import { Link } from '@tanstack/react-router'
import { type ReactNode, useMemo, useState } from 'react'
import type { Priority, ProjectDto, Status, TaskDto } from '../../../../shared/dto'
import { fmt } from '../../../../shared/format'
import { cx } from '../../ui/cx'
import { ChevronDown, CircleCheck, Plus } from '../../ui/icons'
import { DueBadge, LabelChip } from './chips'
import { COLUMNS, dayLabel, PRIORITIES, PRIORITY } from './model'
import { PriorityMenu, StatusMenu } from './property-menus'
import { PriorityIcon, StatusIcon } from './task-icons'
import { useUpdateTask } from './use-tasks'

export type GroupBy = 'status' | 'priority' | 'project' | 'none'

export function TaskRow({ task, project }: { task: TaskDto; project?: ProjectDto }) {
  const update = useUpdateTask()
  const done = task.status === 'done'
  return (
    <div className="task-row group relative flex h-11 items-center gap-2 border-b border-divider/70 pe-4 ps-5 transition-colors">
      <div className="relative z-[1] flex shrink-0 items-center gap-2">
        <PriorityMenu value={task.priority} onChange={(priority) => update.mutate({ id: task.id, priority })} />
        <span className="mono-id w-16 text-end">{task.identifier}</span>
        <StatusMenu value={task.status} onChange={(status) => update.mutate({ id: task.id, status })} />
      </div>
      <Link
        to="/task/$taskId"
        params={{ taskId: String(task.id) }}
        className="flex min-w-0 flex-1 items-center gap-2 self-stretch outline-none after:absolute after:inset-0 after:content-['']"
      >
        <span className={cx('truncate text-sm font-medium', done ? 'text-ink-3' : 'text-ink')}>{task.title}</span>
        {task.subtaskCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-2xs tabular-nums text-ink-3">
            <CircleCheck size={12} />
            {fmt(task.subtaskDone)}/{fmt(task.subtaskCount)}
          </span>
        )}
      </Link>
      {/* trailing meta sits above the row link so its own controls stay clickable */}
      <div className="relative z-[1] flex shrink-0 items-center gap-1.5">
        <span className="hidden items-center gap-1 xl:flex">
          {task.labels.slice(0, 3).map((l) => (
            <LabelChip key={l} text={l} />
          ))}
        </span>
        <DueBadge task={task} />
        {project && (
          <span className="hidden h-[22px] items-center gap-1.5 rounded-full border border-border px-2 text-2xs text-ink-2 lg:inline-flex">
            <span className="h-2 w-2 rounded-[3px]" style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        <span className="w-14 text-end text-2xs text-ink-3" title="تاریخ ایجاد">
          {dayLabel(task.createdAt)}
        </span>
      </div>
    </div>
  )
}

type Group = { key: string; label: string; icon: ReactNode; tasks: TaskDto[]; status?: Status }

function useGroups(tasks: TaskDto[], groupBy: GroupBy, projects: Map<number, ProjectDto>): Group[] {
  return useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: 'همه تسک‌ها', icon: null, tasks }]
    if (groupBy === 'status') {
      return COLUMNS.map((c) => ({
        key: c.key,
        label: c.label,
        status: c.key,
        icon: <StatusIcon status={c.key} />,
        tasks: tasks.filter((t) => t.status === c.key)
      }))
    }
    if (groupBy === 'priority') {
      return PRIORITIES.map((p: Priority) => ({
        key: p,
        label: PRIORITY[p].label,
        icon: <PriorityIcon priority={p} className="text-ink-2" />,
        tasks: tasks.filter((t) => t.priority === p)
      })).filter((g) => g.tasks.length > 0)
    }
    return [...projects.values()]
      .map((p) => ({
        key: String(p.id),
        label: p.name,
        icon: <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />,
        tasks: tasks.filter((t) => t.projectId === p.id)
      }))
      .filter((g) => g.tasks.length > 0)
  }, [tasks, groupBy, projects])
}

/** Linear-style grouped list: sticky group headers, dense rows, inline status/priority menus. */
export function ListView({
  tasks,
  groupBy = 'status',
  projects,
  showProject = false,
  onCreate,
  emptyGroups = true
}: {
  tasks: TaskDto[]
  groupBy?: GroupBy
  projects: readonly ProjectDto[]
  showProject?: boolean
  onCreate?: (s: Status) => void
  emptyGroups?: boolean
}) {
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const groups = useGroups(tasks, groupBy, projectMap).filter((g) => emptyGroups || g.tasks.length > 0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  return (
    <div className="h-full overflow-y-auto pb-10">
      {groups.map((g) => {
        const closed = collapsed.has(g.key)
        return (
          <section key={g.key}>
            {groupBy !== 'none' && (
              <div className="sticky top-0 z-10 flex h-9 items-center gap-2 bg-subtle/95 pe-3 ps-4 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggle(g.key)}
                  className="flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ChevronDown size={13} className={cx('text-ink-3 transition-transform', closed && 'rotate-90')} />
                  {g.icon}
                  <span className="text-sm font-semibold">{g.label}</span>
                  <span className="text-xs tabular-nums text-ink-3">{fmt(g.tasks.length)}</span>
                </button>
                {onCreate && g.status && (
                  <button
                    type="button"
                    aria-label={`تسک جدید در ${g.label}`}
                    onClick={() => onCreate(g.status as Status)}
                    className="ms-auto flex h-6 w-6 items-center justify-center rounded-md text-ink-3 hover:bg-selected hover:text-ink"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            )}
            {!closed && g.tasks.map((t) => <TaskRow key={t.id} task={t} project={showProject ? projectMap.get(t.projectId) : undefined} />)}
          </section>
        )
      })}
    </div>
  )
}
