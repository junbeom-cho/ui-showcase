import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import {
  BookmarkIcon,
  CopyIcon,
  HeartIcon,
  InfoIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PinIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ContentSketch } from '../navigation-patterns/frames'
import { HOLD_MS, SLOP, clamp, play, useTimers, type Point } from './gesture'
import { GesturePhone, ScreenHeader, iconButton } from './parts'

/** An expanding circle from where the finger landed (Material's ripple). */
function ripple(e: PointerEvent<HTMLElement>, ink: HTMLElement | null) {
  if (!ink) return
  const r = e.currentTarget.getBoundingClientRect()
  ink.style.left = `${e.clientX - r.left}px`
  ink.style.top = `${e.clientY - r.top}px`
  play(
    ink,
    [
      { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.35 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
    ],
    { duration: 450, easing: 'ease-out' },
  )
}

function TapButton({
  label,
  small = false,
  widened = false,
  onTap,
  children,
}: {
  label: string
  small?: boolean
  /** an invisible margin that brings a small button's touch area up to 44pt */
  widened?: boolean
  onTap: () => void
  children: ReactNode
}) {
  const ink = useRef<HTMLSpanElement>(null)
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => ripple(e, ink.current)}
      onClick={onTap}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full outline-none transition-[background-color,scale] duration-100 select-none active:scale-90 active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
        // the dashed box is the area that answers to a touch
        "after:pointer-events-auto after:absolute after:rounded-md after:border after:border-dashed after:border-sky-500/70 after:content-['']",
        small ? 'size-6 [&_svg]:size-3.5' : 'size-11 [&_svg]:size-5',
        small && widened ? 'after:-inset-2.5' : 'after:inset-0',
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span ref={ink} className="absolute size-24 rounded-full bg-foreground opacity-0" />
      </span>
      {children}
    </button>
  )
}

/** 1. Tap: touch, then lift on the same spot. */
export function TapFormat() {
  const [likes, setLikes] = useState(0)
  const [saves, setSaves] = useState(0)
  const [misses, setMisses] = useState(0)
  const [last, setLast] = useState('')
  const [widened, setWidened] = useState(false)

  return (
    <GesturePhone
      status={`좋아요 ${likes} · 저장 ${saves} · 빗나감 ${misses}${last && ` · 마지막: ${last}`}`}
      below={
        <div className="flex items-center gap-2 self-start">
          <Switch id="tap-widen" checked={widened} onCheckedChange={setWidened} />
          <Label htmlFor="tap-widen" className="text-sm font-normal">
            작은 버튼의 터치 영역을 44pt로 넓히기
          </Label>
        </div>
      }
    >
      <ScreenHeader title="피드" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div aria-hidden className="aspect-[4/3] rounded-lg bg-gradient-to-br from-sky-200 to-indigo-300 dark:from-sky-500/30 dark:to-indigo-500/40" />
        <div
          className="flex items-center gap-3 rounded-lg px-1 py-1"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return
            setMisses((n) => n + 1)
            setLast('버튼 밖을 눌러 빗나감')
          }}
        >
          <TapButton
            label="좋아요"
            onTap={() => {
              setLikes((n) => n + 1)
              setLast('좋아요 (44×44pt)')
            }}
          >
            <HeartIcon aria-hidden />
          </TapButton>
          <span className="ml-auto" />
          <TapButton
            label="저장"
            small
            widened={widened}
            onTap={() => {
              setSaves((n) => n + 1)
              setLast(widened ? '저장 (넓힌 44pt 영역)' : '저장 (24×24pt)')
            }}
          >
            <BookmarkIcon aria-hidden />
          </TapButton>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          점선이 손가락에 반응하는 영역입니다. 손가락 끝은 지름 1cm쯤이라 44×44pt(안드로이드 48dp)보다 작으면 자주 빗나갑니다.
        </p>
        <ContentSketch rows={2} />
      </div>
    </GesturePhone>
  )
}

