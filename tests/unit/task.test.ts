import { describe, expect, it } from 'vitest'
import { midpoint, Task, type TaskChanged } from '../../src/modules/tasks/domain/task'

const now = new Date('2026-10-28T10:00:00Z')
const base = {
  projectId: 1,
  number: 1,
  title: '  نوشتن گزارش ',
  description: '',
  status: 'todo' as const,
  priority: 'medium' as const,
  dueDate: null,
  labels: ['کار', 'کار', ' '],
  position: 0
}

describe('Task', () => {
  it('cleans title and labels and records creation', () => {
    const task = Task.create(base, now)
    expect(task.snapshot.title).toBe('نوشتن گزارش')
    expect(task.snapshot.labels).toEqual(['کار'])
    expect(task.pullEvents().map((e) => (e as TaskChanged).action)).toEqual(['created'])
  })

  it('refuses an empty title and too many labels', () => {
    expect(() => Task.create({ ...base, title: ' ' }, now)).toThrow('عنوان')
    expect(() => Task.create({ ...base, labels: Array.from({ length: 11 }, (_, i) => `l${i}`) }, now)).toThrow('برچسب')
  })

  it('stamps completion and records only real changes', () => {
    const task = Task.create(base, now)
    task.pullEvents()
    task.update({ status: 'done', priority: 'medium', title: 'نوشتن گزارش' }, now)
    expect(task.snapshot.completedAt).toBe(now.toISOString())
    expect(task.pullEvents().map((e) => (e as TaskChanged).action)).toEqual(['status_changed'])
    task.update({ status: 'doing' }, now)
    expect(task.snapshot.completedAt).toBeNull()
  })

  it('places between neighbours', () => {
    expect(midpoint(undefined, undefined)).toBe(0)
    expect(midpoint(undefined, 3)).toBe(2)
    expect(midpoint(3, undefined)).toBe(4)
    expect(midpoint(1, 2)).toBe(1.5)
  })
})
