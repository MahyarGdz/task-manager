import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ProjectDto } from '../../../../shared/dto'
import { useCommand } from '../../lib/rpc'
import { Button } from '../../ui/button'
import { Sheet } from '../../ui/dialog'
import { useToast } from '../../ui/feedback'
import { TextField } from '../../ui/fields'
import { Check } from '../../ui/icons'

// Mirrors PROJECT_COLORS in the domain; main rejects anything else.
export const PROJECT_COLORS = ['#5e6ad2', '#26b5ce', '#4cb782', '#f2c94c', '#f2994a', '#eb5757', '#bb87fc', '#95a2b3'] as const

export function ProjectSheet({ project, onClose }: { project?: ProjectDto; onClose: () => void }) {
  const save = useCommand('projects.save')
  const toast = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [color, setColor] = useState<string>(project?.color ?? PROJECT_COLORS[0])
  const [key, setKey] = useState(project?.key ?? '')
  const [keyTouched, setKeyTouched] = useState(!!project)
  // Latin initials of the name make the default key; Persian names fall back to TASK-style letters.
  const suggested = (
    name
      .match(/[A-Za-z0-9]/g)
      ?.join('')
      .slice(0, 3) || 'PRJ'
  ).toUpperCase()
  const effectiveKey = keyTouched ? key : suggested
  const submit = () =>
    save.mutate(
      { id: project?.id, key: effectiveKey, name, description, color },
      {
        onSuccess: (id) => {
          onClose()
          if (!project) navigate({ to: '/projects/$projectId', params: { projectId: String(id) } })
        },
        onError: toast.error
      }
    )
  return (
    <Sheet
      title={project ? 'ویرایش پروژه' : 'پروژه جدید'}
      description={project ? undefined : 'تسک‌ها در پروژه‌ها دسته‌بندی می‌شوند: کار، خانه، یادگیری…'}
      isOpen
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" onPress={submit} isPending={save.isPending} isDisabled={!name.trim() || effectiveKey.length < 2}>
            {project ? 'ذخیره' : 'ساخت پروژه'}
          </Button>
          <Button onPress={onClose}>انصراف</Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) submit()
        }}
      >
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <TextField label="نام پروژه" value={name} onChange={setName} autoFocus isRequired />
          <TextField
            label="کلید"
            dir="ltr"
            value={effectiveKey}
            description="مثل KAR در KAR-12"
            onChange={(v) => {
              setKeyTouched(true)
              setKey(
                v
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 5)
              )
            }}
          />
        </div>
        <TextField label="توضیحات" value={description} onChange={setDescription} multiline />
        <fieldset>
          <legend className="ui-label mb-1.5 text-sm font-medium text-ink-2">رنگ</legend>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`رنگ ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white outline-none ring-offset-2 ring-offset-surface transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : undefined }}
              >
                {color === c && <Check size={15} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
