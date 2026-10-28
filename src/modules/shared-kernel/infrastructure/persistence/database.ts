import { type AnyEntity, type EntityClass, type EntityManager, MikroORM } from '@mikro-orm/sqlite'
import type BetterSqlite3 from 'better-sqlite3'
import { BusinessRuleError } from '../../domain/domain-error'
import { MIGRATIONS, type Migration } from './migrations'

/** Marks a file as this application's database ("TKMG"). */
export const APPLICATION_ID = 0x544b4d47
export const SCHEMA_VERSION = MIGRATIONS.length

export class ForeignDatabaseError extends BusinessRuleError {
  constructor() {
    super('این فایل پایگاه داده متعلق به این برنامه نیست.')
  }
}

export class NewerDatabaseError extends BusinessRuleError {
  constructor(version: number) {
    super('این داده با نسخه جدیدتر برنامه ساخته شده است. برنامه را به‌روزرسانی کنید.', { version })
  }
}

export type Database = { orm: MikroORM; em: EntityManager; close(): Promise<void> }

type NativeConnection = { getNativeClient(): Promise<BetterSqlite3.Database> }

export async function nativeClient(orm: MikroORM): Promise<BetterSqlite3.Database> {
  const connection: unknown = orm.em.getConnection()
  return (connection as NativeConnection).getNativeClient()
}

/** Opens the database, applies pragmas and pending migrations. The ORM never touches the schema. */
export async function openDatabase(dbName: string, entities: readonly EntityClass<AnyEntity>[]): Promise<Database> {
  const orm = await MikroORM.init({
    dbName,
    entities: [...entities],
    allowGlobalContext: false,
    debug: process.env.TASKS_SQL_DEBUG === '1'
  })
  try {
    const native = await nativeClient(orm)
    applyPragmas(native)
    migrate(native)
  } catch (error) {
    await orm.close()
    throw error
  }
  return { orm, em: orm.em, close: () => orm.close() }
}

function applyPragmas(db: BetterSqlite3.Database): void {
  db.pragma('journal_mode = WAL')
  // FULL: a committed sale survives power loss; WAL alone at NORMAL may lose the last commit.
  db.pragma('synchronous = FULL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
}

export function migrate(db: BetterSqlite3.Database): void {
  const applicationId = db.pragma('application_id', { simple: true }) as number
  const version = db.pragma('user_version', { simple: true }) as number
  if (version > 0 && applicationId !== APPLICATION_ID) throw new ForeignDatabaseError()
  if (version > MIGRATIONS.length) throw new NewerDatabaseError(version)
  MIGRATIONS.slice(version).forEach((migration, index) => {
    applyMigration(db, migration, version + index + 1)
  })
}

export class MigrationIntegrityError extends BusinessRuleError {
  constructor(version: number) {
    super('به‌روزرسانی ساختار داده به ناسازگاری کلید خارجی رسید و انجام نشد.', { version })
  }
}

function applyMigration(db: BetterSqlite3.Database, migration: Migration, targetVersion: number): void {
  // SQLite's documented table-rebuild procedure: foreign keys off outside the transaction,
  // verified with foreign_key_check before committing.
  if (migration.rebuildsTables) db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      db.exec(migration.sql)
      if (migration.rebuildsTables && (db.pragma('foreign_key_check') as unknown[]).length > 0)
        throw new MigrationIntegrityError(targetVersion)
      db.pragma(`user_version = ${targetVersion}`)
      db.pragma(`application_id = ${APPLICATION_ID}`)
    })()
  } finally {
    if (migration.rebuildsTables) db.pragma('foreign_keys = ON')
  }
}
