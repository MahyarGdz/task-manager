import { join } from 'node:path'
import { app, type BrowserWindow, dialog, ipcMain } from 'electron'
import { createApplication } from './composition-root'
import { Dispatcher, RPC_CHANNEL } from './ipc/dispatcher'
import { FileLogger } from './logger'
import { createMainWindow, isTrustedSender } from './window'

let window: BrowserWindow | null = null

// TASKS_DATA_DIR isolates test and demo runs from the real data (and from their instance lock).
if (process.env.TASKS_DATA_DIR) app.setPath('userData', process.env.TASKS_DATA_DIR)

async function main(): Promise<void> {
  if (!app.requestSingleInstanceLock()) return app.quit()
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore()
    window?.focus()
  })
  await app.whenReady()
  if (!app.isPackaged && app.dock) app.dock.setIcon(join(app.getAppPath(), 'build/icon.png'))

  const data = app.getPath('userData')
  const log = new FileLogger(join(data, 'logs'))
  let application: Awaited<ReturnType<typeof createApplication>>
  try {
    application = await createApplication(join(data, 'tasks.db'))
  } catch (error) {
    const id = log.error('startup failed', error)
    dialog.showErrorBox('تسک‌ها', `باز کردن پایگاه داده ممکن نشد. شناسه خطا: ${id}\n${error instanceof Error ? error.message : ''}`)
    return app.quit()
  }

  const dispatcher = new Dispatcher({ app: application, log, isTrustedSender })
  ipcMain.handle(RPC_CHANNEL, (event, method, input) => dispatcher.handle(event, method, input))
  window = createMainWindow()
  log.info('started', { version: app.getVersion(), data })

  // macOS keeps the app alive without windows; the dock icon reopens it.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('activate', () => {
    if (!window || window.isDestroyed()) window = createMainWindow()
  })
  app.on('before-quit', () => void application.close())
}

void main()
