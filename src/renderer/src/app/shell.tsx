import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Tooltip, TooltipTrigger } from 'react-aria-components'
import type { TaskDto } from '../../../shared/dto'
import { fmt } from '../../../shared/format'
import mark from '../assets/brand/pishro-mark.svg'
import { CommandMenu } from '../features/tasks/command-menu'
import { CreateTaskProvider, useCreateTask } from '../features/tasks/create-task'
import { isDueToday, isOverdue } from '../features/tasks/model'
import { ProjectSheet } from '../features/tasks/project-sheet'
import { ShortcutsSheet } from '../features/tasks/shortcuts'
import { setPref, usePrefs } from '../lib/prefs'
import { useRpc } from '../lib/rpc'
import { IconButton } from '../ui/button'
import { cx } from '../ui/cx'
import {
  CalendarRange,
  ChevronDown,
  Edit,
  Info,
  LayoutDashboard,
  Monitor,
  Moon,
  Plus,
  Rows3,
  Search,
  Sun,
  TriangleAlert
} from '../ui/icons'
import { Kbd } from '../ui/layout'

const platform = window.bridge.platform
const MOD = platform === 'darwin' ? '⌘' : 'Ctrl'

/**
 * Window chrome, Linear-style: the navigation spine sits on the window's own surface (glass over
 * vibrancy on macOS) and the workspace floats over it as an inset, rounded panel.
 */
export function Shell() {
  const { sidebar } = usePrefs()
  const rail = sidebar === 'rail'
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string; taskId?: string }
  const task = useRpc('tasks.get', { id: Number(params.taskId) || 1 }, { enabled: !!params.taskId })
  const currentProject = params.projectId ? Number(params.projectId) : params.taskId ? task.data?.projectId : undefined

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      } else if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setPref('sidebar', rail ? 'full' : 'rail')
      } else if (!typing && !e.metaKey && !e.ctrlKey && (e.key === '?' || e.key === '؟')) {
        setHelp(true)
      } else if (!typing && !e.metaKey && !e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rail])

  const openTask = (t: TaskDto) => navigate({ to: '/task/$taskId', params: { taskId: String(t.id) } })

  return (
    <CreateTaskProvider currentProjectId={currentProject}>
      <div className="workspace-shell flex h-full">
        <Sidebar rail={rail} onSearch={() => setPalette(true)} onHelp={() => setHelp(true)} />
        <div className="workspace-panel my-2 me-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl">
          <Outlet />
        </div>
        <Palette open={palette} onClose={() => setPalette(false)} onOpenTask={openTask} />
        <ShortcutsSheet isOpen={help} onClose={() => setHelp(false)} />
      </div>
    </CreateTaskProvider>
  )
}

function Palette({ open, onClose, onOpenTask }: { open: boolean; onClose: () => void; onOpenTask: (t: TaskDto) => void }) {
  const create = useCreateTask()
  return <CommandMenu isOpen={open} onClose={onClose} onOpenTask={onOpenTask} onCreateTask={() => create()} />
}

function ThemeButton() {
  const { theme } = usePrefs()
  const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'
  const Current = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const label = { system: 'مطابق سیستم', dark: 'تیره', light: 'روشن' }[theme]
  return (
    <TooltipTrigger delay={300}>
      <IconButton label={`ظاهر: ${label}`} size="sm" className="no-drag text-[var(--sidebar-muted)]" onPress={() => setPref('theme', next)}>
        <Current size={16} />
      </IconButton>
      <Tooltip className="rounded-md bg-ink px-2 py-1 text-xs text-surface">ظاهر: {label}</Tooltip>
    </TooltipTrigger>
  )
}

