import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { ProjectDto, TaskDto } from '../../../../shared/dto'
import { fmt, isoDate, persianDateLabel } from '../../../../shared/format'
import { PanelHeader } from '../../app/panel-header'
import mark from '../../assets/brand/pishro-mark.svg'
import { useRpc } from '../../lib/rpc'
import { Button } from '../../ui/button'
import { EmptyState, Skeleton } from '../../ui/feedback'
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock3, type Icon, LayoutDashboard, Plus, Rocket } from '../../ui/icons'
import { TaskStatusBar, TaskStatusLegend } from './chips'
import { useCreateTask } from './create-task'
import { TaskRow } from './list-view'
import { isDueToday, isOverdue, PRIORITY, type TaskStats, taskHealth, taskStats } from './model'
import { ProjectSheet } from './project-sheet'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'شب بخیر'
  if (h < 12) return 'صبح بخیر'
  if (h < 17) return 'روز بخیر'
  return 'عصر بخیر'
}

function StatTile({ label, value, hint, icon: I, tone }: { label: string; value: number; hint?: string; icon: Icon; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-3">{label}</p>
        <I size={15} style={{ color: tone ?? 'var(--ink-3)' }} />
      </div>
      <p className="mt-2 font-display text-[28px] font-bold leading-none tabular-nums" style={{ color: value > 0 ? tone : undefined }}>
        {fmt(value)}
      </p>
      {hint && <p className="mt-1.5 text-2xs text-ink-3">{hint}</p>}
    </div>
  )
}

function ProjectCard({ project, stats }: { project: ProjectDto; stats: TaskStats | null }) {
  const health = taskHealth(stats, fmt)
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: String(project.id) }}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 outline-none transition-colors hover:border-control-border focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white"
          style={{ background: project.color }}
        >
          {project.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{project.name}</p>
          <p className="truncate text-2xs text-ink-3">{project.description || project.key}</p>
        </div>
        <ChevronLeft size={15} className="text-ink-3 transition-transform group-hover:-translate-x-0.5" />
      </div>
      {stats ? (
        <div className="space-y-2.5">
          <TaskStatusBar cols={stats.cols} total={stats.total} />
          <TaskStatusLegend cols={stats.cols} />
        </div>
      ) : (
        <p className="flex h-10 items-center justify-center rounded-lg border border-dashed border-border text-2xs text-ink-3">
          هنوز تسکی ندارد
        </p>
      )}
      <div className="flex items-center justify-between border-t border-divider pt-3 text-2xs">
        {health ? (
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: health.tone }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: health.tone }} />
            {health.label}
          </span>
        ) : (
          <span className="text-ink-3">—</span>
        )}
        <span className="tabular-nums text-ink-3">{fmt(stats?.total ?? 0)} تسک</span>
      </div>
    </Link>
  )
}

