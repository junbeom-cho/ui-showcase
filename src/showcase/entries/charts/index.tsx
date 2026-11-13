import { AlertCircleIcon, ChartColumnIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import { arcPath, fmt, niceTicks, ringAngles, SPENDING, STOCKS, VISITS } from './data'
import {
  AreaChartFormat,
  BarChartFormat,
  DonutChartFormat,
  HeatmapFormat,
  KpiFormat,
  LineChartFormat,
  SparklineFormat,
} from './formats'
import { bandCenter, ChartTooltip, LegendItem, PLOT, Sparkline, TooltipRow, vizVars, yOf } from './kit'

/* ── State gallery: one small chart card, drawn in each state ──────────── */

const WEEK = [
  { day: '월', value: 210 },
  { day: '화', value: 260 },
  { day: '수', value: 342 },
  { day: '목', value: 280 },
  { day: '금', value: 390 },
  { day: '토', value: 180 },
  { day: '일', value: 150 },
]
const MINI = { height: 96, top: 14, axis: 20, max: 400 }
const miniY = (v: number) => MINI.top + (1 - v / MINI.max) * (MINI.height - MINI.top)

function MiniBars({ bars = true, highlight, hover }: { bars?: boolean; highlight?: number; hover?: number }) {
  const n = WEEK.length
  const band = 100 / n
  const width = band * 0.5
  return (
    <div className="relative">
      <svg aria-hidden width="100%" height={MINI.height + MINI.axis} className="block overflow-visible">
        {[200, 400].map((t) => (
          <line key={t} x1="0" x2="100%" y1={miniY(t)} y2={miniY(t)} shapeRendering="crispEdges" style={{ stroke: 'var(--viz-grid)' }} />
        ))}
        {bars &&
          WEEK.map((d, i) => {
            const top = miniY(d.value)
            const foot = Math.min(4, MINI.height - top)
            const x = `${i * band + (band - width) / 2}%`
            const grey = highlight !== undefined && highlight !== i
            return (
              <g
                key={d.day}
                opacity={hover !== undefined && hover !== i ? 0.35 : 1}
                style={{ fill: grey ? 'var(--viz-muted)' : 'var(--series-1)' }}
              >
                <rect x={x} width={`${width}%`} y={top} height={MINI.height - top} rx={3} />
                <rect x={x} width={`${width}%`} y={MINI.height - foot} height={foot} />
              </g>
            )
          })}
        {highlight !== undefined && (
          <text
            x={`${bandCenter(highlight, n)}%`}
            y={miniY(WEEK[highlight].value) - 5}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold"
          >
            {WEEK[highlight].value}
          </text>
        )}
        <line x1="0" x2="100%" y1={MINI.height} y2={MINI.height} shapeRendering="crispEdges" style={{ stroke: 'var(--viz-axis)' }} />
        {WEEK.map((d, i) => (
          <text key={d.day} x={`${bandCenter(i, n)}%`} y={MINI.height + 15} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            {d.day}
          </text>
        ))}
      </svg>
      {hover !== undefined && (
        <ChartTooltip x={bandCenter(hover, n)} y={miniY(WEEK[hover].value)}>
          <TooltipRow label={`${WEEK[hover].day}요일`} value={`${WEEK[hover].value}명`} />
        </ChartTooltip>
      )}
    </div>
  )
}

type CardState = 'default' | 'highlight' | 'tooltip' | 'loading' | 'empty' | 'error'

function MiniChartCard({ state }: { state: CardState }) {
  const total = WEEK.reduce((a, d) => a + d.value, 0)
  const plain = state === 'default' || state === 'highlight' || state === 'tooltip'
  return (
    <div
      aria-busy={state === 'loading' || undefined}
      className={cn(vizVars, 'flex w-full max-w-64 flex-col gap-2 rounded-lg border bg-background p-3 text-left')}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">주간 방문</span>
        <span className="text-xs text-muted-foreground">{plain ? `합계 ${fmt(total)}명` : '이번 주'}</span>
      </div>
      {state === 'default' && <MiniBars />}
      {state === 'highlight' && <MiniBars highlight={4} />}
      {state === 'tooltip' && <MiniBars hover={3} />}
      {state === 'loading' && (
        <div style={{ height: MINI.height + MINI.axis }}>
          <div className="flex items-end justify-around border-b" style={{ height: MINI.height }}>
            {[45, 60, 80, 66, 92, 40, 34].map((h, i) => (
              <Skeleton key={i} className="w-[7%] rounded-b-none motion-reduce:animate-none" style={{ height: `${h}%` }} />
            ))}
          </div>
          <span className="sr-only">차트를 불러오는 중</span>
        </div>
      )}
      {state === 'empty' && (
        <div className="relative">
          <MiniBars bars={false} />
          <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center gap-1" style={{ height: MINI.height }}>
            <ChartColumnIcon aria-hidden className="size-5 text-muted-foreground" />
            <p className="rounded bg-background px-1.5 text-xs font-medium">이번 주 방문 기록이 없어요</p>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ height: MINI.height + MINI.axis }}>
          <AlertCircleIcon aria-hidden className="size-5 text-destructive" />
          <p className="text-xs font-medium">차트를 불러오지 못했어요</p>
          <Button size="xs" variant="outline" tabIndex={-1}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '기본', node: <MiniChartCard state="default" /> },
        { label: '강조', node: <MiniChartCard state="highlight" /> },
        { label: '툴팁 표시', node: <MiniChartCard state="tooltip" /> },
        { label: '불러오는 중', node: <MiniChartCard state="loading" /> },
        { label: '데이터 없음', node: <MiniChartCard state="empty" /> },
        { label: '오류', node: <MiniChartCard state="error" /> },
      ]}
    />
  )
}

