import { useId, useState } from 'react'
import { addDays, format, isBefore } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  formatLong,
  formatRange,
  formatShort,
  maskDateInput,
  nextRange,
  nights,
  parseDateInput,
  quickRange,
  type PartialRange,
  type QuickRangeId,
} from './dates'
import { ignoreSelect, KoCalendar, useToday } from './ko-calendar'

/** Chips and slots fill in when chosen, so the pick reads at a glance. */
export const chosenItem =
  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'

const eventDot =
  'after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:z-20 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary'

/** 1. A month grid shown on the page; one click picks a day. */
export function CalendarFormat() {
  const today = useToday()
  const [date, setDate] = useState<Date | undefined>(today)
  const [month, setMonth] = useState(today)
  const events = [addDays(today, 2), addDays(today, 5), addDays(today, 9)]

  return (
    <div className="flex flex-col items-center gap-3">
      <KoCalendar
        mode="single"
        selected={date}
        onSelect={setDate}
        month={month}
        onMonthChange={setMonth}
        modifiers={{ event: events }}
        modifiersClassNames={{ event: eventDot }}
        className="rounded-lg border [--cell-size:--spacing(9)]"
      />
      <div className="flex items-center gap-3">
        <p role="status" className="text-sm">
          {date ? `선택: ${formatLong(date)}` : '날짜를 고르세요'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDate(today)
            setMonth(today)
          }}
        >
          오늘
        </Button>
      </div>
    </div>
  )
}

/** 3. Two months side by side; the first click is the start, the second the end. */
export function RangeFormat() {
  const today = useToday()
  const [range, setRange] = useState<PartialRange>({ from: today, to: addDays(today, 4) })

  return (
    <div className="flex flex-col items-center gap-3">
      <KoCalendar
        mode="range"
        numberOfMonths={2}
        showOutsideDays={false}
        defaultMonth={today}
        selected={range}
        onSelect={ignoreSelect}
        onDayClick={(day) => setRange(nextRange(range, day))}
        className="rounded-lg border [--cell-size:--spacing(8)]"
      />
      <div className="flex items-center gap-3">
        <p role="status" className="text-sm">
          {formatRange(range)}
        </p>
        <Button variant="outline" size="sm" onClick={() => setRange(undefined)} disabled={!range}>
          지우기
        </Button>
      </div>
    </div>
  )
}

const QUICK: { id: QuickRangeId | 'custom'; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'yesterday', label: '어제' },
  { id: 'last7', label: '최근 7일' },
  { id: 'last30', label: '최근 30일' },
  { id: 'thisMonth', label: '이번 달' },
  { id: 'lastMonth', label: '지난 달' },
  { id: 'custom', label: '직접 선택' },
]

