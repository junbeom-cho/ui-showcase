import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Thursday, 9 in the morning
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 12, 9, 0))
})
afterEach(() => vi.useRealTimers())

const user = () => userEvent.setup()
const day = (label: RegExp) => screen.getByRole('button', { name: label })
// the calendar keeps its own hidden live region for month changes; ours is the other one
const status = () => {
  const [ours] = screen.getAllByRole('status').filter((el) => !el.closest('[data-slot="calendar"]'))
  return ours
}

it('calendar: picks one day and jumps back to today', async () => {
  const u = user()
  render(<CalendarFormat />)
  expect(status()).toHaveTextContent('2026년 11월 12일 목요일')
  await u.click(day(/11월 20일/))
  expect(status()).toHaveTextContent('2026년 11월 20일 금요일')
  await u.click(screen.getByRole('button', { name: '오늘' }))
  expect(status()).toHaveTextContent('2026년 11월 12일 목요일')
})

it('wheel: three wheels, and the day follows the month length', async () => {
  const u = user()
  render(<WheelFormat />)
  const days = screen.getByRole('listbox', { name: '일' })
  await u.click(within(days).getByRole('option', { name: '30일' }))
  await u.click(within(screen.getByRole('listbox', { name: '월' })).getByRole('option', { name: '2월' }))
  expect(within(days).getAllByRole('option')).toHaveLength(28)
  expect(within(days).getByRole('option', { selected: true })).toHaveTextContent('28일')
  expect(status()).toHaveTextContent('2026년 2월 28일 토요일')
  days.focus()
  await u.keyboard('{ArrowUp}')
  expect(status()).toHaveTextContent('2026년 2월 27일 금요일')
})

it('range: the first click starts a range and the second ends it', async () => {
  const u = user()
  render(<RangeFormat />)
  await u.click(day(/11월 20일/))
  expect(status()).toHaveTextContent('11월 20일 (금) – 끝 날짜를 고르세요')
  await u.click(day(/11월 24일/))
  expect(status()).toHaveTextContent('11월 20일 (금) – 11월 24일 (화) · 5일')
  await u.click(screen.getByRole('button', { name: '지우기' }))
  expect(status()).toHaveTextContent('시작 날짜를 고르세요')
})

it('quick chips: one tap fills a common range', async () => {
  const u = user()
  render(<QuickChipsFormat />)
  expect(screen.getByRole('radio', { name: '최근 7일' })).toBeChecked()
  expect(status()).toHaveTextContent('11월 6일 (금) – 11월 12일 (목) · 7일')
  await u.click(screen.getByRole('radio', { name: '지난 달' }))
  expect(status()).toHaveTextContent('10월 1일 (목) – 10월 31일 (토) · 31일')
  expect(screen.queryByRole('grid')).toBeNull()
  await u.click(screen.getByRole('radio', { name: '직접 선택' }))
  expect(screen.getByRole('grid')).toBeInTheDocument()
})

it('time slots: taken and closed slots cannot be booked', async () => {
  const u = user()
  render(<TimeSlotsFormat />)
  const dates = screen.getByRole('radiogroup', { name: '날짜' })
  const times = screen.getByRole('radiogroup', { name: '시간' })
  expect(within(times).getAllByRole('radio').some((slot) => (slot as HTMLButtonElement).disabled)).toBe(true)

  await u.click(within(dates).getByRole('radio', { name: /11월 15일 \(일\)/ }))
  expect(screen.getByText('일요일은 쉽니다')).toBeInTheDocument()
  expect(within(times).getAllByRole('radio').every((slot) => (slot as HTMLButtonElement).disabled)).toBe(true)

  await u.click(within(dates).getByRole('radio', { name: /11월 13일 \(금\)/ }))
  const free = within(times).getAllByRole('radio').find((slot) => !(slot as HTMLButtonElement).disabled)!
  await u.click(free)
  expect(status()).toHaveTextContent(`11월 13일 (금) ${free.textContent}`)
})

it('time slots: late in the evening it starts on tomorrow', () => {
  vi.setSystemTime(new Date(2026, 10, 12, 20, 0))
  render(<TimeSlotsFormat />)
  expect(within(screen.getByRole('radiogroup', { name: '날짜' })).getByRole('radio', { checked: true })).toHaveAccessibleName(
    '11월 13일 (금)',
  )
})

it('month: picks a month of this or an earlier year, never a future one', async () => {
  const u = user()
  render(<MonthFormat />)
  expect(status()).toHaveTextContent('2026년 11월')
  expect(screen.getByRole('button', { name: '12월' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '다음 해' })).toBeDisabled()
  await u.click(screen.getByRole('button', { name: '이전 해' }))
  await u.click(screen.getByRole('button', { name: '3월' }))
  expect(screen.getByRole('button', { name: '3월' })).toHaveAttribute('aria-pressed', 'true')
  expect(status()).toHaveTextContent('2025년 3월')
})

it('date input: formats while typing, explains mistakes, and has a calendar', async () => {
  const u = user()
  render(<DateInputFormat />)
  const input = screen.getByRole('textbox', { name: '시작일' })
  await u.clear(input)
  await u.type(input, '20261120')
  expect(input).toHaveValue('2026-11-20')
  expect(screen.getByText('2026년 11월 20일 금요일')).toBeInTheDocument()

  await u.clear(input)
  await u.type(input, '20260230')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('없는 날짜입니다')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '달력 열기' }))
  await u.click(day(/11월 25일/))
  expect(input).toHaveValue('2026-11-25')
  expect(input).not.toHaveAttribute('aria-invalid')
})

it('check-in/out: picking check-in asks for check-out and counts nights', async () => {
  const u = user()
  render(<CheckInOutFormat />)
  expect(status()).toHaveTextContent('3박')
  await u.click(screen.getByRole('button', { name: /체크인/ }))
  expect(day(/11월 11일/)).toBeDisabled()
  await u.click(day(/12월 1일 /))
  expect(screen.getByRole('button', { name: /체크아웃/ })).toHaveTextContent('날짜 선택')
  expect(status()).toHaveTextContent('체크아웃 날짜를 고르세요')
  await u.click(day(/12월 4일 /))
  expect(status()).toHaveTextContent('3박 · 12월 1일 (화) – 12월 4일 (금)')
})

it('recurrence: the summary and next dates follow the settings', async () => {
  const u = user()
  render(<RecurrenceFormat />)
  expect(status()).toHaveTextContent('매주 목요일')
  const weekdays = screen.getByRole('toolbar', { name: '요일' })
  await u.click(within(weekdays).getByRole('button', { name: '월' }))
  await u.click(within(weekdays).getByRole('button', { name: '금' }))
  expect(status()).toHaveTextContent('매주 월·목·금요일')
  expect(within(screen.getByRole('list', { name: '다음 일정' })).getAllByRole('listitem')[1]).toHaveTextContent(
    '11월 13일 (금)',
  )

  await u.click(screen.getByRole('radio', { name: '횟수' }))
  const count = screen.getByRole('spinbutton', { name: '반복 횟수' })
  await u.clear(count)
  await u.type(count, '2')
  expect(status()).toHaveTextContent('매주 월·목·금요일, 2회')
  expect(within(screen.getByRole('list', { name: '다음 일정' })).getAllByRole('listitem')).toHaveLength(2)
})