/* ── Overview thumbnail ────────────────────────────────────────────────── */

function ChartsPreview() {
  const bars = [40, 62, 50, 78, 92]
  const angles = ringAngles(SPENDING.map((s) => s.value))
  return (
    <div aria-hidden className={cn(vizVars, 'flex w-44 flex-col gap-3 rounded-lg border bg-background p-3')}>
      <div className="flex items-end justify-between gap-3">
        <svg viewBox="0 0 80 56" className="h-14 w-20">
          {bars.map((h, i) => (
            <rect key={i} x={i * 16 + 3} width={10} y={56 - h * 0.56} height={h * 0.56} rx={2} style={{ fill: 'var(--series-1)' }} />
          ))}
        </svg>
        <svg viewBox="0 0 56 56" className="size-14">
          {SPENDING.map((s, i) => (
            <path
              key={s.name}
              d={arcPath(28, 28, 16, 27, angles[i].a0, angles[i].a1)}
              strokeWidth={1.5}
              style={{ fill: s.color, stroke: 'var(--background)' }}
            />
          ))}
        </svg>
      </div>
      <Sparkline values={STOCKS[0].prices} label="" height={22} line="var(--series-2)" dot="var(--series-2)" />
    </div>
  )
}

/* ── Anatomy: one bar-and-line chart with its parts named ──────────────── */

const LAST_YEAR = [980, 1100, 1060, 1010, 1180, 1150]

