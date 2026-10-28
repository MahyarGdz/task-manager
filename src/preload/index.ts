import { contextBridge, ipcRenderer } from 'electron'

// Mirrors RPC_CHANNEL in main. The renderer receives exactly one capability: call a contract method.
const RPC_CHANNEL = 'tasks:rpc'

contextBridge.exposeInMainWorld('bridge', {
  call: (method: string, input: unknown) => ipcRenderer.invoke(RPC_CHANNEL, method, input),
  /** Where the native window controls sit, so the title bar can leave room for them. */
  platform: process.platform
})
