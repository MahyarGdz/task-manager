import { sql } from 'kysely'
import type { ActivityDto, CommentDto, ProjectDto, SubtaskDto, TaskDto } from '../../../shared/dto'
import { ReadModel } from '../../read-model'

export class TasksReadModel extends ReadModel {
  async projects(): Promise<ProjectDto[]> {
    const rows = await this.sql
      .selectFrom('projects')
      .select(['id', 'key', 'name', 'description', 'color', 'created_at'])
      .orderBy('created_at')
      .execute()
    return rows.map((r) => ({ id: r.id, key: r.key, name: r.name, description: r.description, color: r.color, createdAt: r.created_at }))
  }

  /** Every task (all projects) when `projectId` is omitted: the overview computes its rollups from this. */
  async tasks(projectId?: number, taskId?: number): Promise<TaskDto[]> {
    let q = this.sql
      .selectFrom('tasks as t')
      .innerJoin('projects as p', 'p.id', 't.project_id')
      .selectAll('t')
      .select([
        'p.key as project_key',
        sql<number>`(SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id)`.as('subtask_count'),
        sql<number>`(SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.done = 1)`.as('subtask_done')
      ])
      .orderBy('t.position')
    if (projectId !== undefined) q = q.where('t.project_id', '=', projectId)
    if (taskId !== undefined) q = q.where('t.id', '=', taskId)
    const rows = await q.execute()
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      number: r.number,
      identifier: `${r.project_key}-${r.number}`,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date ?? null,
      labels: JSON.parse(r.labels) as string[],
      position: Number(r.position),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at ?? null,
      subtaskCount: Number(r.subtask_count),
      subtaskDone: Number(r.subtask_done)
    }))
  }

  async task(id: number): Promise<TaskDto | null> {
    return (await this.tasks(undefined, id))[0] ?? null
  }

  async comments(taskId: number): Promise<CommentDto[]> {
    const rows = await this.sql
      .selectFrom('task_comments')
      .select(['id', 'task_id', 'body', 'created_at', 'updated_at'])
      .where('task_id', '=', taskId)
      .orderBy('id')
      .execute()
    return rows.map((r) => ({ id: r.id, taskId: r.task_id, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at }))
  }

  async subtasks(taskId: number): Promise<SubtaskDto[]> {
    const rows = await this.sql
      .selectFrom('subtasks')
      .select(['id', 'task_id', 'title', 'done', 'position'])
      .where('task_id', '=', taskId)
      .orderBy('position')
      .execute()
    return rows.map((r) => ({ id: r.id, taskId: r.task_id, title: r.title, done: Boolean(r.done), position: Number(r.position) }))
  }

  async activity(taskId: number): Promise<ActivityDto[]> {
    const rows = await this.sql
      .selectFrom('task_activity')
      .select(['id', 'task_id', 'action', 'detail', 'created_at'])
      .where('task_id', '=', taskId)
      .orderBy('id', 'desc')
      .limit(100)
      .execute()
    return rows.map((r) => ({ id: r.id, taskId: r.task_id, action: r.action, detail: r.detail ?? null, createdAt: r.created_at }))
  }
}
