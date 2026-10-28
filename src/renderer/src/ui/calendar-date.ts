import { CalendarDate, type DateValue, GregorianCalendar, parseDate, toCalendar } from '@internationalized/date'

const gregorian = new GregorianCalendar()

export function calendarDateToIso(date: DateValue): string {
  return toCalendar(date, gregorian).toString()
}

/** Calendar days are local dates, not UTC instants. Noon also avoids midnight DST transitions. */
export function isoToLocalDate(iso: string): Date | undefined {
  try {
    const date = parseDate(iso)
    const local = new Date(0)
    local.setFullYear(date.year, date.month - 1, date.day)
    local.setHours(12, 0, 0, 0)
    return local
  } catch {
    return undefined
  }
}

export function localDateToIso(date: Date | undefined): string | undefined {
  if (!date || !Number.isFinite(date.getTime())) return undefined
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()).toString()
}
