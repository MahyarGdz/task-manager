import { useNavigate } from '@tanstack/react-router'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Dialog, Modal, ModalOverlay, Switch } from 'react-aria-components'
import type { Priority, Status } from '../../../../shared/dto'
import { useCommand, useRpc } from '../../lib/rpc'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/feedback'
import { ChevronLeft, X } from '../../ui/icons'
import { Kbd } from '../../ui/layout'
import { DueMenu, LabelsMenu, PriorityMenu, ProjectMenu, StatusMenu } from './property-menus'

type Open = (opts?: { projectId?: number; status?: Status }) => void
const CreateContext = createContext<Open>(() => undefined)

/** Anywhere in the app: `useCreateTask()(…)` or the C key opens the composer. */
export const useCreateTask = () => useContext(CreateContext)

export function CreateTaskProvider({ children, currentProjectId }: { children: ReactNode; currentProjectId?: number }) {
  const [opts, setOpts] = useState<{ projectId?: number; status?: Status } | null>(null)
  const open = useCallback<Open>((o) => setOpts(o ?? {}), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable], [role="dialog"], [role="menu"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'c' || e.key === 'ز') {
        e.preventDefault()
        setOpts({ projectId: currentProjectId })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentProjectId])

  return (
    <CreateContext.Provider value={open}>
      {children}
      {opts && <Composer initial={{ ...opts, projectId: opts.projectId ?? currentProjectId }} onClose={() => setOpts(null)} />}
    </CreateContext.Provider>
  )
}

function Composer({ initial, onClose }: { initial: { projectId?: number; status?: Status }; onClose: () => void }) {
  const projects = useRpc('projects.list', {})
  const all = useRpc('tasks.list', {})
  const create = useCommand('tasks.create')
  const toast = useToast()
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<number | undefined>(initial.projectId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>(initial.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>('none')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [labels, setLabels] = useState<string[]>([])
  const [more, setMore] = useState(false)
  const known = useMemo(() => [...new Set((all.data ?? []).flatMap((t) => t.labels))], [all.data])
  const list = projects.data ?? []
  const pid = projectId ?? list[0]?.id
  const project = list.find((p) => p.id === pid)

  const submit = () => {
    if (!title.trim() || !pid) return
    create.mutate(
      { projectId: pid, title, description, status, priority, dueDate, labels },
      {
        onSuccess: (id) => {
          toast.ok(`تسک «${title.trim()}» ساخته شد.`)
          if (more) {
            setTitle('')
            setDescription('')
          } else {
            onClose()
            navigate({ to: '/task/$taskId', params: { taskId: String(id) } })
          }
        },
        onError: toast.error
      }
    )
  }

  return (
    <ModalOverlay
      isOpen
      isDismissable
      onOpenChange={(o) => !o && onClose()}
      className="ui-modal-overlay fixed inset-0 z-50 flex items-start justify-center pt-[14vh]"
    >
      <Modal className="ui-modal w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
        <Dialog aria-label="تسک جدید" className="outline-none">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: ⌘↵ submits from any field inside */}
          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
          >
            <div className="flex items-center gap-1.5 px-4 pt-3.5 text-xs text-ink-2">
              {list.length > 0 && pid && <ProjectMenu projects={list} value={pid} onChange={setProjectId} />}
              <ChevronLeft size={13} className="text-ink-3" />
              <span>تسک جدید</span>
              <button
                type="button"
                aria-label="بستن"
                onClick={onClose}
                className="ms-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>
            {list.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-2">اول یک پروژه بساز؛ تسک‌ها داخل پروژه‌ها هستند.</p>
            ) : (
              <>
                <input
                  autoFocus
                  aria-label="عنوان تسک"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                  placeholder="عنوان تسک"
                  className="mt-2 w-full bg-transparent px-5 text-xl font-semibold outline-none placeholder:text-ink-3/70"
                />
                <textarea
                  aria-label="توضیحات"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="توضیحات بیشتر…"
                  className="mt-2 w-full resize-none bg-transparent px-5 text-sm leading-6 text-ink-2 outline-none placeholder:text-ink-3/70"
                />
                <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4 pt-1">
                  <StatusMenu look="pill" value={status} onChange={setStatus} />
                  <PriorityMenu look="pill" value={priority} onChange={setPriority} />
                  <DueMenu value={dueDate} onChange={setDueDate} />
                  <LabelsMenu value={labels} known={known} onChange={setLabels} />
                </div>
                <div className="flex items-center gap-3 border-t border-divider px-4 py-3">
                  <Switch isSelected={more} onChange={setMore} className="group flex items-center gap-2 text-xs text-ink-2 outline-none">
                    <span className="flex h-4 w-7 items-center rounded-full bg-selected p-0.5 transition-colors group-data-[selected]:bg-brand">
                      <span className="h-3 w-3 rounded-full bg-white shadow transition-transform group-data-[selected]:-translate-x-3" />
                    </span>
                    ساخت پشت سر هم
                  </Switch>
                  {project && <span className="mono-id">{project.key}-?</span>}
                  <Button
                    variant="primary"
                    size="sm"
                    className="ms-auto"
                    onPress={submit}
                    isPending={create.isPending}
                    isDisabled={!title.trim()}
                  >
                    ساخت تسک
                    <span className="flex gap-0.5 opacity-80" dir="ltr">
                      <Kbd className="!border-white/25 !bg-white/15 !text-white">⌘</Kbd>
                      <Kbd className="!border-white/25 !bg-white/15 !text-white">↵</Kbd>
                    </span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
