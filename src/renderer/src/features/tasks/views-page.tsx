import { useMemo } from 'react'
import type { TaskDto } from '../../../../shared/dto'
import { fmt, isoDate } from '../../../../shared/format'
import { PanelHeader } from '../../app/panel-header'
import { usePrefs } from '../../lib/prefs'
import { useRpc } from '../../lib/rpc'
import { Button } from '../../ui/button'
import { EmptyState, Loading } from '../../ui/feedback'
import { CalendarRange, Plus, Rows3, TriangleAlert } from '../../ui/icons'
import { useCreateTask } from './create-task'
import { DisplayMenu } from './display-menu'
import { ListView } from './list-view'
import { isDueToday, isOverdue } from './model'

export type ViewKey = 'today' | 'upcoming' | 'active'

const VIEWS: Record<ViewKey, { title: string; hint: string; icon: typeof Rows3; pick: (t: TaskDto) => boolean; empty: string }> = {
  today: {
    title: 'امروز',
    hint: 'سررسیدهای امروز و گذشته',
    icon: TriangleAlert,
    pick: (t) => isOverdue(t) || isDueToday(t),
    empty: 'برای امروز کاری نمانده. روز خوبی است ✨'
  },
  upcoming: {
    title: 'پیش رو',
    hint: 'کارهای موعددار آینده',
    icon: CalendarRange,
    pick: (t) => t.status !== 'done' && !!t.dueDate && t.dueDate > isoDate(),
    empty: 'هیچ موعدی در پیش نیست.'
  },
  active: {
    title: 'همه تسک‌های باز',
    hint: 'همه پروژه‌ها',
    icon: Rows3,
    pick: (t) => t.status !== 'done',
    empty: 'تسک بازی نداری.'
  }
}

/** Cross-project views: the same list, filtered by time or state, each row showing its project. */
export function ViewsPage({ view }: { view: ViewKey }) {
  const v = VIEWS[view] ?? VIEWS.active
  const tasks = useRpc('tasks.list', {})
  const projects = useRpc('projects.list', {})
  const { groupBy } = usePrefs()
  const create = useCreateTask()
  const list = useMemo(
    () => (tasks.data ?? []).filter(v.pick).sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')),
    [tasks.data, v]
  )
  const Icon = v.icon
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <Icon size={16} className="text-ink-3" />
        <h1 className="text-sm font-semibold">{v.title}</h1>
        <span className="text-xs text-ink-3">· {v.hint}</span>
        <span className="rounded-full bg-hover px-2 text-2xs tabular-nums text-ink-2">{fmt(list.length)}</span>
        <div className="ms-auto flex items-center gap-1.5">
          <DisplayMenu canBoard={false} />
          <Button size="xs" variant="primary" onPress={() => create()}>
            <Plus size={14} /> تسک
          </Button>
        </div>
      </PanelHeader>
      <div className="min-h-0 flex-1">
        {tasks.isLoading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : list.length === 0 ? (
          <EmptyState kind="complete" title={v.empty} className="mt-16" />
        ) : (
          <ListView
            tasks={list}
            groupBy={groupBy === 'status' ? 'project' : groupBy}
            projects={projects.data ?? []}
            showProject
            emptyGroups={false}
          />
        )}
      </div>
    </div>
  )
}
