import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import { WEEKDAY_NAMES } from './dates'
import {
  CalendarFormat,
  CheckInOutFormat,
  DateInputFormat,
  MonthFormat,
  QuickChipsFormat,
  RangeFormat,
  RecurrenceFormat,
  TimeSlotsFormat,
  WheelFormat,
} from './formats'

type DayLook = 'default' | 'today' | 'selected' | 'outside' | 'disabled' | 'range-start' | 'range-middle' | 'range-end'

/**
 * One drawn day of the calendar, styled like shadcn's CalendarDayButton. It is a drawing,
 * not a button; hover and focus are pinned with data-demo-state.
 */
function DayCell({
  day,
  look = 'default',
  slot,
  demoState,
  event = false,
}: {
  day: number
  look?: DayLook
  slot?: string
  demoState?: 'hover' | 'focus'
  event?: boolean
}) {
  const filled = look === 'selected' || look === 'range-start' || look === 'range-end'
  return (
    <span
      data-slot={slot}
      className={cn(
        'relative flex size-9 items-center justify-center',
        look === 'today' && 'rounded-md bg-muted',
        look === 'range-start' && 'rounded-l-md bg-muted',
        look === 'range-end' && 'rounded-r-md bg-muted',
        look === 'range-middle' && 'bg-muted',
      )}
    >
      <span
        data-demo-state={demoState}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 font-normal tabular-nums',
          look === 'today' && 'font-semibold',
          filled &&'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          look === 'range-middle' && 'rounded-none hover:bg-transparent',
          look === 'outside' && 'text-muted-foreground',
          look === 'disabled' && 'text-muted-foreground line-through opacity-50 hover:bg-transparent',
        )}
      >
        {day}
      </span>
      {event && <span aria-hidden className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />}
    </span>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <DayCell day={14} /> },
        { label: '호버', node: <DayCell day={14} demoState="hover" /> },
        { label: '포커스', node: <DayCell day={14} demoState="focus" /> },
        { label: '오늘', node: <DayCell day={12} look="today" /> },
        { label: '선택됨', node: <DayCell day={18} look="selected" /> },
        {
          label: '기간 (시작·안·끝)',
          node: (
            <span className="flex">
              <DayCell day={20} look="range-start" />
              <DayCell day={21} look="range-middle" />
              <DayCell day={22} look="range-end" />
            </span>
          ),
        },
        { label: '다른 달', node: <DayCell day={1} look="outside" /> },
        { label: '고를 수 없음', node: <DayCell day={9} look="disabled" /> },
        { label: '일정 있음', node: <DayCell day={25} event /> },
      ]}
    />
  )
}

// The drawings show one fixed month so the part numbers always land on the same days.
const SPECIMEN_MONTH = new Date(2026, 10, 1)
const SPECIMEN_TODAY = 12
const SPECIMEN_SELECTED = 18

function SpecimenCalendar() {
  const weeks: Date[][] = []
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(SPECIMEN_MONTH)),
    end: endOfWeek(endOfMonth(SPECIMEN_MONTH)),
  })
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  let outsideMarked = false

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-9 items-center justify-center">
        <span data-slot="calendar-caption" className="text-sm font-medium">
          {format(SPECIMEN_MONTH, 'yyyy년 M월')}
        </span>
        <div data-slot="calendar-nav" className="absolute inset-x-0 flex justify-between">
          <span className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-9')}>
            <ChevronLeftIcon />
          </span>
          <span className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-9')}>
            <ChevronRightIcon />
          </span>
        </div>
      </div>
      <div data-slot="calendar-weekdays" className="flex">
        {WEEKDAY_NAMES.map((name) => (
          <span key={name} className="w-9 text-center text-[0.8rem] text-muted-foreground">
            {name}
          </span>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].toISOString()} className="flex">
          {week.map((date) => {
            const inMonth = isSameMonth(date, SPECIMEN_MONTH)
            const day = date.getDate()
            const look: DayLook = !inMonth
              ? 'outside'
              : day === SPECIMEN_TODAY
                ? 'today'
                : day === SPECIMEN_SELECTED
                  ? 'selected'
                  : 'default'
            let slot: string | undefined
            if (look === 'today') slot = 'calendar-today'
            if (look === 'selected') slot = 'calendar-selected'
            if (look === 'outside' && !outsideMarked) {
              slot = 'calendar-outside'
              outsideMarked = true
            }
            return <DayCell key={date.toISOString()} day={day} look={look} slot={slot} />
          })}
        </div>
      ))}
    </div>
  )
}

function DatePickerSpecimen() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button variant="outline" data-slot="popover-trigger" tabIndex={-1} className="font-normal">
        <CalendarIcon data-icon="inline-start" />
        2026년 11월 18일
      </Button>
      <div data-slot="popover-content" className="rounded-lg bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-foreground/10">
        <SpecimenCalendar />
      </div>
    </div>
  )
}

