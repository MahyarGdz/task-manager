import { ValidationError } from '../../shared-kernel/domain'

export const MAX_COMMENT = 20_000

export function commentBody(body: string): string {
  const b = body.trim()
  if (!b) throw new ValidationError('متن یادداشت خالی است.')
  if (b.length > MAX_COMMENT) throw new ValidationError('یادداشت خیلی بلند است.')
  return b
}

export interface CommentRepository {
  add(taskId: number, body: string): Promise<number>
  update(id: number, body: string): Promise<void>
  delete(id: number): Promise<void>
}
