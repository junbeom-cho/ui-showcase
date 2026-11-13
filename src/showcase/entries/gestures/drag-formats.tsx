import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowDownIcon, GripVerticalIcon, Loader2Icon, MinusIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clamp, moveItem, useTimers, type Point } from './gesture'
import { Finger, GesturePhone, ScreenHeader, iconButton } from './parts'

const ROW = 44 // px; every rank row is h-11, so the drag math needs no measuring
const FRUITS = [
  { id: 'f1', name: '딸기', emoji: '🍓' },
  { id: 'f2', name: '복숭아', emoji: '🍑' },
  { id: 'f3', name: '귤', emoji: '🍊' },
  { id: 'f4', name: '수박', emoji: '🍉' },
  { id: 'f5', name: '포도', emoji: '🍇' },
]
const nameOf = (id: string) => FRUITS.find((f) => f.id === id)!.name

/** 5. Drag: press a handle, carry the row, drop it in a new place. */
export function DragFormat() {
  const [order, setOrder] = useState(FRUITS.map((f) => f.id))
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null)
  const [status, setStatus] = useState('손잡이(⋮⋮)를 끌거나, 손잡이에 초점을 두고 ↑↓ 키')
  const start = useRef<{ pointerId: number; y: number; from: number; base: string[] } | null>(null)
  const handles = useRef<Record<string, HTMLButtonElement | null>>({})
  const refocus = useRef<string | null>(null)

  useEffect(() => {
    if (refocus.current) handles.current[refocus.current]?.focus()
    refocus.current = null
  }, [order])

  const report = (id: string, from: number, to: number, how: string) =>
    setStatus(from === to ? `‘${nameOf(id)}’ 그대로 ${to + 1}위` : `‘${nameOf(id)}’ ${from + 1}위 → ${to + 1}위 (${how})`)

  const targetOf = (from: number, dy: number) => clamp(from + Math.round(dy / ROW), 0, order.length - 1)

  const onPointerMove = (e: PointerEvent, id: string) => {
    const s = start.current
    if (!s || s.pointerId !== e.pointerId) return
    const dy = e.clientY - s.y
    const to = targetOf(s.from, dy)
    setOrder(moveItem(s.base, s.from, to))
    setDrag({ id, offset: dy - (to - s.from) * ROW })
  }
  const onPointerUp = (e: PointerEvent, id: string) => {
    const s = start.current
    if (!s) return
    start.current = null
    setDrag(null)
    report(id, s.from, targetOf(s.from, e.clientY - s.y), '끌어서')
  }

  return (
    <GesturePhone status={status}>
      <ScreenHeader title="좋아하는 과일 순위" />
      <ol aria-label="과일 순위" className="relative flex flex-col p-2">
        {order.map((id, i) => {
          const f = FRUITS.find((x) => x.id === id)!
          const lifted = drag?.id === id
          return (
            <li
              key={id}
              style={lifted ? { transform: `translateY(${drag.offset}px)` } : undefined}
              className={cn(
                'flex h-11 items-center gap-2 rounded-lg border-b bg-background px-2 text-sm',
                lifted && 'relative z-10 scale-[1.03] border border-border shadow-lg',
              )}
            >
              <span className="w-5 text-center text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
              <span aria-hidden>{f.emoji}</span>
              <span className="flex-1">{f.name}</span>
              {/* touch-action: none only on the handle, so the rest of the row still scrolls the page */}
              <button
                ref={(el) => {
                  handles.current[id] = el
                }}
                type="button"
                aria-label={`‘${f.name}’ 순서 옮기기, 지금 ${i + 1}위. ↑↓ 키로 옮김`}
                onPointerDown={(e) => {
                  if (e.button !== 0) return
                  e.currentTarget.setPointerCapture(e.pointerId)
                  start.current = { pointerId: e.pointerId, y: e.clientY, from: i, base: order }
                  setDrag({ id, offset: 0 })
                }}
                onPointerMove={(e) => onPointerMove(e, id)}
                onPointerUp={(e) => onPointerUp(e, id)}
                onPointerCancel={() => {
                  if (start.current) setOrder(start.current.base)
                  start.current = null
                  setDrag(null)
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
                  e.preventDefault()
                  const to = clamp(i + (e.key === 'ArrowUp' ? -1 : 1), 0, order.length - 1)
                  refocus.current = id
                  setOrder(moveItem(order, i, to))
                  report(id, i, to, `${e.key === 'ArrowUp' ? '↑' : '↓'} 키`)
                }}
                className={cn(iconButton, 'touch-none cursor-grab active:cursor-grabbing', lifted && 'cursor-grabbing bg-muted')}
              >
                <GripVerticalIcon aria-hidden className="size-4" />
              </button>
            </li>
          )
        })}
      </ol>
    </GesturePhone>
  )
}

