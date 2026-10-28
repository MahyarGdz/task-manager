import type { IpcMainInvokeEvent } from 'electron'
import type { ZodError } from 'zod'
import { DomainError } from '../../modules/shared-kernel/domain'
import { contract, type Method, type RpcResult } from '../../shared/contract'
import type { Application } from '../composition-root'
import type { Logger } from '../logger'
import { handlers } from './handlers'

export const RPC_CHANNEL = 'tasks:rpc'

const DATABASE_MESSAGES: [RegExp, string][] = [
  [/UNIQUE constraint failed: projects\.key/, 'این کلید پروژه قبلاً استفاده شده است.'],
  [/FOREIGN KEY constraint failed/, 'این رکورد به داده دیگری وابسته است.'],
  [/CHECK constraint failed/, 'مقدار واردشده مجاز نیست.']
]

/** Contract lookup, sender check, input validation, handler, error translation. */
export class Dispatcher {
  constructor(private readonly deps: { app: Application; log: Logger; isTrustedSender: (event: IpcMainInvokeEvent) => boolean }) {}

  async handle(event: IpcMainInvokeEvent, method: unknown, input: unknown): Promise<RpcResult> {
    if (!this.deps.isTrustedSender(event)) return { ok: false, error: 'درخواست از منبع ناشناخته رد شد.' }
    if (typeof method !== 'string' || !Object.hasOwn(contract, method)) return { ok: false, error: 'درخواست ناشناخته.' }
    const name = method as Method
    const parsed = contract[name].input.safeParse(input ?? {})
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) }
    try {
      const run = handlers[name] as (input: unknown, app: Application) => Promise<unknown>
      return { ok: true, data: await run(parsed.data, this.deps.app) }
    } catch (error) {
      return { ok: false, error: this.toMessage(name, error) }
    }
  }

  private toMessage(method: Method, error: unknown): string {
    if (error instanceof DomainError) return error.message
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
    const known = DATABASE_MESSAGES.find(([pattern]) => pattern.test(text))
    if (known) return known[1]
    const id = this.deps.log.error(`${method} failed`, error)
    return `خطای پیش‌بینی‌نشده رخ داد. شناسه خطا: ${id}`
  }
}

function validationMessage(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'ورودی نامعتبر است.'
  const custom = issue.message && /[؀-ۿ]/.test(issue.message) ? issue.message : null
  return custom ?? `مقدار «${issue.path.join('.') || 'ورودی'}» نامعتبر است.`
}