export function OverviewPage() {
  const projects = useRpc('projects.list', {})
  const tasks = useRpc('tasks.list', {})
  const create = useCreateTask()
  const [creating, setCreating] = useState(false)

  const byProject = useMemo(() => {
    const m = new Map<number, TaskDto[]>()
    for (const t of tasks.data ?? []) m.set(t.projectId, [...(m.get(t.projectId) ?? []), t])
    return m
  }, [tasks.data])
  const all = taskStats(tasks.data ?? [])
  const projectMap = useMemo(() => new Map((projects.data ?? []).map((p) => [p.id, p])), [projects.data])
  const focus = (tasks.data ?? [])
    .filter((t) => isOverdue(t) || isDueToday(t) || (t.status === 'doing' && PRIORITY[t.priority].rank >= 3))
    .sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9') || PRIORITY[b.priority].rank - PRIORITY[a.priority].rank)
    .slice(0, 8)
  // Needs-attention first; projects without tasks sink to the bottom.
  const score = (p: ProjectDto) => {
    const s = taskStats(byProject.get(p.id) ?? [])
    return s ? s.overdue * 100 + s.open : -1
  }
  const ordered = [...(projects.data ?? [])].sort((a, b) => score(b) - score(a))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        <LayoutDashboard size={16} className="text-ink-3" />
        <h1 className="text-sm font-semibold">داشبورد</h1>
        <div className="ms-auto flex items-center gap-1.5">
          <Button size="xs" onPress={() => setCreating(true)}>
            <Plus size={14} /> پروژه
          </Button>
          <Button size="xs" variant="primary" onPress={() => create()}>
            <Plus size={14} /> تسک
          </Button>
        </div>
      </PanelHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {projects.isLoading || tasks.isLoading ? (
          <div className="mx-auto max-w-5xl space-y-4 p-8">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-8 pb-14 pt-8">
            <div className="hero-glow mb-6 flex items-center gap-5 overflow-hidden rounded-2xl border border-border p-6">
              <img src={mark} alt="" className="h-14 w-14 rounded-2xl shadow-pop" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-3">{persianDateLabel(isoDate())}</p>
                <h2 className="mt-0.5 font-display text-2xl font-bold">{greeting()}</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {all
                    ? `${fmt(all.open)} تسک باز در ${fmt(byProject.size)} پروژه${all.overdue ? `؛ ${fmt(all.overdue)} تا از موعدشان گذشته.` : '.'}`
                    : 'اولین پروژه‌ات را بساز و کارهایت را بچین.'}
                </p>
              </div>
              {all && (
                <div className="hidden w-48 md:block">
                  <div className="mb-1.5 flex justify-between text-2xs text-ink-3">
                    <span>پیشرفت کل</span>
                    <span className="font-semibold tabular-nums text-ink">{fmt(all.donePercent)}٪</span>
                  </div>
                  <TaskStatusBar cols={all.cols} total={all.total} className="h-2" />
                </div>
              )}
            </div>

            {(projects.data ?? []).length === 0 ? (
              <EmptyState
                title="هنوز پروژه‌ای نیست"
                action={
                  <Button variant="primary" onPress={() => setCreating(true)}>
                    <Plus size={15} /> پروژه جدید
                  </Button>
                }
              >
                تسک‌ها در پروژه‌ها چیده می‌شوند. با «کار» یا «شخصی» شروع کن.
              </EmptyState>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="تسک‌های باز" value={all?.open ?? 0} hint={`از ${fmt(all?.total ?? 0)} تسک`} icon={Clock3} />
                  <StatTile label="سررسید امروز" value={all?.today ?? 0} icon={Rocket} tone="var(--caution)" />
                  <StatTile label="سررسید گذشته" value={all?.overdue ?? 0} icon={AlertTriangle} tone="var(--negative)" />
                  <StatTile
                    label="انجام‌شده"
                    value={all?.done ?? 0}
                    hint={`${fmt(all?.donePercent ?? 0)}٪ کل کارها`}
                    icon={CheckCircle2}
                    tone="var(--positive)"
                  />
                </div>

                <section className="mb-8">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">تمرکز امروز</h3>
                    <Link to="/views/$view" params={{ view: 'today' }} className="text-xs text-brand hover:underline">
                      همه سررسیدها
                    </Link>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-surface">
                    {focus.length === 0 ? (
                      <p className="flex items-center gap-2 px-5 py-5 text-sm text-ink-2">
                        <CheckCircle2 size={17} className="text-positive" /> کار فوری‌ای نمانده.
                      </p>
                    ) : (
                      focus.map((t) => <TaskRow key={t.id} task={t} project={projectMap.get(t.projectId)} />)
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold">پروژه‌ها</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {ordered.map((p) => (
                      <ProjectCard key={p.id} project={p} stats={taskStats(byProject.get(p.id) ?? [])} />
                    ))}
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-ink-3 transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      <Plus size={18} /> پروژه جدید
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
      {creating && <ProjectSheet onClose={() => setCreating(false)} />}
    </div>
  )
}
