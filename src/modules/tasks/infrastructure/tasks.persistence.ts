import { defineEntity, type EntityManager, p } from '@mikro-orm/sqlite'
import type { CommentRepository } from '../domain/comment'
import type { ProjectProps, ProjectRepository } from '../domain/project'
import type { SubtaskProps, SubtaskRepository } from '../domain/subtask'
import { PRIORITIES, STATUSES, type Status, Task, TaskChanged, type TaskRepository } from '../domain/task'

export const ProjectRecordSchema = defineEntity({
  name: 'ProjectRecord',
  tableName: 'projects',
  properties: {
    id: p.integer().primary(),
    key: p.string(),
    name: p.string(),
    description: p.string(),
    color: p.string(),
    createdAt: p.string().onCreate(() => new Date().toISOString())
  }
})
export class ProjectRecord extends ProjectRecordSchema.class {}
ProjectRecordSchema.setClass(ProjectRecord)

export const TaskRecordSchema = defineEntity({
  name: 'TaskRecord',
  tableName: 'tasks',
  properties: {
    id: p.integer().primary(),
    projectId: p.integer(),
    number: p.integer(),
    title: p.string(),
    description: p.string(),
    status: p.enum(STATUSES),
    priority: p.enum(PRIORITIES),
    dueDate: p.string().nullable(),
    /** JSON array of label names. */
    labels: p.string(),
    position: p.float(),
    createdAt: p.string(),
    updatedAt: p.string(),
    completedAt: p.string().nullable()
  }
})
export class TaskRecord extends TaskRecordSchema.class {}
TaskRecordSchema.setClass(TaskRecord)

export const SubtaskRecordSchema = defineEntity({
  name: 'SubtaskRecord',
  tableName: 'subtasks',
  properties: {
    id: p.integer().primary(),
    taskId: p.integer(),
    title: p.string(),
    done: p.boolean(),
    position: p.float()
  }
})
export class SubtaskRecord extends SubtaskRecordSchema.class {}
SubtaskRecordSchema.setClass(SubtaskRecord)

export const TaskActivityRecordSchema = defineEntity({
  name: 'TaskActivityRecord',
  tableName: 'task_activity',
  properties: {
    id: p.integer().primary(),
    taskId: p.integer(),
    action: p.string(),
    detail: p.string().nullable(),
    createdAt: p.string().onCreate(() => new Date().toISOString())
  }
})
export class TaskActivityRecord extends TaskActivityRecordSchema.class {}
TaskActivityRecordSchema.setClass(TaskActivityRecord)

export const CommentRecordSchema = defineEntity({
  name: 'CommentRecord',
  tableName: 'task_comments',
  properties: {
    id: p.integer().primary(),
    taskId: p.integer(),
    body: p.string(),
    createdAt: p.string().onCreate(() => new Date().toISOString()),
    updatedAt: p.string().onCreate(() => new Date().toISOString())
  }
})
export class CommentRecord extends CommentRecordSchema.class {}
CommentRecordSchema.setClass(CommentRecord)

export const TASK_SCHEMAS = [
  ProjectRecordSchema,
  TaskRecordSchema,
  SubtaskRecordSchema,
  TaskActivityRecordSchema,
  CommentRecordSchema
] as const
export const TASK_RECORDS = [ProjectRecord, TaskRecord, SubtaskRecord, TaskActivityRecord, CommentRecord] as const

export class MikroOrmProjectRepository implements ProjectRepository {
  constructor(private readonly em: EntityManager) {}

  async exists(id: number): Promise<boolean> {
    return (await this.em.count(ProjectRecord, { id })) > 0
  }

  async save(project: ProjectProps): Promise<number> {
    const columns = { key: project.key, name: project.name, description: project.description, color: project.color }
    if (project.id === null) {
      const record = this.em.create(ProjectRecord, columns)
      await this.em.flush()
      return record.id
    }
    this.em.assign(await this.em.findOneOrFail(ProjectRecord, project.id), columns)
    await this.em.flush()
    return project.id
  }

  async delete(id: number): Promise<void> {
    await this.em.nativeDelete(ProjectRecord, { id })
  }
}

export class MikroOrmTaskRepository implements TaskRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: number): Promise<Task | null> {
    const r = await this.em.findOne(TaskRecord, id)
    return r
      ? Task.reconstitute({
          id: r.id,
          projectId: r.projectId,
          number: r.number,
          title: r.title,
          description: r.description,
          status: r.status,
          priority: r.priority,
          dueDate: r.dueDate ?? null,
          labels: JSON.parse(r.labels) as string[],
          position: r.position,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          completedAt: r.completedAt ?? null
        })
      : null
  }

  async save(task: Task): Promise<void> {
    const { id, labels, ...rest } = task.snapshot
    const columns = { ...rest, labels: JSON.stringify(labels) }
    if (id === null) {
      const record = this.em.create(TaskRecord, columns)
      await this.em.flush()
      task.assignIdentity(record.id)
    } else {
      this.em.assign(await this.em.findOneOrFail(TaskRecord, id), columns)
    }
    for (const event of task.pullEvents()) {
      if (event instanceof TaskChanged) {
        this.em.create(TaskActivityRecord, { taskId: task.id as number, action: event.action, detail: event.detail })
      }
    }
    await this.em.flush()
  }

  async delete(id: number): Promise<void> {
    await this.em.nativeDelete(TaskRecord, { id })
  }

  async nextPosition(projectId: number, status: Status): Promise<number> {
    const last = await this.em.findOne(TaskRecord, { projectId, status }, { orderBy: { position: 'desc' } })
    return last ? last.position + 1 : 0
  }

  async nextNumber(projectId: number): Promise<number> {
    const last = await this.em.findOne(TaskRecord, { projectId }, { orderBy: { number: 'desc' } })
    return (last?.number ?? 0) + 1
  }
}

export class MikroOrmSubtaskRepository implements SubtaskRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: number): Promise<SubtaskProps | null> {
    const r = await this.em.findOne(SubtaskRecord, id)
    return r ? { id: r.id, taskId: r.taskId, title: r.title, done: r.done, position: r.position } : null
  }

  async add(taskId: number, title: string): Promise<number> {
    const last = await this.em.findOne(SubtaskRecord, { taskId }, { orderBy: { position: 'desc' } })
    const record = this.em.create(SubtaskRecord, { taskId, title, done: false, position: last ? last.position + 1 : 0 })
    await this.em.flush()
    return record.id
  }

  async update(subtask: SubtaskProps): Promise<void> {
    this.em.assign(await this.em.findOneOrFail(SubtaskRecord, subtask.id), { title: subtask.title, done: subtask.done })
    await this.em.flush()
  }

  async delete(id: number): Promise<void> {
    await this.em.nativeDelete(SubtaskRecord, { id })
  }

  async log(taskId: number, action: string, detail: string | null): Promise<void> {
    this.em.create(TaskActivityRecord, { taskId, action, detail })
    await this.em.flush()
  }
}

export class MikroOrmCommentRepository implements CommentRepository {
  constructor(private readonly em: EntityManager) {}

  async add(taskId: number, body: string): Promise<number> {
    const record = this.em.create(CommentRecord, { taskId, body })
    await this.em.flush()
    return record.id
  }

  async update(id: number, body: string): Promise<void> {
    this.em.assign(await this.em.findOneOrFail(CommentRecord, id), { body, updatedAt: new Date().toISOString() })
    await this.em.flush()
  }

  async delete(id: number): Promise<void> {
    await this.em.nativeDelete(CommentRecord, { id })
  }
}
