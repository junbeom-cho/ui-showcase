import type { MouseEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Demo links (Breadcrumb, Pagination, …) use href="#"; following them would
// reset the hash route, so the specimen frame swallows those clicks.
function preventHashNavigation(event: MouseEvent<HTMLDivElement>) {
  const link = (event.target as Element).closest('a')
  if (link?.getAttribute('href') === '#') event.preventDefault()
}

/** A sheet of drafting paper that a live component sits on. */
export function Specimen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="app-surface"
      onClick={preventHashNavigation}
      className={cn(
        'bg-graph flex min-h-44 min-w-0 items-center justify-center rounded-md border border-rule p-6 sm:p-10',
        className,
      )}
    >
      {children}
    </div>
  )
}
