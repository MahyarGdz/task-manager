import type { Clock } from '../../shared-kernel/application'
import { NotFoundError } from '../../shared-kernel/domain'
import { type CommentRepository, commentBody } from '../domain/comment'
import { type ProjectProps, type ProjectRepository, validProject } from '../domain/project'
import { type SubtaskRepository, subtaskTitle } from '../domain/subtask'
import { type Priority, type Status, Task, type TaskPatch, type TaskRepository } from '../domain/task'

export type SaveProjectCommand = Omit<ProjectProps, 'id'> & { id?: number }
export type CreateTaskCommand = {
  projectId: number
  title: string
  description?: string
  status: Status
  priority: Priority
  dueDate?: string | null
  labels?: string[]
}

/** Every write use case of the task manager. Each method runs inside the caller's unit of work. */
export class TaskCommands {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly tasks: TaskRepository,
    private readonly subtasks: SubtaskRepository,
    private readonly comments: CommentRepository,
    private readonly clock: Clock
  ) {}

  async saveProject(command: SaveProjectCommand): Promise<number> {
    if (command.id && !(await this.projects.exists(command.id))) throw new NotFoundError('پروژه', command.id)
    return this.projects.save(validProject({ ...command, id: command.id ?? null }))
  }

  async deleteProject(id: number): Promise<void> {
    await this.projects.delete(id)
  }

  async createTask(command: CreateTaskCommand): Promise<number> {
    if (!(await this.projects.exists(command.projectId))) throw new NotFoundError('پروژه', command.projectId)
    const task = Task.create(
      {
        projectId: command.projectId,
        number: await this.tasks.nextNumber(command.projectId),
        title: command.title,
        description: command.description?.trim() ?? '',
        status: command.status,
        priority: command.priority,
        dueDate: command.dueDate ?? null,
        labels: command.labels ?? [],
        position: await this.tasks.nextPosition(command.projectId, command.status)
      },
      this.clock.now()
    )
    await this.tasks.save(task)
    return task.id as number
  }

  async updateTask(id: number, patch: TaskPatch): Promise<void> {
    const task = await this.existing(id)
    // A status change without an explicit drop position lands at the end of the target column.
    if (patch.status && patch.status !== task.snapshot.status && patch.position === undefined) {
      patch = { ...patch, position: await this.tasks.nextPosition(task.snapshot.projectId, patch.status) }
    }
    task.update(patch, this.clock.now())
    await this.tasks.save(task)
  }

  async deleteTask(id: number): Promise<void> {
    await this.tasks.delete(id)
  }

  async addSubtask(taskId: number, title: string): Promise<number> {
    await this.existing(taskId)
    const clean = subtaskTitle(title)
    const id = await this.subtasks.add(taskId, clean)
    await this.subtasks.log(taskId, 'subtask_added', clean)
    return id
  }

  async updateSubtask(id: number, patch: { title?: string; done?: boolean }): Promise<void> {
    const sub = await this.subtasks.findById(id)
    if (!sub) throw new NotFoundError('زیرتسک', id)
    const next = { ...sub, title: patch.title === undefined ? sub.title : subtaskTitle(patch.title), done: patch.done ?? sub.done }
    await this.subtasks.update(next)
    if (next.done && !sub.done) await this.subtasks.log(sub.taskId, 'subtask_done', next.title)
  }

  async deleteSubtask(id: number): Promise<void> {
    await this.subtasks.delete(id)
  }

  async addComment(taskId: number, body: string): Promise<number> {
    await this.existing(taskId)
    return this.comments.add(taskId, commentBody(body))
  }

  async updateComment(id: number, body: string): Promise<void> {
    await this.comments.update(id, commentBody(body))
  }

  async deleteComment(id: number): Promise<void> {
    await this.comments.delete(id)
  }

  private async existing(id: number): Promise<Task> {
    const task = await this.tasks.findById(id)
    if (!task) throw new NotFoundError('تسک', id)
    return task
  }
}
