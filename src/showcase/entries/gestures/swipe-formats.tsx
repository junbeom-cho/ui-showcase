import { useRef, useState, type PointerEvent } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContentSketch } from '../navigation-patterns/frames'
import { FLICK, SLOP, clamp, passes, sample, speed, useTimers, type Sample } from './gesture'
import { GesturePhone, ScreenHeader, iconButton } from './parts'

/** One finger on one axis: where it started, which way it went first, how fast it was moving. */
type Track = { pointerId: number; x: number; y: number; axis: 'x' | 'y' | null; samples: Sample[] }

const startTrack = (e: PointerEvent): Track => ({ pointerId: e.pointerId, x: e.clientX, y: e.clientY, axis: null, samples: [] })

/**
 * Decide the axis once the finger has moved a little; a mostly vertical move is left to scrolling.
 * The pointer is captured only then, so a plain tap still clicks the button under it.
 */
function lockAxis(t: Track, e: PointerEvent<HTMLElement>) {
  const dx = e.clientX - t.x
  const dy = e.clientY - t.y
  if (!t.axis && Math.hypot(dx, dy) > SLOP) {
    t.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (t.axis === 'x') e.currentTarget.setPointerCapture(e.pointerId)
  }
  if (t.axis === 'x') sample(t.samples, e.clientX)
  return dx
}

const fmt = (v: number) => `${Math.abs(v).toFixed(1)}px/ms`

const SLIDES = [
  { title: '봄맞이 원두 할인', line: '모든 원두 20%', tone: 'from-amber-200 to-orange-300 dark:from-amber-500/30 dark:to-orange-500/40' },
  { title: '새로 들어온 드리퍼', line: '세라믹 · 유리', tone: 'from-emerald-200 to-teal-300 dark:from-emerald-500/30 dark:to-teal-500/40' },
  { title: '텀블러 1+1', line: '이번 주만', tone: 'from-sky-200 to-indigo-300 dark:from-sky-500/30 dark:to-indigo-500/40' },
  { title: '첫 주문 무료 배송', line: '쿠폰 자동 적용', tone: 'from-pink-200 to-rose-300 dark:from-pink-500/30 dark:to-rose-500/40' },
]

