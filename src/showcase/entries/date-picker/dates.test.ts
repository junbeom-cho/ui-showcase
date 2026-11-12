import {
  describeRecurrence,
  formatLong,
  formatRange,
  formatShort,
  formatSlot,
  maskDateInput,
  nextOccurrences,
  nextRange,
  nights,
  parseDateInput,
  quickRange,
  slotTaken,
  TIME_SLOTS,
  type Recurrence,
} from './dates'

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day)
const today = d(2026, 11, 12) // Thursday

describe('formatting', () => {
  it('writes dates the Korean way', () => {
    expect(formatLong(today)).toBe('2026년 11월 12일 목요일')
    expect(formatShort(today)).toBe('11월 12일 (목)')
  })

  it('writes a range with its length, or asks for the missing end', () => {
    expect(formatRange({ from: d(2026, 11, 6), to: today })).toBe('11월 6일 (금) – 11월 12일 (목) · 7일')
    expect(formatRange({ from: today, to: today })).toBe('11월 12일 (목) · 1일')
    expect(formatRange({ from: today })).toBe('11월 12일 (목) – 끝 날짜를 고르세요')
    expect(formatRange(undefined)).toBe('시작 날짜를 고르세요')
  })

  it('counts nights between check-in and check-out', () => {
    expect(nights(d(2026, 11, 20), d(2026, 11, 23))).toBe(3)
    expect(nights(d(2026, 12, 31), d(2027, 1, 1))).toBe(1)
  })
})

describe('picking a range by clicks', () => {
  it('starts, ends, and starts again', () => {
    const started = nextRange(undefined, d(2026, 11, 20))
    expect(started).toEqual({ from: d(2026, 11, 20), to: undefined })
    const done = nextRange(started, d(2026, 11, 24))
    expect(done).toEqual({ from: d(2026, 11, 20), to: d(2026, 11, 24) })
    expect(nextRange(done, d(2026, 11, 2))).toEqual({ from: d(2026, 11, 2), to: undefined })
  })

  it('restarts from an earlier day and allows a one-day range', () => {
    const started = { from: d(2026, 11, 20), to: undefined }
    expect(nextRange(started, d(2026, 11, 18))).toEqual({ from: d(2026, 11, 18), to: undefined })
    expect(nextRange(started, d(2026, 11, 20))).toEqual({ from: d(2026, 11, 20), to: d(2026, 11, 20) })
  })
})

describe('quick ranges', () => {
  it.each([
    ['today', d(2026, 11, 12), d(2026, 11, 12)],
    ['yesterday', d(2026, 11, 11), d(2026, 11, 11)],
    ['last7', d(2026, 11, 6), d(2026, 11, 12)],
    ['last30', d(2026, 10, 14), d(2026, 11, 12)],
    ['thisMonth', d(2026, 11, 1), d(2026, 11, 12)],
    ['lastMonth', d(2026, 10, 1), d(2026, 10, 31)],
  ] as const)('%s', (id, from, to) => {
    expect(quickRange(id, today)).toEqual({ from, to })
  })
})

describe('typed dates', () => {
  it('keeps digits and adds the dashes while typing', () => {
    expect(maskDateInput('2026')).toBe('2026')
    expect(maskDateInput('20261')).toBe('2026-1')
    expect(maskDateInput('2026111')).toBe('2026-11-1')
    expect(maskDateInput('2026.11.12 ')).toBe('2026-11-12')
    expect(maskDateInput('202611129999')).toBe('2026-11-12')
  })

  it('reads a full date and explains what is wrong otherwise', () => {
    expect(parseDateInput('')).toEqual({})
    expect(parseDateInput('2026-11-12')).toEqual({ date: today })
    expect(parseDateInput('2026-11')).toEqual({ error: '연·월·일 8자리를 모두 입력하세요' })
    expect(parseDateInput('2026-02-30')).toEqual({ error: '없는 날짜입니다' })
    expect(parseDateInput('2026-13-01')).toEqual({ error: '없는 날짜입니다' })
  })
})

describe('time slots', () => {
  it('runs from 10:00 to 17:30 every half hour, skipping lunch', () => {
    expect(TIME_SLOTS[0]).toBe('10:00')
    expect(TIME_SLOTS.at(-1)).toBe('17:30')
    expect(TIME_SLOTS).not.toContain('12:00')
    expect(TIME_SLOTS).not.toContain('12:30')
    expect(TIME_SLOTS).toHaveLength(14)
  })

  it('reads a slot as morning or afternoon', () => {
    expect(formatSlot('10:30')).toBe('오전 10:30')
    expect(formatSlot('13:00')).toBe('오후 1:00')
  })

  it('books the same slots for the same day every time, but not all of them', () => {
    const taken = TIME_SLOTS.filter((s) => slotTaken(today, s))
    expect(TIME_SLOTS.filter((s) => slotTaken(today, s))).toEqual(taken)
    expect(taken.length).toBeGreaterThan(0)
    expect(taken.length).toBeLessThan(TIME_SLOTS.length)
  })
})

describe('recurrence', () => {
  const rule = (r: Partial<Recurrence>): Recurrence => ({
    frequency: 'weekly',
    interval: 1,
    weekdays: [],
    end: { type: 'never' },
    ...r,
  })

  it.each([
    [rule({ frequency: 'daily' }), '매일'],
    [rule({ frequency: 'daily', interval: 3 }), '3일마다'],
    [rule({ weekdays: [5, 1, 3] }), '매주 월·수·금요일'],
    [rule({ interval: 2 }), '2주마다 목요일'],
    [rule({ frequency: 'monthly' }), '매월 12일'],
    [rule({ frequency: 'yearly', interval: 2 }), '2년마다 11월 12일'],
    [rule({ end: { type: 'until', date: d(2026, 12, 31) } }), '매주 목요일, 2026년 12월 31일까지'],
    [rule({ frequency: 'daily', end: { type: 'count', count: 10 } }), '매일, 10회'],
  ])('describes %o', (r, text) => {
    expect(describeRecurrence(r, today)).toBe(text)
  })

  it('lists the next dates of a weekly rule from the start', () => {
    expect(nextOccurrences(rule({ weekdays: [1, 3, 5] }), today, 4)).toEqual([
      d(2026, 11, 13),
      d(2026, 11, 16),
      d(2026, 11, 18),
      d(2026, 11, 20),
    ])
  })

  it('skips weeks for an every-other-week rule', () => {
    expect(nextOccurrences(rule({ interval: 2 }), today, 3)).toEqual([d(2026, 11, 12), d(2026, 11, 26), d(2026, 12, 10)])
  })

  it('skips months without the start day', () => {
    expect(nextOccurrences(rule({ frequency: 'monthly' }), d(2027, 1, 31), 3)).toEqual([
      d(2027, 1, 31),
      d(2027, 3, 31),
      d(2027, 5, 31),
    ])
  })

  it('stops at the end date or after the count', () => {
    expect(nextOccurrences(rule({ frequency: 'daily', end: { type: 'until', date: d(2026, 11, 14) } }), today, 10)).toEqual([
      d(2026, 11, 12),
      d(2026, 11, 13),
      d(2026, 11, 14),
    ])
    expect(nextOccurrences(rule({ frequency: 'yearly', end: { type: 'count', count: 2 } }), today, 10)).toEqual([
      d(2026, 11, 12),
      d(2027, 11, 12),
    ])
  })
})
