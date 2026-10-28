import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface Logger {
  info(message: string, detail?: unknown): void
  warn(message: string, detail?: unknown): void
  error(message: string, error: unknown): string
}

/** Append-only file log in the user-data folder. `error` returns an id the user can quote to support. */
export class FileLogger implements Logger {
  private ready: Promise<void>

  constructor(private readonly dir: string) {
    this.ready = mkdir(dir, { recursive: true }).then(() => undefined)
  }

  info(message: string, detail?: unknown): void {
    this.write('INFO', message, detail)
  }

  warn(message: string, detail?: unknown): void {
    this.write('WARN', message, detail)
  }

  error(message: string, error: unknown): string {
    const id = `E${Date.now().toString(36).toUpperCase()}`
    const detail = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    this.write('ERROR', `${id} ${message}`, detail)
    return id
  }

  private write(level: string, message: string, detail?: unknown): void {
    const line = `${new Date().toISOString()} ${level} ${message}${detail === undefined ? '' : ` ${JSON.stringify(detail)}`}\n`
    this.ready = this.ready.then(() => appendFile(join(this.dir, 'tasks.log'), line)).catch(() => undefined)
    if (level === 'ERROR') console.error(line)
  }
}
