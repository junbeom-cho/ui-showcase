import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TONES, type Tone } from './tones'

// the notification-timer keyframes live in src/index.css

/** Name a part for the anatomy drawing only; elsewhere keep the component's own data-slot. */
const slotProps = (on: boolean, name: string) => (on ? { 'data-slot': name } : {})

/**
 * The bar along the bottom of a toast that shrinks until it closes. A live bar runs for
 * `duration` and stops with `paused`; a drawn one stays at `fraction`.
 */
export function TimerBar({
  tone,
  duration,
  paused = false,
  fraction,
  slots = false,
}: {
  tone: Tone
  duration?: number
  paused?: boolean
  fraction?: number
  slots?: boolean
}) {
  return (
    <span
      aria-hidden
      {...slotProps(slots, 'toast-timer')}
      className={cn('absolute inset-x-0 bottom-0 h-1 origin-left', TONES[tone].accent)}
      style={
        duration !== undefined
          ? {
              // longhands only: React warns when a shorthand and its longhand change together
              animationName: 'notification-timer',
              animationDuration: `${duration}ms`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
              animationPlayState: paused ? 'paused' : 'running',
            }
          : { transform: `scaleX(${fraction ?? 1})` }
      }
    />
  )
}

/** One toast: tone icon, title, optional description and action, close button and time bar. */
export function ToastCard({
  tone,
  title,
  description,
  action,
  onAction,
  closable = false,
  onClose,
  timer,
  drawing = false,
  slots = false,
  className,
}: {
  tone: Tone
  title: string
  description?: string
  action?: string
  onAction?: () => void
  closable?: boolean
  onClose?: () => void
  timer?: ReactNode
  /** a picture of a toast: its buttons stay out of the tab order */
  drawing?: boolean
  /** name the parts for the anatomy drawing */
  slots?: boolean
  className?: string
}) {
  const { icon: Icon, chip } = TONES[tone]
  const showClose = closable || onClose !== undefined
  return (
    <div
      {...slotProps(slots, 'toast')}
      className={cn(
        'relative flex w-full max-w-80 items-start gap-3 overflow-hidden rounded-xl border bg-popover p-3 text-left text-sm text-popover-foreground shadow-lg',
        showClose && 'pr-9',
        className,
      )}
    >
      <span {...slotProps(slots, 'toast-icon')} className={cn('grid size-8 shrink-0 place-items-center rounded-full', chip)}>
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p {...slotProps(slots, 'toast-title')} className="leading-snug font-medium">
          {title}
        </p>
        {description && (
          <p {...slotProps(slots, 'toast-description')} className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {action && (
          <Button
            {...slotProps(slots, 'toast-action')}
            size="xs"
            variant="outline"
            className="mt-1.5 self-start"
            tabIndex={drawing ? -1 : undefined}
            onClick={onAction}
          >
            {action}
          </Button>
        )}
      </div>
      {showClose && (
        <Button
          {...slotProps(slots, 'toast-close')}
          variant="ghost"
          size="icon-xs"
          aria-label="알림 닫기"
          className="absolute top-2 right-2 text-muted-foreground"
          tabIndex={drawing ? -1 : undefined}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      )}
      {timer}
    </div>
  )
}

/** Red count on an icon corner, shortened to 99+; no number means a plain dot. */
export function CountBadge({ count, className }: { count?: number; className?: string }) {
  if (count === undefined) {
    return <span aria-hidden className={cn('size-2.5 rounded-full bg-red-500 ring-2 ring-background', className)} />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-background',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Faint stand-in content for a page, so messages have something to sit on. */
export function PageSketch({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex flex-col gap-2.5 p-4', className)}>
      <div className="h-3 w-28 rounded bg-muted" />
      <div className="h-2 w-full rounded bg-muted" />
      <div className="h-2 w-5/6 rounded bg-muted" />
      <div className="h-2 w-2/3 rounded bg-muted" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="h-14 rounded bg-muted" />
        <div className="h-14 rounded bg-muted" />
        <div className="h-14 rounded bg-muted" />
      </div>
    </div>
  )
}
