import type { ReactNode, Ref } from 'react'
import { cn } from '@/lib/utils'

/** Name a part for the anatomy drawing only. */
const slotProps = (on: boolean, name: string) => (on ? { 'data-slot': name } : {})

/**
 * The block every empty screen is built from: a drawing, a title that says what happened,
 * one sentence on why or what next, and the action that gets people moving again.
 */
export function EmptyState({
  art,
  title,
  description,
  children,
  footer,
  compact = false,
  slots = false,
  titleRef,
  className,
}: {
  art: ReactNode
  title: ReactNode
  description: ReactNode
  /** the buttons */
  children?: ReactNode
  /** anything under the buttons: a search field, an error code */
  footer?: ReactNode
  compact?: boolean
  /** name the parts for the anatomy drawing */
  slots?: boolean
  /** lets a demo move the focus to the title when this screen replaces what had the focus */
  titleRef?: Ref<HTMLHeadingElement>
  className?: string
}) {
  return (
    <div
      {...slotProps(slots, 'empty-state')}
      className={cn('flex flex-col items-center text-center', compact ? 'gap-2 p-4' : 'gap-3 px-6 py-6', className)}
    >
      <div {...slotProps(slots, 'empty-art')}>{art}</div>
      <div className="flex flex-col items-center gap-1">
        <h4
          {...slotProps(slots, 'empty-title')}
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className={cn('font-semibold outline-none', compact ? 'text-sm' : 'text-base')}
        >
          {title}
        </h4>
        <p
          {...slotProps(slots, 'empty-description')}
          className={cn('max-w-xs leading-relaxed text-muted-foreground', compact ? 'text-xs' : 'text-sm')}
        >
          {description}
        </p>
      </div>
      {children && <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>}
      {footer}
    </div>
  )
}
