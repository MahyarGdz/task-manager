/** How the presentation layer should treat a failure. */
export type ErrorKind = 'validation' | 'not_found' | 'rule' | 'forbidden' | 'conflict'

/**
 * Base for every business failure. `message` is user-facing Persian text (the ubiquitous
 * language of the users); the class name and `details` are for logs and tests.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: ErrorKind

  constructor(
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {}
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends DomainError {
  readonly kind = 'validation'
}

export class NotFoundError extends DomainError {
  readonly kind = 'not_found'

  constructor(entity: string, id: number | string) {
    super(`${entity} یافت نشد.`, { entity, id })
  }
}

export class ForbiddenError extends DomainError {
  readonly kind = 'forbidden'
}

export class ConflictError extends DomainError {
  readonly kind = 'conflict'
}

/** A business rule refused the operation. Subclass per rule when callers need to tell them apart. */
export class BusinessRuleError extends DomainError {
  readonly kind = 'rule'
}
