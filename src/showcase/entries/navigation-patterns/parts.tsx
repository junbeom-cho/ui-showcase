import { useRef, useState, type MouseEvent, type ReactNode, type UIEvent } from 'react'
import { cn } from '@/lib/utils'

/** Name a part for the anatomy drawing only. */
export const slotProps = (on: boolean, name: string) => (on ? { 'data-slot': name } : {})

/** Demo links point at "#"; keep the showcase's own hash route where it is. */
export const stay = (event: MouseEvent) => event.preventDefault()

/**
 * Follows a scrolling box: how far down it is and whether the last real move went down.
 * Pass the returned handler to the box's onScroll.
 */
export function useScrollDirection() {
  const last = useRef(0)
  const [scroll, setScroll] = useState({ top: 0, down: false })
  const onScroll = (event: UIEvent<HTMLElement>) => {
    const top = event.currentTarget.scrollTop
    // ignore a few pixels of jitter, but always notice reaching the very top
    if (Math.abs(top - last.current) < 6 && top > 0) return
    setScroll({ top, down: top > last.current })
    last.current = top
  }
  return [scroll, onScroll] as const
}

/** The made-up product every navigation demo belongs to. */
export function Logo({
  slots = false,
  className,
  wordClassName,
}: {
  slots?: boolean
  className?: string
  /** e.g. hide the word on narrow stages and keep only the mark */
  wordClassName?: string
}) {
  return (
    <span {...slotProps(slots, 'nav-logo')} className={cn('flex shrink-0 items-center gap-1.5 text-sm font-semibold', className)}>
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-foreground text-[11px] font-bold text-background">
        M
      </span>
      <span className={wordClassName}>모아</span>
    </span>
  )
}

/** Red count or dot on a menu item; the count is spoken through the item's own name. */
export function NavBadge({ count, slots = false, className }: { count?: number; slots?: boolean; className?: string }) {
  if (count === undefined) {
    return <span aria-hidden {...slotProps(slots, 'nav-badge')} className={cn('size-2 rounded-full bg-red-500', className)} />
  }
  return (
    <span
      aria-hidden
      {...slotProps(slots, 'nav-badge')}
      className={cn(
        'grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-semibold text-white tabular-nums',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export const navItemClass =
  'relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:font-medium aria-[current=page]:text-foreground'

/**
 * One link in a horizontal bar that is 48px tall (h-12); the current page gets a bar
 * under it that sits on the bar's bottom edge.
 */
export function NavItem({
  children,
  current = false,
  state,
  dot = false,
  disabled = false,
  drawing = false,
  slots = false,
  onSelect,
  className,
}: {
  children: ReactNode
  current?: boolean
  /** pin the pointer or keyboard look (state gallery) */
  state?: 'hover' | 'focus'
  dot?: boolean
  disabled?: boolean
  /** a picture of a link: kept out of the tab order */
  drawing?: boolean
  slots?: boolean
  onSelect?: () => void
  className?: string
}) {
  return (
    <a
      href={disabled ? undefined : '#'}
      role={disabled ? 'link' : undefined}
      aria-disabled={disabled || undefined}
      aria-current={current ? 'page' : undefined}
      data-demo-state={state}
      tabIndex={drawing && !disabled ? -1 : undefined}
      onClick={(event) => {
        stay(event)
        if (!disabled) onSelect?.()
      }}
      className={cn(navItemClass, disabled && 'pointer-events-none opacity-45', className)}
    >
      {children}
      {dot && (
        <>
          <NavBadge className="absolute top-1.5 right-1.5" />
          <span className="sr-only">, 새 소식 있음</span>
        </>
      )}
      {current && (
        <span
          aria-hidden
          {...slotProps(slots, 'nav-current')}
          className="absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-foreground"
        />
      )}
    </a>
  )
}
