import { useState, type ComponentProps } from 'react'
import { format, startOfDay } from 'date-fns'
import { ko } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'

/**
 * shadcn Calendar in Korean: "2026년 11월" captions, Korean weekdays and day labels.
 * Today is also set in bold, so it does not read like a hovered day (both are grey).
 */
export function KoCalendar(props: ComponentProps<typeof Calendar>) {
  return (
    <Calendar
      locale={ko}
      formatters={{ formatCaption: (month) => format(month, 'yyyy년 M월') }}
      {...props}
      modifiersClassNames={{ today: '[&>button]:font-semibold', ...props.modifiersClassNames }}
    />
  )
}

/** Today at midnight, fixed for the life of the component. */
export function useToday() {
  const [today] = useState(() => startOfDay(new Date()))
  return today
}

/** For controlled range calendars whose clicks are handled by onDayClick. */
export const ignoreSelect = () => {}
