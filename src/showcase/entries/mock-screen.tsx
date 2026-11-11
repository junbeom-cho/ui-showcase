import type { ReactNode } from 'react'

/**
 * A miniature page used in overlay anatomy diagrams. Real overlays portal to
 * <body> and cover the whole viewport, so their anatomy is drawn on this
 * stand-in screen with the same part names (data-slot) instead.
 */
export function MockScreen({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-56 w-full max-w-80 overflow-hidden rounded-lg border bg-background shadow-sm">
      <div aria-hidden className="flex flex-col gap-2 p-4">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-5/6 rounded bg-muted" />
        <div className="h-2 w-2/3 rounded bg-muted" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      </div>
      {children}
    </div>
  )
}
