import { cn } from '@/lib/utils'

// the loading-dot, loading-bar and loading-shimmer keyframes live in src/index.css

export type SpinnerKind = 'ring' | 'dots' | 'bars'
export type SpinnerSize = 'sm' | 'md' | 'lg'

const RING_SIZE: Record<SpinnerSize, string> = { sm: 'size-4', md: 'size-6', lg: 'size-10' }
const DOT_SIZE: Record<SpinnerSize, string> = { sm: 'size-1', md: 'size-1.5', lg: 'size-2.5' }
const DOTS_GAP: Record<SpinnerSize, string> = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-1.5' }
const BAR_SIZE: Record<SpinnerSize, string> = { sm: 'h-3.5 w-0.5', md: 'h-5 w-1', lg: 'h-9 w-1.5' }

/**
 * A spinner drawn in the current text colour. It is decoration only (aria-hidden); say
 * what is loading in text next to it, or pass `label` for a visually hidden one.
 * With reduced motion it stands still and the text carries the message.
 */
export function Spinner({
  kind = 'ring',
  size = 'md',
  label,
  still = false,
  className,
}: {
  kind?: SpinnerKind
  size?: SpinnerSize
  /** read by screen readers only */
  label?: string
  /** a drawing: no motion */
  still?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)}>
      {kind === 'ring' && (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className={cn(RING_SIZE[size], !still && 'motion-safe:animate-spin')}
        >
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
          <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {kind === 'dots' && (
        <span aria-hidden className={cn('inline-flex items-center', DOTS_GAP[size])}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                'rounded-full bg-current',
                DOT_SIZE[size],
                !still && 'motion-safe:animate-[loading-dot_1.2s_ease-in-out_infinite]',
              )}
              style={{ animationDelay: `${i * 0.16 - 0.32}s` }}
            />
          ))}
        </span>
      )}
      {kind === 'bars' && (
        <span aria-hidden className="inline-flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'rounded-full bg-current',
                BAR_SIZE[size],
                !still && 'motion-safe:animate-[loading-bar_1s_ease-in-out_infinite]',
              )}
              style={{ animationDelay: `${i * 0.12 - 0.48}s` }}
            />
          ))}
        </span>
      )}
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

/**
 * A skeleton block with a band of light sweeping across it. `still` (or the
 * device's reduced-motion setting) leaves a plain grey block.
 */
export function ShimmerBlock({ className, still = false }: { className?: string; still?: boolean }) {
  return (
    <div data-slot="shimmer" className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
      {!still && (
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-transparent motion-safe:animate-[loading-shimmer_1.6s_ease-in-out_infinite] motion-reduce:hidden dark:via-white/10"
        />
      )}
    </div>
  )
}
