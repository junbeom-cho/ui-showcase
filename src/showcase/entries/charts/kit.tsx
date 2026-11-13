import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { TableIcon } from 'lucide-react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import { fmt, linePath } from './data'

/*
 * Chart colours as CSS variables, set on each chart's root. The categorical
 * slots are a colour-blind-checked palette in a fixed order (a series keeps its
 * colour when others are hidden); dark mode has its own steps of the same hues.
 * The heat steps are one blue ramp, light to dark (reversed on a dark surface).
 */
export const vizVars = [
  '[--series-1:#2a78d6] [--series-2:#eb6834] [--series-3:#1baf7a] [--series-4:#eda100] [--series-5:#e87ba4]',
  'dark:[--series-1:#3987e5] dark:[--series-2:#d95926] dark:[--series-3:#199e70] dark:[--series-4:#c98500] dark:[--series-5:#d55181]',
  '[--viz-grid:#e1e0d9] [--viz-axis:#b4b3ab] [--viz-muted:#c9c8c1] dark:[--viz-grid:#2c2c2a] dark:[--viz-axis:#4a4a46] dark:[--viz-muted:#4a4a46]',
  '[--heat-0:#ebebe7] [--heat-1:#9ec5f4] [--heat-2:#5598e7] [--heat-3:#256abf] [--heat-4:#104281]',
  'dark:[--heat-0:#2c2c2a] dark:[--heat-1:#184f95] dark:[--heat-2:#256abf] dark:[--heat-3:#3987e5] dark:[--heat-4:#86b6ef]',
].join(' ')

/** Text colours for good / bad changes; they always come with ▲▼ and words, never alone. */
export const deltaTone = {
  good: 'text-[#006300] dark:text-[#3fbf3f]',
  bad: 'text-[#c0392b] dark:text-[#ef7b7b]',
  neutral: 'text-muted-foreground',
}

/** useId, made safe for url(#…) references and CSS selectors. */
export function useSafeId() {
  return useId().replace(/[^\w-]/g, '')
}

/*
 * XY plots are drawn in an <svg> that is 100% wide and a fixed number of pixels
 * tall, with no viewBox: x positions are percentages and y positions pixels.
 * The chart then stretches with its box while text and strokes keep their size.
 * Paths (lines, areas) cannot take percentages, so they go in a nested
 * viewBox="0 0 100 H" with preserveAspectRatio="none" and non-scaling strokes.
 */
export const PLOT = { height: 200, top: 12, axis: 26 } as const

export const yOf = (value: number, max: number) => PLOT.top + (1 - value / max) * (PLOT.height - PLOT.top)

/** Centre of the i-th of n equal bands, in percent. */
export const bandCenter = (i: number, n: number) => ((i + 0.5) / n) * 100

