import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from 'react-aria-components'
import type { Priority, Status, TaskDto } from '../../../../shared/dto'
import { fmt } from '../../../../shared/format'
import { PanelHeader } from '../../app/panel-header'
import { usePrefs } from '../../lib/prefs'
import { useCommand, useRpc } from '../../lib/rpc'
import { Button } from '../../ui/button'
import { cx } from '../../ui/cx'
import { Confirm } from '../../ui/dialog'
import { EmptyState, Loading, useToast } from '../../ui/feedback'
import { Check, Edit, Plus, Search, Trash2, X } from '../../ui/icons'
import { ActionMenu } from '../../ui/menu'
import { BoardView } from './board-view'
import { TaskStatusBar } from './chips'
import { useCreateTask } from './create-task'
import { DisplayMenu } from './display-menu'
import { ListView } from './list-view'
import { labelHue, PRIORITIES, PRIORITY, taskStats } from './model'
import { ProjectSheet } from './project-sheet'
import { PriorityIcon } from './task-icons'

type Tab = 'all' | 'active' | 'backlog' | 'done'
const TABS: { id: Tab; label: string; pick: (t: TaskDto) => boolean }[] = [
  { id: 'all', label: 'همه', pick: () => true },
  { id: 'active', label: 'فعال', pick: (t) => t.status !== 'done' && t.status !== 'backlog' },
  { id: 'backlog', label: 'بک‌لاگ', pick: (t) => t.status === 'backlog' },
  { id: 'done', label: 'انجام‌شده', pick: (t) => t.status === 'done' }
]

type Filter = { priorities: Priority[]; labels: string[] }