const MAX_ZOOM = 4

/** The photo to zoom: a landscape with a sign too small to read at 1×. */
function Landscape() {
  return (
    <svg viewBox="0 0 240 240" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="gesture-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#gesture-sky)" />
      <circle cx="180" cy="60" r="22" fill="#fbbf24" />
      <path d="M0 170 L60 100 L110 150 L160 90 L240 165 V240 H0Z" fill="#4d7c0f" />
      <path d="M0 200 Q120 170 240 205 V240 H0Z" fill="#365314" />
      <rect x="112" y="176" width="2" height="12" fill="#78350f" />
      <rect x="104" y="171" width="18" height="7" rx="1" fill="#fff7ed" />
      <text x="113" y="176.4" fontSize="3.6" textAnchor="middle" fill="#7c2d12" fontWeight="700">
        정상까지 2km
      </text>
    </svg>
  )
}

type Pinch = { mode: 'pinch'; d0: number; s0: number; ghost: boolean } | { mode: 'pan'; start: Point; pan0: Point }

/** 6. Pinch: two fingers spread to zoom in, pinch together to zoom out. */
export function PinchFormat() {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [ghost, setGhost] = useState<Point | null>(null)
  const [touching, setTouching] = useState(false)
  const [status, setStatus] = useState('두 손가락으로 벌려 보세요 (마우스는 Shift+끌기)')
  const view = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Pinch | null>(null)
  const virtual = useRef<number | null>(null) // the mouse pointer that drags a pretend pair of fingers

  const box = () => view.current!.getBoundingClientRect()
  const center = () => {
    const r = box()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  /** The two fingers: real ones, or the mouse plus its mirror image around the photo's centre. */
  const pair = (): [Point, Point] | null => {
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) return [pts[0], pts[1]]
    if (virtual.current !== null && pts.length === 1) {
      const c = center()
      return [pts[0], { x: 2 * c.x - pts[0].x, y: 2 * c.y - pts[0].y }]
    }
    return null
  }
  const clampPan = (p: Point, s: number) => {
    const r = box()
    const mx = ((s - 1) * r.width) / 2
    const my = ((s - 1) * r.height) / 2
    return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) }
  }
  const zoomTo = (s: number, how: string) => {
    const next = clamp(s, 1, MAX_ZOOM)
    setScale(next)
    setPan((p) => clampPan(p, next))
    setStatus(`배율 ${next.toFixed(1)}× (${how})`)
  }
  const begin = () => {
    const p = pair()
    if (p) {
      gesture.current = { mode: 'pinch', d0: Math.max(20, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)), s0: scale, ghost: virtual.current !== null }
      return
    }
    const one = [...pointers.current.values()][0]
    gesture.current = one ? { mode: 'pan', start: one, pan0: pan } : null
  }

  // ctrl/⌘ + wheel is also what a trackpad pinch sends; React's wheel listener is passive, so attach our own
  useEffect(() => {
    const el = view.current!
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomTo(scale * Math.exp(-e.deltaY / 200), 'Ctrl/⌘ + 휠')
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // re-attached whenever the scale changes, so the handler always starts from the current one
  }, [scale])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setTouching(true)
    if (e.shiftKey && pointers.current.size === 1) virtual.current = e.pointerId
    begin()
    if (virtual.current !== null) updateGhost()
  }
  const updateGhost = () => {
    const p = pair()
    if (!p || virtual.current === null) return setGhost(null)
    const r = box()
    setGhost({ x: p[1].x - r.left, y: p[1].y - r.top })
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (g?.mode === 'pinch') {
      const p = pair()
      if (!p) return
      const s = clamp((g.s0 * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) / g.d0, 1, MAX_ZOOM)
      setScale(s)
      setPan((q) => clampPan(q, s))
      setStatus(`배율 ${s.toFixed(1)}× (${g.ghost ? 'Shift+끌기로 흉내 낸 핀치' : '두 손가락 핀치'})`)
      updateGhost()
    } else if (g?.mode === 'pan' && scale > 1) {
      setPan(clampPan({ x: g.pan0.x + e.clientX - g.start.x, y: g.pan0.y + e.clientY - g.start.y }, scale))
      setStatus(`배율 ${scale.toFixed(1)}× · 한 손가락으로 옮겨 보는 중`)
    }
  }
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (virtual.current === e.pointerId) virtual.current = null
    setGhost(null)
    setTouching(pointers.current.size > 0)
    begin()
  }

  return (
    <GesturePhone status={status}>
      <ScreenHeader title="사진">
        <button type="button" aria-label="축소" disabled={scale <= 1} onClick={() => zoomTo(scale - 0.5, '− 버튼')} className={iconButton}>
          <MinusIcon aria-hidden className="size-4" />
        </button>
        <button type="button" aria-label="확대" disabled={scale >= MAX_ZOOM} onClick={() => zoomTo(scale + 0.5, '+ 버튼')} className={iconButton}>
          <PlusIcon aria-hidden className="size-4" />
        </button>
      </ScreenHeader>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 bg-black/90 p-2">
        {/* touch-action: none, because every finger movement here is ours: pinch, and pan once zoomed */}
        <div
          ref={view}
          role="group"
          tabIndex={0}
          aria-label="확대할 사진. + − 키로 확대·축소, 0으로 원래대로"
          onKeyDown={(e) => {
            if (e.key === '+' || e.key === '=') zoomTo(scale + 0.5, '+ 키')
            else if (e.key === '-') zoomTo(scale - 0.5, '− 키')
            else if (e.key === '0') zoomTo(1, '0 키')
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2, '두 번 탭')}
          className="relative aspect-square touch-none overflow-hidden rounded-md outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div
            className={cn('size-full', !touching && 'transition-transform duration-200 motion-reduce:transition-none')}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            <Landscape />
          </div>
          {ghost && <Finger ghost x={ghost.x} y={ghost.y} />}
        </div>
        <div className="flex items-center justify-between px-1 text-xs text-white/80">
          <span className="tabular-nums">{scale.toFixed(1)}×</span>
          <Button size="xs" variant="secondary" disabled={scale === 1} onClick={() => zoomTo(1, '원래대로')}>
            원래대로
          </Button>
        </div>
      </div>
    </GesturePhone>
  )
}

