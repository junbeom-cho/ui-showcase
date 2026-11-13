import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  bandPath,
  CHANNELS,
  fmt,
  linePath,
  MONTHS,
  niceTicks,
  ORDERS,
  percentChange,
  VISITS,
  type MonthValue,
} from './data'
import {
  bandCenter,
  Baseline,
  CategoryLabels,
  ChartFrame,
  ChartTooltip,
  CrosshairLayer,
  DataTable,
  Gridlines,
  LegendItem,
  LegendToggle,
  PLOT,
  TooltipRow,
  useCrosshair,
  useSafeId,
  ValueAxis,
  yOf,
} from './kit'

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const signed = (n: number, unit: string) => `${n > 0 ? '▲' : n < 0 ? '▼' : '–'} ${fmt(Math.abs(n))}${unit}`
const monthName = (d: MonthValue) => `${d.year}년 ${d.month}월`

/** The month before `d` in the full data, if there is one. */
const previousOf = (d: MonthValue) => VISITS[VISITS.indexOf(d) - 1] as MonthValue | undefined

/** Draws a bar with a 4px rounded top and a square foot on the baseline. */
function Bar({ x, width, top }: { x: string; width: string; top: number }) {
  const height = PLOT.height - top
  const foot = Math.min(4, height)
  return (
    <>
      <rect x={x} width={width} y={top} height={height} rx={4} />
      <rect x={x} width={width} y={PLOT.height - foot} height={foot} />
    </>
  )
}

