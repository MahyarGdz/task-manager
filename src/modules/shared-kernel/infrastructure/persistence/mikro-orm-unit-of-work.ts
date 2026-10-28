import type { EntityManager } from '@mikro-orm/sqlite'
import type { UnitOfWork } from '../../application/ports'

/**
 * One transaction per use case. Repositories hold the root EntityManager; inside `transaction`
 * MikroORM resolves it to the transactional fork, so repositories stay transaction-agnostic.
 * Calls are serialized: a single window does not need concurrent writers, and SQLite has one.
 */
export class MikroOrmUnitOfWork implements UnitOfWork {
  private queue: Promise<unknown> = Promise.resolve()

  constructor(private readonly em: EntityManager) {}

  transaction<T>(work: () => Promise<T>): Promise<T> {
    // Nested use joins the transaction already open instead of queueing behind it (deadlock).
    if (this.em.isInTransaction()) return work()
    const run = () => this.em.fork().transactional(() => work())
    const result = this.queue.then(run, run)
    this.queue = result.catch(() => undefined)
    return result
  }
}
