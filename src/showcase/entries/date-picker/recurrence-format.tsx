import { useId, useState } from 'react'
import { addMonths } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { chosenItem } from './calendar-formats'
import {
  describeRecurrence,
  formatShort,
  nextOccurrences,
  WEEKDAY_NAMES,
  type Frequency,
  type Recurrence,
} from './dates'
import { KoCalendar, useToday } from './ko-calendar'

const FREQUENCIES: { value: Frequency | 'none'; label: string; unit: string }[] = [
  { value: 'none', label: '반복 안 함', unit: '' },
  { value: 'daily', label: '매일', unit: '일' },
  { value: 'weekly', label: '매주', unit: '주' },
  { value: 'monthly', label: '매월', unit: '개월' },
  { value: 'yearly', label: '매년', unit: '년' },
]

/** A number field kept as text so it can be cleared while typing; reads as at least 1. */
const atLeastOne = (text: string) => Math.max(1, Math.min(99, Math.floor(Number(text)) || 1))

/** 9. How often an event repeats and when it stops, summed up in one sentence. */
export function RecurrenceFormat() {
  const today = useToday()
  const id = useId()
  const [frequency, setFrequency] = useState<Frequency | 'none'>('weekly')
  const [interval, setInterval] = useState('1')
  const [weekdays, setWeekdays] = useState([String(today.getDay())])
  const [endType, setEndType] = useState<Recurrence['end']['type']>('never')
  const [until, setUntil] = useState(() => addMonths(today, 1))
  const [untilOpen, setUntilOpen] = useState(false)
  const [count, setCount] = useState('5')

  const repeats = frequency !== 'none'
  const rule: Recurrence = {
    frequency: repeats ? frequency : 'daily',
    interval: atLeastOne(interval),
    weekdays: weekdays.map(Number),
    end:
      endType === 'until'
        ? { type: 'until', date: until }
        : endType === 'count'
          ? { type: 'count', count: atLeastOne(count) }
          : { type: 'never' },
  }
  const upcoming = repeats ? nextOccurrences(rule, today, 5) : [today]
  const unit = FREQUENCIES.find((f) => f.value === frequency)!.unit

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="grid grid-cols-[2.5rem_1fr] items-center gap-x-3 gap-y-3 text-sm">
        <span className="text-muted-foreground">시작</span>
        <span>{formatShort(today)}</span>

        <Label htmlFor={`${id}-freq`} className="font-normal text-muted-foreground">
          반복
        </Label>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency | 'none')}>
          <SelectTrigger id={`${id}-freq`} className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {repeats && (
          <>
            <Label htmlFor={`${id}-interval`} className="font-normal text-muted-foreground">
              간격
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`${id}-interval`}
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-16 tabular-nums"
              />
              <span>{unit}마다</span>
            </div>
          </>
        )}

        {frequency === 'weekly' && (
          <>
            <span className="text-muted-foreground">요일</span>
            <ToggleGroup
              type="multiple"
              aria-label="요일"
              variant="outline"
              size="sm"
              spacing={1}
              value={weekdays}
              onValueChange={(next) => next.length > 0 && setWeekdays(next)} // at least one day
            >
              {WEEKDAY_NAMES.map((name, day) => (
                <ToggleGroupItem
                  key={name}
                  value={String(day)}
                  className={cn('size-8 rounded-full p-0', chosenItem, day === 0 && 'text-destructive')}
                >
                  {name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}

        {repeats && (
          <>
            <span className="self-start pt-1 text-muted-foreground">끝</span>
            <RadioGroup value={endType} onValueChange={(v) => setEndType(v as typeof endType)} className="gap-2.5">
              <div className="flex h-8 items-center gap-2">
                <RadioGroupItem value="never" id={`${id}-never`} />
                <Label htmlFor={`${id}-never`} className="font-normal">
                  계속
                </Label>
              </div>
              <div className="flex h-8 items-center gap-2">
                <RadioGroupItem value="until" id={`${id}-until`} />
                <Label htmlFor={`${id}-until`} className="font-normal">
                  날짜까지
                </Label>
                <Popover open={untilOpen} onOpenChange={setUntilOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={endType !== 'until'} aria-label={`끝나는 날 ${formatShort(until)}`}>
                      <CalendarIcon data-icon="inline-start" />
                      {formatShort(until)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <KoCalendar
                      mode="single"
                      required
                      defaultMonth={until}
                      selected={until}
                      disabled={{ before: today }}
                      onSelect={(date) => {
                        setUntil(date)
                        setUntilOpen(false)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex h-8 items-center gap-2">
                <RadioGroupItem value="count" id={`${id}-count`} />
                <Label htmlFor={`${id}-count`} className="font-normal">
                  횟수
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  aria-label="반복 횟수"
                  disabled={endType !== 'count'}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="h-8 w-16 tabular-nums"
                />
                <span>회</span>
              </div>
            </RadioGroup>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
        <p role="status" className="text-sm font-medium">
          {repeats ? describeRecurrence(rule, today) : '반복하지 않음'}
        </p>
        <p className="text-xs text-muted-foreground">다음 일정</p>
        <ul aria-label="다음 일정" className="flex flex-wrap gap-1.5">
          {upcoming.map((date) => (
            <li key={date.toISOString()} className="rounded-md bg-background px-2 py-1 text-xs tabular-nums">
              {formatShort(date)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