/** Static drawing; the parts carry data-slot so the anatomy overlay can point at them. */
function ChartsSpecimen() {
  const data = VISITS.slice(-6)
  const n = data.length
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), ...LAST_YEAR))
  const max = ticks[ticks.length - 1]
  const band = 100 / n
  const width = band * 0.4
  const active = 4
  const xs = data.map((_, i) => bandCenter(i, n))
  const linePoints = LAST_YEAR.map((v, i) => `${i ? 'L' : 'M'}${xs[i]} ${yOf(v, max)}`).join(' ')

  return (
    <div className={cn(vizVars, 'flex w-80 flex-col gap-3 rounded-xl border bg-background p-4 text-left')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p data-slot="chart-title" className="text-sm font-semibold">
          월별 방문자
        </p>
        <div data-slot="chart-legend" className="flex gap-3">
          <LegendItem name="올해" color="var(--series-1)" mark="rect" />
          <LegendItem name="작년" color="var(--series-2)" mark="line" />
        </div>
      </div>
      <div className="flex">
        <div data-slot="chart-y-axis" className="relative w-11 shrink-0" style={{ height: PLOT.height }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 -translate-y-1/2 text-[11px] leading-none text-muted-foreground tabular-nums"
              style={{ top: yOf(t, max) }}
            >
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <svg aria-hidden width="100%" height={PLOT.height + PLOT.axis} className="block overflow-visible">
            {ticks
              .filter((t) => t > 0)
              .map((t) => (
                <line
                  key={t}
                  data-slot={t === ticks[ticks.length - 2] ? 'chart-gridline' : undefined}
                  x1="0"
                  x2="100%"
                  y1={yOf(t, max)}
                  y2={yOf(t, max)}
                  shapeRendering="crispEdges"
                  style={{ stroke: 'var(--viz-grid)' }}
                />
              ))}
            {data.map((d, i) => {
              const top = yOf(d.value, max)
              const foot = Math.min(4, PLOT.height - top)
              const x = `${i * band + (band - width) / 2}%`
              return (
                <g
                  key={d.month}
                  data-slot={i === active ? 'chart-bar' : undefined}
                  opacity={i === active ? 1 : 0.55}
                  style={{ fill: 'var(--series-1)' }}
                >
                  <rect x={x} width={`${width}%`} y={top} height={PLOT.height - top} rx={4} />
                  <rect x={x} width={`${width}%`} y={PLOT.height - foot} height={foot} />
                </g>
              )
            })}
            <svg viewBox={`0 0 100 ${PLOT.height}`} preserveAspectRatio="none" width="100%" height={PLOT.height} className="overflow-visible">
              <path
                data-slot="chart-line"
                d={linePoints}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: 'var(--series-2)' }}
              />
            </svg>
            {LAST_YEAR.map((v, i) => (
              <circle key={i} cx={`${xs[i]}%`} cy={yOf(v, max)} r={3} strokeWidth={1.5} style={{ fill: 'var(--series-2)', stroke: 'var(--background)' }} />
            ))}
            <g data-slot="chart-x-axis">
              <line x1="0" x2="100%" y1={PLOT.height} y2={PLOT.height} shapeRendering="crispEdges" style={{ stroke: 'var(--viz-axis)' }} />
              {data.map((d, i) => (
                <text key={d.month} x={`${xs[i]}%`} y={PLOT.height + 17} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {d.month}월
                </text>
              ))}
            </g>
          </svg>
          <ChartTooltip data-slot="chart-tooltip" x={xs[active]} y={yOf(data[active].value, max)}>
            <span className="text-muted-foreground">
              {data[active].year}년 {data[active].month}월
            </span>
            <TooltipRow color="var(--series-1)" mark="rect" label="올해" value={`${fmt(data[active].value)}명`} />
            <TooltipRow color="var(--series-2)" label="작년" value={`${fmt(LAST_YEAR[active])}명`} />
          </ChartTooltip>
        </div>
      </div>
    </div>
  )
}

