// What main returns to the renderer. Plain JSON, no classes.
export type Status = 'backlog' | 'todo' | 'doing' | 'review' | 'done'
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export type AppInfo = { version: string; today: string; dataDir: string }

export type ProjectDto = {
  id: number
  key: string
  name: string
  description: string
  color: string
  createdAt: string
}

export type TaskDto = {
  id: number
  projectId: number
  number: number
  /** KEY-12 */
  identifier: string
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
  subtaskCount: number
  subtaskDone: number
}

export type SubtaskDto = { id: number; taskId: number; title: string; done: boolean; position: number }

export type ActivityDto = { id: number; taskId: number; action: string; detail: string | null; createdAt: string }

export type CommentDto = { id: number; taskId: number; body: string; createdAt: string; updatedAt: string }
