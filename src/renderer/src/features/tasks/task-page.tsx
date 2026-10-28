import { Link, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import type { ActivityDto, CommentDto, Priority, Status, TaskDto } from '../../../../shared/dto'
import { dateTimeFa, fmt } from '../../../../shared/format'
import { PanelHeader } from '../../app/panel-header'
import { useCommand, useRpc } from '../../lib/rpc'
import { Button, IconButton } from '../../ui/button'
import { Confirm } from '../../ui/dialog'
import { EmptyState, Skeleton, useToast } from '../../ui/feedback'
import { Check, ChevronLeft, Copy, Edit, Send, Trash2 } from '../../ui/icons'
import { Kbd } from '../../ui/layout'
import { ActionMenu } from '../../ui/menu'
import { ACTION_LABEL, dayLabel, PRIORITY, relativeTime, STATUS_LABEL } from './model'
import { DueMenu, LabelsMenu, PriorityMenu, StatusMenu } from './property-menus'
import { PriorityIcon, StatusIcon } from './task-icons'
import { useUpdateTask } from './use-tasks'

const autoGrow = { fieldSizing: 'content' } as React.CSSProperties

export function TaskPage({ taskId }: { taskId: number }) {
  const task = useRpc('tasks.get', { id: taskId })
  const projects = useRpc('projects.list', {})
  const navigate = useNavigate()
  const project = projects.data?.find((p) => p.id === task.data?.projectId)

  // Esc goes back to the board, like closing a peek.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target as HTMLElement).closest('input, textarea, [role="dialog"], [role="menu"]')) return
      if (project) navigate({ to: '/projects/$projectId', params: { projectId: String(project.id) } })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, navigate])

  if (task.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-10">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    )
  }
  if (!task.data) {
    return (
      <EmptyState title="تسک پیدا نشد" className="mt-16">
        این تسک حذف شده است.
      </EmptyState>
    )
  }
  const t = task.data
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader>
        {project && (
          <Link
            to="/projects/$projectId"
            params={{ projectId: String(project.id) }}
            className="no-drag flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-ink-2 hover:bg-hover hover:text-ink"
          >
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: project.color }} />
            {project.name}
          </Link>
        )}
        <ChevronLeft size={13} className="text-ink-3" />
        <span className="mono-id">{t.identifier}</span>
        <span className="min-w-0 truncate text-sm text-ink-2">{t.title}</span>
        <div className="no-drag ms-auto flex items-center gap-1">
          <CopyId identifier={t.identifier} />
          <TaskMenu
            task={t}
            onDeleted={() => project && navigate({ to: '/projects/$projectId', params: { projectId: String(project.id) } })}
          />
        </div>
      </PanelHeader>
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-10 pb-16 pt-8">
            <Editor key={t.id} task={t} />
            <Subtasks taskId={t.id} />
            <Feed task={t} />
          </div>
        </main>
        <Properties task={t} />
      </div>
    </div>
  )
}

function CopyId({ identifier }: { identifier: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <IconButton
      label="کپی شناسه"
      size="sm"
      onPress={() => {
        void navigator.clipboard.writeText(identifier)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? <Check size={15} className="text-positive" /> : <Copy size={15} />}
    </IconButton>
  )
}

function TaskMenu({ task, onDeleted }: { task: TaskDto; onDeleted: () => void }) {
  const remove = useCommand('tasks.delete')
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <ActionMenu
        label="گزینه‌های تسک"
        items={[{ id: 'delete', label: 'حذف تسک', icon: Trash2, danger: true, onAction: () => setConfirm(true) }]}
      />
      <Confirm
        title={`${task.identifier} حذف شود؟`}
        confirmLabel="حذف تسک"
        tone="danger"
        isOpen={confirm}
        pending={remove.isPending}
        onClose={() => setConfirm(false)}
        onConfirm={() => remove.mutate({ id: task.id }, { onSuccess: onDeleted, onError: toast.error })}
      >
        زیرتسک‌ها، یادداشت‌ها و تاریخچه این تسک هم حذف می‌شوند.
      </Confirm>
    </>
  )
}

/** Title and description edit in place and save on blur, like a document. */
function Editor({ task }: { task: TaskDto }) {
  const update = useUpdateTask()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const saveTitle = () => {
    const v = title.trim()
    if (!v) return setTitle(task.title)
    if (v !== task.title) update.mutate({ id: task.id, title: v })
  }
  const saveDescription = () => {
    if (description !== task.description) update.mutate({ id: task.id, description })
  }
  return (
    <div className="mb-8">
      <textarea
        aria-label="عنوان"
        rows={1}
        value={title}
        style={autoGrow}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        className="w-full resize-none bg-transparent font-display text-[26px] font-bold leading-10 outline-none"
      />
      <textarea
        aria-label="توضیحات"
        value={description}
        style={autoGrow}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={saveDescription}
        placeholder="توضیحات اضافه کن…"
        className="mt-3 min-h-16 w-full resize-none bg-transparent text-md leading-7 text-ink-2 outline-none placeholder:text-ink-3/70"
      />
    </div>
  )
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 6
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="var(--positive)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${(done / Math.max(total, 1)) * c} ${c}`}
        transform="rotate(-90 8 8)"
      />
    </svg>
  )
}

