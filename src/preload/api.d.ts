import type { RpcBridge } from '../shared/contract'

declare global {
  interface Window {
    bridge: RpcBridge
  }
}
