import { useMemo } from 'react'
import type { Priority, Status, TaskDto } from '../../../../shared/dto'
import { isoDate } from '../../../../shared/format'

// Task-manager constants + pure helpers, shared by the overview, board, list, sheets and command menu.

// Order here IS the board's column order and the status bar's segment order.
export const COLUMNS: readonly { key: Status; label: string; accent: string }[] = [
  { key: 'backlog', label: 'بک‌لاگ', accent: '#8a8f98' },
  { key: 'todo', label: 'برای انجام', accent: '#a8abb4' },
  { key: 'doing', label: 'در حال انجام', accent: '#f2c94c' },
  { key: 'review', label: 'بازبینی', accent: '#4cb782' },
  { key: 'done', label: 'انجام شد', accent: '#6d5ef6' }
]
export const STATUS_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label])) as Record<Status, string>
export const statusAccent = (s: Status) => COLUMNS.find((c) => c.key === s)?.accent ?? '#94a3b8'

export const PRIORITY: Record<Priority, { label: string; color: string; rank: number }> = {
  urgent: { label: 'فوری', color: '#f2683c', rank: 4 },
  high: { label: 'زیاد', color: 'var(--ink-2)', rank: 3 },
  medium: { label: 'متوسط', color: 'var(--ink-2)', rank: 2 },
  low: { label: 'کم', color: 'var(--ink-2)', rank: 1 },
  none: { label: 'بدون اولویت', color: 'var(--ink-3)', rank: 0 }
}
export const PRIORITIES: readonly Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

export const ACTION_LABEL: Record<string, string> = {
  created: 'ساخته شد',
  status_changed: 'وضعیت تغییر کرد',
  priority_changed: 'اولویت تغییر کرد',
  renamed: 'عنوان تغییر کرد',
  due_changed: 'موعد تغییر کرد',
  subtask_added: 'زیرتسک اضافه شد',
  subtask_done: 'زیرتسک انجام شد'
}

/** Short Jalali day for dense rows: "۷ آبان". */
const shortDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'short' })
export const dayLabel = (iso: string) => shortDay.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso))

/** "۵ دقیقه پیش" style time for feeds. */
const rtf = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' })
export function relativeTime(iso: string): string {
  const s = (Date.parse(iso) - Date.now()) / 1000
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12]
  ]
  let v = s
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return unit === 'second' ? 'همین حالا' : rtf.format(Math.round(v), unit)
    v /= size
  }
  return rtf.format(Math.round(v), 'year')
}

/** Stable colour per label name (hash → hue). */
export function labelHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

const DAY_MS = 86_400_000
const dayDiff = (iso: string) => Math.round((Date.parse(iso) - Date.parse(isoDate())) / DAY_MS)

export const isOverdue = (t: Pick<TaskDto, 'dueDate' | 'status'>) => !!t.dueDate && t.status !== 'done' && dayDiff(t.dueDate) < 0
export const isDueToday = (t: Pick<TaskDto, 'dueDate' | 'status'>) => !!t.dueDate && t.status !== 'done' && dayDiff(t.dueDate) === 0

/** Float position between neighbours (see the domain's midpoint). */
export function midpoint(list: readonly TaskDto[], index: number): number {
  const prev = list[index - 1]?.position
  const next = list[index]?.position
  if (prev === undefined && next === undefined) return 0
  if (prev === undefined) return (next as number) - 1
  if (next === undefined) return prev + 1
  return (prev + next) / 2
}

export type StatusCount = { key: Status; label: string; accent: string; count: number }

export type TaskStats = {
  total: number
  done: number
  open: number
  overdue: number
  today: number
  high: number
  donePercent: number
  cols: StatusCount[]
}

/** Rollup of a set of tasks; `null` when there are none (rendered differently from "all zero"). */
export function taskStats(tasks: readonly TaskDto[]): TaskStats | null {
  const total = tasks.length
  if (total === 0) return null
  const done = tasks.filter((x) => x.status === 'done').length
  return {
    total,
    done,
    open: total - done,
    overdue: tasks.filter(isOverdue).length,
    today: tasks.filter(isDueToday).length,
    high: tasks.filter((x) => (x.priority === 'high' || x.priority === 'urgent') && x.status !== 'done').length,
    donePercent: Math.round((done / total) * 100),
    cols: COLUMNS.map((c) => ({ ...c, count: tasks.filter((x) => x.status === c.key).length }))
  }
}

/** The single line answering "does this need me?", worst first. */
export function taskHealth(s: TaskStats | null, fmt: (n: number) => string): { tone: string; label: string } | null {
  if (!s) return null
  if (s.overdue > 0) return { tone: 'var(--negative)', label: `${fmt(s.overdue)} سررسید گذشته` }
  if (s.high > 0) return { tone: 'var(--caution)', label: `${fmt(s.high)} اولویت زیاد` }
  if (s.donePercent === 100) return { tone: 'var(--positive)', label: 'همه انجام شد' }
  return { tone: 'var(--brand)', label: `${fmt(s.donePercent)}٪ انجام‌شده` }
}

// ----- filters ---------------------------------------------------------------

export type SortKey = 'manual' | 'priority' | 'due' | 'created' | 'title'
export type ViewMode = 'board' | 'list'
export type Filters = { q: string; priority: Priority | ''; label: string; sort: SortKey }
export const EMPTY_FILTERS: Filters = { q: '', priority: '', label: '', sort: 'manual' }

export const filtersActive = (f: Filters) => !!(f.q || f.priority || f.label || f.sort !== 'manual')

export function useTaskFilters(tasks: readonly TaskDto[], filters: Filters): TaskDto[] {
  return useMemo(() => {
    let out = [...tasks]
    const q = filters.q.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.labels.some((l) => l.toLowerCase().includes(q))
      )
    }
    if (filters.priority) out = out.filter((t) => t.priority === filters.priority)
    if (filters.label) out = out.filter((t) => t.labels.includes(filters.label))
    if (filters.sort !== 'manual') {
      out.sort((a, b) => {
        switch (filters.sort) {
          case 'priority':
            return PRIORITY[b.priority].rank - PRIORITY[a.priority].rank
          case 'due':
            if (!a.dueDate) return b.dueDate ? 1 : 0
            if (!b.dueDate) return -1
            return a.dueDate.localeCompare(b.dueDate)
          case 'created':
            return b.createdAt.localeCompare(a.createdAt)
          default:
            return a.title.localeCompare(b.title, 'fa')
        }
      })
    }
    return out
  }, [tasks, filters])
}