function Subtasks({ taskId }: { taskId: number }) {
  const subs = useRpc('subtasks.list', { taskId })
  const add = useCommand('subtasks.add')
  const update = useCommand('subtasks.update')
  const remove = useCommand('subtasks.delete')
  const toast = useToast()
  const [title, setTitle] = useState('')
  const list = subs.data ?? []
  const done = list.filter((s) => s.done).length
  const submit = () => {
    const v = title.trim()
    if (v) add.mutate({ taskId, title: v }, { onSuccess: () => setTitle(''), onError: toast.error })
  }
  return (
    <section className="mb-10">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold">زیرتسک‌ها</h2>
        {list.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs tabular-nums text-ink-3">
            <Ring done={done} total={list.length} />
            {fmt(done)}/{fmt(list.length)}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {list.map((s) => (
          <div key={s.id} className="group flex h-10 items-center gap-3 border-b border-divider px-3 last:border-b-0 hover:bg-hover/60">
            <button
              type="button"
              onClick={() => update.mutate({ id: s.id, done: !s.done })}
              aria-label={s.done ? 'بازگشایی' : 'انجام شد'}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <StatusIcon status={s.done ? 'done' : 'todo'} />
            </button>
            <span className={`flex-1 truncate text-sm ${s.done ? 'text-ink-3 line-through decoration-ink-3/50' : ''}`}>{s.title}</span>
            <IconButton
              label="حذف زیرتسک"
              size="xs"
              className="opacity-0 group-hover:opacity-100"
              onPress={() => remove.mutate({ id: s.id })}
            >
              <Trash2 size={13} />
            </IconButton>
          </div>
        ))}
        <input
          aria-label="زیرتسک جدید"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="+ افزودن زیرتسک…"
          className="h-10 w-full bg-transparent px-3 text-sm outline-none placeholder:text-ink-3 focus:bg-hover/40"
        />
      </div>
    </section>
  )
}

type FeedItem = { kind: 'event'; at: string; event: ActivityDto } | { kind: 'comment'; at: string; comment: CommentDto }

function eventDetail(e: ActivityDto): ReactNode {
  if (!e.detail) return null
  if (e.action === 'status_changed') {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-ink-2">
        <StatusIcon status={e.detail as Status} size={12} />
        {STATUS_LABEL[e.detail as Status]}
      </span>
    )
  }
  if (e.action === 'priority_changed') {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-ink-2">
        <PriorityIcon priority={e.detail as Priority} size={12} />
        {PRIORITY[e.detail as Priority]?.label}
      </span>
    )
  }
  if (e.action === 'due_changed') return <span className="font-medium text-ink-2">{dayLabel(e.detail)}</span>
  return <span className="font-medium text-ink-2">«{e.detail}»</span>
}

/** One timeline: history events as quiet lines, comments as cards, composer at the end. */
function Feed({ task }: { task: TaskDto }) {
  const activity = useRpc('tasks.activity', { taskId: task.id })
  const comments = useRpc('comments.list', { taskId: task.id })
  const items = useMemo<FeedItem[]>(
    () =>
      [
        ...(activity.data ?? []).map((event) => ({ kind: 'event' as const, at: event.createdAt, event })),
        ...(comments.data ?? []).map((comment) => ({ kind: 'comment' as const, at: comment.createdAt, comment }))
      ].sort((a, b) => a.at.localeCompare(b.at)),
    [activity.data, comments.data]
  )
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold">فعالیت</h2>
      <ol className="relative space-y-3 before:absolute before:inset-y-2 before:start-[9px] before:w-px before:bg-divider">
        {items.map((it) =>
          it.kind === 'event' ? (
            <li key={`e${it.event.id}`} className="relative flex items-center gap-3 text-xs text-ink-3">
              <span className="z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-canvas">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
              </span>
              <span>
                {ACTION_LABEL[it.event.action] ?? it.event.action} {eventDetail(it.event)}
              </span>
              <span title={dateTimeFa(it.at)}>· {relativeTime(it.at)}</span>
            </li>
          ) : (
            <Comment key={`c${it.comment.id}`} comment={it.comment} />
          )
        )}
      </ol>
      <Composer taskId={task.id} />
    </section>
  )
}

function Avatar() {
  return (
    <span className="z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#f472b6] text-2xs font-bold text-white">
      م
    </span>
  )
}

