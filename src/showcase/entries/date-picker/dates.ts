import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  getDayOfYear,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'

/** Helpers behind the date picker examples. Weeks start on Sunday, as Korean calendars do. */

export const formatLong = (date: Date) => format(date, 'yyyy년 M월 d일 EEEE', { locale: ko })
export const formatShort = (date: Date) => format(date, 'M월 d일 (EEE)', { locale: ko })

/** Same shape as react-day-picker's DateRange. */
export type PartialRange = { from: Date | undefined; to?: Date | undefined } | undefined

/** The first click starts a range, the second ends it; a click before the start, or after a finished range, starts over. */
export function nextRange(range: PartialRange, day: Date): PartialRange {
  if (!range?.from || range.to || isBefore(day, range.from)) return { from: day, to: undefined }
  return { from: range.from, to: day }
}

export function formatRange(range: PartialRange): string {
  if (!range?.from) return '시작 날짜를 고르세요'
  if (!range.to) return `${formatShort(range.from)} – 끝 날짜를 고르세요`
  const days = differenceInCalendarDays(range.to, range.from) + 1
  if (days === 1) return `${formatShort(range.from)} · 1일`
  return `${formatShort(range.from)} – ${formatShort(range.to)} · ${days}일`
}

export const nights = (checkIn: Date, checkOut: Date) => differenceInCalendarDays(checkOut, checkIn)

export type QuickRangeId = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth'

export function quickRange(id: QuickRangeId, today: Date): { from: Date; to: Date } {
  switch (id) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: addDays(today, -1), to: addDays(today, -1) }
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'last30':
      return { from: addDays(today, -29), to: today }
    case 'thisMonth':
      return { from: startOfMonth(today), to: today }
    case 'lastMonth':
      // the day before this month starts; endOfMonth would carry 23:59:59
      return { from: startOfMonth(subMonths(today, 1)), to: addDays(startOfMonth(today), -1) }
  }
}

/** Keeps up to 8 digits and writes them as YYYY-MM-DD while the user types. */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-')
}

export function parseDateInput(text: string): { date?: Date; error?: string } {
  if (text === '') return {}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: '연·월·일 8자리를 모두 입력하세요' }
  const date = parse(text, 'yyyy-MM-dd', new Date())
  // date-fns rolls 2026-02-30 over to March; writing it back catches that
  if (!isValid(date) || format(date, 'yyyy-MM-dd') !== text) return { error: '없는 날짜입니다' }
  return { date }
}

/** Half-hour slots from 10:00 to 17:30 with a lunch break at 12:00–13:00. */
export const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

export function formatSlot(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')}`
}

/** Pretend bookings: about a third of the slots, scattered, and the same ones every time for a given day. */
export function slotTaken(day: Date, slot: string): boolean {
  const x = Math.sin(getDayOfYear(day) * 12.9898 + TIME_SLOTS.indexOf(slot) * 78.233) * 43758.5453
  return x - Math.floor(x) < 0.3
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Recurrence = {
  frequency: Frequency
  /** every N days/weeks/months/years */
  interval: number
  /** 0 = Sunday … 6 = Saturday; empty means the start date's weekday */
  weekdays: number[]
  end: { type: 'never' } | { type: 'until'; date: Date } | { type: 'count'; count: number }
}

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const weekdaysOf = (rule: Recurrence, start: Date) =>
  rule.weekdays.length > 0 ? [...rule.weekdays].sort((a, b) => a - b) : [start.getDay()]

export function describeRecurrence(rule: Recurrence, start: Date): string {
  const every = (unit: string) => (rule.interval === 1 ? `매${unit}` : `${rule.interval}${unit === '월' ? '개월' : unit}마다`)
  const what = {
    daily: () => (rule.interval === 1 ? '매일' : `${rule.interval}일마다`),
    weekly: () => `${every('주')} ${weekdaysOf(rule, start).map((w) => WEEKDAY_NAMES[w]).join('·')}요일`,
    monthly: () => `${every('월')} ${start.getDate()}일`,
    yearly: () => `${every('년')} ${format(start, 'M월 d일')}`,
  }[rule.frequency]()

  if (rule.end.type === 'until') return `${what}, ${format(rule.end.date, 'yyyy년 M월 d일')}까지`
  if (rule.end.type === 'count') return `${what}, ${rule.end.count}회`
  return what
}

/** The first `limit` dates of the rule, counting the start date when it matches. */
export function nextOccurrences(rule: Recurrence, start: Date, limit: number): Date[] {
  const max = rule.end.type === 'count' ? Math.min(limit, rule.end.count) : limit
  const until = rule.end.type === 'until' ? rule.end.date : undefined
  const out: Date[] = []
  const push = (date: Date) => {
    if (until && isAfter(date, until)) return false
    out.push(date)
    return out.length < max
  }

  // A rule that never matches would loop forever; 500 steps is far more than any example needs.
  for (let step = 0; step < 500 && out.length < max; step++) {
    if (rule.frequency === 'daily') {
      if (!push(addDays(start, step * rule.interval))) break
    } else if (rule.frequency === 'weekly') {
      const week = addWeeks(startOfWeek(start), step * rule.interval)
      const days = weekdaysOf(rule, start).map((w) => addDays(week, w)).filter((day) => !isAfter(start, day))
      if (days.some((day) => !push(day))) break
    } else {
      const add = rule.frequency === 'monthly' ? addMonths : addYears
      const date = add(start, step * rule.interval)
      // date-fns clamps Jan 31 + 1 month to Feb 28; skip such months instead
      if (date.getDate() !== start.getDate()) continue
      if (!push(date)) break
    }
    if (until && out.length > 0 && isAfter(addDays(out.at(-1)!, 1), until)) break
  }
  return out.slice(0, max)
}
