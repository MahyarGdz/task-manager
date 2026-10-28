import { DayPicker, faIR, getDateLib } from '@daypicker/persian'
import type { DayPickerProps } from '@daypicker/react'
import { useState } from 'react'
import { persianDateLabel } from '../../../shared/format'
import { Button } from './button'
import { isoToLocalDate, localDateToIso } from './calendar-date'
import '@daypicker/react/style.css'
import './persian-calendar.css'

const weekdays = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
const dayLabel = (date: Date) => persianDateLabel(localDateToIso(date) ?? '')

/** One localized calendar surface for date fields and reporting ranges. */
export function PersianCalendar({ todayIso, ...props }: DayPickerProps & { todayIso: string }) {
  const todayDate = isoToLocalDate(todayIso) ?? new Date()
  const [month, setMonth] = useState(props.defaultMonth ?? todayDate)
  const dateLib = getDateLib()
  const currentYear = dateLib.getYear(todayDate)
  const selectedYear = dateLib.getYear(props.month ?? month)
  return (
    <div className="persian-calendar-shell" data-testid="persian-calendar">
      <DayPicker
        {...props}
        className="persian-calendar"
        locale={faIR}
        dir="rtl"
        numerals="arabext"
        weekStartsOn={6}
        today={todayDate}
        month={props.month ?? month}
        onMonthChange={(nextMonth) => {
          setMonth(nextMonth)
          props.onMonthChange?.(nextMonth)
        }}
        startMonth={dateLib.newDate(Math.min(currentYear - 100, selectedYear), 0, 1)}
        endMonth={dateLib.newDate(Math.max(currentYear + 100, selectedYear), 11, 1)}
        captionLayout="dropdown"
        navLayout="around"
        showOutsideDays
        fixedWeeks
        modifiers={{ friday: (date) => date.getDay() === 5 }}
        modifiersClassNames={{ friday: 'persian-calendar-friday' }}
        formatters={{ formatWeekdayName: (date) => weekdays[date.getDay()] ?? '' }}
        labels={{
          labelDayButton: (date, modifiers) =>
            `${dayLabel(date)}${modifiers.today ? '، امروز' : ''}${modifiers.selected ? '، انتخاب شده' : ''}`,
          labelGridcell: (date) => dayLabel(date)
        }}
      />
      <div className="persian-calendar-footer">
        <span>تقویم هجری شمسی</span>
        <Button
          size="xs"
          variant="soft"
          onPress={() => {
            setMonth(todayDate)
            props.onMonthChange?.(todayDate)
          }}
          aria-label="امروز"
        >
          برو به امروز
        </Button>
      </div>
    </div>
  )
}