function Comment({ comment }: { comment: CommentDto }) {
  const update = useCommand('comments.update')
  const remove = useCommand('comments.delete')
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(comment.body)
  const edited = comment.updatedAt !== comment.createdAt
  return (
    <li className="relative flex gap-3">
      <Avatar />
      <div className="group min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className="font-semibold text-ink">شما</span>
          <span className="text-ink-3" title={dateTimeFa(comment.createdAt)}>
            {relativeTime(comment.createdAt)}
            {edited && ' · ویرایش‌شده'}
          </span>
          <div className="ms-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton label="ویرایش یادداشت" size="xs" onPress={() => setEditing(true)}>
              <Edit size={13} />
            </IconButton>
            <IconButton label="حذف یادداشت" size="xs" onPress={() => remove.mutate({ id: comment.id }, { onError: toast.error })}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        </div>
        {editing ? (
          <div>
            <textarea
              // biome-ignore lint/a11y/noAutofocus: opened on purpose by the edit button
              autoFocus
              aria-label="متن یادداشت"
              value={body}
              style={autoGrow}
              onChange={(e) => setBody(e.target.value)}
              className="w-full resize-none bg-transparent text-sm leading-6 outline-none"
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="xs"
                variant="primary"
                isDisabled={!body.trim()}
                onPress={() => update.mutate({ id: comment.id, body }, { onSuccess: () => setEditing(false), onError: toast.error })}
              >
                ذخیره
              </Button>
              <Button
                size="xs"
                onPress={() => {
                  setBody(comment.body)
                  setEditing(false)
                }}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <p className="selectable whitespace-pre-wrap break-words text-sm leading-6 text-ink">{comment.body}</p>
        )}
      </div>
    </li>
  )
}

function Composer({ taskId }: { taskId: number }) {
  const add = useCommand('comments.add')
  const toast = useToast()
  const [body, setBody] = useState('')
  const send = () => body.trim() && add.mutate({ taskId, body }, { onSuccess: () => setBody(''), onError: toast.error })
  return (
    <div className="mt-6 flex gap-3">
      <Avatar />
      <div className="flex-1 rounded-xl border border-border bg-surface shadow-card transition-colors focus-within:border-brand/50">
        <textarea
          aria-label="یادداشت جدید"
          value={body}
          style={autoGrow}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="یادداشت یا به‌روزرسانی بنویس…"
          className="min-h-20 w-full resize-none bg-transparent px-4 pt-3 text-sm leading-6 outline-none placeholder:text-ink-3"
        />
        <div className="flex items-center justify-end gap-2 px-3 pb-2.5">
          <span className="flex gap-0.5 text-ink-3" dir="ltr">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </span>
          <Button size="xs" variant="primary" onPress={send} isPending={add.isPending} isDisabled={!body.trim()}>
            <Send size={13} /> ارسال
          </Button>
        </div>
      </div>
    </div>
  )
}

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-2">
      <span className="text-xs text-ink-3">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Every property as a one-click menu; changes save immediately. */
function Properties({ task }: { task: TaskDto }) {
  const update = useUpdateTask()
  const all = useRpc('tasks.list', {})
  const known = useMemo(() => [...new Set((all.data ?? []).flatMap((t) => t.labels))], [all.data])
  return (
    <aside className="w-[300px] shrink-0 space-y-2.5 overflow-y-auto border-s border-divider bg-subtle/40 px-4 py-6">
      <p className="mb-3 text-2xs font-semibold text-ink-3">ویژگی‌ها</p>
      <Prop label="وضعیت">
        <StatusMenu look="field" value={task.status} onChange={(status) => update.mutate({ id: task.id, status })} />
      </Prop>
      <Prop label="اولویت">
        <PriorityMenu look="field" value={task.priority} onChange={(priority) => update.mutate({ id: task.id, priority })} />
      </Prop>
      <Prop label="موعد">
        <DueMenu look="field" value={task.dueDate} onChange={(dueDate) => update.mutate({ id: task.id, dueDate })} />
      </Prop>
      <Prop label="برچسب‌ها">
        <LabelsMenu look="field" value={task.labels} known={known} onChange={(labels) => update.mutate({ id: task.id, labels })} />
      </Prop>
      <div className="!mt-6 space-y-2 border-t border-divider pt-5 text-xs">
        <Fact label="ساخته‌شده" value={dateTimeFa(task.createdAt)} />
        <Fact label="آخرین تغییر" value={relativeTime(task.updatedAt)} />
        {task.completedAt && <Fact label="انجام‌شده" value={dateTimeFa(task.completedAt)} />}
      </div>
    </aside>
  )
}

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[84px_1fr] gap-2">
    <span className="text-ink-3">{label}</span>
    <span className="text-ink-2">{value}</span>
  </div>
)
