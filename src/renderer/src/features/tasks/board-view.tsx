import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import type { Status, TaskDto } from '../../../../shared/dto'
import { fmt } from '../../../../shared/format'
import { useCommand } from '../../lib/rpc'
import { IconButton } from '../../ui/button'
import { useToast } from '../../ui/feedback'
import { Plus } from '../../ui/icons'
import { COLUMNS, midpoint } from './model'
import { TaskCardBody } from './task-card'
import { StatusIcon } from './task-icons'
import { useUpdateTask } from './use-tasks'

function SortableCard({ task, onOpen }: { task: TaskDto; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    // biome-ignore lint/a11y/useSemanticElements: dnd-kit's sortable node must be a plain element; it carries role/tabIndex itself
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event)
        if (event.key === 'Enter') onOpen()
      }}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <TaskCardBody task={task} />
    </div>
  )
}

/** Type a title, Enter: the fastest way to capture a task into a column. */
function QuickAdd({ projectId, status, onDone }: { projectId: number; status: Status; onDone: () => void }) {
  const create = useCommand('tasks.create')
  const toast = useToast()
  const [title, setTitle] = useState('')
  const submit = () => {
    const t = title.trim()
    if (!t) return onDone()
    create.mutate({ projectId, title: t, status, priority: 'none' }, { onSuccess: () => setTitle(''), onError: toast.error })
  }
  return (
    <div className="rounded-lg border border-brand/50 bg-surface p-2 shadow-card">
      <textarea
        // biome-ignore lint/a11y/noAutofocus: opened on purpose by the add button
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title.trim() && onDone()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
          if (e.key === 'Escape') onDone()
        }}
        placeholder="عنوان تسک و Enter…"
        className="w-full resize-none bg-transparent text-base outline-none placeholder:text-ink-3"
      />
      <p className="text-2xs text-ink-3">Enter ثبت · Esc بستن</p>
    </div>
  )
}

function Column({
  status,
  label,
  tasks,
  projectId,
  onOpen
}: {
  status: Status
  label: string
  tasks: TaskDto[]
  projectId: number
  onOpen: (task: TaskDto) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [adding, setAdding] = useState(false)
  return (
    <div
      ref={setNodeRef}
      data-over={isOver}
      className="board-column flex h-full min-w-[248px] flex-1 basis-0 flex-col rounded-xl bg-subtle/60 transition-colors"
    >
      <div className="flex h-10 items-center gap-2 px-3">
        <StatusIcon status={status} />
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs tabular-nums text-ink-3">{fmt(tasks.length)}</span>
        <IconButton label={`افزودن به ${label}`} size="xs" className="ms-auto" onPress={() => setAdding(true)}>
          <Plus size={15} />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1.5 pb-3">
        {adding && <QuickAdd projectId={projectId} status={status} onDone={() => setAdding(false)} />}
        <SortableContext items={tasks.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onOpen={() => onOpen(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-6 text-xs text-ink-3 transition-colors hover:border-brand/50 hover:text-brand"
          >
            <Plus size={14} /> افزودن تسک
          </button>
        )}
      </div>
    </div>
  )
}

export function BoardView({
  tasks,
  projectId,
  sortable,
  onOpen
}: {
  tasks: TaskDto[]
  projectId: number
  /** false when a custom sort/filter is active: drag reordering would fight it. */
  sortable: boolean
  onOpen: (task: TaskDto) => void
}) {
  const update = useUpdateTask()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeWidth, setActiveWidth] = useState(272)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const grouped = useMemo(() => {
    const g: Record<Status, TaskDto[]> = { backlog: [], todo: [], doing: [], review: [], done: [] }
    for (const x of tasks) g[x.status].push(x)
    if (sortable) for (const list of Object.values(g)) list.sort((a, b) => a.position - b.position)
    return g
  }, [tasks, sortable])

  const activeTask = activeId ? (tasks.find((x) => x.id === activeId) ?? null) : null

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const dragged = tasks.find((x) => x.id === active.id)
    if (!dragged) return
    const overTask = tasks.find((x) => x.id === over.id)
    const destStatus = overTask ? overTask.status : (over.id as Status)
    if (!grouped[destStatus]) return
    const dest = grouped[destStatus].filter((x) => x.id !== dragged.id)
    const idx = overTask ? dest.findIndex((x) => x.id === overTask.id) : dest.length
    const position = midpoint(dest, idx < 0 ? dest.length : idx)
    if (destStatus === dragged.status && position === dragged.position) return
    update.mutate({ id: dragged.id, status: destStatus, position })
  }

  const columns = (
    <div className="flex h-full gap-2 overflow-x-auto px-3 py-3">
      {COLUMNS.map(({ key, label }) => (
        <Column key={key} status={key} label={label} tasks={grouped[key]} projectId={projectId} onOpen={onOpen} />
      ))}
    </div>
  )

  if (!sortable) return columns

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => (pointerWithin(args).length ? pointerWithin(args) : rectIntersection(args))}
      onDragStart={(e: DragStartEvent) => {
        setActiveId(Number(e.active.id))
        setActiveWidth(e.active.rect.current.initial?.width ?? 272)
      }}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      {columns}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {activeTask && (
          <div style={{ width: activeWidth }}>
            <TaskCardBody task={activeTask} dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
