import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Input, Method, Output } from '../../../shared/contract'

/** A refusal from the main process; `message` is already user-facing Persian. */
export class RpcError extends Error {}

export async function rpc<M extends Method>(method: M, input: Input<M>): Promise<Output<M>> {
  const result = await window.bridge.call(method, input)
  if (!result.ok) throw new RpcError(result.error)
  return result.data as Output<M>
}

export const rpcKey = <M extends Method>(method: M, input?: Input<M>): QueryKey => (input === undefined ? [method] : [method, input])

/** Reads are server state: cached per method+input, refetched when any command succeeds. */
export function useRpc<M extends Method>(method: M, input: Input<M>, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({ queryKey: rpcKey(method, input), queryFn: () => rpc(method, input), ...options })
}

/** Every successful command invalidates all cached reads: local IPC makes refetching cheap and staleness impossible. */
export function useCommand<M extends Method>(method: M) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Input<M>) => rpc(method, input),
    onSuccess: () => client.invalidateQueries()
  })
}

export const newRequestId = () => crypto.randomUUID()
