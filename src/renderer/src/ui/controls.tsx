import { type ReactNode, useState } from 'react'
import {
  Switch as AriaSwitch,
  TextField as AriaTextField,
  FieldError,
  Input,
  Label,
  Radio,
  RadioGroup,
  SearchField,
  Text
} from 'react-aria-components'
import { IconButton } from './button'
import { cx } from './cx'
import { fieldBox, labelCls } from './fields'
import { Eye, EyeOff, type Icon, Search, X } from './icons'

/** On/off setting that applies immediately (no save button needed). */
export function Switch({
  isSelected,
  onChange,
  children,
  isDisabled,
  'aria-label': ariaLabel
}: {
  isSelected: boolean
  onChange: (v: boolean) => void
  children?: ReactNode
  isDisabled?: boolean
  'aria-label'?: string
}) {
  return (
    <AriaSwitch
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      aria-label={ariaLabel}
      className="group flex min-h-8 cursor-default items-center gap-3 text-sm outline-none data-[disabled]:opacity-50"
    >
      <span className="ui-switch-track flex h-6 w-11 shrink-0 items-center rounded-full bg-selected p-0.5 transition-colors group-data-[selected]:bg-brand group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-brand group-data-[focus-visible]:ring-offset-2">
        <span className="h-5 w-5 rounded-full bg-white shadow-card transition-transform group-data-[selected]:-translate-x-5 group-data-[selected]:bg-on-brand" />
      </span>
      {children}
    </AriaSwitch>
  )
}

/** One-of-a-few choice where each option needs a sentence of explanation. */
export function RadioCards<K extends string>({
  label,
  value,
  onChange,
  options,
  columns = 2,
  hideLabel = false
}: {
  label: string
  value: K
  onChange: (v: K) => void
  options: readonly { id: K; title: string; description?: ReactNode; icon?: Icon }[]
  columns?: 1 | 2 | 3
  hideLabel?: boolean
}) {
  return (
    <RadioGroup value={value} onChange={(v) => onChange(v as K)} aria-label={hideLabel ? label : undefined} className="flex flex-col gap-2">
      {!hideLabel && <Label className={labelCls}>{label}</Label>}
      <div className={cx('grid gap-2.5', columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {options.map((o) => (
          <Radio
            key={o.id}
            value={o.id}
            className="ui-choice-card group relative flex min-w-0 cursor-default gap-3 rounded-lg border border-border bg-surface p-4 outline-none transition-[background-color,border-color,box-shadow] data-[focus-visible]:ring-2 data-[focus-visible]:ring-brand data-[focus-visible]:ring-offset-2 data-[hovered]:border-brand/50 data-[selected]:border-brand data-[selected]:bg-brand-soft/60"
          >
            {o.icon ? (
              <o.icon
                size={20}
                strokeWidth={1.75}
                className="ui-choice-icon mt-0.5 shrink-0 text-ink-3 group-data-[selected]:text-brand"
                aria-hidden="true"
              />
            ) : (
              <span className="ui-radio mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-surface group-data-[selected]:border-[6px] group-data-[selected]:border-brand" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{o.title}</span>
              {o.description && <span className="mt-1 block text-xs leading-5 text-ink-2">{o.description}</span>}
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

/** Rough strength: length dominates; variety of character classes adds a step. 0–4. */
export function passwordScore(pw: string): number {
  if (!pw) return 0
  const classes = [/[a-z]/, /[A-Z]/, /\d|[۰-۹]/, /[^a-zA-Z\d۰-۹]/].filter((r) => r.test(pw)).length
  let score = pw.length >= 8 ? 1 : 0
  if (pw.length >= 10) score++
  if (pw.length >= 14) score++
  if (classes >= 3) score++
  return Math.min(4, score)
}
const STRENGTH = ['خیلی کوتاه', 'ضعیف', 'متوسط', 'خوب', 'قوی'] as const

export function PasswordField({
  label,
  value,
  onChange,
  showStrength = false,
  description,
  autoFocus,
  error,
  autoComplete = 'new-password'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  showStrength?: boolean
  description?: string
  autoFocus?: boolean
  error?: string | null
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const score = passwordScore(value)
  return (
    <AriaTextField
      value={value}
      onChange={onChange}
      type={visible ? 'text' : 'password'}
      autoFocus={autoFocus}
      isInvalid={!!error}
      autoComplete={autoComplete}
      className="ui-field flex flex-col gap-1.5"
    >
      <Label className={labelCls}>{label}</Label>
      <div className="relative">
        <Input dir="ltr" className={cx(fieldBox, 'h-10 pe-11 ps-3')} />
        <IconButton
          onPress={() => setVisible((v) => !v)}
          label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}
          size="sm"
          excludeFromTabOrder
          className="ui-field-action absolute start-1 top-1"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </IconButton>
      </div>
      {showStrength && (
        <div className="mt-1 flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cx(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= score ? (score <= 1 ? 'bg-negative' : score === 2 ? 'bg-caution' : 'bg-positive') : 'bg-selected'
                )}
              />
            ))}
          </div>
          <span className="w-16 text-end text-xs text-ink-3">{value ? STRENGTH[score] : ''}</span>
        </div>
      )}
      {error ? (
        <FieldError className="text-xs text-negative">{error}</FieldError>
      ) : (
        description && (
          <Text slot="description" className="text-xs leading-5 text-ink-3">
            {description}
          </Text>
        )
      )}
    </AriaTextField>
  )
}

/** Compact filter search for toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'جستجو',
  label = 'جستجو',
  className,
  autoFocus
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <SearchField
      aria-label={label}
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
      className={cx('group relative w-64', className)}
    >
      <Search size={17} className="pointer-events-none absolute start-3 top-[11px] text-ink-3" aria-hidden="true" />
      <Input placeholder={placeholder} className={cx(fieldBox, 'h-10 pe-10 ps-9 [&::-webkit-search-cancel-button]:hidden')} />
      <IconButton label="پاک کردن جستجو" size="sm" className="ui-field-action absolute end-1 top-1 group-data-[empty]:hidden">
        <X size={14} />
      </IconButton>
    </SearchField>
  )
}
