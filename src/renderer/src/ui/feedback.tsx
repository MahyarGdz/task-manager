import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { IconButton } from './button'
import { cx } from './cx'
import { CircleAlert, CircleCheck, ClipboardList, type Icon, Info, MousePointer2, Search, TriangleAlert, X } from './icons'
import './empty-state.css'
import { SpotArt } from './illustrations'

type Toast = { id: number; tone: 'ok' | 'error'; text: string }
const ToastContext = createContext<(tone: Toast['tone'], text: string) => void>(() => undefined)

const TOAST_MS = 3500
const ERROR_MS = 6000

/** Toasts sit bottom-centre, out of the way of headers and the POS cart, and stack upward. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (tone: Toast['tone'], text: string) => {
      const id = Date.now() + Math.random()
      setToasts((all) => [...all.slice(-2), { id, tone, text }])
      setTimeout(() => dismiss(id), tone === 'error' ? ERROR_MS : TOAST_MS)
    },
    [dismiss]
  )
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="no-print pointer-events-none fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[min(32rem,calc(100vw-2rem))] flex-col items-center gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex animate-rise items-center gap-3 rounded-lg border bg-surface py-3 pe-2 ps-3.5 text-sm text-ink shadow-pop',
              t.tone === 'ok' ? 'border-positive/40' : 'border-negative/40'
            )}
          >
            {t.tone === 'ok' ? (
              <CircleCheck size={17} className="shrink-0 text-positive" aria-hidden="true" />
            ) : (
              <CircleAlert size={17} className="shrink-0 text-negative" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1 break-words">{t.text}</span>
            <IconButton label="بستن" size="xs" onPress={() => dismiss(t.id)}>
              <X size={14} aria-hidden="true" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const push = useContext(ToastContext)
  return useMemo(
    () => ({ ok: (text: string) => push('ok', text), error: (e: unknown) => push('error', e instanceof Error ? e.message : String(e)) }),
    [push]
  )
}

export function ErrorNote({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null
  return (
    <Callout tone="negative" className={className}>
      {error instanceof Error ? error.message : String(error)}
    </Callout>
  )
}

const CALLOUT: Record<'info' | 'caution' | 'negative' | 'positive', { cls: string; icon: Icon }> = {
  info: { cls: 'bg-subtle border-border text-ink [&>svg]:text-ink-3', icon: Info },
  caution: { cls: 'bg-caution-soft border-caution/20 text-ink [&>svg]:text-caution', icon: TriangleAlert },
  negative: { cls: 'bg-negative-soft border-negative/20 text-ink [&>svg]:text-negative', icon: CircleAlert },
  positive: { cls: 'bg-positive-soft border-positive/20 text-ink [&>svg]:text-positive', icon: CircleCheck }
}

/** An inline message inside a page or form; not for transient confirmations (use a toast). */
export function Callout({
  tone = 'info',
  title,
  children,
  action,
  className
}: {
  tone?: keyof typeof CALLOUT
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { cls, icon: Icon } = CALLOUT[tone]
  return (
    <div
      role={tone === 'negative' ? 'alert' : undefined}
      className={cx('flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm', cls, className)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx(!!title && 'mt-0.5 text-ink-2')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx('inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand', className)} />
}

/** Placeholder rows while data loads: keeps layout stable instead of a spinner jumping into place. */
export function Loading({ label = 'در حال بارگذاری…', rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-2.5 py-2" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-9 rounded-md" style={{ opacity: 1 - i * 0.14 }} />
      ))}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-md', className)} aria-hidden="true" />
}

const EMPTY_ICON = { data: ClipboardList, filtered: Search, complete: CircleCheck, selection: MousePointer2 }

/** Explain the current state and offer a next step only when one is useful. */
export function EmptyState({
  title,
  children,
  icon: Icon,
  action,
  className,
  kind = 'data',
  compact = false
}: {
  title: string
  children?: ReactNode
  icon?: Icon
  action?: ReactNode
  className?: string
  kind?: keyof typeof EMPTY_ICON
  compact?: boolean
}) {
  const StateIcon = Icon ?? EMPTY_ICON[kind]
  return (
    <div className={cx('ui-empty-state', compact && 'ui-empty-state-compact', className)} data-kind={kind}>
      <div className="ui-empty-state-panel">
        <SpotArt icon={StateIcon} accent={kind} className="ui-empty-state-art" />
        <div className="ui-empty-state-content">
          <h2 className="ui-empty-state-title">{title}</h2>
          {children && <div className="ui-empty-state-description">{children}</div>}
          {action && <div className="ui-empty-state-action">{action}</div>}
        </div>
      </div>
    </div>
  )
}
