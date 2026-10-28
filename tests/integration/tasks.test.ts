import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type Application, createApplication } from '../../src/main/composition-root'

let dir: string
let app: Application
const tx = <T>(work: () => Promise<T>) => app.uow.transaction(work)

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tasks-'))
  app = await createApplication(join(dir, 'tasks.db'))
})
afterEach(async () => {
  await app.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('task manager', () => {
  it('creates, moves, completes and cascades', async () => {
    const projectId = await tx(() => app.commands.saveProject({ key: 'kar', name: 'کار', description: '', color: '#5e6ad2' }))
    const a = await tx(() => app.commands.createTask({ projectId, title: 'اول', status: 'todo', priority: 'high', labels: ['x'] }))
    const b = await tx(() => app.commands.createTask({ projectId, title: 'دوم', status: 'todo', priority: 'low' }))
    let tasks = await tx(() => app.read.tasks(projectId))
    expect(tasks.map((t) => [t.title, t.position])).toEqual([
      ['اول', 0],
      ['دوم', 1]
    ])

    await tx(() => app.commands.updateTask(b, { status: 'done' }))
    await tx(() => app.commands.addSubtask(a, 'گام'))
    const [sub] = await tx(() => app.read.subtasks(a))
    await tx(() => app.commands.updateSubtask(sub?.id as number, { done: true }))

    tasks = await tx(() => app.read.tasks())
    const done = tasks.find((t) => t.id === b)
    expect(done?.completedAt).not.toBeNull()
    expect(tasks.find((t) => t.id === a)).toMatchObject({ labels: ['x'], subtaskCount: 1, subtaskDone: 1 })
    expect((await tx(() => app.read.activity(a))).map((x) => x.action)).toEqual(['subtask_done', 'subtask_added', 'created'])

    expect(tasks.find((t) => t.id === a)?.identifier).toBe('KAR-1')
    expect((await tx(() => app.read.task(b)))?.identifier).toBe('KAR-2')
    await tx(() => app.commands.addComment(a, '  تمام شد  '))
    expect((await tx(() => app.read.comments(a))).map((c) => c.body)).toEqual(['تمام شد'])
    await expect(tx(() => app.commands.saveProject({ key: 'K', name: 'x', description: '', color: '#5e6ad2' }))).rejects.toThrow('کلید')

    await tx(() => app.commands.deleteProject(projectId))
    expect(await tx(() => app.read.tasks())).toEqual([])
  })

  it('refuses a task for a missing project and rolls back', async () => {
    await expect(tx(() => app.commands.createTask({ projectId: 99, title: 'x', status: 'todo', priority: 'low' }))).rejects.toThrow('پروژه')
  })
})
