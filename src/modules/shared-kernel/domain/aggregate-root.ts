import type { DomainEvent } from './domain-event'

/** Collects domain events; it never dispatches them. The application layer publishes after save. */
export abstract class AggregateRoot {
  private readonly pendingEvents: DomainEvent[] = []

  protected record(event: DomainEvent): void {
    this.pendingEvents.push(event)
  }

  pullEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0)
  }
}
