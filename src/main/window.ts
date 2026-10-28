import { join } from 'node:path'
import { app, BrowserWindow, type IpcMainInvokeEvent, nativeTheme, shell } from 'electron'

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL
/** Height of the app's own title bar; native window controls are drawn inside it. */
export const TITLE_BAR_HEIGHT = 52

const CHROME = {
  light: { background: '#f4f4f7', symbols: '#5d6069' },
  dark: { background: '#0c0d0e', symbols: '#a8abb4' }
} as const

export const chromeColors = () => (nativeTheme.shouldUseDarkColors ? CHROME.dark : CHROME.light)

/** The renderer gets no Node, no remote content and a single typed bridge (see preload). */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'پیشرو',
    icon: app.isPackaged ? join(process.resourcesPath, 'icon.png') : join(app.getAppPath(), 'build/icon.png'),
    // macOS: the sidebar shows the desktop through native vibrancy; the workspace paints itself opaque.
    backgroundColor: process.platform === 'darwin' ? '#00000000' : chromeColors().background,
    autoHideMenuBar: true,
    // Frameless look with the platform's own controls: an overlay on Windows/Linux, inset traffic lights on macOS.
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 18, y: 18 }, vibrancy: 'sidebar' as const, visualEffectState: 'followWindow' as const }
      : { titleBarOverlay: { color: chromeColors().background, symbolColor: chromeColors().symbols, height: TITLE_BAR_HEIGHT } }),
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
      devTools: !!DEV_SERVER_URL
    }
  })
  window.once('ready-to-show', () => window.show())
  nativeTheme.on('updated', () => syncChrome(window))
  lockNavigation(window)
  if (DEV_SERVER_URL) void window.loadURL(DEV_SERVER_URL)
  else void window.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  return window
}

/** Keeps the native controls and window background in step with light/dark. */
export function syncChrome(window: BrowserWindow): void {
  const { background, symbols } = chromeColors()
  if (process.platform !== 'darwin') window.setBackgroundColor(background)
  if (process.platform !== 'darwin') window.setTitleBarOverlay({ color: background, symbolColor: symbols, height: TITLE_BAR_HEIGHT })
}

function lockNavigation(window: BrowserWindow): void {
  const contents = window.webContents
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) event.preventDefault()
  })
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
}

function isAppUrl(url: string): boolean {
  return DEV_SERVER_URL ? url.startsWith(DEV_SERVER_URL) : url.startsWith('file://')
}

/** IPC is answered only for our own top-level page. */
export function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame
  return !!frame && frame.parent === null && isAppUrl(frame.url)
}
