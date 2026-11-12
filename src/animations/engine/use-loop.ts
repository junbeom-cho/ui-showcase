import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { advance } from './clock'

export type Frame = {
  /** scene seconds: scaled by speed, frozen while paused */
  time: number
  /** scene seconds since the last frame (0 while paused) */
  delta: number
}

/**
 * Calls onFrame every animation frame while the target is on screen and the
 * scene plays. While paused (or off screen) nothing runs, except one redraw
 * whenever `redrawKey` changes, so moving a slider still updates a paused picture.
 */
export function useLoop(
  target: RefObject<Element | null>,
  onFrame: (frame: Frame) => void,
  { paused, speed, redrawKey }: { paused: boolean; speed: number; redrawKey: string },
) {
  const latest = useRef({ onFrame, paused, speed })
  useEffect(() => {
    latest.current = { onFrame, paused, speed }
  })
  const time = useRef(0)
  const visible = useRef(true)
  const wake = useRef<() => void>(() => {})

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      frame = 0
      const { onFrame, paused, speed } = latest.current
      const step = advance(time.current, (now - last) / 1000, speed, paused)
      last = now
      time.current = step.time
      onFrame({ time: step.time, delta: step.delta })
      if (!paused && visible.current) frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    wake.current = start

    const el = target.current
    let observer: IntersectionObserver | undefined
    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        visible.current = entry.isIntersecting
        if (entry.isIntersecting) start()
      })
      observer.observe(el)
    }
    start()

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      wake.current = () => {}
    }
  }, [target])

  // resume after a pause, and draw once when something visible changed while paused
  useEffect(() => {
    wake.current()
  }, [paused, redrawKey])

  /** draw one frame now (e.g. after a resize while paused) */
  return useCallback(() => wake.current(), [])
}