const DEALS = [
  '드립 포트 15%',
  '원두 1kg 묶음',
  '머그컵 2개 세트',
  '한정 머그 30%',
  '콜드브루 1+1',
  '드립백 20개 묶음',
  '세라믹 드리퍼 10%',
  '핸드밀 무료 배송',
  '텀블러 각인 무료',
]
const THRESHOLD = 64 // px the list has to be pulled before letting go refreshes it
const HOLD = 48 // px the list stays pulled down while it loads
const REFRESH_MS = 1200

/** 8. Pull to refresh: at the top of a list, pull down and let go to load new items. */
export function PullToRefreshFormat() {
  const timers = useTimers()
  const [deals, setDeals] = useState(() => DEALS.slice(0, 3).map((name) => ({ name, fresh: false })))
  const [pull, setPull] = useState(0)
  const [loading, setLoading] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [pulling, setPulling] = useState(false)
  const [status, setStatus] = useState('목록 맨 위에서 아래로 당겨 보세요')
  const drag = useRef<{ pointerId: number; y: number } | null>(null)
  const round = useRef(1)

  const refresh = (how: string) => {
    if (loading) return
    setLoading(true)
    setPull(HOLD)
    setStatus(`불러오는 중… (${how})`)
    timers.later(() => {
      const start = (round.current++ * 3) % DEALS.length
      const fresh = [0, 1, 2].map((i) => ({ name: DEALS[(start + i) % DEALS.length], fresh: true }))
      setDeals((list) => [...fresh, ...list.map((d) => ({ ...d, fresh: false }))])
      setLoading(false)
      setPull(0)
      setStatus(`새 특가 3개를 불러옴 (${how})`)
    }, REFRESH_MS)
  }

  const past = pull >= THRESHOLD
  return (
    <GesturePhone status={status}>
      <ScreenHeader title="특가 알림">
        <button type="button" aria-label="새로고침" disabled={loading} onClick={() => refresh('새로고침 버튼')} className={iconButton}>
          <RefreshCwIcon aria-hidden className={cn('size-4', loading && 'motion-safe:animate-spin')} />
        </button>
      </ScreenHeader>
      {/*
        At the very top the list hands downward pulls to us (pan-x pan-down) and still lets the
        browser scroll the other way; anywhere else the browser scrolls normally (pan-x pan-y).
      */}
      <div
        onScroll={(e) => setAtTop(e.currentTarget.scrollTop <= 0)}
        onPointerDown={(e) => {
          if (e.button !== 0 || loading || e.currentTarget.scrollTop > 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { pointerId: e.pointerId, y: e.clientY }
          setPulling(true)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          // pulling feels heavier the further it goes
          setPull(Math.min(120, Math.max(0, e.clientY - drag.current.y) * 0.5))
        }}
        onPointerUp={() => {
          if (!drag.current) return
          drag.current = null
          setPulling(false)
          if (past) refresh('당겨서')
          else {
            if (pull > 0) setStatus('덜 당겨서 취소')
            setPull(0)
          }
        }}
        onPointerCancel={() => {
          drag.current = null
          setPulling(false)
          setPull(0)
        }}
        style={{ touchAction: atTop ? 'pan-x pan-down' : 'pan-x pan-y' }}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain select-none"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden text-xs text-muted-foreground"
          style={{ height: pull }}
        >
          <span className="flex items-center gap-1.5 pb-3">
            {loading ? (
              <Loader2Icon className="size-4 motion-safe:animate-spin" />
            ) : (
              <ArrowDownIcon className={cn('size-4 transition-transform motion-reduce:transition-none', past && 'rotate-180')} />
            )}
            {loading ? '불러오는 중' : past ? '놓으면 새로고침' : '당겨서 새로고침'}
          </span>
        </div>
        <ul
          className={cn('flex flex-col gap-2 p-3', !pulling && 'transition-transform duration-300 ease-out motion-reduce:transition-none')}
          style={{ transform: `translateY(${pull}px)` }}
        >
          {deals.map((d, i) => (
            <li key={`${d.name}-${deals.length - i}`} className="flex items-center gap-2.5 rounded-lg border p-2.5">
              <span aria-hidden className="size-9 shrink-0 rounded-md bg-muted" />
              <span className="flex-1 text-sm">{d.name}</span>
              {d.fresh && <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">새로</span>}
            </li>
          ))}
        </ul>
      </div>
    </GesturePhone>
  )
}
