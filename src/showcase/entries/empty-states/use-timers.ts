import { useEffect, useRef } from 'react'

/** Timers that are all cleared when the demo goes away. */
export function useTimers() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((t) => window.clearTimeout(t)), [])
  return {
    later: (fn: () => void, ms: number) => {
      ids.current.push(window.setTimeout(fn, ms))
    },
    clear: () => {
      ids.current.forEach((t) => window.clearTimeout(t))
      ids.current = []
    },
  }
}
