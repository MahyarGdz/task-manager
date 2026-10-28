/** Runs work atomically. Everything inside commits together or not at all. */
export interface UnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>
}

export interface Clock {
  now(): Date
}
