import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  arcPath,
  dayLabel,
  fmt,
  HEAT_STEPS,
  heatLevel,
  heatmapDays,
  HEATMAP_WEEKS,
  KPIS,
  kpiChange,
  kpiMet,
  kpiProgress,
  percentChange,
  ringAngles,
  shortDay,
  SPENDING,
  STOCKS,
  type Kpi,
} from './data'
import { ChartFrame, ChartTooltip, DataTable, deltaTone, Key, Sparkline, TooltipRow, useSafeId } from './kit'

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

/* ── Donut ─────────────────────────────────────────────────────────────── */

const RING = { size: 176, outer: 80, inner: 52, lift: 5 }

export function DonutChartFormat() {
  const [active, setActive] = useState<number | null>(null)
  const total = sum(SPENDING.map((s) => s.value))
  const angles = ringAngles(SPENDING.map((s) => s.value))
  const slices = SPENDING.map((s, i) => ({ ...s, ...angles[i], pct: Math.round((s.value / total) * 100) }))
  const c = RING.size / 2
  const shown = active === null ? null : slices[active]
  const biggest = slices.reduce((a, b) => (b.value > a.value ? b : a))

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ChartFrame
        title="이번 달 지출"
        subtitle={`분류별 비율 · 합계 ${fmt(total)}원`}
        summary={`이번 달 지출 ${fmt(total)}원을 분류별로 나눈 도넛 차트. ${slices.map((s) => `${s.name} ${s.pct}%`).join(', ')}.`}
        table={
          <DataTable
            caption="이번 달 지출"
            columns={[{ label: '분류' }, { label: '금액(원)', numeric: true }, { label: '비율', numeric: true }]}
            rows={[
              ...slices.map((s) => [s.name, fmt(s.value), `${s.pct}%`]),
              ['합계', fmt(total), '100%'],
            ]}
          />
        }
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
          <div className="relative size-44 shrink-0">
            <svg
              role="group"
              aria-label="분류별 조각"
              viewBox={`0 0 ${RING.size} ${RING.size}`}
              className="size-full overflow-visible"
            >
              {slices.map((s, i) => (
                <path
                  key={s.name}
                  data-slice={s.name}
                  d={arcPath(c, c, RING.inner, active === i ? RING.outer + RING.lift : RING.outer, s.a0, s.a1)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${s.name} ${fmt(s.value)}원, ${s.pct}%`}
                  opacity={active !== null && active !== i ? 0.35 : 1}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  className="cursor-pointer outline-none motion-safe:transition-opacity"
                  style={{ fill: s.color, stroke: 'var(--background)' }}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              ))}
            </svg>
            <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground">{shown ? shown.name : '총 지출'}</span>
              <span className="text-lg leading-tight font-semibold">{shown ? `${fmt(shown.value)}원` : `${fmt(total / 10000)}만 원`}</span>
              <span className="text-xs text-muted-foreground">{shown ? `${shown.pct}%` : `${slices.length}개 분류`}</span>
            </div>
          </div>
          <ul aria-label="범례" className="flex w-full max-w-60 flex-col gap-0.5">
            {slices.map((s, i) => (
              <li
                key={s.name}
                data-active={active === i || undefined}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm data-active:bg-muted"
              >
                <Key color={s.color} mark="rect" />
                <span className="flex-1">{s.name}</span>
                <span className="font-medium tabular-nums">{s.pct}%</span>
                <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">{fmt(s.value)}원</span>
              </li>
            ))}
          </ul>
        </div>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {shown
          ? `${shown.name}: ${fmt(shown.value)}원, 전체의 ${shown.pct}%`
          : `가장 큰 분류는 ${biggest.name}로 전체의 ${biggest.pct}%입니다. 조각이나 범례에 마우스를 올려 보세요.`}
      </p>
    </div>
  )
}

/* ── Sparklines in a table ─────────────────────────────────────────────── */

type Scheme = 'kr' | 'us'

/** Korean markets colour a rise red and a fall blue; American ones a rise green and a fall red. */
const SCHEMES: Record<Scheme, { up: string; down: string; upDot: string; downDot: string; rule: string }> = {
  kr: {
    up: 'text-[#d03b3b] dark:text-[#ef7b7b]',
    down: 'text-[#1c5cab] dark:text-[#6da7ec]',
    upDot: '#d03b3b',
    downDot: '#2a78d6',
    rule: '한국식: 오르면 빨강 ▲, 내리면 파랑 ▼',
  },
  us: {
    up: deltaTone.good,
    down: 'text-[#d03b3b] dark:text-[#ef7b7b]',
    upDot: '#0ca30c',
    downDot: '#d03b3b',
    rule: '미국식: 오르면 초록 ▲, 내리면 빨강 ▼',
  },
}

export function SparklineFormat() {
  const [scheme, setScheme] = useState<Scheme>('kr')
  const tone = SCHEMES[scheme]
  const rows = STOCKS.map((s) => {
    const last = s.prices[s.prices.length - 1]
    const change = percentChange(s.prices[s.prices.length - 2], last)
    return { ...s, last, change, low: Math.min(...s.prices), high: Math.max(...s.prices) }
  })
  const ups = rows.filter((r) => r.change > 0).length
  const days = STOCKS[0].prices.length

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="오르내림 색"
        value={scheme}
        onValueChange={(v) => v && setScheme(v as Scheme)}
      >
        <ToggleGroupItem value="kr" className="px-3">
          한국식
        </ToggleGroupItem>
        <ToggleGroupItem value="us" className="px-3">
          미국식
        </ToggleGroupItem>
      </ToggleGroup>
      <ChartFrame
        title="관심 종목"
        subtitle={`최근 ${days}거래일 · 가상의 종목`}
        summary={`가상 종목 ${rows.length}개의 최근 ${days}거래일 가격 흐름. ${rows
          .map((r) => `${r.name} ${fmt(r.last)}원 ${r.change > 0 ? '상승' : '하락'} ${Math.abs(r.change)}%`)
          .join(', ')}.`}
        table={
          <DataTable
            caption={`관심 종목 ${days}거래일 가격`}
            columns={[{ label: '거래일' }, ...rows.map((r) => ({ label: `${r.name}(원)`, numeric: true }))]}
            rows={Array.from({ length: days }, (_, i) => [
              i === days - 1 ? '오늘' : `${days - 1 - i}일 전`,
              ...rows.map((r) => fmt(r.prices[i])),
            ])}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">종목</TableHead>
              <TableHead className="text-xs">최근 {days}일</TableHead>
              <TableHead className="text-right text-xs">현재가</TableHead>
              <TableHead className="text-right text-xs">전일 대비</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <div className="w-24">
                    <Sparkline
                      values={r.prices}
                      label={`${r.name} 최근 ${days}일: 최저 ${fmt(r.low)}원, 최고 ${fmt(r.high)}원`}
                      dot={r.change > 0 ? tone.upDot : tone.downDot}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.last)}원</TableCell>
                <TableCell data-change={r.change > 0 ? 'up' : 'down'} className={cn('text-right tabular-nums', r.change > 0 ? tone.up : tone.down)}>
                  <span aria-hidden>{r.change > 0 ? '▲' : '▼'} </span>
                  <span className="sr-only">{r.change > 0 ? '상승' : '하락'} </span>
                  {Math.abs(r.change).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {ups}종목 오름 · {rows.length - ups}종목 내림 · {tone.rule}
      </p>
    </div>
  )
}

/* ── KPI cards ─────────────────────────────────────────────────────────── */

type Period = 'week' | 'month'

const PERIODS: Record<Period, { now: string; before: string; trend: string }> = {
  month: { now: '이번 달', before: '지난달', trend: '최근 12개월' },
  week: { now: '이번 주', before: '지난주', trend: '최근 12주' },
}

function goalText(k: Kpi) {
  const target = `${fmt(k.target)}${k.unit}`
  if (k.goodWhen === 'down') return `목표 ${target} 이하 · ${kpiMet(k) ? '달성' : '넘음'}`
  return kpiMet(k) ? `목표 ${target} 달성` : `목표 ${target}의 ${kpiProgress(k)}%`
}

function KpiCard({ kpi: k, period }: { kpi: Kpi; period: Period }) {
  const change = kpiChange(k)
  const names = PERIODS[period]
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{k.label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl leading-none font-semibold">
          {fmt(k.value)}
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">{k.unit}</span>
        </p>
        <Sparkline
          className="w-20 shrink-0"
          values={k.trend}
          label={`${k.label} ${names.trend} 추이`}
          line="var(--viz-axis)"
          dot="var(--series-1)"
        />
      </div>
      <p
        className={cn(
          'text-xs',
          change.good === null ? deltaTone.neutral : change.good ? deltaTone.good : deltaTone.bad,
        )}
      >
        {change.text}{' '}
        <span className="text-muted-foreground">
          {names.before}보다{change.good !== null && ` · ${change.good ? '좋아짐' : '나빠짐'}`}
        </span>
      </p>
      <Progress
        value={kpiProgress(k)}
        aria-label={`${k.label} 목표 달성률`}
        className="h-1.5 bg-(--series-1)/15 [&_[data-slot=progress-indicator]]:bg-(--series-1)"
      />
      <p className="text-xs text-muted-foreground">{goalText(k)}</p>
    </li>
  )
}

export function KpiFormat() {
  const [period, setPeriod] = useState<Period>('month')
  const kpis = KPIS[period]
  const names = PERIODS[period]
  const met = kpis.filter(kpiMet).length

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="기간"
        value={period}
        onValueChange={(v) => v && setPeriod(v as Period)}
      >
        <ToggleGroupItem value="week" className="px-3">
          이번 주
        </ToggleGroupItem>
        <ToggleGroupItem value="month" className="px-3">
          이번 달
        </ToggleGroupItem>
      </ToggleGroup>
      <ChartFrame
        title="서비스 지표"
        subtitle={`${names.now} · ${names.before}과 비교`}
        summary={`${names.now} 지표 ${kpis.length}개. ${kpis
          .map((k) => `${k.label} ${fmt(k.value)}${k.unit}, ${names.before}보다 ${kpiChange(k).text}`)
          .join('. ')}.`}
        table={
          <DataTable
            caption="서비스 지표"
            columns={[
              { label: '지표' },
              { label: names.now, numeric: true },
              { label: names.before, numeric: true },
              { label: '변화', numeric: true },
              { label: '목표', numeric: true },
              { label: '달성률', numeric: true },
            ]}
            rows={kpis.map((k) => [
              k.label,
              `${fmt(k.value)}${k.unit}`,
              `${fmt(k.previous)}${k.unit}`,
              kpiChange(k).text,
              `${fmt(k.target)}${k.unit}${k.goodWhen === 'down' ? ' 이하' : ''}`,
              `${kpiProgress(k)}%`,
            ])}
          />
        }
      >
        <ul aria-label="지표 카드" className="grid gap-3 sm:grid-cols-2">
          {kpis.map((k) => (
            <KpiCard key={k.label} kpi={k} period={period} />
          ))}
        </ul>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {names.now} 기준 · 목표 달성 {met}개 · 미달 {kpis.length - met}개
      </p>
    </div>
  )
}

/* ── Heatmap ───────────────────────────────────────────────────────────── */

/*
 * The grid of cells keeps its squares by scaling with a viewBox (about 10px
 * cells on a phone, up to 16px); its month and weekday labels sit outside it
 * in HTML, placed by percentage, so their text never shrinks.
 */
const CELL = 12
const GAP = 3
const PITCH = CELL + GAP
const GRID_W = HEATMAP_WEEKS * PITCH - GAP
const GRID_H = 7 * PITCH - GAP
const WEEKDAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
const pctX = (week: number) => ((week * PITCH) / GRID_W) * 100
const pctY = (weekday: number) => ((weekday * PITCH) / GRID_H) * 100

export function HeatmapFormat() {
  const id = useSafeId()
  const days = useMemo(() => heatmapDays(), [])
  const [active, setActive] = useState<{ index: number; focus: boolean } | null>(null)
  // Roving focus: one cell is in the tab order, the arrow keys move it.
  const [current, setCurrent] = useState(days.length - 1)
  const svgRef = useRef<SVGSVGElement>(null)
  const total = sum(days.map((d) => d.count))
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a))
  const monthOf = (time: number) => new Date(time).getUTCMonth()
  // A month label goes over the first week column whose Monday is in a new month.
  const monthStarts = days.filter((d, i) => d.weekday === 0 && (i === 0 || monthOf(d.time) !== monthOf(days[i - 7].time)))
  const shown = active ? days[active.index] : null

  const move = (event: KeyboardEvent<SVGSVGElement>) => {
    const from = (event.target as Element).getAttribute('data-index')
    if (from === null) return
    const steps: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }
    const next =
      event.key in steps ? Number(from) + steps[event.key] : event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : null
    if (next === null) return
    event.preventDefault()
    if (next < 0 || next >= days.length) return
    setCurrent(next)
    svgRef.current?.querySelector<SVGElement>(`[data-index="${next}"]`)?.focus()
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ChartFrame
        title="커밋 기록"
        subtitle={`${dayLabel(days[0].time)} ~ ${shortDay(days[days.length - 1].time)} · 하루 한 칸`}
        summary={`${HEATMAP_WEEKS}주 동안 하루를 한 칸으로 그린 격자. 열은 주, 줄은 요일이고 칸이 진할수록 그날 커밋이 많습니다. 주말은 대체로 비어 있고, 가장 많은 날은 ${dayLabel(busiest.time)} ${busiest.count}개입니다.`}
        table={
          <DataTable
            caption="주별·요일별 커밋 수"
            columns={[{ label: '주(월요일)' }, ...WEEKDAY_NAMES.map((w) => ({ label: w, numeric: true }))]}
            rows={Array.from({ length: HEATMAP_WEEKS }, (_, w) => [
              shortDay(days[w * 7].time),
              ...days.slice(w * 7, w * 7 + 7).map((d) => d.count),
            ])}
          />
        }
      >
        <div className="w-full max-w-[25rem] self-center">
          <div aria-hidden className="relative ml-6 h-5 text-[11px] text-muted-foreground">
            {monthStarts.map((d) => (
              <span key={d.time} className="absolute top-0" style={{ left: `${pctX(d.week)}%` }}>
                {monthOf(d.time) + 1}월
              </span>
            ))}
          </div>
          <div className="flex">
            <div aria-hidden className="relative w-6 shrink-0 text-[11px] text-muted-foreground">
              {[0, 2, 4].map((w) => (
                <span key={w} className="absolute left-0 leading-none" style={{ top: `${pctY(w) + (CELL / GRID_H) * 50}%`, transform: 'translateY(-50%)' }}>
                  {WEEKDAY_NAMES[w]}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <svg
                ref={svgRef}
                role="group"
                aria-label="날짜별 커밋 수 격자. 방향키로 칸을 옮깁니다"
                viewBox={`0 0 ${GRID_W} ${GRID_H}`}
                width="100%"
                className="block h-auto overflow-visible"
                onKeyDown={move}
                onPointerLeave={() => setActive((a) => (a?.focus ? a : null))}
              >
                {days.map((d, i) => (
                  <rect
                    key={d.time}
                    data-index={i}
                    data-level={heatLevel(d.count)}
                    x={d.week * PITCH}
                    y={d.weekday * PITCH}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    // a transparent stroke widens the hit area over the gap around the cell
                    strokeWidth={GAP}
                    tabIndex={i === current ? 0 : -1}
                    role="img"
                    aria-label={`${dayLabel(d.time)} · 커밋 ${d.count}개`}
                    className="cursor-pointer outline-none"
                    style={{ fill: `var(--heat-${heatLevel(d.count)})`, stroke: 'transparent' }}
                    onPointerEnter={() => setActive({ index: i, focus: false })}
                    onFocus={() => {
                      setCurrent(i)
                      setActive({ index: i, focus: true })
                    }}
                    onBlur={() => setActive(null)}
                  />
                ))}
                {shown && (
                  <rect
                    aria-hidden
                    x={shown.week * PITCH - 1}
                    y={shown.weekday * PITCH - 1}
                    width={CELL + 2}
                    height={CELL + 2}
                    rx={3.5}
                    fill="none"
                    strokeWidth={1.5}
                    pointerEvents="none"
                    style={{ stroke: 'var(--foreground)' }}
                  />
                )}
              </svg>
              {shown && (
                <ChartTooltip
                  id={`${id}-tip`}
                  x={pctX(shown.week) + (CELL / GRID_W) * 50}
                  y={`${pctY(shown.weekday)}%`}
                >
                  <TooltipRow label={dayLabel(shown.time)} value={`커밋 ${shown.count}개`} />
                </ChartTooltip>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 self-end text-[11px] text-muted-foreground">
          <span className="mr-1">적음</span>
          <ul aria-label="색 단계" className="flex gap-1">
            {HEAT_STEPS.map((step, level) => (
              <li key={step} className="size-3 rounded-[3px]" style={{ background: `var(--heat-${level})` }}>
                <span className="sr-only">{step}</span>
              </li>
            ))}
          </ul>
          <span className="ml-1">많음</span>
        </div>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {HEATMAP_WEEKS}주 동안 커밋 {fmt(total)}개 · 커밋한 날 {days.filter((d) => d.count > 0).length}일 · 가장 많은 날{' '}
        {shortDay(busiest.time)} {busiest.count}개
      </p>
    </div>
  )
}
