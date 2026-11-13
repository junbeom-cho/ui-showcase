import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '../navigation-patterns/frames'
import { HOLD_MS, play, type Point } from './gesture'

/** Starts filling the moment it appears, so re-renders never restart it. */
function HoldRing({ ms }: { ms: number }) {
  const ref = useRef<SVGCircleElement>(null)
  useEffect(() => {
    play(ref.current, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, fill: 'forwards' }, true)
  }, [ms])
  return <circle ref={ref} cx="24" cy="24" r="22" pathLength={1} strokeDasharray="1" strokeDashoffset="0" />
}

/**
 * The translucent circle a touch indicator draws under a finger. `progress` draws a still
 * ring (state gallery), `holdMs` a ring that fills while the finger stays down.
 */
export function Finger({
  x,
  y,
  progress,
  holdMs,
  ghost = false,
  slot = false,
  className,
}: Point & {
  progress?: number
  holdMs?: number
  /** a finger the demo pretends is there (Shift-drag pinch) */
  ghost?: boolean
  slot?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      data-slot={slot ? 'gesture-touch-point' : undefined}
      className={cn(
        'pointer-events-none absolute z-40 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25 shadow-sm ring-2 ring-background/80',
        ghost && 'bg-foreground/15 outline-2 outline-offset-2 outline-foreground/40 outline-dashed',
        className,
      )}
      style={{ left: x, top: y }}
    >
      {(progress !== undefined || holdMs !== undefined) && (
        <svg viewBox="0 0 48 48" className="absolute -inset-2 size-14 -rotate-90 fill-none stroke-sky-500 stroke-[3]">
          {holdMs !== undefined ? (
            <HoldRing ms={holdMs} />
          ) : (
            <circle cx="24" cy="24" r="22" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - (progress ?? 0)} />
          )}
        </svg>
      )}
    </span>
  )
}

/**
 * The phone screen. It listens in the capture phase, so every pressed pointer gets a finger
 * circle whatever the demo inside does with it (demos capture their pointers, so moves keep coming).
 */
function TouchScreen({ children, hold = false }: { children: ReactNode; hold?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [fingers, setFingers] = useState<(Point & { id: number })[]>([])
  const at = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    return { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = fingers.length > 0
  useEffect(() => {
    if (!down) return
    const lift = (e: globalThis.PointerEvent) => setFingers((f) => f.filter((p) => p.id !== e.pointerId))
    window.addEventListener('pointerup', lift)
    window.addEventListener('pointercancel', lift)
    return () => {
      window.removeEventListener('pointerup', lift)
      window.removeEventListener('pointercancel', lift)
    }
  }, [down])

  return (
    <div
      ref={box}
      className="relative flex min-h-0 flex-1 flex-col"
      onPointerDownCapture={(e) => {
        const p = at(e)
        setFingers((f) => [...f.filter((q) => q.id !== p.id), p])
      }}
      onPointerMoveCapture={(e) => {
        if (!fingers.some((f) => f.id === e.pointerId)) return
        const p = at(e)
        setFingers((f) => f.map((q) => (q.id === p.id ? p : q)))
      }}
    >
      {children}
      {fingers.map((f) => (
        <Finger key={f.id} x={f.x} y={f.y} holdMs={hold ? HOLD_MS : undefined} />
      ))}
    </div>
  )
}

/** Phone + the line that reports what the gesture did. `hold` puts a filling ring on the finger. */
export function GesturePhone({
  children,
  status,
  hold,
  below,
}: {
  children: ReactNode
  status: ReactNode
  hold?: boolean
  /** settings or hints under the phone */
  below?: ReactNode
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <TouchScreen hold={hold}>{children}</TouchScreen>
      </PhoneFrame>
      {below}
      <p role="status" className="self-start text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  )
}

/** The app bar at the top of every demo screen. */
export function ScreenHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b px-3">
      <p className="flex-1 truncate text-sm font-semibold">{title}</p>
      {children}
    </header>
  )
}

export const iconButton =
  'grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40'