export function ChartFrame({
  title,
  subtitle,
  summary,
  table,
  legend,
  children,
  className,
  ...props
}: {
  title: string
  subtitle?: string
  /** read by screen readers in place of the picture */
  summary: string
  /** the same numbers as the chart, shown by "표로 보기" */
  table: ReactNode
  legend?: ReactNode
  children: ReactNode
} & Omit<ComponentProps<'figure'>, 'title' | 'children'>) {
  const id = useSafeId()
  const [asTable, setAsTable] = useState(false)
  return (
    <figure
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-summary`}
      className={cn(vizVars, 'flex w-full min-w-0 flex-col gap-3 rounded-xl border bg-background p-4 text-left', className)}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p id={`${id}-title`} className="text-sm font-semibold">
            {title}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Toggle variant="outline" size="sm" pressed={asTable} onPressedChange={setAsTable}>
          <TableIcon data-icon="inline-start" />
          표로 보기
        </Toggle>
      </div>
      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>
      {!asTable && legend}
      {asTable ? table : children}
    </figure>
  )
}

export type Column = { label: string; numeric?: boolean }

export function DataTable({ caption, columns, rows }: { caption: string; columns: Column[]; rows: ReactNode[][] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.label} className={cn('h-8 text-xs', c.numeric && 'text-right')}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((cell, c) => (
                <TableCell key={c} className={cn('py-1.5 text-xs', columns[c].numeric && 'text-right tabular-nums')}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Value-axis labels in their own column, so the plot beside them can stretch. */
export function ValueAxis({ ticks, ...props }: { ticks: number[] } & ComponentProps<'div'>) {
  const max = ticks[ticks.length - 1]
  return (
    <div aria-hidden className="relative w-11 shrink-0" style={{ height: PLOT.height }} {...props}>
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
  )
}

/** Hairline gridlines at every tick above zero. */
export function Gridlines({ ticks }: { ticks: number[] }) {
  const max = ticks[ticks.length - 1]
  return (
    <g aria-hidden>
      {ticks
        .filter((t) => t > 0)
        .map((t) => (
          <line
            key={t}
            x1="0"
            x2="100%"
            y1={yOf(t, max)}
            y2={yOf(t, max)}
            strokeWidth={1}
            shapeRendering="crispEdges"
            style={{ stroke: 'var(--viz-grid)' }}
          />
        ))}
    </g>
  )
}

/** The zero line every bar grows from; drawn after the marks. */
export function Baseline() {
  return (
    <line
      aria-hidden
      x1="0"
      x2="100%"
      y1={PLOT.height}
      y2={PLOT.height}
      strokeWidth={1}
      shapeRendering="crispEdges"
      style={{ stroke: 'var(--viz-axis)' }}
    />
  )
}

/** Category labels under the plot; every other one is dropped on narrow screens when there are many. */
export function CategoryLabels({ labels, ...props }: { labels: string[] } & ComponentProps<'g'>) {
  const n = labels.length
  return (
    <g aria-hidden {...props}>
      {labels.map((label, i) => (
        <text
          key={i}
          x={`${bandCenter(i, n)}%`}
          y={PLOT.height + 17}
          textAnchor="middle"
          className={cn('fill-muted-foreground text-[11px]', n > 8 && i % 2 === 1 && 'max-sm:hidden')}
        >
          {label}
        </text>
      ))}
    </g>
  )
}

/** A short coloured mark that says which series a label belongs to (line for lines, square for fills). */
export function Key({ color, mark }: { color: string; mark: 'line' | 'rect' }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', mark === 'line' ? 'h-0.5 w-3.5 rounded-full' : 'size-2.5 rounded-[3px]')}
      style={{ background: color }}
    />
  )
}

export function LegendItem({ name, color, mark }: { name: string; color: string; mark: 'line' | 'rect' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Key color={color} mark={mark} />
      {name}
    </span>
  )
}

/** A legend entry that hides or shows its series. */
export function LegendToggle({
  name,
  color,
  mark,
  pressed,
  onToggle,
}: {
  name: string
  color: string
  mark: 'line' | 'rect'
  pressed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[pressed=false]:text-muted-foreground aria-[pressed=false]:line-through"
    >
      <span className={cn('inline-flex', !pressed && 'opacity-30')}>
        <Key color={color} mark={mark} />
      </span>
      {name}
    </button>
  )
}

/** Floating box over the plot, anchored above (x %, y px or a CSS length); it leans inward near the edges. */
export function ChartTooltip({
  x,
  y,
  className,
  ...props
}: { x: number; y: number | string } & ComponentProps<'div'>) {
  const shift = x < 18 ? '-14%' : x > 82 ? '-86%' : '-50%'
  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-10 flex min-w-24 flex-col gap-1 rounded-md border bg-popover px-2.5 py-2 text-xs whitespace-nowrap text-popover-foreground shadow-md',
        className,
      )}
      style={{ left: `${x}%`, top: y, transform: `translate(${shift}, calc(-100% - 8px))` }}
      {...props}
    />
  )
}

/** One line of a tooltip: the value leads, the series name follows. */
export function TooltipRow({
  color,
  label,
  value,
  mark = 'line',
}: {
  color?: string
  label: string
  value: string
  mark?: 'line' | 'rect'
}) {
  return (
    <span className="flex items-center gap-1.5">
      {color && <Key color={color} mark={mark} />}
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Snaps a crosshair to the nearest of `count` x positions under the pointer, and
 * lets the keyboard move it with the arrow keys while the plot has focus.
 */
export function useCrosshair(count: number) {
  const [index, setIndex] = useState<number | null>(null)
  const focused = useRef(false)

  const handlers = {
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const box = event.currentTarget.getBoundingClientRect()
      if (box.width > 0) setIndex(clamp(Math.floor(((event.clientX - box.left) / box.width) * count), 0, count - 1))
    },
    onPointerLeave: () => {
      if (!focused.current) setIndex(null)
    },
    onFocus: () => {
      focused.current = true
      setIndex((i) => i ?? count - 1)
    },
    onBlur: () => {
      focused.current = false
      setIndex(null)
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      const moves: Record<string, (i: number) => number> = {
        ArrowRight: (i) => i + 1,
        ArrowUp: (i) => i + 1,
        ArrowLeft: (i) => i - 1,
        ArrowDown: (i) => i - 1,
        Home: () => 0,
        End: () => count - 1,
      }
      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      setIndex((i) => clamp(move(i ?? count - 1), 0, count - 1))
    },
  }
  return { index, handlers }
}

/**
 * The invisible layer over a line or area plot that the pointer and keyboard
 * use. It is a slider over the x positions, so screen readers read each stop.
 */
export function CrosshairLayer({
  label,
  count,
  index,
  valueText,
  describedBy,
  handlers,
}: {
  label: string
  count: number
  index: number | null
  valueText: string
  describedBy?: string
  handlers: ReturnType<typeof useCrosshair>['handlers']
}) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={(index ?? count - 1) + 1}
      aria-valuetext={valueText}
      aria-describedby={describedBy}
      className="absolute inset-x-0 top-0 cursor-crosshair touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      style={{ height: PLOT.height }}
      {...handlers}
    />
  )
}

/**
 * A word-sized trend line. The line is quiet; only the last point carries colour.
 * Its width follows its box, its height is fixed.
 */
export function Sparkline({
  values,
  label,
  height = 28,
  line = 'var(--muted-foreground)',
  dot = 'var(--series-1)',
  className,
}: {
  values: number[]
  label: string
  height?: number
  line?: string
  dot?: string
  className?: string
}) {
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const pad = 4
  const points = values.map(
    (v, i) => [(i / (values.length - 1)) * 100, pad + (1 - (v - min) / span) * (height - pad * 2)] as [number, number],
  )
  const last = points[points.length - 1]
  return (
    <svg role="img" aria-label={label} width="100%" height={height} className={cn('block overflow-visible', className)}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        className="overflow-visible"
      >
        <path
          d={linePath(points)}
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: line }}
        />
      </svg>
      <circle cx="100%" cy={last[1]} r={3} strokeWidth={1.5} style={{ fill: dot, stroke: 'var(--background)' }} />
    </svg>
  )
}
