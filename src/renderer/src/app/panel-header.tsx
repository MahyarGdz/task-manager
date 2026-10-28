import type { ReactNode } from 'react'
import { cx } from '../ui/cx'

const platform = window.bridge.platform

/**
 * The workspace panel's top bar: draggable, and clear of the native window controls,
 * which sit on the physical left (macOS traffic lights, Windows overlay on the right).
 */
export function PanelHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cx(
        'drag flex h-12 shrink-0 items-center gap-2 border-b border-divider pe-4 ps-5 [&_a]:no-drag [&_button]:no-drag [&_input]:no-drag',
        platform === 'darwin' && 'pl-[76px]',
        platform === 'win32' && 'pr-[140px]',
        className
      )}
    >
      {children}
    </header>
  )
}
