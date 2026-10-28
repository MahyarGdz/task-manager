import { useSyncExternalStore } from 'react'
import { rpc } from './rpc'

/**
 * Per-machine UI preferences (theme, sidebar). Browser storage is fine here: losing them only
 * resets the look. Business settings live in the database.
 */
type Prefs = {
  theme: 'system' | 'light' | 'dark'
  sidebar: 'full' | 'rail'
  view: 'board' | 'list'
  groupBy: 'status' | 'priority' | 'none'
  projectsOpen: boolean
}
const KEY = 'pishro.prefs'
const DEFAULTS: Prefs = { theme: 'system', sidebar: 'full', view: 'list', groupBy: 'status', projectsOpen: true }

function read(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

let current = read()
const listeners = new Set<() => void>()

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  current = { ...current, [key]: value }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // storage unavailable: keep the in-memory value
  }
  if (key === 'theme') applyTheme()
  for (const l of listeners) l()
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current
  )
}

/** CSS follows `data-theme`; main follows too so the native title-bar controls and dialogs match. */
export function applyTheme() {
  const { theme } = current
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  rpc('ui.setTheme', { theme }).catch(() => undefined)
}
