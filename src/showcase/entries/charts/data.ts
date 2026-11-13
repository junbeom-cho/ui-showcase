/*
 * Made-up numbers for the chart formats, plus the small amount of maths the
 * charts share (axis ticks, scales, arc paths). Everything is deterministic so
 * each render and each test draws the same picture.
 */

export const fmt = (n: number) => n.toLocaleString('ko-KR')

/** Seeded pseudo-random numbers in [0, 1) (mulberry32). */
export function seeded(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Round axis ticks from 0 to just past `max`, stepping by 1, 2 or 5 × 10ⁿ. */
export function niceTicks(max: number, count = 5): number[] {
  if (!(max > 0)) return [0, 1]
  const rough = max / count
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough)!
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Number((i * step).toPrecision(12)))
}

/** Signed percent change, one decimal. */
export const percentChange = (from: number, to: number) => Math.round(((to - from) / from) * 1000) / 10

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * A ring slice from angle a0 to a1 (radians, 0 = twelve o'clock, clockwise)
 * between the inner radius r0 and the outer radius r1.
 */
export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const at = (r: number, a: number) => `${round2(cx + r * Math.sin(a))} ${round2(cy - r * Math.cos(a))}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  return [
    `M${at(r1, a0)}`,
    `A${r1} ${r1} 0 ${large} 1 ${at(r1, a1)}`,
    `L${at(r0, a1)}`,
    `A${r0} ${r0} 0 ${large} 0 ${at(r0, a0)}`,
    'Z',
  ].join(' ')
}

/** Start and end angle of each part of a whole, clockwise from twelve o'clock. */
export function ringAngles(values: number[]) {
  const total = values.reduce((a, b) => a + b, 0)
  return values.reduce<{ a0: number; a1: number }[]>((acc, v) => {
    const a0 = acc.length ? acc[acc.length - 1].a1 : 0
    return [...acc, { a0, a1: a0 + (v / total) * Math.PI * 2 }]
  }, [])
}

/** "M x y L x y …" through points given as [x, y]. */
export const linePath = (points: [number, number][]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${round2(x)} ${round2(y)}`).join(' ')

/** Closed shape between a top edge and a bottom edge (both left to right). */
export const bandPath = (top: [number, number][], bottom: [number, number][]) =>
  `${linePath(top)} ${linePath([...bottom].reverse()).replace(/^M/, 'L')} Z`

/* ── Bar chart: monthly visits ─────────────────────────────────────────── */

export type MonthValue = { year: number; month: number; value: number }

export const VISITS: MonthValue[] = [
  { year: 2025, month: 12, value: 820 },
  { year: 2026, month: 1, value: 760 },
  { year: 2026, month: 2, value: 910 },
  { year: 2026, month: 3, value: 1240 },
  { year: 2026, month: 4, value: 1180 },
  { year: 2026, month: 5, value: 1350 },
  { year: 2026, month: 6, value: 1290 },
  { year: 2026, month: 7, value: 1520 },
  { year: 2026, month: 8, value: 1460 },
  { year: 2026, month: 9, value: 1380 },
  { year: 2026, month: 10, value: 1610 },
  { year: 2026, month: 11, value: 1570 },
]

/* ── Line chart: orders this year and last year ────────────────────────── */