export const chartsEntry: ShowcaseEntry = {
  id: 'charts',
  name: 'Charts',
  aliases: [
    'Chart',
    'Graph',
    'Data visualization',
    'Bar chart',
    'Line chart',
    'Area chart',
    'Donut chart',
    'Sparkline',
    'KPI card',
    'Heatmap',
    '차트',
    '그래프',
  ],
  description: '숫자를 막대 길이, 선의 높이, 조각의 크기, 칸의 색으로 바꿔 한눈에 비교하게 하는 그림.',
  category: 'display',
  Preview: ChartsPreview,
  anatomy: {
    Specimen: ChartsSpecimen,
    parts: [
      { slot: 'chart-title', name: 'Title', description: '무엇을, 어느 기간, 어떤 단위로 보여 주는지 적는 제목' },
      { slot: 'chart-legend', name: 'Legend', description: '어떤 색·모양이 어떤 계열인지 알려 주는 범례. 계열이 둘 이상일 때 둠' },
      { slot: 'chart-y-axis', name: 'Y axis', description: '값을 읽는 눈금. 0에서 시작해 500, 1,000처럼 깔끔한 수로 끊음' },
      { slot: 'chart-gridline', name: 'Gridline', description: '눈금에서 가로로 이어지는 옅은 선. 막대 끝의 값을 어림하게 도움' },
      { slot: 'chart-bar', name: 'Bar', description: '값 하나를 길이로 나타낸 막대. 바닥은 각지고 끝만 둥글게' },
      { slot: 'chart-line', name: 'Line series', description: '이어지는 값의 흐름을 잇는 선. 같은 축 위에서 막대와 비교' },
      { slot: 'chart-x-axis', name: 'X axis', description: '막대와 점이 무엇(어느 달)인지 적는 축과 바닥선' },
      { slot: 'chart-tooltip', name: 'Tooltip', description: '마우스를 올리거나 포커스한 곳의 정확한 값을 띄우는 상자' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '작은 막대 차트 카드 한 장이 가질 수 있는 모습입니다. 기본, 한 막대만 색을 남긴 강조, 마우스를 올려 툴팁이 뜬 모습과, 데이터를 기다리는 중·데이터가 없음·불러오기 실패를 나란히 그렸습니다.',
      Demo: States,
    },
    {
      title: '막대 차트',
      description:
        '항목(여기서는 달)마다 값의 크기를 막대 길이로 비교합니다. 몇 개에서 열몇 개 항목의 크기를 견줄 때 가장 무난하고, 길이를 정직하게 비교하려면 축이 0에서 시작해야 합니다. 이어지는 흐름 자체가 중요하면 선 차트가 낫습니다. 기간 탭을 바꾸고, 막대에 마우스를 올리거나 Tab으로 옮겨 정확한 값을 확인해 보세요.',
      Demo: BarChartFormat,
    },
    {
      title: '선 차트',
      description:
        '시간에 따른 흐름을 선으로 잇습니다. 여러 계열의 추세를 같은 축에서 견줄 때 쓰고, 순서 없는 항목끼리의 비교에는 막대가 낫습니다. 범례를 눌러 한 해를 숨겨 보고, 차트 위에서 마우스를 움직이거나 포커스한 뒤 방향키로 달을 옮겨 보세요.',
      Demo: LineChartFormat,
    },
    {
      title: '영역 차트',
      description:
        '선 아래를 색으로 채워 양을 강조합니다. 누적은 부분이 모여 전체가 되는 모습을, 겹침은 계열마다 0부터의 크기를 보여 줍니다. 누적에서는 맨 아래 계열 말고는 크기를 정확히 견주기 어려우니 툴팁과 표로 확인합니다. 누적과 겹침을 바꿔 보세요.',
      Demo: AreaChartFormat,
    },
    {
      title: '도넛 차트',
      description:
        '전체 중 각 부분의 비율을 고리 조각으로 보여 주고 가운데에 합계를 적습니다. 조각이 대여섯 개 이하이고 차이가 뚜렷할 때만 쓰고, 비슷한 값끼리의 비교나 시간에 따른 변화에는 막대가 낫습니다. 조각이나 범례에 마우스를 올리거나 Tab으로 조각을 옮겨 보세요.',
      Demo: DonutChartFormat,
    },
    {
      title: '스파크라인',
      description:
        '축도 눈금도 없는 글자 크기의 작은 선으로 흐름만 보여 줍니다. 표나 목록의 한 칸에 넣어 여러 항목의 추세를 훑을 때 쓰고, 정확한 값 비교에는 쓰지 않습니다. 오르내림 색은 나라마다 반대이니 한국식과 미국식을 바꿔 보세요.',
      Demo: SparklineFormat,
    },
    {
      title: '지표 카드',
      description:
        '가장 중요한 숫자 하나를 크게 쓰고, 지난 기간과의 변화, 작은 추세선, 목표까지의 진행을 덧붙입니다. 대시보드 맨 위에서 핵심 지표를 보여 줄 때 씁니다. 응답 시간처럼 줄어야 좋은 지표는 ▼가 초록입니다. 기간을 바꿔 보세요.',
      Demo: KpiFormat,
    },
    {
      title: '히트맵',
      description:
        '칸 하나가 하루이고 색이 진할수록 값이 큽니다. 요일과 주처럼 두 방향으로 늘어선 많은 값에서 패턴을 찾을 때 씁니다. 색 단계로는 어림만 되니 정확한 값은 툴팁과 표로 봅니다. 칸에 마우스를 올리거나, 칸에 포커스한 뒤 방향키로 옮겨 보세요.',
      Demo: HeatmapFormat,
    },
  ],
}