/** 3. Swipe: a quick horizontal stroke moves between pages. */
export function SwipeFormat() {
  const [index, setIndex] = useState(0)
  const [dx, setDx] = useState(0)
  const [note, setNote] = useState('')
  const track = useRef<Track | null>(null)
  const last = SLIDES.length - 1

  const go = (to: number, how: string) => {
    setIndex(clamp(to, 0, last))
    setNote(how)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    if (!t) return
    const d = lockAxis(t, e)
    if (t.axis !== 'x') return
    // past the first or last card the strip only gives a little (rubber band)
    const edge = (index === 0 && d > 0) || (index === last && d < 0)
    setDx(edge ? d / 3 : d)
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    track.current = null
    setDx(0)
    if (!t || t.axis !== 'x') return
    const d = e.clientX - t.x
    const v = speed(t.samples)
    const dir = d < 0 ? 1 : -1
    const width = e.currentTarget.getBoundingClientRect().width
    const target = index + dir
    if (target < 0 || target > last) return setNote('끝이라 더 넘길 수 없음')
    if (!passes(Math.abs(d), -v * dir, width)) return setNote(`덜 밀어 제자리로 (${fmt(v)})`)
    go(target, Math.abs(d) > width / 2 ? `절반 넘게 밀어 넘김` : `빠르게 튕겨 넘김 (${fmt(v)})`)
  }

  return (
    <GesturePhone status={`${index + 1} / ${SLIDES.length} · ${SLIDES[index].title}${note && ` · ${note}`}`}>
      <ScreenHeader title="오늘의 특가">
        <button type="button" aria-label="이전 카드" disabled={index === 0} onClick={() => go(index - 1, '이전 버튼')} className={iconButton}>
          <ChevronLeftIcon aria-hidden className="size-4" />
        </button>
        <button type="button" aria-label="다음 카드" disabled={index === last} onClick={() => go(index + 1, '다음 버튼')} className={iconButton}>
          <ChevronRightIcon aria-hidden className="size-4" />
        </button>
      </ScreenHeader>
      <div className="flex flex-col gap-3 p-3">
        {/* pan-y: the browser still scrolls the page up and down; sideways moves come to us */}
        <div
          role="region"
          aria-roledescription="캐러셀"
          aria-label="특가 카드, ←→ 키로 넘기기"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(index + 1, '→ 키')
            else if (e.key === 'ArrowLeft') go(index - 1, '← 키')
          }}
          onPointerDown={(e) => {
            if (e.button === 0) track.current = startTrack(e)
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            track.current = null
            setDx(0)
          }}
          className="touch-pan-y overflow-hidden rounded-xl outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div
            className={cn('flex transition-transform duration-300 ease-out motion-reduce:transition-none', dx !== 0 && 'transition-none')}
            style={{ transform: `translateX(calc(${-index * 100}% + ${dx}px))` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.title}
                role="group"
                aria-roledescription="슬라이드"
                aria-label={`${i + 1} / ${SLIDES.length}`}
                aria-hidden={i !== index}
                className={cn('flex aspect-[4/3] w-full shrink-0 flex-col justify-end gap-0.5 bg-gradient-to-br p-4', s.tone)}
              >
                <p className="text-base font-semibold">{s.title}</p>
                <p className="text-xs opacity-80">{s.line}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`${i + 1}번 카드`}
              aria-current={i === index || undefined}
              onClick={() => go(i, '점 누름')}
              className="group grid size-6 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full bg-muted-foreground/40 transition-all motion-reduce:transition-none',
                  i === index && 'w-4 bg-foreground',
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground">추천 상품</p>
        <ContentSketch rows={3} />
      </div>
    </GesturePhone>
  )
}

const MAILS = [
  { id: 'm1', from: '김하늘', subject: '회의 자료 공유드려요', time: '9:12' },
  { id: 'm2', from: '택배 알림', subject: '오늘 도착 예정입니다', time: '8:40' },
  { id: 'm3', from: '이도윤', subject: '주말에 등산 갈래?', time: '어제' },
  { id: 'm4', from: '디자인 소식', subject: '이번 주 읽을거리 5편', time: '어제' },
  { id: 'm5', from: '박서연', subject: '사진 보냈어요', time: '월' },
]
type Mail = (typeof MAILS)[number]

const OPEN = 80 // px a row rests open, showing its delete button

