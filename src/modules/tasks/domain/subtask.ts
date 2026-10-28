import { ValidationError } from '../../shared-kernel/domain'

export type SubtaskProps = { id: number; taskId: number; title: string; done: boolean; position: number }

export function subtaskTitle(title: string): string {
  const t = title.trim()
  if (!t) throw new ValidationError('عنوان زیرتسک الزامی است.')
  return t
}

export interface SubtaskRepository {
  findById(id: number): Promise<SubtaskProps | null>
  add(taskId: number, title: string): Promise<number>
  update(subtask: SubtaskProps): Promise<void>
  delete(id: number): Promise<void>
  /** Appends a line to the parent task's history. */
  log(taskId: number, action: string, detail: string | null): Promise<void>
}
