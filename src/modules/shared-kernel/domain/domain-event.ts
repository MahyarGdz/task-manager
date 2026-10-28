/** Something that happened, past tense, immutable. Published after the aggregate is saved. */
export abstract class DomainEvent {
  readonly occurredAt = new Date().toISOString()
}

export type EventClass<E extends DomainEvent> = abstract new (...args: never[]) => E
