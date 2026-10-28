import { useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'
import type { TaskDto } from '../../../../shared/dto'
import { searchKey } from '../../../../shared/format'
import { useRpc } from '../../lib/rpc'
import { cx } from '../../ui/cx'
import { FolderOpen, LayoutDashboard, Plus, Search } from '../../ui/icons'
import { Kbd } from '../../ui/layout'
import { COLUMNS } from './model'
import { StatusIcon } from './task-icons'
import { useUpdateTask } from './use-tasks'

type Cmd = { id: string; label: string; group: string; hint?: string; icon?: ReactNode; run: () => void }

/** Command palette (⌘K): jump to a project or task, create a task, move a task to another status. */
export function CommandMenu({
  isOpen,
  onClose,
  onCreateTask,
  onOpenTask
}: {
  isOpen: boolean
  onClose: () => void
  onCreateTask?: () => void
  onOpenTask: (task: TaskDto) => void
}) {
  const navigate = useNavigate()
  const projects = useRpc('projects.list', {})
  const tasks = useRpc('tasks.list', {})
  const update = useUpdateTask()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [statusFor, setStatusFor] = useState<TaskDto | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQ('')
      setSel(0)
      setStatusFor(null)
    }
  }, [isOpen])

  const projectName = useMemo(() => new Map((projects.data ?? []).map((p) => [p.id, p.name])), [projects.data])

  const commands = useMemo<Cmd[]>(() => {
    if (statusFor) {
      return COLUMNS.map((c) => ({
        id: `status-${c.key}`,
        group: `تغییر وضعیت «${statusFor.title}»`,
        label: c.label,
        icon: <StatusIcon status={c.key} />,
        run: () => {
          update.mutate({ id: statusFor.id, status: c.key })
          onClose()
        }
      }))
    }
    const list: Cmd[] = []
    if (onCreateTask)
      list.push({ id: 'create', group: 'عملیات', label: 'ساخت تسک جدید', hint: 'N', icon: <Plus size={16} />, run: onCreateTask })
    list.push({ id: 'home', group: 'رفتن به', label: 'داشبورد', icon: <LayoutDashboard size={16} />, run: () => navigate({ to: '/' }) })
    for (const p of projects.data ?? []) {
      list.push({
        id: `project-${p.id}`,
        group: 'پروژه‌ها',
        label: p.name,
        icon: <FolderOpen size={16} style={{ color: p.color }} />,
        run: () => navigate({ to: '/projects/$projectId', params: { projectId: String(p.id) } })
      })
    }
    for (const [view, label] of [
      ['today', 'امروز'],
      ['upcoming', 'پیش رو'],
      ['active', 'همه تسک‌های باز']
    ] as const) {
      list.push({
        id: `view-${view}`,
        group: 'رفتن به',
        label,
        icon: <LayoutDashboard size={16} />,
        run: () => navigate({ to: '/views/$view', params: { view } })
      })
    }
    for (const t of tasks.data ?? []) {
      list.push({
        id: `task-${t.id}`,
        group: 'تسک‌ها',
        label: `${t.identifier}  ${t.title}`,
        hint: projectName.get(t.projectId),
        icon: <StatusIcon status={t.status} />,
        run: () => onOpenTask(t)
      })
    }
    return list
  }, [statusFor, projects.data, tasks.data, projectName, onCreateTask, onOpenTask, navigate, update, onClose])

  const filtered = useMemo(() => {
    const s = searchKey(q)
    const hits = s ? commands.filter((c) => searchKey(c.label).includes(s)) : commands
    return hits.slice(0, 60)
  }, [q, commands])
  const current = Math.min(sel, Math.max(0, filtered.length - 1))

  const run = (cmd: Cmd | undefined) => {
    if (!cmd) return
    if (!cmd.id.startsWith('status-')) onClose()
    cmd.run()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(Math.min(filtered.length - 1, current + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(Math.max(0, current - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(filtered[current])
    } else if (e.key === 'Tab') {
      // Tab on a task: pick its new status instead of opening it.
      e.preventDefault()
      const task = tasks.data?.find((t) => `task-${t.id}` === filtered[current]?.id)
      if (task) {
        setStatusFor(task)
        setQ('')
        setSel(0)
      }
    }
  }

  const groups: { name: string; items: { cmd: Cmd; idx: number }[] }[] = []
  filtered.forEach((cmd, idx) => {
    let g = groups.find((x) => x.name === cmd.group)
    if (!g) {
      g = { name: cmd.group, items: [] }
      groups.push(g)
    }
    g.items.push({ cmd, idx })
  })

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className="ui-modal-overlay fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
    >
      <Modal className="ui-modal w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
        <Dialog aria-label="فرمان‌ها" className="outline-none">
          <div className="flex items-center gap-2.5 border-b border-divider px-4">
            <Search size={18} className="text-ink-3" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setSel(0)
              }}
              onKeyDown={onKey}
              placeholder={statusFor ? 'وضعیت جدید…' : 'پروژه، تسک یا فرمان…'}
              className="h-14 flex-1 bg-transparent text-md outline-none placeholder:text-ink-3"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-ink-3">نتیجه‌ای پیدا نشد.</p>
            ) : (
              groups.map((g) => (
                <div key={g.name} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-2xs font-semibold text-ink-3">{g.name}</p>
                  {g.items.map(({ cmd, idx }) => (
                    <button
                      type="button"
                      key={cmd.id}
                      onMouseMove={() => setSel(idx)}
                      onClick={() => run(cmd)}
                      className={cx(
                        'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm transition-colors',
                        idx === current ? 'bg-brand-soft text-ink' : 'text-ink-2'
                      )}
                    >
                      <span className="flex w-4 shrink-0 justify-center text-ink-3">{cmd.icon}</span>
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {cmd.hint && <span className="max-w-40 truncate text-2xs text-ink-3">{cmd.hint}</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-divider bg-subtle px-4 py-2 text-2xs text-ink-3">
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> باز کردن
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> انتخاب
            </span>
            {!statusFor && (
              <span className="flex items-center gap-1">
                <Kbd>Tab</Kbd> تغییر وضعیت تسک
              </span>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