function VisitBars({ data }: { data: MonthValue[] }) {
  const id = useSafeId()
  const [active, setActive] = useState<{ index: number; focus: boolean } | null>(null)
  const n = data.length
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)))
  const max = ticks[ticks.length - 1]
  const band = 100 / n
  const barWidth = band * (n > 8 ? 0.56 : 0.4)
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a))
  const low = data.reduce((a, b) => (b.value < a.value ? b : a))
  const first = data[0]
  const last = data[n - 1]
  const shown = active ? data[active.index] : null
  const before = shown && previousOf(shown)

  return (
    <ChartFrame
      title="월별 방문자"
      subtitle={`${monthName(first)} ~ ${monthName(last)} · 단위: 명`}
      summary={`${monthName(first)}부터 ${monthName(last)}까지 달마다 막대 하나. 가장 적은 달은 ${low.month}월 ${fmt(low.value)}명, 가장 많은 달은 ${peak.month}월 ${fmt(peak.value)}명이고, 전체로 ${last.value > first.value ? '늘어나는' : '줄어드는'} 흐름입니다.`}
      table={
        <DataTable
          caption="월별 방문자"
          columns={[{ label: '달' }, { label: '방문자(명)', numeric: true }, { label: '지난달 대비', numeric: true }]}
          rows={data.map((d) => {
            const prev = previousOf(d)
            return [monthName(d), fmt(d.value), prev ? signed(d.value - prev.value, '명') : '–']
          })}
        />
      }
    >
      <div className="flex">
        <ValueAxis ticks={ticks} />
        <div className="relative min-w-0 flex-1">
          <svg
            role="group"
            aria-label="달마다 막대 하나"
            width="100%"
            height={PLOT.height + PLOT.axis}
            className="block overflow-visible"
            onPointerLeave={() => setActive((a) => (a?.focus ? a : null))}
          >
            <Gridlines ticks={ticks} />
            {data.map((d, i) => (
              <g
                key={monthName(d)}
                data-bar=""
                opacity={active && active.index !== i ? 0.35 : 1}
                className="motion-safe:transition-opacity"
                style={{ fill: 'var(--series-1)' }}
              >
                <Bar x={`${i * band + (band - barWidth) / 2}%`} width={`${barWidth}%`} top={yOf(d.value, max)} />
              </g>
            ))}
            <Baseline />
            {/* Label only the extreme; the axis, tooltip and table carry the rest. */}
            {!active && (
              <text
                x={`${bandCenter(data.indexOf(peak), n)}%`}
                y={yOf(peak.value, max) - 6}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium"
              >
                {fmt(peak.value)}
              </text>
            )}
            <CategoryLabels labels={data.map((d) => `${d.month}월`)} />
            {active?.focus && (
              <rect
                aria-hidden
                x={`${active.index * band}%`}
                width={`${band}%`}
                y={2}
                height={PLOT.height + PLOT.axis - 4}
                rx={6}
                fill="none"
                strokeWidth={2}
                pointerEvents="none"
                style={{ stroke: 'var(--ring)' }}
              />
            )}
            {/* Hit areas: the whole band, taller and wider than the bar itself. */}
            {data.map((d, i) => (
              <rect
                key={monthName(d)}
                x={`${i * band}%`}
                width={`${band}%`}
                y={0}
                height={PLOT.height + PLOT.axis}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${d.month}월 ${fmt(d.value)}명`}
                aria-describedby={active?.index === i ? `${id}-tip` : undefined}
                className="cursor-pointer outline-none"
                onPointerEnter={() => setActive({ index: i, focus: false })}
                onFocus={() => setActive({ index: i, focus: true })}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>
          {active && shown && (
            <ChartTooltip id={`${id}-tip`} x={bandCenter(active.index, n)} y={yOf(shown.value, max)}>
              <TooltipRow label={monthName(shown)} value={`${fmt(shown.value)}명`} />
              {before && <span className="text-muted-foreground">지난달보다 {signed(shown.value - before.value, '명')}</span>}
            </ChartTooltip>
          )}
        </div>
      </div>
    </ChartFrame>
  )
}

export function BarChartFormat() {
  const [period, setPeriod] = useState('12')
  const data = period === '6' ? VISITS.slice(-6) : VISITS
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a))

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList aria-label="기간">
          <TabsTrigger value="6">6개월</TabsTrigger>
          <TabsTrigger value="12">12개월</TabsTrigger>
        </TabsList>
        <TabsContent value="6">
          <VisitBars data={VISITS.slice(-6)} />
        </TabsContent>
        <TabsContent value="12">
          <VisitBars data={VISITS} />
        </TabsContent>
      </Tabs>
      <p role="status" className="text-sm text-muted-foreground">
        최근 {period}개월 · 막대 {data.length}개 · 합계 {fmt(sum(data.map((d) => d.value)))}명 · 가장 많은 달 {peak.month}월{' '}
        {fmt(peak.value)}명
      </p>
    </div>
  )
}

export function LineChartFormat() {
  const id = useSafeId()
  const [hidden, setHidden] = useState<string[]>([])
  const n = MONTHS.length
  const { index, handlers } = useCrosshair(n)
  const visible = ORDERS.filter((s) => !hidden.includes(s.name))
  // One scale for both years, so hiding a line never stretches the other.
  const ticks = niceTicks(Math.max(...ORDERS.flatMap((s) => s.values)))
  const max = ticks[ticks.length - 1]
  const xs = MONTHS.map((_, i) => bandCenter(i, n))
  const [thisYear, lastYear] = ORDERS
  const toggle = (name: string) => setHidden((h) => (h.includes(name) ? h.filter((x) => x !== name) : [...h, name]))

  const valueText =
    index === null
      ? '마우스를 올리거나 방향키로 달을 고르세요'
      : `${MONTHS[index]}: ${visible.map((s) => `${s.name} ${fmt(s.values[index])}건`).join(', ') || '보이는 선 없음'}`

  const status =
    visible.length === 2
      ? `올해 ${fmt(sum(thisYear.values))}건 · 작년 ${fmt(sum(lastYear.values))}건 · 작년보다 ${signed(percentChange(sum(lastYear.values), sum(thisYear.values)), '%')}`
      : visible.length === 1
        ? `${visible[0].name}만 보는 중 · 합계 ${fmt(sum(visible[0].values))}건`
        : '보이는 선이 없습니다. 범례를 눌러 다시 켜세요.'

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ChartFrame
        title="월별 주문 수"
        subtitle="올해와 작년 · 단위: 건"
        summary={`1월부터 12월까지 올해와 작년의 월별 주문 수를 잇는 선 두 개. 두 해 모두 늘어나는 흐름이고, 올해가 모든 달에서 작년보다 많습니다. 올해 12월은 ${fmt(thisYear.values[11])}건입니다.`}
        legend={
          <div role="group" aria-label="범례: 눌러서 선 숨기기·보이기" className="-ml-2 flex flex-wrap gap-1">
            {ORDERS.map((s) => (
              <LegendToggle
                key={s.name}
                name={s.name}
                color={s.color}
                mark="line"
                pressed={!hidden.includes(s.name)}
                onToggle={() => toggle(s.name)}
              />
            ))}
          </div>
        }
        table={
          <DataTable
            caption="월별 주문 수"
            columns={[{ label: '달' }, ...ORDERS.map((s) => ({ label: `${s.name}(건)`, numeric: true }))]}
            rows={MONTHS.map((m, i) => [m, ...ORDERS.map((s) => fmt(s.values[i]))])}
          />
        }
      >
        <div className="flex">
          <ValueAxis ticks={ticks} />
          <div className="relative mr-9 min-w-0 flex-1">
            <svg aria-hidden width="100%" height={PLOT.height + PLOT.axis} className="block overflow-visible">
              <Gridlines ticks={ticks} />
              <Baseline />
              {index !== null && (
                <line
                  x1={`${xs[index]}%`}
                  x2={`${xs[index]}%`}
                  y1={PLOT.top - 6}
                  y2={PLOT.height}
                  strokeWidth={1}
                  style={{ stroke: 'var(--viz-axis)' }}
                />
              )}
              <svg
                viewBox={`0 0 100 ${PLOT.height}`}
                preserveAspectRatio="none"
                width="100%"
                height={PLOT.height}
                className="overflow-visible"
              >
                {visible.map((s) => (
                  <path
                    key={s.name}
                    data-series={s.name}
                    d={linePath(s.values.map((v, i) => [xs[i], yOf(v, max)]))}
                    fill="none"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ stroke: s.color }}
                  />
                ))}
              </svg>
              {visible.map((s) => (
                <g key={s.name} style={{ fill: s.color, stroke: 'var(--background)' }}>
                  {s.values.map((v, i) => (
                    <circle
                      key={i}
                      cx={`${xs[i]}%`}
                      cy={yOf(v, max)}
                      r={index === i ? 5 : 3}
                      strokeWidth={index === i ? 2 : 1.5}
                    />
                  ))}
                </g>
              ))}
              {/* Direct labels at the line ends, beside the legend. */}
              {visible.map((s) => (
                <text
                  key={s.name}
                  x={`${xs[n - 1]}%`}
                  dx={9}
                  y={yOf(s.values[n - 1], max)}
                  dominantBaseline="middle"
                  className="fill-foreground text-[11px]"
                >
                  {s.name}
                </text>
              ))}
              <CategoryLabels labels={MONTHS} />
            </svg>
            {visible.length === 0 && (
              <p className="absolute inset-x-0 top-20 text-center text-sm text-muted-foreground">보이는 선이 없습니다</p>
            )}
            <CrosshairLayer
              label="월별 주문 수: 달 고르기"
              count={n}
              index={index}
              valueText={valueText}
              describedBy={index !== null && visible.length > 0 ? `${id}-tip` : undefined}
              handlers={handlers}
            />
            {index !== null && visible.length > 0 && (
              <ChartTooltip
                id={`${id}-tip`}
                x={xs[index]}
                y={Math.min(...visible.map((s) => yOf(s.values[index], max)))}
              >
                <span className="text-muted-foreground">{MONTHS[index]}</span>
                {[...visible]
                  .sort((a, b) => b.values[index] - a.values[index])
                  .map((s) => (
                    <TooltipRow key={s.name} color={s.color} label={s.name} value={`${fmt(s.values[index])}건`} />
                  ))}
                {visible.length === 2 && (
                  <span className="text-muted-foreground">
                    작년보다 {signed(percentChange(lastYear.values[index], thisYear.values[index]), '%')}
                  </span>
                )}
              </ChartTooltip>
            )}
          </div>
        </div>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  )
}

type AreaMode = 'stacked' | 'overlap'

export function AreaChartFormat() {
  const id = useSafeId()
  const [mode, setMode] = useState<AreaMode>('stacked')
  const n = MONTHS.length
  const { index, handlers } = useCrosshair(n)
  const xs = MONTHS.map((_, i) => bandCenter(i, n))
  const totals = MONTHS.map((_, i) => sum(CHANNELS.map((s) => s.values[i])))
  const stacked = mode === 'stacked'
  const ticks = niceTicks(stacked ? Math.max(...totals) : Math.max(...CHANNELS.flatMap((s) => s.values)))
  const max = ticks[ticks.length - 1]

  // Stacked: each band starts where the ones below it end. Overlap: every band starts at 0.
  const layers = CHANNELS.map((s, k) => {
    const lower = s.values.map((_, i) => (stacked ? sum(CHANNELS.slice(0, k).map((c) => c.values[i])) : 0))
    return { ...s, k, lower, upper: s.values.map((v, i) => lower[i] + v) }
  })
  // Overlapping areas: the biggest goes at the back so the smaller ones stay visible.
  const drawOrder = stacked ? layers : [...layers].sort((a, b) => Math.max(...b.values) - Math.max(...a.values))
  const point = (values: number[]) => values.map((v, i) => [xs[i], yOf(v, max)] as [number, number])
  const biggest = CHANNELS.reduce((a, b) => (b.values[n - 1] > a.values[n - 1] ? b : a))

  const valueText =
    index === null
      ? '마우스를 올리거나 방향키로 달을 고르세요'
      : `${MONTHS[index]}: ${CHANNELS.map((s) => `${s.name} ${fmt(s.values[index])}명`).join(', ')}, 합계 ${fmt(totals[index])}명`

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="그리는 방식"
        value={mode}
        onValueChange={(v) => v && setMode(v as AreaMode)}
      >
        <ToggleGroupItem value="stacked" className="px-3">
          누적
        </ToggleGroupItem>
        <ToggleGroupItem value="overlap" className="px-3">
          겹침
        </ToggleGroupItem>
      </ToggleGroup>
      <ChartFrame
        data-mode={mode}
        title="경로별 방문자"
        subtitle={`1월~12월 · ${stacked ? '쌓아 올림' : '겹쳐 그림'} · 단위: 명`}
        summary={`검색, SNS, 직접 방문 세 경로의 월별 방문자 영역 차트. 세 경로 모두 늘었고 SNS가 가장 빠르게 늘었습니다. 12월 합계는 ${fmt(totals[n - 1])}명입니다.`}
        legend={
          <div className="flex flex-wrap gap-3">
            {CHANNELS.map((s) => (
              <LegendItem key={s.name} name={s.name} color={s.color} mark="rect" />
            ))}
          </div>
        }
        table={
          <DataTable
            caption="경로별 방문자"
            columns={[
              { label: '달' },
              ...CHANNELS.map((s) => ({ label: `${s.name}(명)`, numeric: true })),
              { label: '합계(명)', numeric: true },
            ]}
            rows={MONTHS.map((m, i) => [m, ...CHANNELS.map((s) => fmt(s.values[i])), fmt(totals[i])])}
          />
        }
      >
        <div className="flex">
          <ValueAxis ticks={ticks} />
          <div className="relative min-w-0 flex-1">
            <svg aria-hidden width="100%" height={PLOT.height + PLOT.axis} className="block overflow-visible">
              <Gridlines ticks={ticks} />
              <svg
                viewBox={`0 0 100 ${PLOT.height}`}
                preserveAspectRatio="none"
                width="100%"
                height={PLOT.height}
                className="overflow-visible"
              >
                <defs>
                  {layers.map((s) => (
                    <linearGradient key={s.name} id={`${id}-fill-${s.k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: s.color, stopOpacity: stacked ? 0.55 : 0.32 }} />
                      <stop offset="100%" style={{ stopColor: s.color, stopOpacity: stacked ? 0.25 : 0.02 }} />
                    </linearGradient>
                  ))}
                </defs>
                {drawOrder.map((s) => (
                  <g key={s.name} data-area={s.name}>
                    <path d={bandPath(point(s.upper), point(s.lower))} fill={`url(#${id}-fill-${s.k})`} />
                    <path
                      d={linePath(point(s.upper))}
                      fill="none"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ stroke: s.color }}
                    />
                  </g>
                ))}
              </svg>
              <Baseline />
              {index !== null && (
                <>
                  <line
                    x1={`${xs[index]}%`}
                    x2={`${xs[index]}%`}
                    y1={PLOT.top - 6}
                    y2={PLOT.height}
                    strokeWidth={1}
                    style={{ stroke: 'var(--viz-axis)' }}
                  />
                  {layers.map((s) => (
                    <circle
                      key={s.name}
                      cx={`${xs[index]}%`}
                      cy={yOf(s.upper[index], max)}
                      r={4.5}
                      strokeWidth={2}
                      style={{ fill: s.color, stroke: 'var(--background)' }}
                    />
                  ))}
                </>
              )}
              <CategoryLabels labels={MONTHS} />
            </svg>
            <CrosshairLayer
              label="경로별 방문자: 달 고르기"
              count={n}
              index={index}
              valueText={valueText}
              describedBy={index !== null ? `${id}-tip` : undefined}
              handlers={handlers}
            />
            {index !== null && (
              <ChartTooltip id={`${id}-tip`} x={xs[index]} y={Math.min(...layers.map((s) => yOf(s.upper[index], max)))}>
                <span className="text-muted-foreground">{MONTHS[index]}</span>
                {[...CHANNELS].reverse().map((s) => (
                  <TooltipRow key={s.name} color={s.color} mark="rect" label={s.name} value={`${fmt(s.values[index])}명`} />
                ))}
                <TooltipRow label="합계" value={`${fmt(totals[index])}명`} />
              </ChartTooltip>
            )}
          </div>
        </div>
      </ChartFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {stacked
          ? `누적: 맨 위 선의 높이가 세 경로를 더한 전체 방문자입니다. 12월 합계 ${fmt(totals[n - 1])}명.`
          : `겹침: 세 영역이 모두 0에서 시작해 경로끼리 바로 비교됩니다. 12월에는 ${biggest.name}이 ${fmt(biggest.values[n - 1])}명으로 가장 많습니다.`}
      </p>
    </div>
  )
}
