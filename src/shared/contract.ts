// The whole renderer -> main API. Main validates every input with these schemas before running
// a handler; the renderer is treated as untrusted.
import { z } from 'zod'
import type * as D from './dto'

const id = z.int().positive()
const isoDate = z.iso.date()
const title = z.string().trim().min(1, 'عنوان الزامی است').max(300)
const status = z.enum(['backlog', 'todo', 'doing', 'review', 'done'])
const priority = z.enum(['none', 'low', 'medium', 'high', 'urgent'])
const labels = z.array(z.string().trim().min(1).max(40)).max(10, 'حداکثر ۱۰ برچسب')
const description = z.string().max(20_000)

type Def<I extends z.ZodType, O> = { input: I; _out?: O }
const def =
  <O>() =>
  <I extends z.ZodType>(input: I): Def<I, O> => ({ input })
const none = z.object({}).strict()

export const contract = {
  'app.info': def<D.AppInfo>()(none),
  'app.revealData': def<null>()(none),
  'ui.setTheme': def<null>()(z.object({ theme: z.enum(['system', 'light', 'dark']) })),

  'projects.list': def<D.ProjectDto[]>()(none),
  'projects.save': def<number>()(
    z.object({
      id: id.optional(),
      key: z
        .string()
        .trim()
        .regex(/^[A-Za-z][A-Za-z0-9]{1,4}$/, 'کلید پروژه ۲ تا ۵ حرف لاتین است، مثل KAR'),
      name: z.string().trim().min(1, 'نام پروژه الزامی است').max(120),
      description: z.string().max(2000).default(''),
      color: z.string().regex(/^#[0-9a-f]{6}$/i)
    })
  ),
  'projects.delete': def<null>()(z.object({ id })),

  'tasks.list': def<D.TaskDto[]>()(z.object({ projectId: id.optional() })),
  'tasks.create': def<number>()(
    z.object({
      projectId: id,
      title,
      description: description.optional(),
      status,
      priority,
      dueDate: isoDate.nullable().optional(),
      labels: labels.optional()
    })
  ),
  'tasks.update': def<null>()(
    z.object({
      id,
      title: title.optional(),
      description: description.optional(),
      status: status.optional(),
      priority: priority.optional(),
      dueDate: isoDate.nullable().optional(),
      labels: labels.optional(),
      position: z.number().finite().optional()
    })
  ),
  'tasks.get': def<D.TaskDto | null>()(z.object({ id })),
  'tasks.delete': def<null>()(z.object({ id })),
  'tasks.activity': def<D.ActivityDto[]>()(z.object({ taskId: id })),

  'subtasks.list': def<D.SubtaskDto[]>()(z.object({ taskId: id })),
  'subtasks.add': def<number>()(z.object({ taskId: id, title })),
  'subtasks.update': def<null>()(z.object({ id, title: title.optional(), done: z.boolean().optional() })),
  'subtasks.delete': def<null>()(z.object({ id })),

  'comments.list': def<D.CommentDto[]>()(z.object({ taskId: id })),
  'comments.add': def<number>()(z.object({ taskId: id, body: z.string().trim().min(1, 'متن یادداشت خالی است').max(20_000) })),
  'comments.update': def<null>()(z.object({ id, body: z.string().trim().min(1).max(20_000) })),
  'comments.delete': def<null>()(z.object({ id }))
} as const

export type Contract = typeof contract
export type Method = keyof Contract
export type Input<M extends Method> = z.input<Contract[M]['input']>
export type Parsed<M extends Method> = z.output<Contract[M]['input']>
export type Output<M extends Method> = Exclude<Contract[M]['_out'], undefined>

export type RpcResult = { ok: true; data: unknown } | { ok: false; error: string }
export type RpcBridge = { call: (method: string, input: unknown) => Promise<RpcResult>; platform: string }
