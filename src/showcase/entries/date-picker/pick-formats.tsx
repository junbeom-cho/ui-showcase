import { useState } from 'react'
import { addDays, format, isSameDay, setHours, setMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { chosenItem } from './calendar-formats'
import { formatShort, formatSlot, slotTaken, TIME_SLOTS } from './dates'
import { useToday } from './ko-calendar'

const key = (date: Date) => format(date, 'yyyy-MM-dd')

/** 5. A strip of days, then the free half-hour slots of the chosen day. */
export function TimeSlotsFormat() {
  const today = useToday()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const [now] = useState(() => new Date())

  const unavailableOn = (day: Date, s: string) => {
    const [h, m] = s.split(':').map(Number)
    const past = isSameDay(day, now) && setMinutes(setHours(day, h), m) <= now
    return day.getDay() === 0 || slotTaken(day, s) || past
  }
  // late in the day today may be full; start on the first day that still has a free slot
  const [date, setDate] = useState(() => days.find((d) => TIME_SLOTS.some((s) => !unavailableOn(d, s))) ?? today)
  const [slot, setSlot] = useState<string>('')
  const closed = date.getDay() === 0
  const unavailable = (s: string) => unavailableOn(date, s)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ToggleGroup
        type="single"
        aria-label="날짜"
        variant="outline"
        spacing={1}
        value={key(date)}
        onValueChange={(value) => {
          const next = days.find((d) => key(d) === value)
          if (!next) return
          setDate(next)
          setSlot('')
        }}
        className="grid w-full grid-cols-7"
      >
        {days.map((day, i) => (
          <ToggleGroupItem
            key={key(day)}
            value={key(day)}
            aria-label={formatShort(day)}
            className={cn('h-auto flex-col gap-0 px-0 py-1.5', chosenItem, day.getDay() === 0 && 'text-destructive')}
          >
            <span className="text-[11px]">{i === 0 ? '오늘' : format(day, 'EEE', { locale: ko })}</span>
            <span className="text-base font-semibold tabular-nums">{day.getDate()}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {closed && <p className="text-center text-sm text-muted-foreground">일요일은 쉽니다</p>}

      <ToggleGroup
        type="single"
        aria-label="시간"
        variant="outline"
        size="sm"
        spacing={1}
        value={slot}
        onValueChange={setSlot}
        className="grid w-full grid-cols-3 sm:grid-cols-4"
      >
        {TIME_SLOTS.map((s) => {
          const taken = !closed && slotTaken(date, s)
          return (
            <ToggleGroupItem
              key={s}
              value={s}
              disabled={unavailable(s)}
              aria-label={taken ? `${formatSlot(s)} 마감` : undefined}
              className={cn('tabular-nums', chosenItem, taken && 'line-through')}
            >
              {formatSlot(s)}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <p role="status" className="text-center text-sm">
        {slot ? `선택: ${formatShort(date)} ${formatSlot(slot)}` : closed ? '다른 날을 고르세요' : '시간을 고르세요'}
      </p>
    </div>
  )
}

/** 6. A year with twelve month buttons, for things that happen once a month. */
export function MonthFormat() {
  const today = useToday()
  const thisYear = today.getFullYear()
  const thisMonth = today.getMonth()
  const [year, setYear] = useState(thisYear)
  const [picked, setPicked] = useState({ year: thisYear, month: thisMonth })
  const firstYear = thisYear - 3

  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" aria-label="이전 해" disabled={year <= firstYear} onClick={() => setYear(year - 1)}>
          <ChevronLeftIcon />
        </Button>
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {year}년
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="다음 해" disabled={year >= thisYear} onClick={() => setYear(year + 1)}>
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 12 }, (_, month) => {
          const selected = picked.year === year && picked.month === month
          const current = year === thisYear && month === thisMonth
          return (
            <Button
              key={month}
              variant={selected ? 'default' : 'ghost'}
              aria-pressed={selected}
              aria-current={current ? 'date' : undefined}
              disabled={year === thisYear && month > thisMonth}
              onClick={() => setPicked({ year, month })}
              className={cn('tabular-nums', current && !selected && 'ring-1 ring-foreground/30')}
            >
              {month + 1}월
            </Button>
          )
        })}
      </div>
      <p role="status" className="text-center text-sm">
        {picked.year}년 {picked.month + 1}월 명세서
      </p>
    </div>
  )
}
