import { useEffect, useMemo, useRef } from 'react'

/** px per ms: a release faster than this counts as a flick even if the finger moved only a little. */
export const FLICK = 0.5
/** px a finger may wander before a press stops being a tap (or a long press is cancelled). */
export const SLOP = 10
export const HOLD_MS = 500

export type Point = { x: number; y: number }
export type Sample = { at: number; t: number }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Remember where the finger was a moment ago, so a release can tell a flick from a slow drag. */
export function sample(list: Sample[], at: number) {
  list.push({ at, t: performance.now() })
  if (list.length > 8) list.shift()
}

/** Speed in px/ms over the last ~100ms; 0 if the finger rested before letting go. */
export function speed(list: Sample[]) {
  const last = list[list.length - 1]
  if (!last || performance.now() - last.t > 80) return 0
  const first = list.find((s) => last.t - s.t <= 100) ?? last
  const dt = last.t - first.t
  // under 8ms there are too few samples to tell a speed from noise
  return dt >= 8 ? (last.at - first.at) / dt : 0
}

/**
 * Does a release complete the gesture? Either the finger travelled past `fraction` of the
 * target, or it was flicked fast in that direction. `distance` and `velocity` point the same way.
 */
export function passes(distance: number, velocity: number, size: number, fraction = 0.5) {
  return distance > size * fraction || (distance > SLOP && velocity > FLICK)
}

/** Plays a Web Animation unless the viewer asked for less motion; `essential` ones (a timer ring) always play. */
export function play(el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions, essential = false) {
  if (!el || typeof el.animate !== 'function') return
  if (!essential && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  el.animate(keyframes, options)
}

/** setTimeout that is cleared when the demo goes away. */
export function useTimers() {
  const ids = useRef(new Set<number>())
  useEffect(() => {
    const set = ids.current
    return () => set.forEach((id) => window.clearTimeout(id))
  }, [])
  return useMemo(
    () => ({
      later(fn: () => void, ms: number) {
        const id = window.setTimeout(() => {
          ids.current.delete(id)
          fn()
        }, ms)
        ids.current.add(id)
        return id
      },
      cancel(id: number | null | undefined) {
        if (id == null) return
        window.clearTimeout(id)
        ids.current.delete(id)
      },
    }),
    [],
  )
}

/** Take the item at `from` out and put it back at `to`. */
export function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}