/** 4. Swipe to delete: slide a row left to reveal delete; slide far enough and it goes. */
export function SwipeToDeleteFormat() {
  const timers = useTimers()
  const [mails, setMails] = useState(MAILS)
  const [drag, setDrag] = useState<{ id: string; dx: number; past: boolean } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [leaving, setLeaving] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ mail: Mail; index: number } | null>(null)
  const [status, setStatus] = useState('메일을 왼쪽으로 밀어 보세요')
  const track = useRef<(Track & { id: string; base: number; moved: boolean }) | null>(null)
  const swallowClick = useRef(false)

  const remove = (id: string, how: string) => {
    const index = mails.findIndex((m) => m.id === id)
    const mail = mails[index]
    setOpen(null)
    setLeaving(id)
    setStatus(`‘${mail.subject}’ 삭제함 (${how})`)
    timers.later(() => {
      setMails((list) => list.filter((m) => m.id !== id))
      setLeaving(null)
      setUndo({ mail, index })
    }, 200)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    if (!t) return
    const d = lockAxis(t, e)
    if (t.axis !== 'x') return
    t.moved = true
    const width = e.currentTarget.getBoundingClientRect().width
    const dx = Math.min(0, t.base + d)
    setDrag({ id: t.id, dx, past: -dx > width / 2 })
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    track.current = null
    setDrag(null)
    swallowClick.current = !!t?.moved
    if (!t?.moved) return
    const dist = -Math.min(0, t.base + e.clientX - t.x)
    const width = e.currentTarget.getBoundingClientRect().width
    const v = -speed(t.samples)
    // a short flick only opens the row; deleting takes half the row or a fast, long stroke
    if (passes(dist, v, width) && dist > OPEN) return remove(t.id, dist > width / 2 ? '절반 넘게 밀어' : `빠르게 밀어 (${fmt(v)})`)
    if (dist > OPEN / 2) {
      setOpen(t.id)
      setStatus('삭제 버튼이 드러남. 누르면 삭제')
    } else {
      setOpen(null)
      setStatus('덜 밀어 제자리로')
    }
  }

  return (
    <GesturePhone status={status} below={<p className="self-start text-xs text-muted-foreground">키보드: 메일에 초점을 두고 Delete 키</p>}>
      <ScreenHeader title="받은 편지함" />
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {mails.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
            메일이 없어요
            <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setMails(MAILS)}>
              처음으로
            </button>
          </div>
        )}
        <ul>
          {mails.map((m) => {
            const dragging = drag?.id === m.id
            const dx = dragging ? drag.dx : open === m.id ? -OPEN : 0
            const gone = leaving === m.id
            return (
              <li key={m.id} className="relative overflow-hidden border-b">
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-end bg-red-500 text-white transition-colors motion-reduce:transition-none',
                    dragging && drag.past && 'bg-red-600',
                  )}
                >
                  {open === m.id ? (
                    <button
                      type="button"
                      onClick={() => remove(m.id, '삭제 버튼')}
                      className="flex h-full w-20 flex-col items-center justify-center gap-0.5 text-xs font-medium outline-none focus-visible:bg-red-700"
                    >
                      <Trash2Icon aria-hidden className="size-4" />
                      삭제
                    </button>
                  ) : (
                    <span aria-hidden className="flex w-28 flex-col items-center gap-0.5 text-[11px] font-medium">
                      <Trash2Icon
                        className={cn('size-4 transition-transform motion-reduce:transition-none', dragging && drag.past && 'scale-125')}
                      />
                      {dragging && drag.past ? '놓으면 삭제' : '삭제'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    if (open && open !== m.id) setOpen(null)
                    track.current = { ...startTrack(e), id: m.id, base: open === m.id ? -OPEN : 0, moved: false }
                  }}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={() => {
                    track.current = null
                    setDrag(null)
                  }}
                  onClick={() => {
                    if (swallowClick.current) swallowClick.current = false
                    else if (open === m.id) {
                      setOpen(null)
                      setStatus('닫음')
                    } else setStatus(`‘${m.subject}’ 열기`)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') remove(m.id, 'Delete 키')
                  }}
                  style={{ transform: `translateX(${gone ? '-100%' : `${dx}px`})` }}
                  className={cn(
                    'relative flex w-full touch-pan-y flex-col gap-0.5 bg-background px-3 py-2.5 text-left outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                    !dragging && 'transition-transform duration-200 ease-out motion-reduce:transition-none',
                  )}
                >
                  <span className="flex w-full items-center text-sm font-medium">
                    {m.from}
                    <span className="ml-auto text-[10px] font-normal text-muted-foreground">{m.time}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{m.subject}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {undo && (
          <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg motion-safe:animate-in motion-safe:slide-in-from-bottom-2">
            <span className="min-w-0 flex-1 truncate">메일 1개 삭제함</span>
            <button
              type="button"
              onClick={() => {
                setMails((list) => [...list.slice(0, undo.index), undo.mail, ...list.slice(undo.index)])
                setStatus(`‘${undo.mail.subject}’ 되돌림`)
                setUndo(null)
              }}
              className="shrink-0 rounded px-1.5 py-1 font-semibold text-sky-300 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:text-sky-600"
            >
              되돌리기
            </button>
          </div>
        )}
      </div>
    </GesturePhone>
  )
}

const EDGE = 24 // px from the left edge where a back swipe may begin

/** 9. Edge swipe: from the left edge, drag the screen away to go back. */
export function EdgeSwipeFormat() {
  const [screen, setScreen] = useState<'list' | 'detail'>('detail')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('화면 왼쪽 가장자리에서 오른쪽으로 끌어 보세요')
  const [dragging, setDragging] = useState(false)
  const track = useRef<(Track & { fromEdge: boolean }) | null>(null)
  const detail = screen === 'detail'

  const back = (how: string) => {
    setScreen('list')
    setProgress(0)
    setStatus(`이전 화면으로 돌아감 (${how})`)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    if (!t) return
    const d = lockAxis(t, e)
    if (t.axis !== 'x' || !t.fromEdge) return
    setDragging(true)
    setProgress(clamp(d / e.currentTarget.getBoundingClientRect().width, 0, 1) || 0)
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const t = track.current
    track.current = null
    setDragging(false)
    if (!t || t.axis !== 'x') return
    if (!t.fromEdge) {
      setStatus('가장자리가 아닌 곳에서 끌어 아무 일도 없음')
      return
    }
    const d = e.clientX - t.x
    const v = speed(t.samples)
    if (passes(d, v, e.currentTarget.getBoundingClientRect().width, 0.4)) back(d > 0 && v > FLICK ? `빠르게 밀어 (${fmt(v)})` : '끌어서')
    else {
      setProgress(0)
      setStatus('덜 끌어 제자리로')
    }
  }

  return (
    <GesturePhone status={status}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* the previous screen waits underneath, a little to the left, and slides in under the finger */}
        <section
          aria-label="받은 편지함"
          inert={detail}
          className={cn('absolute inset-0 flex flex-col bg-background', !dragging && 'transition-transform duration-300 ease-out motion-reduce:transition-none')}
          style={{ transform: detail ? `translateX(${-30 + progress * 30}%)` : 'none' }}
        >
          <ScreenHeader title="받은 편지함" />
          <ul>
            {MAILS.map((m) => (
              <li key={m.id} className="border-b">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('detail')
                    setStatus(`‘${m.subject}’ 열기`)
                  }}
                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left outline-none focus-visible:bg-muted"
                >
                  <span className="text-sm font-medium">{m.from}</span>
                  <span className="truncate text-xs text-muted-foreground">{m.subject}</span>
                </button>
              </li>
            ))}
          </ul>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-foreground" style={{ opacity: detail ? 0.15 * (1 - progress) : 0 }} />
        </section>
        <section
          aria-label="메일 보기"
          inert={!detail}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            const fromEdge = e.clientX - e.currentTarget.getBoundingClientRect().left <= EDGE
            track.current = { ...startTrack(e), fromEdge }
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            track.current = null
            setDragging(false)
            setProgress(0)
          }}
          className={cn(
            'absolute inset-0 flex touch-pan-y flex-col bg-background shadow-[-8px_0_16px_rgba(0,0,0,0.12)] select-none',
            !dragging && 'transition-transform duration-300 ease-out motion-reduce:transition-none',
          )}
          style={{ transform: `translateX(${detail ? progress * 100 : 100}%)` }}
        >
          <header className="flex h-11 shrink-0 items-center border-b px-1">
            <button
              type="button"
              onClick={() => back('뒤로 버튼')}
              className="flex h-9 items-center gap-0.5 rounded-md pr-2 text-sm text-sky-600 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-sky-400"
            >
              <ChevronLeftIcon aria-hidden className="size-5" />
              받은 편지함
            </button>
          </header>
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm font-semibold">회의 자료 공유드려요</p>
            <p className="text-xs text-muted-foreground">김하늘 · 오전 9:12</p>
            <ContentSketch rows={5} className="mt-2" />
          </div>
          <span
            aria-hidden
            className="absolute inset-y-11 left-0 border-r border-dashed border-sky-500/50 bg-sky-500/10"
            style={{ width: EDGE }}
          />
        </section>
      </div>
    </GesturePhone>
  )
}