function FilterMenu({ filter, onChange, labels }: { filter: Filter; onChange: (f: Filter) => void; labels: string[] }) {
  const count = filter.priorities.length + filter.labels.length
  const toggle = <K extends keyof Filter>(key: K, v: Filter[K][number]) => {
    const list = filter[key] as string[]
    onChange({ ...filter, [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] })
  }
  const row = 'flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm hover:bg-hover'
  const box = (on: boolean) => (
    <span
      className={cx(
        'flex h-4 w-4 items-center justify-center rounded border',
        on ? 'border-brand bg-brand text-white' : 'border-control-border'
      )}
    >
      {on && <Check size={11} strokeWidth={3} />}
    </span>
  )
  return (
    <div className="flex items-center gap-1">
      <DialogTrigger>
        <AriaButton
          className={cx(
            'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand',
            count ? 'border-brand/40 bg-brand-soft text-brand' : 'border-border text-ink-2 hover:bg-hover hover:text-ink'
          )}
        >
          فیلتر{count > 0 && ` · ${fmt(count)}`}
        </AriaButton>
        <Popover
          placement="bottom end"
          offset={4}
          className="ui-popover w-64 rounded-xl border border-border bg-surface p-1.5 shadow-pop outline-none"
        >
          <Dialog aria-label="فیلتر" className="max-h-96 overflow-y-auto outline-none">
            <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold text-ink-3">اولویت</p>
            {PRIORITIES.map((p) => (
              <button type="button" key={p} className={row} onClick={() => toggle('priorities', p)}>
                {box(filter.priorities.includes(p))}
                <PriorityIcon priority={p} className="text-ink-2" />
                {PRIORITY[p].label}
              </button>
            ))}
            {labels.length > 0 && <p className="mt-1 border-t border-divider px-2 pb-1 pt-2 text-2xs font-semibold text-ink-3">برچسب</p>}
            {labels.map((l) => (
              <button type="button" key={l} className={row} onClick={() => toggle('labels', l)}>
                {box(filter.labels.includes(l))}
                <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${labelHue(l)} 65% 55%)` }} />
                <span className="truncate">{l}</span>
              </button>
            ))}
          </Dialog>
        </Popover>
      </DialogTrigger>
      {count > 0 && (
        <button
          type="button"
          aria-label="حذف فیلترها"
          onClick={() => onChange({ priorities: [], labels: [] })}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/** One project's issues, Linear-style: tabs for state, filter + display popovers, list or board. */
export function ProjectPage({ projectId }: { projectId: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const projects = useRpc('projects.list', {})
  const tasks = useRpc('tasks.list', { projectId })
  const remove = useCommand('projects.delete')
  const create = useCreateTask()
  const { view, groupBy } = usePrefs()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>({ priorities: [], labels: [] })
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const project = projects.data?.find((p) => p.id === projectId)
  const all = tasks.data ?? []
  const labels = useMemo(() => [...new Set(all.flatMap((t) => t.labels))].sort(), [all])
  const stats = taskStats(all)
  const visible = useMemo(() => {
    const pick = TABS.find((t) => t.id === tab)?.pick ?? (() => true)
    const s = q.trim().toLowerCase()
    return all.filter(
      (t) =>
        pick(t) &&
        (!s || t.title.toLowerCase().includes(s) || t.identifier.toLowerCase().includes(s)) &&
        (filter.priorities.length === 0 || filter.priorities.includes(t.priority)) &&
        (filter.labels.length === 0 || t.labels.some((l) => filter.labels.includes(l)))
    )
  }, [all, tab, q, filter])
  const filtering = !!q.trim() || filter.priorities.length > 0 || filter.labels.length > 0
  const onCreate = (status: Status) => create({ projectId, status })

  if (projects.isLoading) return <Loading />
  if (!project) {
    return (
      <EmptyState title="پروژه پیدا نشد" className="mt-16">
        این پروژه حذف شده است.
      </EmptyState>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <span
          className="flex h-5 w-5 items-center justify-center rounded-[5px] text-2xs font-black text-white"
          style={{ background: project.color }}
        >
          {project.name.charAt(0)}
        </span>
        <h1 className="truncate text-sm font-semibold">{project.name}</h1>
        <span className="mono-id">{project.key}</span>
        {stats && (
          <span className="hidden items-center gap-2 text-2xs text-ink-3 lg:flex">
            <TaskStatusBar cols={stats.cols} total={stats.total} className="h-1.5 w-24" />
            {fmt(stats.donePercent)}٪
          </span>
        )}
        <div className="ms-3 flex items-center gap-0.5" role="tablist" aria-label="وضعیت">
          {TABS.map((t) => {
            const n = all.filter(t.pick).length
            return (
              <button
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                  tab === t.id ? 'bg-selected text-ink' : 'text-ink-3 hover:bg-hover hover:text-ink'
                )}
              >
                {t.label}
                <span className="tabular-nums opacity-60">{fmt(n)}</span>
              </button>
            )
          })}
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <label className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-ink-3 focus-within:border-brand/50">
            <Search size={13} />
            <input
              aria-label="جستجو در پروژه"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو…"
              className="w-28 bg-transparent text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <FilterMenu filter={filter} onChange={setFilter} labels={labels} />
          <DisplayMenu />
          <ActionMenu
            label="گزینه‌های پروژه"
            items={[
              { id: 'edit', label: 'ویرایش پروژه', icon: Edit, onAction: () => setEditing(true) },
              { id: 'delete', label: 'حذف پروژه', icon: Trash2, danger: true, onAction: () => setConfirm(true) }
            ]}
          />
          <Button size="xs" variant="primary" onPress={() => onCreate('todo')}>
            <Plus size={14} /> تسک
          </Button>
        </div>
      </PanelHeader>

      <div className="min-h-0 flex-1">
        {tasks.isLoading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : all.length === 0 ? (
          <EmptyState
            title="این پروژه هنوز تسکی ندارد"
            className="mt-16"
            action={
              <Button variant="primary" onPress={() => onCreate('todo')}>
                <Plus size={15} /> اولین تسک
              </Button>
            }
          >
            کلید C را بزن یا از دکمه زیر شروع کن.
          </EmptyState>
        ) : filtering && visible.length === 0 ? (
          <EmptyState kind="filtered" title="تسکی با این فیلترها پیدا نشد" className="mt-10" />
        ) : view === 'board' ? (
          <BoardView
            tasks={visible}
            projectId={projectId}
            sortable={!filtering}
            onOpen={(t) => navigate({ to: '/task/$taskId', params: { taskId: String(t.id) } })}
          />
        ) : (
          <ListView
            tasks={visible}
            groupBy={groupBy}
            projects={projects.data ?? []}
            onCreate={onCreate}
            emptyGroups={tab === 'all' && !filtering}
          />
        )}
      </div>

      {editing && <ProjectSheet project={project} onClose={() => setEditing(false)} />}
      <Confirm
        title={`پروژه «${project.name}» حذف شود؟`}
        confirmLabel="حذف پروژه"
        tone="danger"
        isOpen={confirm}
        pending={remove.isPending}
        onClose={() => setConfirm(false)}
        onConfirm={() => remove.mutate({ id: projectId }, { onSuccess: () => navigate({ to: '/' }), onError: toast.error })}
      >
        همه {fmt(all.length)} تسک این پروژه هم برای همیشه حذف می‌شوند.
      </Confirm>
    </div>
  )
}