function DatePickerPreview() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" size="sm" tabIndex={-1} className="font-normal">
        <CalendarIcon data-icon="inline-start" />
        11월 18일 (수)
      </Button>
      <div className="flex rounded-lg bg-popover p-1 shadow-sm ring-1 ring-foreground/10">
        {[15, 16, 17, 18, 19, 20, 21].map((day) => (
          <DayCell key={day} day={day} look={day === 18 ? 'selected' : day === 16 ? 'today' : 'default'} />
        ))}
      </div>
    </div>
  )
}

export const datePickerEntry: ShowcaseEntry = {
  id: 'date-picker',
  name: 'Date Picker',
  aliases: ['Calendar', 'Datepicker', 'Date input', '날짜 선택', '달력'],
  description: '달력, 바퀴, 칩 같은 방법으로 날짜·기간·시간을 고르는 입력 요소.',
  category: 'input',
  Preview: DatePickerPreview,
  anatomy: {
    Specimen: DatePickerSpecimen,
    parts: [
      { slot: 'popover-trigger', name: 'PopoverTrigger', description: '고른 날짜를 보여주고, 누르면 달력을 여는 버튼' },
      { slot: 'popover-content', name: 'PopoverContent', description: '달력이 떠 있는 상자' },
      { slot: 'calendar-caption', name: 'MonthCaption', description: '지금 보고 있는 연도와 달' },
      { slot: 'calendar-nav', name: 'Nav', description: '이전 달·다음 달로 넘기는 버튼' },
      { slot: 'calendar-weekdays', name: 'Weekdays', description: '요일 머리글. 한국 달력은 일요일부터 시작' },
      { slot: 'calendar-today', name: 'Day (today)', description: '오늘. 고르지 않아도 옅게 칠해 둠' },
      { slot: 'calendar-selected', name: 'Day (selected)', description: '고른 날. 가장 진하게 칠함' },
      { slot: 'calendar-outside', name: 'Day (outside)', description: '앞뒤 달의 날짜. 흐리게 보임' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '달력의 날짜 한 칸이 가질 수 있는 상태입니다. 아래 형식들은 모두 이 상태들을 조합해 그립니다.',
      Demo: States,
    },
    {
      title: '캘린더',
      description: '달력을 화면에 펼쳐 두고 하루를 누릅니다. 점이 찍힌 날은 일정이 있는 날입니다. 일정 앱이나 예약 화면에서 씁니다.',
      Demo: CalendarFormat,
    },
    {
      title: '휠 피커',
      description: '연·월·일 바퀴를 굴려 가운데 줄에 맞춥니다. 휴대폰의 생년월일 입력에서 흔합니다. 2월을 고르면 일 수가 줄어들고, 키보드 ↑↓로도 움직입니다.',
      Demo: WheelFormat,
    },
    {
      title: '기간 선택',
      description: '두 달을 나란히 놓고 첫 클릭은 시작, 두 번째 클릭은 끝입니다. 통계나 검색 기간을 정할 때 씁니다.',
      Demo: RangeFormat,
    },
    {
      title: '빠른 선택 칩',
      description: '자주 쓰는 기간을 칩 한 번으로 고릅니다. 맞는 칩이 없을 때만 "직접 선택"으로 달력을 엽니다.',
      Demo: QuickChipsFormat,
    },
    {
      title: '시간 슬롯',
      description: '날짜 띠에서 하루를 고른 뒤 비어 있는 30분 칸을 고릅니다. 줄 그어진 칸은 이미 찬 시간이고 일요일은 쉽니다. 병원·미용실 예약에서 씁니다.',
      Demo: TimeSlotsFormat,
    },
    {
      title: '월 선택',
      description: '날짜까지는 필요 없고 달만 고를 때 씁니다. 카드 명세서처럼 아직 오지 않은 달은 고를 수 없습니다.',
      Demo: MonthFormat,
    },
    {
      title: '날짜 입력',
      description: '키보드로 직접 칩니다. 숫자만 쳐도 하이픈이 들어가고, 없는 날짜면 바로 알려 줍니다. 아이콘을 누르면 달력도 열립니다. 아래는 브라우저가 그리는 기본 입력입니다.',
      Demo: DateInputFormat,
    },
    {
      title: '체크인·체크아웃',
      description: '숙소 예약처럼 두 칸이 한 쌍입니다. 체크인을 고르면 바로 체크아웃을 묻고 몇 박인지 셉니다. 지난 날짜는 고를 수 없습니다.',
      Demo: CheckInOutFormat,
    },
    {
      title: '반복 설정',
      description: '일정이 얼마나 자주 반복되고 언제 끝나는지 정합니다. 설정을 바꾸면 요약 문장과 다음 일정이 바로 바뀝니다.',
      Demo: RecurrenceFormat,
    },
  ],
}