export const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`)

export type Series = { name: string; color: string; values: number[] }

export const ORDERS: Series[] = [
  { name: '올해', color: 'var(--series-1)', values: [420, 380, 510, 560, 640, 700, 760, 720, 690, 810, 880, 940] },
  { name: '작년', color: 'var(--series-2)', values: [360, 340, 420, 470, 500, 560, 610, 590, 570, 640, 700, 780] },
]

/* ── Area chart: visits by channel ─────────────────────────────────────── */

export const CHANNELS: Series[] = [
  { name: '검색', color: 'var(--series-1)', values: [520, 540, 580, 610, 650, 690, 720, 700, 740, 780, 820, 860] },
  { name: 'SNS', color: 'var(--series-2)', values: [180, 210, 260, 320, 300, 340, 420, 460, 430, 470, 520, 560] },
  { name: '직접', color: 'var(--series-3)', values: [240, 230, 250, 260, 270, 280, 290, 300, 310, 300, 320, 330] },
]

/* ── Donut chart: spending by category ─────────────────────────────────── */

export const SPENDING = [
  { name: '식비', color: 'var(--series-1)', value: 456000 },
  { name: '주거', color: 'var(--series-2)', value: 288000 },
  { name: '교통', color: 'var(--series-3)', value: 168000 },
  { name: '쇼핑', color: 'var(--series-4)', value: 144000 },
  { name: '기타', color: 'var(--series-5)', value: 144000 },
]

/* ── Sparklines: made-up stocks over 30 trading days ───────────────────── */

/** `length` values that wander (seeded) and end exactly at `end`, rounded to `unit`. */
export function trendTo(seed: number, end: number, length: number, swing: number, unit = 1) {
  const rand = seeded(seed)
  const values = [end]
  while (values.length < length) values.push(values[values.length - 1] * (1 + (rand() - 0.5) * swing))
  return values.reverse().map((v) => Number((Math.round(v / unit) * unit).toPrecision(12)))
}

export type Stock = { name: string; prices: number[] }

function stock(name: string, seed: number, price: number, changePct: number): Stock {
  const before = trendTo(seed, price / (1 + changePct / 100), 29, 0.05, 10)
  return { name, prices: [...before, price] }
}

export const STOCKS: Stock[] = [
  stock('한빛전자', 11, 72400, 2.3),
  stock('누리바이오', 23, 18250, -1.1),
  stock('파랑에너지', 37, 41900, 0.4),
  stock('솔길식품', 41, 9870, -3.2),
  stock('다온게임즈', 53, 53100, 5.6),
]

/* ── KPI cards ─────────────────────────────────────────────────────────── */

export type Kpi = {
  label: string
  unit: string
  value: number
  previous: number
  target: number
  /** whether a rise is good news (sales) or bad news (response time) */
  goodWhen: 'up' | 'down'
  trend: number[]
}

function kpi(seed: number, k: Omit<Kpi, 'trend'>, swing: number): Kpi {
  const digits = Number.isInteger(k.value) ? 1 : 0.1
  return { ...k, trend: trendTo(seed, k.value, 12, swing, digits) }
}

export const KPIS: Record<'week' | 'month', Kpi[]> = {
  month: [
    kpi(3, { label: '매출', unit: '만 원', value: 4820, previous: 4290, target: 5000, goodWhen: 'up' }, 0.12),
    kpi(5, { label: '신규 가입', unit: '명', value: 1284, previous: 1120, target: 1200, goodWhen: 'up' }, 0.14),
    kpi(7, { label: '구매 전환율', unit: '%', value: 3.4, previous: 3.7, target: 4, goodWhen: 'up' }, 0.12),
    kpi(9, { label: '평균 응답 시간', unit: '초', value: 1.8, previous: 2.3, target: 2, goodWhen: 'down' }, 0.16),
  ],
  week: [
    kpi(13, { label: '매출', unit: '만 원', value: 1130, previous: 1210, target: 1250, goodWhen: 'up' }, 0.12),
    kpi(15, { label: '신규 가입', unit: '명', value: 302, previous: 268, target: 300, goodWhen: 'up' }, 0.14),
    kpi(17, { label: '구매 전환율', unit: '%', value: 3.1, previous: 3.3, target: 4, goodWhen: 'up' }, 0.12),
    kpi(19, { label: '평균 응답 시간', unit: '초', value: 2.4, previous: 2.1, target: 2, goodWhen: 'down' }, 0.16),
  ],
}

/** How far toward the target, 0–100. For "lower is better" the target is a ceiling. */
export const kpiProgress = (k: Kpi) =>
  Math.min(100, Math.round(((k.goodWhen === 'up' ? k.value / k.target : k.target / k.value) * 100)))

export const kpiMet = (k: Kpi) => (k.goodWhen === 'up' ? k.value >= k.target : k.value <= k.target)

/** "▲ 12.4%" for amounts, "▼ 0.3%p" for rates. */
export function kpiChange(k: Kpi) {
  const diff = k.value - k.previous
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '–'
  const size =
    k.unit === '%' ? `${Math.abs(Math.round(diff * 10) / 10)}%p` : `${Math.abs(percentChange(k.previous, k.value))}%`
  const good = diff === 0 ? null : (diff > 0) === (k.goodWhen === 'up')
  return { text: `${arrow} ${size}`, good }
}

/* ── Heatmap: one cell per day, weeks as columns ───────────────────────── */

export const HEATMAP_WEEKS = 18
/** The last day drawn: Sunday 8 November 2026 (weeks run Monday to Sunday). */
export const HEATMAP_END = Date.UTC(2026, 10, 8)
const DAY = 24 * 60 * 60 * 1000

export type HeatDay = { time: number; count: number; week: number; weekday: number }

export function heatmapDays(): HeatDay[] {
  const rand = seeded(2026)
  const start = HEATMAP_END - (HEATMAP_WEEKS * 7 - 1) * DAY
  return Array.from({ length: HEATMAP_WEEKS * 7 }, (_, i) => {
    const weekday = i % 7
    const weekend = weekday >= 5
    const r = rand()
    const quiet = r < (weekend ? 0.55 : 0.18)
    const count = quiet ? 0 : Math.round(rand() ** 1.7 * (weekend ? 7 : 14)) + 1
    return { time: start + i * DAY, count, week: Math.floor(i / 7), weekday }
  })
}

/** Five colour steps: none, 1–2, 3–5, 6–8, 9 or more. */
export const heatLevel = (count: number) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4)

export const HEAT_STEPS = ['0개', '1~2개', '3~5개', '6~8개', '9개 이상']

const WEEKDAYS = '일월화수목금토'

export function dayLabel(time: number) {
  const d = new Date(time)
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`
}

export const shortDay = (time: number) => {
  const d = new Date(time)
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
}
