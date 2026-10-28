import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cx } from './cx'
import { ChevronLeft } from './icons'

const WIDTH = { narrow: 'max-w-3xl', default: 'max-w-[1440px]', full: 'max-w-none' } as const

/**
 * A screen inside the main panel: a sticky header bar (breadcrumb, title, actions, optional tabs)
 * and a scrolling body. `flush` drops body padding for full-bleed tables and editors.
 */
export function Page({
  title,
  subtitle,
  parent,
  actions,
  tabs,
  toolbar,
  children,
  width = 'default',
  flush = false
}: {
  title: ReactNode
  subtitle?: ReactNode
  /** Breadcrumb back to the list this page belongs to. */
  parent?: { to: string; label: string }
  actions?: ReactNode
  tabs?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  width?: keyof typeof WIDTH
  flush?: boolean
}) {
  return (
    <div className="ui-page flex min-h-full min-w-0 flex-col bg-canvas">
      <header className="ui-page-header no-print sticky top-0 z-20 border-b border-border bg-surface">
        <div className={cx('mx-auto flex min-h-24 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6', WIDTH[width])}>
          <div className="min-w-0">
            {parent && (
              <div className="mb-1.5 flex items-center gap-1.5">
                <Link
                  to={parent.to}
                  className="rounded-sm text-xs text-ink-2 outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {parent.label}
                </Link>
                <ChevronLeft size={13} className="shrink-0 text-ink-3" aria-hidden="true" />
              </div>
            )}
            <h1 className="font-sans text-[22px] font-bold leading-9">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm leading-6 text-ink-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {tabs && <div className={cx('mx-auto px-4 sm:px-6', WIDTH[width])}>{tabs}</div>}
      </header>
      {toolbar && (
        <div className="ui-page-toolbar no-print border-b border-border bg-surface">
          <div className={cx('mx-auto flex flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6', WIDTH[width])}>{toolbar}</div>
        </div>
      )}
      <div className={cx('ui-page-body mx-auto w-full min-w-0 flex-1', WIDTH[width], !flush && 'px-4 pb-8 pt-6 sm:px-6')}>{children}</div>
    </div>
  )
}

/** Pushes following toolbar items to the end side. */
export const Spacer = () => <div className="flex-1" />

/** A titled block of a page. Cards are for content that stands on its own; most content needs only this. */
export function Section({
  title,
  description,
  actions,
  children,
  className
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('mb-8 last:mb-0', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h2 className="font-sans text-lg font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Card({
  children,
  className,
  title,
  actions,
  padded = true
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  actions?: ReactNode
  padded?: boolean
}) {
  return (
    <section className={cx('ui-card min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-card', className)}>
      {(title || actions) && (
        <div className="ui-card-header flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-3">
          {title && <h2 className="font-sans text-base font-bold">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx(padded && 'p-5')}>{children}</div>
    </section>
  )
}

/** Key figures in one band, separated by hairlines rather than boxed one by one. */
export function SummaryStrip({
  items,
  className
}: {
  items: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'negative' | 'caution' | 'positive' }[]
  className?: string
}) {
  return (
    <dl className={cx('summary-strip', className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-5 py-5">
          <dt className="text-xs text-ink-2">{item.label}</dt>
          <dd
            className={cx(
              'mt-2 overflow-x-auto whitespace-nowrap font-display text-2xl font-bold leading-9',
              item.tone === 'negative' && 'text-negative',
              item.tone === 'caution' && 'text-caution',
              item.tone === 'positive' && 'text-positive'
            )}
          >
            {item.value}
          </dd>
          {item.hint && <dd className="mt-1 text-xs leading-5 text-ink-3">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}

/** Label/value pairs, two columns: for detail views and drawers. */
export function Facts({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cx('grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2.5 text-sm', className)}>
      {items.map((i) => (
        <div key={i.label} className="contents">
          <dt className="text-ink-2">{i.label}</dt>
          <dd className="min-w-0">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Settings layout: a heading and a bordered list of rows, each a label/description with its control. */
export function SettingsGroup({
  title,
  description,
  children,
  footer
}: {
  title?: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="mb-8 last:mb-0">
      {title && <h2 className="font-sans text-base font-bold">{title}</h2>}
      {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      <div
        className={cx('divide-y divide-divider overflow-hidden rounded-xl border border-border bg-surface shadow-card', title && 'mt-3')}
      >
        {children}
      </div>
      {footer && <div className="mt-3 flex justify-end gap-2">{footer}</div>}
    </section>
  )
}

export function SettingsRow({
  label,
  description,
  children,
  stacked = false
}: {
  label: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Put the control under the label (wide inputs). */
  stacked?: boolean
}) {
  return (
    <div className={cx('px-5 py-5', stacked ? 'space-y-3' : 'flex flex-wrap items-center justify-between gap-x-8 gap-y-3')}>
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-5 text-ink-2">{description}</div>}
      </div>
      {children && <div className={cx(!stacked && 'shrink-0')}>{children}</div>}
    </div>
  )
}

const BADGE = {
  neutral: 'bg-subtle text-ink-2 ring-border',
  brand: 'bg-brand-soft text-brand ring-transparent',
  positive: 'bg-positive-soft text-positive ring-transparent',
  caution: 'bg-caution-soft text-caution ring-transparent',
  negative: 'bg-negative-soft text-negative ring-transparent'
} as const
export type Tone = keyof typeof BADGE

export function Badge({ tone = 'neutral', children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium ring-1 ring-inset',
        BADGE[tone]
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Stat({ label, children, tone }: { label: string; children: ReactNode; tone?: 'negative' | 'caution' | 'positive' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd
        className={cx(
          'font-display text-lg font-bold',
          tone === 'negative' && 'text-negative',
          tone === 'caution' && 'text-caution',
          tone === 'positive' && 'text-positive'
        )}
      >
        {children}
      </dd>
    </div>
  )
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cx(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-subtle px-1 font-sans text-2xs text-ink-3',
        className
      )}
    >
      {children}
    </kbd>
  )
}
