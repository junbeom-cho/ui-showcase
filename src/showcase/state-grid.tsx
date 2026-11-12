import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StateItem = { label: string; node: ReactNode }

/**
 * One labelled cell per state (D-019). Pointer and keyboard states are pinned
 * by passing data-demo-state="hover" | "active" | "focus" to the component.
 * The label is always the last child of its cell.
 */
export function StateGrid({ items, wide = false }: { items: StateItem[]; wide?: boolean }) {
  return (
    <ul
      aria-label="상태 모음"
      className={cn('grid w-full gap-x-4 gap-y-6', wide ? 'sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}
    >
      {items.map(({ label, node }) => (
        <li key={label} className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex min-h-12 w-full items-center justify-center">{node}</div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </li>
      ))}
    </ul>
  )
}
