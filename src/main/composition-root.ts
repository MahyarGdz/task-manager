// Composition root: the only place that knows every concrete class. No Electron imports here,
// so integration tests boot exactly the graph the desktop app runs.
import { type Database, openDatabase } from '../modules/shared-kernel/infrastructure/persistence/database'
import { MikroOrmUnitOfWork } from '../modules/shared-kernel/infrastructure/persistence/mikro-orm-unit-of-work'
import { SystemClock } from '../modules/shared-kernel/infrastructure/system'
import { TaskCommands } from '../modules/tasks/application/tasks.handlers'
import {
  MikroOrmCommentRepository,
  MikroOrmProjectRepository,
  MikroOrmSubtaskRepository,
  MikroOrmTaskRepository,
  TASK_RECORDS
} from '../modules/tasks/infrastructure/tasks.persistence'
import { TasksReadModel } from '../modules/tasks/infrastructure/tasks.read-model'

export type Application = Awaited<ReturnType<typeof createApplication>>

export async function createApplication(dbFile: string) {
  const db: Database = await openDatabase(dbFile, TASK_RECORDS)
  const em = db.em
  return {
    db,
    uow: new MikroOrmUnitOfWork(em),
    commands: new TaskCommands(
      new MikroOrmProjectRepository(em),
      new MikroOrmTaskRepository(em),
      new MikroOrmSubtaskRepository(em),
      new MikroOrmCommentRepository(em),
      new SystemClock()
    ),
    read: new TasksReadModel(em),
    close: () => db.close()
  }
}
