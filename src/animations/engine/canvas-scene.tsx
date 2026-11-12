import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Params } from '../types'
import { usePointer, type Pointer } from './pointer'
import { useLoop, type Frame } from './use-loop'

export type CanvasFrame = Frame & {
  ctx: CanvasRenderingContext2D
  /** CSS pixels; the context is already scaled, so draw in CSS pixels */
  width: number
  height: number
  dpr: number
  pointer: Pointer
  /** true on the first frame and after every resize: (re)build particles, grids, buffers here */
  resized: boolean
  params: Params
  thumb: boolean
}

/**
 * A 2D canvas that fills its parent and calls `draw` every frame.
 * Keep scene state (particles, grids) in a ref and rebuild it when `resized` is true.
 */
export function CanvasScene({
  draw,
  params,
  paused,
  thumb = false,
  pixelRatio,
  className,
}: {
  draw: (frame: CanvasFrame) => void
  params: Params
  paused: boolean
  thumb?: boolean
  /** fixed backing-store scale; pixel art uses a small one and lets CSS enlarge it */
  pixelRatio?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pointer = usePointer(ref)
  const size = useRef({ width: 0, height: 0, dpr: 1, resized: true })
  const ctx = useRef<CanvasRenderingContext2D | null>(null)

  const redraw = useLoop(
    ref,
    (frame) => {
      const canvas = ref.current
      if (!canvas) return
      ctx.current ??= canvas.getContext('2d')
      const s = size.current
      if (!ctx.current || s.width === 0 || s.height === 0) return
      ctx.current.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
      draw({ ...frame, ctx: ctx.current, width: s.width, height: s.height, dpr: s.dpr, pointer: pointer.current, resized: s.resized, params, thumb })
      s.resized = false
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const measure = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = pixelRatio ?? (thumb ? 1 : Math.min(window.devicePixelRatio || 1, 2))
      const width = Math.max(1, Math.round(r.width))
      const height = Math.max(1, Math.round(r.height))
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      size.current = { width, height, dpr, resized: true }
      redraw()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [pixelRatio, thumb, redraw])

  return <canvas ref={ref} className={cn('block size-full', className)} />
}
