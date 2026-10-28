import type { ReactNode } from 'react'
import {
  Tabs as AriaTabs,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Header as SectionHeader,
  Separator,
  Tab,
  TabList
} from 'react-aria-components'
import { fmt } from '../../../shared/format'
import { IconButton } from './button'
import { cx } from './cx'
import { Check, Ellipsis, type Icon } from './icons'

export type MenuAction = {
  id: string
  label: string
  icon?: Icon
  danger?: boolean
  disabled?: boolean
  selected?: boolean
  shortcut?: string
  onAction: () => void
}

export const popoverCls =
  'ui-popover max-h-[min(32rem,calc(100dvh-2rem))] min-w-48 overflow-auto rounded-lg border border-border bg-surface p-1.5 shadow-pop outline-none'
const itemCls =
  'ui-select-option flex min-h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none data-[disabled]:opacity-40 data-[focused]:bg-hover'

/** Overflow menu for secondary actions of a row or page. Pass `trigger` for a custom button. */
export function ActionMenu({
  label,
  items,
  trigger,
  sections,
  placement = 'bottom end'
}: {
  label: string
  items?: readonly MenuAction[]
  sections?: readonly { title?: string; items: readonly MenuAction[] }[]
  trigger?: ReactNode
  placement?: 'bottom end' | 'bottom start' | 'top start' | 'top end'
}) {
  const groups = sections ?? [{ items: items ?? [] }]
  const all = groups.flatMap((g) => g.items)
  return (
    <MenuTrigger>
      {trigger ?? (
        <IconButton label={label} size="sm">
          <Ellipsis size={17} />
        </IconButton>
      )}
      <Popover placement={placement} className={popoverCls}>
        <Menu
          aria-label={label}
          className="outline-none"
          disabledKeys={all.filter((i) => i.disabled).map((i) => i.id)}
          onAction={(key) => all.find((i) => i.id === key)?.onAction()}
        >
          {groups.map((g, gi) => (
            <MenuSection
              key={g.title ?? gi}
              className="[&:not(:first-child)]:mt-1 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-divider [&:not(:first-child)]:pt-1"
            >
              {g.title && <SectionHeader className="px-2.5 pb-1 pt-1.5 text-xs text-ink-3">{g.title}</SectionHeader>}
              {g.items.map((i) => (
                <MenuItem key={i.id} id={i.id} textValue={i.label} className={cx(itemCls, i.danger && 'text-negative')}>
                  {i.icon ? <i.icon size={15} className={cx(!i.danger && 'text-ink-3')} aria-hidden="true" /> : null}
                  <span className="flex-1">{i.label}</span>
                  {i.selected && <Check size={15} className="text-brand" aria-hidden="true" />}
                  {i.shortcut && <span className="text-xs text-ink-3">{i.shortcut}</span>}
                </MenuItem>
              ))}
            </MenuSection>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}

export const MenuSeparator = () => <Separator className="my-1 h-px bg-divider" />

/** Page-level tabs drawn as an underline row in the page header. Content is rendered by the caller. */
export function Tabs<K extends string>({
  label,
  value,
  onChange,
  tabs
}: {
  label: string
  value: K
  onChange: (value: K) => void
  tabs: readonly { id: K; label: string; count?: number }[]
}) {
  return (
    <AriaTabs selectedKey={value} onSelectionChange={(k) => onChange(k as K)}>
      <TabList aria-label={label} className="-mb-px flex gap-5 overflow-x-auto">
        {tabs.map((t) => (
          <Tab
            key={t.id}
            id={t.id}
            className="relative flex h-11 shrink-0 cursor-default items-center gap-1.5 px-0.5 text-sm font-medium text-ink-2 outline-none transition-colors data-[hovered]:text-ink data-[selected]:font-semibold data-[selected]:text-brand data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[selected]:after:bg-brand"
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-subtle px-1.5 text-2xs tabular-nums text-ink-2">{fmt(t.count)}</span>
            )}
          </Tab>
        ))}
      </TabList>
    </AriaTabs>
  )
}
