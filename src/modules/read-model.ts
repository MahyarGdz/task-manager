// Query side (CQRS): one typed view over every table for read models.
// Reads may cross context boundaries; writes never do (they go through each context's repositories).
import type { InferKyselyDB } from '@mikro-orm/sql'
import type { EntityManager } from '@mikro-orm/sqlite'
import type { TASK_SCHEMAS } from './tasks/infrastructure/tasks.persistence'

export type ReadDB = InferKyselyDB<(typeof TASK_SCHEMAS)[number]>

/** Base for read models: typed SQL bound to the current unit of work. */
export abstract class ReadModel {
  constructor(private readonly em: EntityManager) {}

  protected get sql() {
    return this.em.getKysely<ReadDB>()
  }
}
