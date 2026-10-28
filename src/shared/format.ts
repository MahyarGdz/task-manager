// Money, digits, Persian text and Jalali dates. Pure: used by main, renderer and tests.
import { CalendarDate, GregorianCalendar, PersianCalendar, parseDate, toCalendar } from '@internationalized/date'

const persian = new PersianCalendar()
const gregorian = new GregorianCalendar()

export type Currency = 'IRR' | 'IRT'
export const currencyLabel = (c: Currency) => (c === 'IRT' ? 'تومان' : 'ریال')

/** Money is always an integer count of the company's currency unit. */
export const isMoney = (n: number) => Number.isSafeInteger(n) && n >= 0

const faNum = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 })
export const fmt = (n: number) => faNum.format(n)

export const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))

/** Parses "۱۲٬۵۰۰" / "12,500" / "12500" to 12500. Null when not a safe non-negative integer. */
export function parseAmount(s: string): number | null {
  const t = toLatinDigits(s).replace(/[,،٬\s]/g, '')
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

/** amount * bp / 10000, rounded half-up, without float or overflow error. */
export const applyBp = (amount: number, bp: number) => Number((BigInt(amount) * BigInt(bp) + 5000n) / 10000n)

/** total * part / whole, rounded half-up. Used to prorate discount/tax on partial returns. */
export const prorate = (total: number, part: number, whole: number) =>
  whole === 0 ? 0 : Number((BigInt(total) * BigInt(part) * 2n + BigInt(whole)) / (2n * BigInt(whole)))

/** Search key: Arabic ي/ك → Persian ی/ک, no diacritics/ZWNJ, Latin digits, lower case. */
export const searchKey = (s: string) =>
  toLatinDigits(s)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ً-ٰٟ‌‏‎]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD (Gregorian, as stored). */
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function toJalali(iso: string): string {
  const d = toCalendar(parseDate(iso.slice(0, 10)), persian)
  return `${d.year}/${pad(d.month)}/${pad(d.day)}`
}

/** "۱۴۰۵/۸/۲" → "2026-10-24"; null if not a valid Jalali date. */
export function parseJalali(s: string): string | null {
  const m = toLatinDigits(s)
    .trim()
    .match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (!m) return null
  const [jy, jm, jd] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new CalendarDate(persian, jy, jm, jd) // constrains out-of-range parts, so compare back
  if (d.year !== jy || d.month !== jm || d.day !== jd) return null
  return toCalendar(d, gregorian).toString()
}

/** Jalali year start/end for a Gregorian date: the default fiscal year. */
export function jalaliYearRange(iso: string): { title: string; startDate: string; endDate: string } {
  const y = toCalendar(parseDate(iso), persian).year
  const start = new CalendarDate(persian, y, 1, 1)
  const end = start.add({ years: 1 }).subtract({ days: 1 })
  return {
    title: `سال مالی ${faDigits(String(y))}`,
    startDate: toCalendar(start, gregorian).toString(),
    endDate: toCalendar(end, gregorian).toString()
  }
}

export const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] ?? d)
export const jalaliFa = (iso: string | null | undefined) => (iso ? faDigits(toJalali(iso)) : '')
const persianFullDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})
export function persianDateLabel(iso: string): string {
  const parts = new Map(persianFullDate.formatToParts(new Date(`${iso}T12:00:00Z`)).map(({ type, value }) => [type, value]))
  return `${parts.get('weekday')}، ${parts.get('day')} ${parts.get('month')} ${parts.get('year')}`
}
/** Display timestamps in the device's local time, with an explicit date-then-time order. */
export function dateTimeFa(ts: string | null | undefined): string {
  if (!ts) return ''
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(ts))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('year')}/${part('month')}/${part('day')} · ${part('hour')}:${part('minute')}`
}
