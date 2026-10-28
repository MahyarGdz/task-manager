import { AggregateRoot, DomainEvent, ValidationError } from '../../shared-kernel/domain'

// Order here IS the board's column order.
export const STATUSES = ['backlog', 'todo', 'doing', 'review', 'done'] as const
export type Status = (typeof STATUSES)[number]
export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]
export const MAX_LABELS = 10

export type TaskAction = 'created' | 'status_changed' | 'priority_changed' | 'renamed' | 'due_changed' | 'subtask_added' | 'subtask_done'

/** One line of a task's history. Persisted as task_activity by the repository. */
export class TaskChanged extends DomainEvent {
  constructor(
    readonly action: TaskAction,
    readonly detail: string | null = null
  ) {
    super()
  }
}

export class InvalidTaskError extends ValidationError {}

export type TaskProps = {
  id: number | null
  projectId: number
  /** Per-project sequence: the 12 in KEY-12. */
  number: number
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  labels: string[]
  position: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskPatch = Partial<Pick<TaskProps, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'labels' | 'position'>>

/** A unit of work on a project's board. Owns its title/label rules and records its own history. */
export class Task extends AggregateRoot {
  private constructor(private props: TaskProps) {
    super()
  }

  static create(input: Omit<TaskProps, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>, now: Date): Task {
    const at = now.toISOString()
    const task = new Task({ ...input, id: null, createdAt: at, updatedAt: at, completedAt: null })
    task.props.title = cleanTitle(input.title)
    task.props.labels = cleanLabels(input.labels)
    if (input.status === 'done') task.props.completedAt = at
    task.record(new TaskChanged('created'))
    return task
  }

  static reconstitute(props: TaskProps): Task {
    return new Task({ ...props })
  }

  get id() {
    return this.props.id
  }
  get snapshot(): Readonly<TaskProps> {
    return this.props
  }

  update(patch: TaskPatch, now: Date): void {
    const p = this.props
    if (patch.title !== undefined) {
      const title = cleanTitle(patch.title)
      if (title !== p.title) this.record(new TaskChanged('renamed', title))
      p.title = title
    }
    if (patch.status !== undefined && patch.status !== p.status) {
      this.record(new TaskChanged('status_changed', patch.status))
      p.status = patch.status
      p.completedAt = patch.status === 'done' ? now.toISOString() : null
    }
    if (patch.priority !== undefined && patch.priority !== p.priority) {
      this.record(new TaskChanged('priority_changed', patch.priority))
      p.priority = patch.priority
    }
    if (patch.dueDate !== undefined && patch.dueDate !== p.dueDate) {
      this.record(new TaskChanged('due_changed', patch.dueDate))
      p.dueDate = patch.dueDate
    }
    if (patch.description !== undefined) p.description = patch.description.trim()
    if (patch.labels !== undefined) p.labels = cleanLabels(patch.labels)
    if (patch.position !== undefined) p.position = patch.position
    p.updatedAt = now.toISOString()
  }

  assignIdentity(id: number): void {
    this.props.id = id
  }
}

function cleanTitle(title: string): string {
  const t = title.trim()
  if (!t) throw new InvalidTaskError('عنوان تسک الزامی است.')
  return t
}

function cleanLabels(labels: readonly string[]): string[] {
  const out = [...new Set(labels.map((l) => l.trim()).filter(Boolean))]
  if (out.length > MAX_LABELS) throw new InvalidTaskError(`حداکثر ${MAX_LABELS} برچسب مجاز است.`)
  return out
}

/** Position between two neighbours in a column; float midpoint. */
// ponytail: converges only after ~50 inserts between the same pair; add a rebalance pass if it ever matters.
export function midpoint(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return 0
  if (prev === undefined) return (next as number) - 1
  if (next === undefined) return prev + 1
  return (prev + next) / 2
}

export interface TaskRepository {
  findById(id: number): Promise<Task | null>
  /** Saves the task and appends its pending history. */
  save(task: Task): Promise<void>
  delete(id: number): Promise<void>
  /** Position after the last task of a column. */
  nextPosition(projectId: number, status: Status): Promise<number>
  /** Next per-project sequence number. */
  nextNumber(projectId: number): Promise<number>
}
