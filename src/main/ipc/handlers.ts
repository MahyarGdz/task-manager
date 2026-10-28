import { app, nativeTheme, shell } from 'electron'
import type { Method, Output, Parsed } from '../../shared/contract'
import { isoDate } from '../../shared/format'
import type { Application } from '../composition-root'

type Handler<M extends Method> = (input: Parsed<M>, app: Application) => Promise<Output<M>>
export type Handlers = { [M in Method]: Handler<M> }

/** Commands answer `null`; the renderer refetches what it shows. */
const none = async (work: Promise<unknown>) => {
  await work
  return null
}

/** One line per contract method; every read and write runs in its own unit of work. */
export const handlers: Handlers = {
  'app.info': async () => ({ version: app.getVersion(), today: isoDate(), dataDir: app.getPath('userData') }),
  'app.revealData': async () => {
    await shell.openPath(app.getPath('userData'))
    return null
  },
  'ui.setTheme': async ({ theme }) => {
    nativeTheme.themeSource = theme
    return null
  },

  'projects.list': (_, a) => a.uow.transaction(() => a.read.projects()),
  'projects.save': (input, a) => a.uow.transaction(() => a.commands.saveProject(input)),
  'projects.delete': ({ id }, a) => a.uow.transaction(() => none(a.commands.deleteProject(id))),

  'tasks.list': ({ projectId }, a) => a.uow.transaction(() => a.read.tasks(projectId)),
  'tasks.create': (input, a) => a.uow.transaction(() => a.commands.createTask(input)),
  'tasks.update': ({ id, ...patch }, a) => a.uow.transaction(() => none(a.commands.updateTask(id, patch))),
  'tasks.get': ({ id }, a) => a.uow.transaction(() => a.read.task(id)),
  'tasks.delete': ({ id }, a) => a.uow.transaction(() => none(a.commands.deleteTask(id))),
  'tasks.activity': ({ taskId }, a) => a.uow.transaction(() => a.read.activity(taskId)),

  'subtasks.list': ({ taskId }, a) => a.uow.transaction(() => a.read.subtasks(taskId)),
  'subtasks.add': ({ taskId, title }, a) => a.uow.transaction(() => a.commands.addSubtask(taskId, title)),
  'subtasks.update': ({ id, ...patch }, a) => a.uow.transaction(() => none(a.commands.updateSubtask(id, patch))),
  'subtasks.delete': ({ id }, a) => a.uow.transaction(() => none(a.commands.deleteSubtask(id))),

  'comments.list': ({ taskId }, a) => a.uow.transaction(() => a.read.comments(taskId)),
  'comments.add': ({ taskId, body }, a) => a.uow.transaction(() => a.commands.addComment(taskId, body)),
  'comments.update': ({ id, body }, a) => a.uow.transaction(() => none(a.commands.updateComment(id, body))),
  'comments.delete': ({ id }, a) => a.uow.transaction(() => none(a.commands.deleteComment(id)))
}
