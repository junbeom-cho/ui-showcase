import type { ReactNode } from 'react'
import { ArrowLeftIcon, LockIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A small browser window drawn inside the example box. Everything a demo opens
 * (menus, panels, backdrops) is positioned against the page area, never the viewport.
 */
export function BrowserFrame({
  url,
  children,
  onBack,
  canGoBack = false,
  className,
  bodyClassName,
}: {
  url: string
  children: ReactNode
  /** shows a working back button in the toolbar */
  onBack?: () => void
  canGoBack?: boolean
  className?: string
  bodyClassName?: string
}) {
  return (
    <div className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm', className)}>
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
        <span aria-hidden className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </span>
        {onBack && (
          <button
            type="button"
            aria-label="뒤로"
            disabled={!canGoBack}
            onClick={onBack}
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
          >
            <ArrowLeftIcon aria-hidden className="size-3.5" />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground">
          <LockIcon aria-hidden className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className={cn('relative flex min-h-0 flex-1 flex-col', bodyClassName)}>{children}</div>
    </div>
  )
}

/** A phone drawn inside the example box; overlays stay within its screen. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-[30rem] w-full max-w-[17.5rem] flex-col overflow-hidden rounded-[2rem] border-[6px] border-foreground/85 bg-background shadow-lg',
        className,
      )}
    >
      <div aria-hidden className="relative flex h-7 shrink-0 items-center justify-between px-5 text-[10px] font-semibold">
        <span>9:41</span>
        <span className="absolute top-1.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground/85" />
        <span className="flex items-end gap-0.5">
          <span className="h-1.5 w-0.5 rounded-sm bg-foreground" />
          <span className="h-2 w-0.5 rounded-sm bg-foreground" />
          <span className="h-2.5 w-0.5 rounded-sm bg-foreground" />
          <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-foreground/70 p-px">
            <span className="block h-full w-3/4 rounded-[1px] bg-foreground" />
          </span>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

/** Faint stand-in lines for page content. */
export function ContentSketch({ rows = 3, className }: { rows?: number; className?: string }) {
  const widths = ['w-full', 'w-5/6', 'w-2/3', 'w-4/5', 'w-1/2']
  return (
    <div aria-hidden className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn('h-2 rounded bg-muted', widths[i % widths.length])} />
      ))}
    </div>
  )
}
