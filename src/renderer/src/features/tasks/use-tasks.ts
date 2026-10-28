import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Input } from '../../../../shared/contract'
import type { TaskDto } from '../../../../shared/dto'
import { rpc } from '../../lib/rpc'
import { useToast } from '../../ui/feedback'

/**
 * Task edits apply to every cached task list at once (optimistic), so a drag lands instantly;
 * on failure the lists roll back and the refusal shows as a toast.
 */
export function useUpdateTask() {
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: Input<'tasks.update'>) => rpc('tasks.update', input),
    onMutate: async ({ id, ...patch }) => {
      await client.cancelQueries({ queryKey: ['tasks.list'] })
      const before = client.getQueriesData<TaskDto[]>({ queryKey: ['tasks.list'] })
      for (const [key, list] of before) {
        if (list)
          client.setQueryData<TaskDto[]>(
            key,
            list.map((t) => (t.id === id ? ({ ...t, ...patch } as TaskDto) : t))
          )
      }
      const one = ['tasks.get', { id }]
      const single = client.getQueryData<TaskDto | null>(one)
      if (single) client.setQueryData<TaskDto>(one, { ...single, ...patch } as TaskDto)
      return { before }
    },
    onError: (error, _input, ctx) => {
      for (const [key, list] of ctx?.before ?? []) client.setQueryData(key, list)
      toast.error(error)
    },
    onSettled: () => client.invalidateQueries()
  })
}