function Sidebar({ rail, onSearch, onHelp }: { rail: boolean; onSearch: () => void; onHelp: () => void }) {
  const projects = useRpc('projects.list', {})
  const tasks = useRpc('tasks.list', {})
  const { projectsOpen } = usePrefs()
  const create = useCreateTask()
  const [creating, setCreating] = useState(false)
  const counts = useMemo(() => {
    const open = new Map<number, number>()
    let today = 0
    let overdue = 0
    let active = 0
    for (const t of tasks.data ?? []) {
      if (t.status !== 'done') {
        open.set(t.projectId, (open.get(t.projectId) ?? 0) + 1)
        active++
      }
      if (isOverdue(t)) overdue++
      else if (isDueToday(t)) today++
    }
    return { open, today, overdue, active }
  }, [tasks.data])

  return (
    <nav aria-label="بخش‌ها" data-rail={rail} className="workspace-sidebar drag flex shrink-0 flex-col overflow-hidden px-2 pb-2 pt-3">
      <div className={cx('no-drag mb-3 flex items-center gap-1 px-1')}>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1">
          <img src={mark} alt="" className="h-[22px] w-[22px] shrink-0 rounded-md" />
          <span className="sidebar-link-label truncate text-sm font-bold">پیشرو</span>
        </div>
        <TooltipTrigger delay={300}>
          <IconButton label="جستجو" size="sm" className="sidebar-hide text-[var(--sidebar-muted)]" onPress={onSearch}>
            <Search size={16} />
          </IconButton>
          <Tooltip className="rounded-md bg-ink px-2 py-1 text-xs text-surface">جستجو {MOD}K</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger delay={300}>
          <IconButton
            label="تسک جدید"
            size="sm"
            className="sidebar-hide border border-[var(--sidebar-selected)] bg-[var(--sidebar-hover)]"
            onPress={() => create()}
          >
            <Edit size={15} />
          </IconButton>
          <Tooltip className="rounded-md bg-ink px-2 py-1 text-xs text-surface">تسک جدید · C</Tooltip>
        </TooltipTrigger>
      </div>

      <ul className="no-drag space-y-px">
        <NavItem to="/" label="داشبورد" rail={rail} icon={<LayoutDashboard size={16} />} />
        <NavItem
          to="/views/$view"
          params={{ view: 'today' }}
          label="امروز"
          rail={rail}
          icon={<TriangleAlert size={16} />}
          badge={counts.overdue + counts.today}
          urgent={counts.overdue > 0}
        />
        <NavItem to="/views/$view" params={{ view: 'upcoming' }} label="پیش رو" rail={rail} icon={<CalendarRange size={16} />} />
        <NavItem
          to="/views/$view"
          params={{ view: 'active' }}
          label="همه تسک‌های باز"
          rail={rail}
          icon={<Rows3 size={16} />}
          count={counts.active}
        />
      </ul>

      <div className="no-drag mb-1 mt-5 flex items-center px-2">
        <button
          type="button"
          onClick={() => setPref('projectsOpen', !projectsOpen)}
          className="sidebar-group-label sidebar-hide flex flex-1 items-center gap-1 text-2xs font-semibold hover:text-[var(--sidebar-ink)]"
        >
          پروژه‌ها
          <ChevronDown size={12} className={cx('transition-transform', !projectsOpen && 'rotate-90')} />
        </button>
        <IconButton label="پروژه جدید" size="xs" className="sidebar-hide text-[var(--sidebar-muted)]" onPress={() => setCreating(true)}>
          <Plus size={14} />
        </IconButton>
      </div>
      <ul className="no-drag min-h-0 flex-1 space-y-px overflow-y-auto overflow-x-hidden">
        {(projectsOpen || rail) &&
          (projects.data ?? []).map((p) => (
            <NavItem
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: String(p.id) }}
              label={p.name}
              rail={rail}
              count={counts.open.get(p.id) ?? 0}
              icon={
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-[4px] text-[9px] font-black text-white"
                  style={{ background: p.color }}
                >
                  {p.name.charAt(0)}
                </span>
              }
            />
          ))}
      </ul>

      <div className="no-drag mt-2 flex items-center gap-1 border-t border-[var(--sidebar-selected)] px-1 pt-2">
        <ThemeButton />
        <TooltipTrigger delay={300}>
          <IconButton label="میانبرها" size="sm" className="text-[var(--sidebar-muted)]" onPress={onHelp}>
            <Info size={16} />
          </IconButton>
          <Tooltip className="rounded-md bg-ink px-2 py-1 text-xs text-surface">میانبرهای صفحه‌کلید · ?</Tooltip>
        </TooltipTrigger>
        <span className="sidebar-hide ms-auto flex gap-0.5 text-[var(--sidebar-muted)]" dir="ltr">
          <Kbd>{MOD}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>
      {creating && <ProjectSheet onClose={() => setCreating(false)} />}
    </nav>
  )
}

function NavItem({
  to,
  params,
  label,
  icon,
  rail,
  count,
  badge,
  urgent
}: {
  to: string
  params?: Record<string, string>
  label: string
  icon: ReactNode
  rail: boolean
  count?: number
  badge?: number
  urgent?: boolean
}) {
  return (
    <li>
      <TooltipTrigger delay={250} isDisabled={!rail}>
        <Link
          to={to}
          params={params as never}
          activeOptions={{ exact: to === '/', includeSearch: false }}
          aria-label={label}
          className="sidebar-link flex h-8 items-center gap-2.5 rounded-md text-sm transition-colors"
        >
          <span className="flex w-4 shrink-0 justify-center">{icon}</span>
          <span className="sidebar-link-label min-w-0 flex-1 truncate">{label}</span>
          {!!badge && (
            <span
              className={cx(
                'sidebar-link-label min-w-5 rounded-full px-1.5 text-center text-2xs font-bold tabular-nums',
                urgent ? 'bg-negative text-white' : 'bg-[var(--sidebar-selected)] text-[var(--sidebar-ink)]'
              )}
            >
              {fmt(badge)}
            </span>
          )}
          {!!count && <span className="sidebar-link-label text-2xs tabular-nums text-[var(--sidebar-muted)]">{fmt(count)}</span>}
        </Link>
        <Tooltip placement="left" offset={8} className="rounded-md bg-ink px-2 py-1 text-xs text-surface">
          {label}
        </Tooltip>
      </TooltipTrigger>
    </li>
  )
}
