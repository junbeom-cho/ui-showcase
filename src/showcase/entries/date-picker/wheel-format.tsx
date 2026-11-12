import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { getDaysInMonth } from 'date-fns'
import { formatLong } from './dates'
import { useToday } from './ko-calendar'

const ITEM = 36 // px per row; the wheel shows five rows with the middle one chosen
const PAD = ITEM * 2

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/**
 * One scrolling column. It snaps to rows; when it comes to rest the middle row is
 * chosen. Clicking a row or pressing ↑/↓ also chooses, and the wheel scrolls to it.
 */
function Wheel({
  label,
  options,
  value,
  onChange,
  unit,
}: {
  label: string
  options: number[]
  value: number
  onChange: (value: number) => void
  unit: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const index = options.indexOf(value)
  // the scroll timer reads the newest props, not the ones from when it was set
  const latest = useRef({ options, value, onChange })
  useLayoutEffect(() => {
    latest.current = { options, value, onChange }
  })
  const settle = useRef<number | undefined>(undefined)

  // start on the chosen row without animating
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = latest.current.options.indexOf(latest.current.value) * ITEM
  }, [])

  // follow a value chosen by click, keys, or a shorter month
  useEffect(() => {
    const el = ref.current
    if (el && Math.round(el.scrollTop / ITEM) !== index) el.scrollTo?.({ top: index * ITEM, behavior: 'smooth' })
  }, [index])

  useEffect(() => () => window.clearTimeout(settle.current), [])

  const onScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const { options, value, onChange } = latest.current
      const next = options[Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)))]
      if (next !== value) onChange(next)
    }, 90)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }[event.key]
    let next: number | undefined
    if (step) next = options[Math.min(options.length - 1, Math.max(0, index + step))]
    if (event.key === 'Home') next = options[0]
    if (event.key === 'End') next = options.at(-1)
    if (next === undefined) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div className="relative h-[180px] w-20">
      {/* the band behind the middle row */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[72px] h-9 rounded-lg bg-muted" />
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${id}-${value}`}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        style={{ paddingBlock: PAD }}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg outline-none [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)] [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => (
          <div
            key={option}
            id={`${id}-${option}`}
            role="option"
            aria-selected={option === value}
            onClick={() => onChange(option)}
            className="flex h-9 cursor-pointer snap-center items-center justify-center text-base text-muted-foreground tabular-nums select-none aria-selected:font-semibold aria-selected:text-foreground"
          >
            {option}
            {unit}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 2. Year, month and day wheels, the way phones pick a date. */
export function WheelFormat() {
  const today = useToday()
  const [date, setDate] = useState({ y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() })
  const days = getDaysInMonth(new Date(date.y, date.m - 1))

  // a shorter month pulls the day in (31일 → 2월 28일)
  const set = (next: Partial<typeof date>) =>
    setDate((prev) => {
      const merged = { ...prev, ...next }
      return { ...merged, d: Math.min(merged.d, getDaysInMonth(new Date(merged.y, merged.m - 1))) }
    })

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1 rounded-xl border bg-background p-2">
        <Wheel label="연도" unit="년" options={range(1950, today.getFullYear() + 5)} value={date.y} onChange={(y) => set({ y })} />
        <Wheel label="월" unit="월" options={range(1, 12)} value={date.m} onChange={(m) => set({ m })} />
        <Wheel label="일" unit="일" options={range(1, days)} value={date.d} onChange={(d) => set({ d })} />
      </div>
      <p role="status" className="text-sm">
        {formatLong(new Date(date.y, date.m - 1, date.d))}
      </p>
    </div>
  )
}
