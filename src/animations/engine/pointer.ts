import { useEffect, useRef, type RefObject } from 'react'

/** Pointer position in CSS pixels from the element's top-left corner. */
export type Pointer = { x: number; y: number; inside: boolean; down: boolean }

/** Tracks the pointer over an element without re-rendering; read `.current` inside a frame. */
export function usePointer(target: RefObject<HTMLElement | null>) {
  const pointer = useRef<Pointer>({ x: 0, y: 0, inside: false, down: false })

  useEffect(() => {
    const el = target.current
    if (!el) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointer.current = { ...pointer.current, x: e.clientX - r.left, y: e.clientY - r.top, inside: true }
    }
    const leave = () => (pointer.current = { ...pointer.current, inside: false, down: false })
    const down = (e: PointerEvent) => {
      move(e)
      pointer.current.down = true
    }
    const up = () => (pointer.current.down = false)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointercancel', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointercancel', leave)
    }
  }, [target])

  return pointer
}
