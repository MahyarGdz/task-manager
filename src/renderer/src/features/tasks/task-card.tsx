import type { TaskDto } from '../../../../shared/dto'
import { fmt } from '../../../../shared/format'
import { cx } from '../../ui/cx'
import { CircleCheck } from '../../ui/icons'
import { DueBadge, LabelChip } from './chips'
import { PriorityIcon, StatusIcon } from './task-icons'

// One task as a board card. Shared by the column and the drag overlay so the dragged card
// is literally the same component as the one it left behind.
export function TaskCardBody({ task, dragging }: { task: TaskDto; dragging?: boolean }) {
  const done = task.status === 'done'
  return (
    <div
      data-dragging={dragging}
      className={cx(
        'task-card rounded-lg border border-border bg-surface px-3 pb-2.5 pt-2 text-start shadow-card',
        dragging ? 'cursor-grabbing' : 'cursor-pointer'
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="mono-id">{task.identifier}</span>
        <PriorityIcon priority={task.priority} className={task.priority === 'none' ? 'text-ink-3' : 'text-ink-2'} />
      </div>
      <div className="flex items-start gap-2">
        <StatusIcon status={task.status} className="mt-[3px]" />
        <p className={cx('line-clamp-3 break-words text-sm font-medium leading-5', done ? 'text-ink-3' : 'text-ink')}>{task.title}</p>
      </div>
      {(task.labels.length > 0 || task.dueDate || task.subtaskCount > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          <DueBadge task={task} />
          {task.subtaskCount > 0 && (
            <span
              className={cx(
                'inline-flex h-[22px] items-center gap-1 rounded-full border border-border px-2 text-2xs tabular-nums',
                task.subtaskDone === task.subtaskCount ? 'text-positive' : 'text-ink-2'
              )}
            >
              <CircleCheck size={11} />
              {fmt(task.subtaskDone)}/{fmt(task.subtaskCount)}
            </span>
          )}
          {task.labels.slice(0, 2).map((l) => (
            <LabelChip key={l} text={l} />
          ))}
          {task.labels.length > 2 && <span className="text-2xs text-ink-3">+{fmt(task.labels.length - 2)}</span>}
        </div>
      )}
    </div>
  )
}
