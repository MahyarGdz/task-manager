import { type CalendarDate, parseDate } from '@internationalized/date'
import { type ReactNode, useState } from 'react'
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  TextField as AriaTextField,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  TextArea
} from 'react-aria-components'
import { isoDate } from '../../../shared/format'
import { IconButton } from './button'
import { calendarDateToIso, isoToLocalDate, localDateToIso } from './calendar-date'
import { cx } from './cx'
import { CalendarDays, ChevronDown } from './icons'
import { PersianCalendar } from './persian-calendar'

export const fieldBox = 'ui-control w-full px-3 text-sm outline-none'
export const labelCls = 'ui-label text-sm font-medium text-ink-2'

type Common = {
  label: string
  description?: string
  error?: string | null
  className?: string
  isRequired?: boolean
  isDisabled?: boolean
  autoFocus?: boolean
  /** Keep the label for screen readers only (the row around it already names the field). */
  hideLabel?: boolean
}

function Help({ description, error }: { description?: string; error?: string | null }) {
  return (
    <>
      {description && !error && (
        <Text slot="description" className="text-xs leading-5 text-ink-3">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-negative">{error ?? undefined}</FieldError>
    </>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  multiline,
  dir,
  ...common
}: Common & {
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'password' | 'tel'
  multiline?: boolean
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <AriaTextField
      value={value}
      onChange={onChange}
      type={type}
      isRequired={common.isRequired}
      isDisabled={common.isDisabled}
      autoFocus={common.autoFocus}
      isInvalid={!!common.error}
      className={cx('ui-field flex flex-col gap-1.5', common.className)}
    >
      <Label className={cx(labelCls, common.hideLabel && 'sr-only')}>{label}</Label>
      {multiline ? (
        <TextArea dir={dir} className={cx(fieldBox, 'min-h-24 resize-y py-2.5')} />
      ) : (
        <Input dir={dir} className={cx(fieldBox, 'h-10')} />
      )}
      <Help description={common.description} error={common.error} />
    </AriaTextField>
  )
}

/** Jalali date picker. The value stays an ISO Gregorian date; the locale renders the Persian calendar. */
export function DateField({ label, value, onChange, ...common }: Common & { value: string; onChange: (iso: string) => void }) {
  const today = isoDate()
  const [isOpen, setIsOpen] = useState(false)
  const localDate = isoToLocalDate(value)
  const parsed: CalendarDate | null = localDate ? parseDate(value) : null
  return (
    <DatePicker
      value={parsed}
      onChange={(date) => date && onChange(calendarDateToIso(date))}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isRequired={common.isRequired}
      isDisabled={common.isDisabled}
      autoFocus={common.autoFocus}
      isInvalid={!!common.error}
      className={cx('ui-field flex flex-col gap-1.5', common.className)}
    >
      <Label className={cx(labelCls, common.hideLabel && 'sr-only')}>{label}</Label>
      <Group className={cx(fieldBox, 'flex h-10 items-center justify-between gap-2')}>
        <DateInput dir="ltr" className="ui-date-input flex gap-0.5">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums outline-none data-[focused]:bg-brand data-[focused]:text-on-brand data-[placeholder]:text-ink-3"
            />
          )}
        </DateInput>
        <IconButton size="sm" className="ui-field-action -me-1" label="باز کردن تقویم">
          <CalendarDays size={18} />
        </IconButton>
      </Group>
      <Help description={common.description} error={common.error} />
      <Popover
        placement="bottom start"
        className="ui-popover max-w-[calc(100vw-24px)] rounded-xl border border-border bg-surface p-3 shadow-pop"
      >
        <Dialog aria-label={`انتخاب تاریخ ${label}`} className="outline-none">
          <PersianCalendar
            mode="single"
            required
            todayIso={today}
            selected={localDate}
            defaultMonth={localDate}
            autoFocus
            onSelect={(date) => {
              const iso = localDateToIso(date)
              if (!iso) return
              onChange(iso)
              setIsOpen(false)
            }}
          />
        </Dialog>
      </Popover>
    </DatePicker>
  )
}

export type Option<K extends string | number> = { id: K; label: string; hint?: string }

export function SelectField<K extends string | number>({
  label,
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید',
  ...common
}: Common & { value: K | null; onChange: (v: K) => void; options: readonly Option<K>[]; placeholder?: string }) {
  return (
    <Select
      selectedKey={value}
      onSelectionChange={(key) => key !== null && onChange(key as K)}
      placeholder={placeholder}
      isRequired={common.isRequired}
      isDisabled={common.isDisabled}
      isInvalid={!!common.error}
      className={cx('ui-field flex flex-col gap-1.5', common.className)}
    >
      <Label className={cx(labelCls, common.hideLabel && 'sr-only')}>{label}</Label>
      <AriaButton className={cx(fieldBox, 'flex h-10 items-center justify-between gap-3 text-start')}>
        <SelectValue className="truncate data-[placeholder]:text-ink-3">
          {({ selectedText, isPlaceholder }) => (isPlaceholder ? placeholder : selectedText)}
        </SelectValue>
        <ChevronDown size={16} className="text-ink-3" />
      </AriaButton>
      <Help description={common.description} error={common.error} />
      <Popover className="ui-popover max-h-80 min-w-[var(--trigger-width)] overflow-auto rounded-lg border border-border bg-surface p-1.5 shadow-pop">
        <ListBox className="outline-none">
          {options.map((o) => (
            <ListBoxItem
              key={o.id}
              id={o.id}
              textValue={o.label}
              className="ui-select-option flex min-h-10 cursor-default items-center justify-between gap-4 rounded-md px-3 py-2 text-sm outline-none data-[focused]:bg-hover data-[selected]:bg-brand-soft data-[selected]:font-semibold data-[selected]:text-brand"
            >
              <span>{o.label}</span>
              {o.hint && <span className="num text-xs text-ink-3">{o.hint}</span>}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  )
}

export function Checkbox({ children, isSelected, onChange }: { children: ReactNode; isSelected: boolean; onChange: (v: boolean) => void }) {
  return (
    <AriaCheckbox
      isSelected={isSelected}
      onChange={onChange}
      className="group flex min-h-8 cursor-default items-center gap-2.5 text-sm outline-none"
    >
      <span className="ui-checkbox flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border bg-surface shadow-card transition-colors group-data-[hovered]:border-brand group-data-[selected]:border-brand group-data-[selected]:bg-brand group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-brand group-data-[focus-visible]:ring-offset-2">
        <svg
          viewBox="0 0 16 16"
          className="hidden h-3.5 w-3.5 fill-none stroke-on-brand stroke-[2.5] group-data-[selected]:block"
          aria-hidden="true"
        >
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      </span>
      {children}
    </AriaCheckbox>
  )
}