/** 4. Common ranges as one-tap chips; a calendar appears only for "직접 선택". */
export function QuickChipsFormat() {
  const today = useToday()
  const [choice, setChoice] = useState<QuickRangeId | 'custom'>('last7')
  const [custom, setCustom] = useState<PartialRange>(undefined)
  const range = choice === 'custom' ? custom : quickRange(choice, today)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <ToggleGroup
        type="single"
        aria-label="빠른 선택"
        variant="outline"
        size="sm"
        value={choice}
        onValueChange={(value) => {
          if (!value) return // a chip stays chosen until another one is
          if (value === 'custom') setCustom(range) // start from what was showing
          setChoice(value as QuickRangeId | 'custom')
        }}
        className="flex-wrap justify-center"
      >
        {QUICK.map(({ id, label }) => (
          <ToggleGroupItem key={id} value={id} className={cn('rounded-full px-3', chosenItem)}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p role="status" className="text-sm">
        {formatRange(range)}
      </p>
      {choice === 'custom' && (
        <KoCalendar
          mode="range"
          defaultMonth={custom?.from ?? today}
          selected={custom}
          onSelect={ignoreSelect}
          onDayClick={(day) => setCustom(nextRange(custom, day))}
          disabled={{ after: today }}
          className="rounded-lg border"
        />
      )}
    </div>
  )
}

/** 7. Type the date, or open a calendar from the icon. */
export function DateInputFormat() {
  const today = useToday()
  const id = useId()
  const [text, setText] = useState(format(today, 'yyyy-MM-dd'))
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)
  const parsed = parseDateInput(text)
  // a half-typed date is only wrong once the user leaves the field
  const error = parsed.error && (touched || text.length === 10) ? parsed.error : undefined

  return (
    <div className="grid w-full max-w-xs gap-5">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-text`}>시작일</Label>
        <div className="relative">
          <Input
            id={`${id}-text`}
            value={text}
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            onChange={(e) => {
              setText(maskDateInput(e.target.value))
              setTouched(false)
            }}
            onBlur={() => setTouched(true)}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-hint`}
            className="pr-10 tabular-nums"
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="달력 열기"
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <CalendarIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <KoCalendar
                mode="single"
                captionLayout="dropdown"
                startMonth={new Date(1950, 0)}
                endMonth={new Date(today.getFullYear() + 5, 11)}
                defaultMonth={parsed.date ?? today}
                selected={parsed.date}
                onSelect={(date) => {
                  if (!date) return
                  setText(format(date, 'yyyy-MM-dd'))
                  setTouched(false)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <p id={`${id}-hint`} className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? (parsed.date ? formatLong(parsed.date) : '예: 2026-11-12, 숫자만 쳐도 됩니다')}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-native`}>브라우저 기본 입력 (type=&quot;date&quot;)</Label>
        <Input id={`${id}-native`} type="date" defaultValue={format(today, 'yyyy-MM-dd')} />
        <p className="text-xs text-muted-foreground">모양과 달력은 브라우저와 운영체제가 정합니다.</p>
      </div>
    </div>
  )
}

type Field = 'in' | 'out'

/** 8. Two linked fields: pick check-in, then check-out, and see the nights. */
export function CheckInOutFormat() {
  const today = useToday()
  const [stay, setStay] = useState<PartialRange>({ from: addDays(today, 7), to: addDays(today, 10) })
  const [active, setActive] = useState<Field | null>(null)

  const pick = (day: Date) => {
    if (active === 'in' || !stay?.from) {
      const keepOut = stay?.to && isBefore(day, stay.to)
      setStay({ from: day, to: keepOut ? stay.to : undefined })
      setActive(keepOut ? null : 'out')
    } else if (!isBefore(stay.from, day)) {
      setStay({ from: day, to: undefined }) // at least one night: an earlier day becomes the new check-in
    } else {
      setStay({ from: stay.from, to: day })
      setActive(null)
    }
  }

  const field = (which: Field, label: string, date: Date | undefined) => (
    <button
      type="button"
      onClick={() => setActive(which)}
      aria-expanded={active === which}
      className={cn(
        'flex flex-1 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        active === which && 'bg-muted ring-2 ring-foreground',
      )}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span className={cn('text-sm', !date && 'text-muted-foreground')}>{date ? formatShort(date) : '날짜 선택'}</span>
    </button>
  )

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Popover open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <PopoverAnchor asChild>
          <div className="flex rounded-xl border bg-background p-1">
            {field('in', '체크인', stay?.from)}
            <div className="my-2 w-px bg-border" />
            {field('out', '체크아웃', stay?.to)}
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-auto p-0">
          <p className="px-4 pt-3 text-sm font-medium">
            {active === 'in' ? '체크인 날짜를 고르세요' : '체크아웃 날짜를 고르세요'}
          </p>
          <KoCalendar
            mode="range"
            numberOfMonths={2}
            showOutsideDays={false}
            defaultMonth={stay?.from ?? today}
            disabled={{ before: today }}
            selected={stay}
            onSelect={ignoreSelect}
            onDayClick={pick}
          />
        </PopoverContent>
      </Popover>
      <p role="status" className="text-center text-sm">
        {stay?.from && stay.to
          ? `${nights(stay.from, stay.to)}박 · ${formatShort(stay.from)} – ${formatShort(stay.to)}`
          : '체크아웃 날짜를 고르세요'}
      </p>
    </div>
  )
}
