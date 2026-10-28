import type { TaskDto } from '../../../../shared/dto'
import { fmt } from '../../../../shared/format'
import { cx } from '../../ui/cx'
import { CalendarDays, X } from '../../ui/icons'
import { dayLabel, isDueToday, isOverdue, labelHue, type StatusCount } from './model'

// The inline task markers, shared by list rows, board cards and the task page,
// so a label or due date looks identical wherever it appears.

export function LabelChip({ text, onRemove }: { text: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-[22px] max-w-40 items-center gap-1.5 rounded-full border border-border bg-surface px-2 text-2xs font-medium text-ink-2">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(${labelHue(text)} 65% 55%)` }} />
      <span className="truncate">{text}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="-me-0.5 opacity-60 hover:opacity-100" aria-label={`حذف برچسب ${text}`}>
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export function DueBadge({ task, className }: { task: Pick<TaskDto, 'dueDate' | 'status'>; className?: string }) {
  if (!task.dueDate) return null
  const overdue = isOverdue(task)
  const today = isDueToday(task)
  return (
    <span
      className={cx(
        'inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-2xs font-medium',
        overdue ? 'border-negative/30 text-negative' : today ? 'border-caution/30 text-caution' : 'border-border text-ink-2',
        className
      )}
      title={overdue ? 'سررسید گذشته' : 'موعد انجام'}
    >
      <CalendarDays size={11} aria-hidden="true" />
      {today ? 'امروز' : dayLabel(task.dueDate)}
    </span>
  )
}

/** Where a set of tasks sits, as one segmented bar (one segment per status, sized by share). */
export function TaskStatusBar({ cols, total, className }: { cols: StatusCount[]; total: number; className?: string }) {
  return (
    <div className={cx('flex shrink-0 gap-px overflow-hidden rounded-full bg-hover', className ?? 'h-1.5')} dir="ltr">
      {cols.map((c) =>
        c.count > 0 ? (
          <span
            key={c.key}
            className="h-full transition-[width] duration-300"
            style={{ width: `${(c.count / total) * 100}%`, background: c.accent }}
            title={`${c.label}: ${fmt(c.count)}`}
          />
        ) : null
      )}
    </div>
  )
}

/** The bar's key. Every status is listed; empty ones dim so the populated ones carry the eye. */
export function TaskStatusLegend({ cols, className }: { cols: StatusCount[]; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-3.5 gap-y-1', className)}>
      {cols.map((c) => (
        <span key={c.key} className={cx('inline-flex items-center gap-1.5 text-2xs', c.count === 0 && 'opacity-40')}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.accent }} />
          <span className="text-ink-3">{c.label}</span>
          <span className="font-semibold tabular-nums text-ink-2">{fmt(c.count)}</span>
        </span>
      ))}
    </div>
  )
}