type Note = { id: string; title: string; line: string }

const NOTES: Note[] = [
  { id: 'n1', title: '회의 메모', line: '금요일까지 시안 정리' },
  { id: 'n2', title: '장보기 목록', line: '우유, 달걀, 사과' },
  { id: 'n3', title: '여행 계획', line: '강릉 1박 2일' },
  { id: 'n4', title: '읽을 책', line: '세 권 남음' },
]

type Press = { id: string; start: Point; timer: number; done: boolean }
type Menu = { id: string; x: number; y: number }

/** 2. Long press: hold still about half a second for more actions. */
export function LongPressFormat() {
  const timers = useTimers()
  const [notes, setNotes] = useState(NOTES)
  const [pinned, setPinned] = useState<string[]>([])
  const [holding, setHolding] = useState<string | null>(null)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [status, setStatus] = useState('메모를 길게 눌러 보세요')
  const press = useRef<Press | null>(null)
  const swallowClick = useRef(false)
  const area = useRef<HTMLDivElement>(null)
  const moreButtons = useRef<Record<string, HTMLButtonElement | null>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  const titleOf = (id: string) => NOTES.find((n) => n.id === id)!.title
  const sorted = [...notes].sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)))

  const openMenu = (id: string, clientX: number, clientY: number, how: string) => {
    const r = area.current!.getBoundingClientRect()
    setMenu({ id, x: clamp(clientX - r.left, 8, r.width - 148), y: clamp(clientY - r.top, 8, r.height - 132) })
    setStatus(`‘${titleOf(id)}’ 메뉴 열림 (${how})`)
  }
  const closeMenu = () => {
    if (menu) moreButtons.current[menu.id]?.focus()
    setMenu(null)
  }
  useEffect(() => {
    menuRef.current?.querySelector('button')?.focus()
  }, [menu?.id])

  const stop = () => {
    if (press.current) timers.cancel(press.current.timer)
    press.current = null
    setHolding(null)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { clientX, clientY } = e
    swallowClick.current = false
    press.current = {
      id,
      start: { x: clientX, y: clientY },
      done: false,
      timer: timers.later(() => {
        press.current!.done = true
        swallowClick.current = true
        setHolding(null)
        openMenu(id, clientX, clientY, `${HOLD_MS}ms 길게 누름`)
      }, HOLD_MS),
    }
    setHolding(id)
  }
  const onPointerMove = (e: PointerEvent) => {
    const p = press.current
    if (!p || p.done) return
    if (Math.hypot(e.clientX - p.start.x, e.clientY - p.start.y) > SLOP) {
      swallowClick.current = true
      stop()
      setStatus('손가락이 움직여 길게 누르기 취소')
    }
  }

  const act = (action: 'copy' | 'pin' | 'delete') => {
    if (!menu) return
    const title = titleOf(menu.id)
    if (action === 'copy') setStatus(`‘${title}’ 복사함`)
    if (action === 'pin') {
      const on = !pinned.includes(menu.id)
      setPinned((list) => (on ? [...list, menu.id] : list.filter((x) => x !== menu.id)))
      setStatus(on ? `‘${title}’ 맨 위에 고정함` : `‘${title}’ 고정 풀림`)
    }
    if (action === 'delete') {
      setNotes((list) => list.filter((n) => n.id !== menu.id))
      setStatus(`‘${title}’ 삭제함`)
      setMenu(null)
      return
    }
    closeMenu()
  }

  const onMenuKey = (e: KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll('button') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') closeMenu()
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    } else return
    e.stopPropagation()
  }

  const menuItems = [
    { action: 'copy' as const, label: '복사', icon: CopyIcon },
    { action: 'pin' as const, label: menu && pinned.includes(menu.id) ? '고정 풀기' : '고정', icon: PinIcon },
    { action: 'delete' as const, label: '삭제', icon: Trash2Icon },
  ]

  return (
    <GesturePhone status={status} hold={holding !== null}>
      <ScreenHeader title="메모" />
      <div ref={area} className="relative min-h-0 flex-1 overflow-y-auto p-2">
        {notes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
            메모가 없어요
            <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setNotes(NOTES)}>
              <RotateCcwIcon aria-hidden className="mr-1 inline size-3" />
              처음으로
            </button>
          </div>
        )}
        <ul className="flex flex-col gap-1.5">
          {sorted.map((n) => {
            const open = menu?.id === n.id
            const pressing = holding === n.id
            return (
              <li
                key={n.id}
                className={cn(
                  'relative flex items-center rounded-lg border bg-background transition-[scale,box-shadow] duration-200 motion-reduce:transition-none',
                  pressing && 'scale-[0.98] bg-muted',
                  open && 'z-20 scale-[1.02] shadow-lg',
                )}
              >
                <button
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, n.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={stop}
                  onPointerCancel={stop}
                  onContextMenu={(e) => {
                    // a desktop right-click and Android's own long-press event land here
                    e.preventDefault()
                    stop()
                    swallowClick.current = true
                    openMenu(n.id, e.clientX, e.clientY, '오른쪽 클릭')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                      e.preventDefault()
                      const r = e.currentTarget.getBoundingClientRect()
                      openMenu(n.id, r.left + 40, r.bottom, '키보드')
                    }
                  }}
                  onClick={() => {
                    if (swallowClick.current) return
                    setStatus(`‘${n.title}’ 열기 (짧게 탭)`)
                  }}
                  className="flex min-w-0 flex-1 touch-pan-y flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {pinned.includes(n.id) && <PinIcon aria-label="고정됨" className="size-3 text-sky-600" />}
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{n.line}</span>
                </button>
                <button
                  ref={(el) => {
                    moreButtons.current[n.id] = el
                  }}
                  type="button"
                  aria-label={`‘${n.title}’ 메뉴`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    openMenu(n.id, r.left - 110, r.bottom, '⋯ 버튼')
                  }}
                  className={cn(iconButton, 'mr-1 size-8')}
                >
                  <MoreHorizontalIcon aria-hidden className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
        {menu && (
          <>
            <div aria-hidden className="absolute inset-0 z-10 bg-foreground/10" onPointerDown={closeMenu} />
            <div
              ref={menuRef}
              role="menu"
              aria-label={`‘${titleOf(menu.id)}’ 메뉴`}
              onKeyDown={onMenuKey}
              style={{ left: menu.x, top: menu.y }}
              className="absolute z-30 flex w-36 flex-col rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
            >
              {menuItems.map(({ action, label, icon: Icon }) => (
                <button
                  key={action}
                  type="button"
                  role="menuitem"
                  onClick={() => act(action)}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-md px-2.5 text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                    action === 'delete' && 'text-red-600 dark:text-red-400',
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </GesturePhone>
  )
}

const DOUBLE_MS = 300

function HeartBurst({ x, y }: Point) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    play(
      ref.current,
      [
        { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1, offset: 0.35 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-50%, -60%) scale(0.9)', opacity: 0 },
      ],
      { duration: 700, easing: 'ease-out', fill: 'forwards' },
    )
  }, [])
  return (
    <HeartIcon
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute size-16 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-lg"
      style={{ left: x, top: y }}
    />
  )
}

/** 7. Double tap: two quick taps on one spot; a single tap has to wait to be sure. */
export function DoubleTapFormat() {
  const timers = useTimers()
  const [liked, setLiked] = useState(false)
  const [info, setInfo] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [doubleOn, setDoubleOn] = useState(true)
  const [hearts, setHearts] = useState<(Point & { id: number })[]>([])
  const [status, setStatus] = useState('사진을 두 번 탭하거나 한 번 탭해 보세요')
  const lastTap = useRef<(Point & { t: number }) | null>(null)
  const pending = useRef<number | null>(null)
  const nextHeart = useRef(0)

  const toggleInfo = (how: string) => {
    setInfo(!info)
    setStatus(`정보 ${info ? '숨김' : '보기'} (${how})`)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const p = { x: e.clientX - r.left, y: e.clientY - r.top }
    const now = performance.now()
    if (!doubleOn) {
      toggleInfo('한 번 탭, 두 번 탭이 꺼져 바로 반응')
      return
    }
    const prev = lastTap.current
    if (prev && now - prev.t < DOUBLE_MS && Math.hypot(p.x - prev.x, p.y - prev.y) < 40) {
      timers.cancel(pending.current)
      lastTap.current = null
      setWaiting(false)
      const id = nextHeart.current++
      setHearts((h) => [...h, { id, ...p }])
      timers.later(() => setHearts((h) => h.filter((x) => x.id !== id)), 700)
      setLiked(true)
      setStatus('두 번 탭: 좋아요 ♥')
      return
    }
    lastTap.current = { ...p, t: now }
    setWaiting(true)
    pending.current = timers.later(() => {
      lastTap.current = null
      setWaiting(false)
      toggleInfo(`한 번 탭, ${DOUBLE_MS}ms 기다린 뒤`)
    }, DOUBLE_MS)
  }

  return (
    <GesturePhone
      status={status}
      below={
        <div className="flex items-center gap-2 self-start">
          <Switch id="double-on" checked={doubleOn} onCheckedChange={setDoubleOn} />
          <Label htmlFor="double-on" className="text-sm font-normal">
            두 번 탭 쓰기 (끄면 한 번 탭이 바로 반응)
          </Label>
        </div>
      }
    >
      <ScreenHeader title="게시물" />
      <div className="flex items-center gap-2 px-3 py-2">
        <span aria-hidden className="size-7 rounded-full bg-gradient-to-br from-amber-300 to-pink-400" />
        <span className="text-xs font-medium">바다여행</span>
      </div>
      {/* touch-action: manipulation turns off the browser's own double-tap zoom on this photo */}
      <div
        role="img"
        aria-label="바닷가 사진"
        onPointerUp={onPointerUp}
        className="relative aspect-square shrink-0 touch-manipulation overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 select-none dark:from-sky-700 dark:via-sky-800 dark:to-amber-900/60"
      >
        <span aria-hidden className="absolute top-6 right-8 size-10 rounded-full bg-amber-200 dark:bg-amber-300/80" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-sky-500/50 dark:bg-sky-900/70" />
        {info && (
          <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-xs text-white motion-safe:animate-in motion-safe:fade-in-0">
            강릉 경포해변 · 오후 5:12
          </span>
        )}
        {waiting && (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            두 번째 탭을 기다리는 중… ({DOUBLE_MS}ms)
          </span>
        )}
        {hearts.map((h) => (
          <HeartBurst key={h.id} x={h.x} y={h.y} />
        ))}
      </div>
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          aria-pressed={liked}
          aria-label="좋아요"
          onClick={() => {
            setLiked(!liked)
            setStatus(liked ? '버튼: 좋아요 취소' : '버튼: 좋아요 ♥')
          }}
          className={iconButton}
        >
          <HeartIcon aria-hidden className={cn('size-5', liked && 'fill-red-500 text-red-500')} />
        </button>
        <button type="button" aria-label="댓글" className={iconButton} onClick={() => setStatus('댓글 열기')}>
          <MessageCircleIcon aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          aria-pressed={info}
          aria-label="사진 정보"
          onClick={() => toggleInfo('버튼')}
          className={cn(iconButton, 'ml-auto')}
        >
          <InfoIcon aria-hidden className="size-5" />
        </button>
      </div>
      <p className="px-3 text-xs">
        좋아요 <span className="font-semibold tabular-nums">{liked ? 129 : 128}</span>개
      </p>
    </GesturePhone>
  )
}
