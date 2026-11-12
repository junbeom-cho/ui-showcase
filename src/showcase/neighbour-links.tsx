import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

type Neighbour = { href: string; name: string }

const linkClass =
  'flex flex-col gap-1 rounded-md border border-rule bg-card px-4 py-3 outline-none hover:border-blueprint focus-visible:ring-2 focus-visible:ring-blueprint/40'

/** "이전 / 다음" cards at the bottom of a component or style page. */
export function NeighbourLinks({ label, prev, next }: { label: string; prev?: Neighbour; next?: Neighbour }) {
  return (
    <nav aria-label={label} className="grid grid-cols-2 gap-3 border-t border-rule pt-8">
      {prev ? (
        <a href={prev.href} data-slot="app-surface" className={linkClass}>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <ChevronLeftIcon className="size-3.5" />
            이전
          </span>
          <span className="font-medium text-ink">{prev.name}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={next.href} data-slot="app-surface" className={`${linkClass} items-end text-right`}>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            다음
            <ChevronRightIcon className="size-3.5" />
          </span>
          <span className="font-medium text-ink">{next.name}</span>
        </a>
      )}
    </nav>
  )
}
