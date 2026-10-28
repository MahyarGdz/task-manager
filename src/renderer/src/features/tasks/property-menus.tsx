import { type ReactNode, useState } from 'react'
import { Button, Dialog, DialogTrigger, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import type { Priority, ProjectDto, Status } from '../../../../shared/dto'
import { isoDate } from '../../../../shared/format'
import { isoToLocalDate, localDateToIso } from '../../ui/calendar-date'
import { cx } from '../../ui/cx'
import { CalendarDays, Check, Plus, X } from '../../ui/icons'
import { PersianCalendar } from '../../ui/persian-calendar'
import { LabelChip } from './chips'
import { COLUMNS, dayLabel, isOverdue, labelHue, PRIORITIES, PRIORITY } from './model'
import { PriorityIcon, StatusIcon } from './task-icons'

const popover =
  'ui-popover min-w-52 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop outline-none data-[entering]:animate-[rise_120ms_ease-out]'
const item =
  'flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-sm text-ink outline-none data-[focused]:bg-hover data-[selected]:font-medium'

/** The trigger look: bare icon (rows, cards) or an outlined pill with its label (task page, create modal). */
export type TriggerLook = 'icon' | 'pill' | 'field'

const triggerCls = (look: TriggerLook, className?: string) =>
  cx(
    'no-drag inline-flex shrink-0 items-center gap-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand',
    look === 'icon' && 'h-6 w-6 justify-center rounded-md hover:bg-selected',
    look === 'pill' && 'h-7 rounded-md border border-border px-2 text-xs text-ink-2 hover:bg-hover hover:text-ink',
    look === 'field' && 'h-8 w-full rounded-md px-2 text-sm text-ink hover:bg-hover',
    className
  )

function ChoiceMenu<K extends string>({
  label,
  trigger,
  look,
  value,
  options,
  onChange,
  className
}: {
  label: string
  trigger: ReactNode
  look: TriggerLook
  value: K
  options: readonly { id: K; label: string; icon: ReactNode; hint?: string }[]
  onChange: (k: K) => void
  className?: string
}) {
  return (
    <MenuTrigger>
      <Button aria-label={label} className={triggerCls(look, className)} onPress={() => undefined}>
        {trigger}
      </Button>
      <Popover placement="bottom start" offset={4} className={popover}>
        <Menu
          aria-label={label}
          autoFocus="first"
          selectionMode="single"
          selectedKeys={[value]}
          onAction={(k) => onChange(k as K)}
          className="outline-none"
        >
          {options.map((o) => (
            <MenuItem key={o.id} id={o.id} textValue={o.label} className={item}>
              {({ isSelected }) => (
                <>
                  <span className="flex w-4 justify-center">{o.icon}</span>
                  <span className="flex-1">{o.label}</span>
                  {isSelected && <Check size={14} className="text-ink-2" />}
                  {o.hint && <span className="mono-id w-3 text-center">{o.hint}</span>}
                </>
              )}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}

export function StatusMenu({
  value,
  onChange,
  look = 'icon',
  className
}: {
  value: Status
  onChange: (s: Status) => void
  look?: TriggerLook
  className?: string
}) {
  const label = COLUMNS.find((c) => c.key === value)?.label ?? ''
  return (
    <ChoiceMenu
      label={`وضعیت: ${label}`}
      look={look}
      value={value}
      onChange={onChange}
      className={className}
      options={COLUMNS.map((c, i) => ({ id: c.key, label: c.label, icon: <StatusIcon status={c.key} />, hint: String(i + 1) }))}
      trigger={
        <>
          <StatusIcon status={value} size={look === 'icon' ? 14 : 13} />
          {look !== 'icon' && <span>{label}</span>}
        </>
      }
    />
  )
}

export function PriorityMenu({
  value,
  onChange,
  look = 'icon',
  className
}: {
  value: Priority
  onChange: (p: Priority) => void
  look?: TriggerLook
  className?: string
}) {
  return (
    <ChoiceMenu
      label={`اولویت: ${PRIORITY[value].label}`}
      look={look}
      value={value}
      onChange={onChange}
      className={className}
      options={PRIORITIES.map((p, i) => ({
        id: p,
        label: PRIORITY[p].label,
        icon: <PriorityIcon priority={p} className="text-ink-2" />,
        hint: String((i + 1) % 5)
      }))}
      trigger={
        <>
          <PriorityIcon priority={value} className={value === 'none' ? 'text-ink-3' : 'text-ink-2'} />
          {look !== 'icon' && <span>{PRIORITY[value].label}</span>}
        </>
      }
    />
  )
}

export function ProjectMenu({
  projects,
  value,
  onChange,
  look = 'pill'
}: {
  projects: readonly ProjectDto[]
  value: number
  onChange: (id: number) => void
  look?: TriggerLook
}) {
  const current = projects.find((p) => p.id === value)
  const dot = (p?: ProjectDto) => <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p?.color ?? 'var(--ink-3)' }} />
  return (
    <ChoiceMenu
      label="پروژه"
      look={look}
      value={String(value)}
      onChange={(k) => onChange(Number(k))}
      options={projects.map((p) => ({ id: String(p.id), label: p.name, icon: dot(p) }))}
      trigger={
        <>
          {dot(current)}
          <span>{current?.name ?? 'پروژه'}</span>
        </>
      }
    />
  )
}

const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

export function DueMenu({
  value,
  onChange,
  look = 'pill',
  className
}: {
  value: string | null
  onChange: (iso: string | null) => void
  look?: TriggerLook
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const pick = (iso: string | null) => {
    onChange(iso)
    setOpen(false)
  }
  const overdue = value ? isOverdue({ dueDate: value, status: 'todo' }) : false
  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button aria-label="موعد انجام" className={triggerCls(look, cx(overdue && 'text-negative', className))}>
        <CalendarDays size={14} className={overdue ? 'text-negative' : 'text-ink-3'} />
        {(look !== 'icon' || value) && <span>{value ? dayLabel(value) : 'موعد'}</span>}
      </Button>
      <Popover placement="bottom start" offset={4} className={cx(popover, 'p-2')}>
        <Dialog aria-label="انتخاب موعد" className="outline-none">
          <div className="mb-2 grid grid-cols-2 gap-1">
            {[
              ['امروز', addDays(0)],
              ['فردا', addDays(1)],
              ['هفته بعد', addDays(7)],
              ['ماه بعد', addDays(30)]
            ].map(([label, iso]) => (
              <button
                type="button"
                key={label}
                onClick={() => pick(iso as string)}
                className="flex h-8 items-center justify-between rounded-md px-2 text-sm hover:bg-hover"
              >
                {label}
                <span className="text-2xs text-ink-3">{dayLabel(iso as string)}</span>
              </button>
            ))}
          </div>
          <PersianCalendar
            mode="single"
            todayIso={isoDate()}
            selected={value ? isoToLocalDate(value) : undefined}
            defaultMonth={value ? isoToLocalDate(value) : undefined}
            onSelect={(date) => {
              const iso = localDateToIso(date)
              if (iso) pick(iso)
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="mt-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-negative hover:bg-negative-soft"
            >
              <X size={14} /> حذف موعد
            </button>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

/** Toggle existing labels or type a new one; changes apply as you click. */
export function LabelsMenu({
  value,
  known,
  onChange,
  look = 'pill'
}: {
  value: string[]
  known: string[]
  onChange: (labels: string[]) => void
  look?: TriggerLook
}) {
  const [q, setQ] = useState('')
  const all = [...new Set([...known, ...value])].sort((a, b) => a.localeCompare(b, 'fa'))
  const shown = all.filter((l) => l.includes(q.trim()))
  const toggle = (l: string) => onChange(value.includes(l) ? value.filter((x) => x !== l) : [...value, l].slice(0, 10))
  const create = q.trim() && !all.includes(q.trim())
  return (
    <DialogTrigger>
      <Button aria-label="برچسب‌ها" className={triggerCls(look, 'h-auto min-h-7 flex-wrap py-1')}>
        {value.length === 0 ? (
          <span className="flex items-center gap-1.5">
            <Plus size={13} /> برچسب
          </span>
        ) : (
          value.map((l) => <LabelChip key={l} text={l} />)
        )}
      </Button>
      <Popover placement="bottom start" offset={4} className={cx(popover, 'w-60')}>
        <Dialog aria-label="برچسب‌ها" className="outline-none">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) {
                e.preventDefault()
                toggle(q.trim())
                setQ('')
              }
            }}
            placeholder="جستجو یا برچسب جدید…"
            className="mb-1 h-8 w-full border-b border-divider bg-transparent px-2 text-sm outline-none placeholder:text-ink-3"
          />
          <div className="max-h-60 overflow-y-auto">
            {shown.map((l) => (
              <button type="button" key={l} onClick={() => toggle(l)} className={cx(item, 'w-full text-start hover:bg-hover')}>
                <span
                  className={cx(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    value.includes(l) ? 'border-brand bg-brand text-white' : 'border-control-border'
                  )}
                >
                  {value.includes(l) && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${labelHue(l)} 65% 55%)` }} />
                <span className="flex-1 truncate">{l}</span>
              </button>
            ))}
            {create && (
              <button
                type="button"
                onClick={() => {
                  toggle(q.trim())
                  setQ('')
                }}
                className={cx(item, 'w-full text-start text-brand hover:bg-hover')}
              >
                <Plus size={14} /> ساخت «{q.trim()}»
              </button>
            )}
            {!create && shown.length === 0 && <p className="px-2 py-3 text-xs text-ink-3">برچسبی نیست؛ بنویس و Enter بزن.</p>}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
