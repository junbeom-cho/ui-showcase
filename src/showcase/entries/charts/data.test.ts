import {
  arcPath,
  dayLabel,
  heatLevel,
  heatmapDays,
  HEATMAP_WEEKS,
  KPIS,
  kpiChange,
  kpiMet,
  kpiProgress,
  niceTicks,
  percentChange,
  STOCKS,
  trendTo,
} from './data'

it('niceTicks: starts at 0 and steps by 1, 2 or 5 × 10ⁿ just past the maximum', () => {
  expect(niceTicks(1610)).toEqual([0, 500, 1000, 1500, 2000])
  expect(niceTicks(860)).toEqual([0, 200, 400, 600, 800, 1000])
  expect(niceTicks(1750)).toEqual([0, 500, 1000, 1500, 2000])
  expect(niceTicks(3.4)).toEqual([0, 1, 2, 3, 4])
  expect(niceTicks(0)).toEqual([0, 1])
})

it('arcPath: draws a ring slice clockwise from twelve o’clock', () => {
  expect(arcPath(50, 50, 30, 40, 0, Math.PI / 2)).toBe('M50 10 A40 40 0 0 1 90 50 L80 50 A30 30 0 0 0 50 20 Z')
  // more than half a turn takes the long way round
  expect(arcPath(50, 50, 30, 40, 0, Math.PI * 1.5)).toContain('A40 40 0 1 1')
})

it('trendTo: ends exactly at the given value', () => {
  const values = trendTo(7, 3.4, 12, 0.12, 0.1)
  expect(values).toHaveLength(12)
  expect(values[11]).toBe(3.4)
  expect(trendTo(7, 3.4, 12, 0.12, 0.1)).toEqual(values)
})

it('stocks: 30 prices each, moving the way their change says', () => {
  for (const s of STOCKS) expect(s.prices).toHaveLength(30)
  const change = (name: string) => {
    const p = STOCKS.find((s) => s.name === name)!.prices
    return percentChange(p[28], p[29])
  }
  expect(change('한빛전자')).toBeCloseTo(2.3, 0)
  expect(change('솔길식품')).toBeCloseTo(-3.2, 0)
})

it('KPI: rates change in %p, and "lower is better" counts a fall as good', () => {
  const [sales, signups, conversion, response] = KPIS.month
  expect(kpiChange(sales)).toEqual({ text: '▲ 12.4%', good: true })
  expect(kpiChange(conversion)).toEqual({ text: '▼ 0.3%p', good: false })
  expect(kpiChange(response)).toEqual({ text: '▼ 21.7%', good: true })
  expect(kpiProgress(sales)).toBe(96)
  expect(kpiProgress(signups)).toBe(100)
  expect([sales, signups, conversion, response].map(kpiMet)).toEqual([false, true, false, true])
})

it('heatmap: 18 full weeks, Monday to Sunday, ending on 8 November 2026', () => {
  const days = heatmapDays()
  expect(days).toHaveLength(HEATMAP_WEEKS * 7)
  expect(dayLabel(days[0].time)).toBe('2026년 7월 6일 (월)')
  expect(dayLabel(days[days.length - 1].time)).toBe('2026년 11월 8일 (일)')
  for (const d of days) expect((new Date(d.time).getUTCDay() + 6) % 7).toBe(d.weekday)
  expect(new Set(days.map((d) => heatLevel(d.count))).size).toBe(5)
})

it('heatLevel: five steps', () => {
  expect([0, 1, 2, 3, 5, 6, 8, 9, 14].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
})
