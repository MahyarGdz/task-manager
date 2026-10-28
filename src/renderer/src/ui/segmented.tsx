import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'
import { fmt } from '../../../shared/format'
import { cx } from './cx'

/** A small set of mutually exclusive views (e.g. status filters), shown as one control. */
export function Segmented<K extends string>({
  label,
  value,
  onChange,
  options,
  className
}: {
  label: string
  value: K
  onChange: (value: K) => void
  options: readonly { id: K; label: string; count?: number }[]
  className?: string
}) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [first] = [...keys]
        if (first !== undefined) onChange(first as K)
      }}
      className={cx(
        'inline-flex h-9 max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-subtle p-0.5',
        className
      )}
    >
      {options.map((o) => (
        <ToggleButton
          key={o.id}
          id={o.id}
          className="flex h-full shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-ink-2 outline-none transition-colors data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-brand data-[hovered]:text-ink data-[selected]:bg-surface data-[selected]:font-semibold data-[selected]:text-brand data-[selected]:shadow-card"
        >
          {o.label}
          {o.count !== undefined && <span className="tabular-nums text-xs text-ink-3">{fmt(o.count)}</span>}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
