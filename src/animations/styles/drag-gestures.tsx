import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { ArchiveIcon, GripVerticalIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const TRACKS = [
  { id: 'a', title: '밤산책', artist: '보라빛 정류장', length: '3:24', hue: 262 },
  { id: 'b', title: '창문 너머', artist: '소금과 바람', length: '4:02', hue: 196 },
  { id: 'c', title: '여름의 끝', artist: '모래성 밴드', length: '2:58', hue: 150 },
  { id: 'd', title: '느린 편지', artist: '구름다리', length: '3:41', hue: 24 },
  { id: 'e', title: '첫차', artist: '보라빛 정류장', length: '3:15', hue: 338 },
]
const ORIGINAL = TRACKS.map((t) => t.id)
const N = TRACKS.length

const MAILS = [
  { id: 'm1', from: '김하늘', subject: '회의 자료 공유드려요', time: '9:12', hue: 215 },
  { id: 'm2', from: '택배 알림', subject: '오늘 도착 예정입니다', time: '8:40', hue: 32 },
  { id: 'm3', from: '이도윤', subject: '주말에 등산 갈래?', time: '어제', hue: 150 },
  { id: 'm4', from: '디자인 소식', subject: '이번 주 읽을거리 5편', time: '어제', hue: 285 },
  { id: 'm5', from: '박서연', subject: '사진 보냈어요', time: '월', hue: 350 },
]

const ROW_PCT = 18 // mail row height, percent of the phone's list area
const OPEN = 0.36 // a row resting open shows two buttons of 18% each (fractions of the row width)
const PROJECT = 0.2 // seconds of the release speed added to the position before deciding: a quick flick counts
const COLLAPSE = 0.28 // seconds for a removed row to close its gap
const LIST_OMEGA = 11 // spring speed (rad/s) of the rows making room
const SWIPE_OMEGA = 10 // spring speed of a swiped row snapping back or open
const SLICE = 1 / 240 // largest integration step, so stiff springs stay stable at any frame rate
const AUTO_AFTER = 4 // seconds without input before the demo plays by itself
const TOAST_FOR = 4.5
const POSTER = 1.15 // a paused scene is drawn this far into the demo, caught mid-gesture

// the demo: two songs are carried and carried back; one mail is opened and closed, another flicked away and restored
const LIST_PERIOD = 6.4
const LIST_MOVES = [
  { at: 0.5, from: 1, by: 2 },
  { at: 3.6, from: 3, by: -2 },
]
const MOVE_TIME = 1.2
const SWIPE_PERIOD = 8
const FLICK = 0.24 // the demo's flick only travels this far, yet its speed carries it past the threshold

const FS_HEAD = 'clamp(11px, min(3.1cqh, 2.3cqw), 17px)'
const FS_MAIN = 'clamp(9px, min(2.7cqh, 2.1cqw), 15px)'
const FS_SUB = 'clamp(8px, min(2.2cqh, 1.7cqw), 12.5px)'
const FINGER =
  'pointer-events-none absolute top-1/2 size-[clamp(14px,4.2cqmin,28px)] -translate-y-1/2 rounded-full bg-neutral-900/25 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]'
const HINT = '손잡이를 끌거나, Tab으로 손잡이에 가서 Space · ↑↓ · Space'

type Spring = { x: number; v: number }
type Row = Spring & { lift: number; finger: number }
type MailState = 'rest' | 'drag' | 'open' | 'leaving' | 'collapsing' | 'gone' | 'returning'
type Mail = Spring & { h: number; state: MailState; age: number; mark: number; finger: number }
type Drag = { id: string; pointerId: number; startY: number; rowPx: number; start: number; offset: number; virtual: boolean }
type Swipe = {
  id: string
  pointerId: number
  startX: number
  startY: number
  startDx: number
  rowPx: number
  axis: 'x' | 'y' | null
  samples: { x: number; t: number }[]
  virtual: boolean
}
type Toast = { id: string; text: string }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
const easeOut = (p: number) => 1 - (1 - p) ** 3
/** Frame-rate independent exponential approach. */
const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt))
/** True when a looping phase went past `at` between the previous frame and this one. */
const passed = (prev: number, now: number, at: number) => (prev <= now ? prev < at && at <= now : prev < at || at <= now)
const cover = (hue: number) => `linear-gradient(135deg, hsl(${hue} 75% 66%), hsl(${hue + 40} 62% 44%))`

/** Korean object particle: 을 after a final consonant, 를 after a vowel. */
function eul(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return word + (code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를')
}

/** Damped spring with unit mass, integrated in small fixed slices (semi-implicit Euler). */
function stepSpring(s: Spring, target: number, omega: number, zeta: number, dt: number) {
  for (let left = dt; left > 1e-6; left -= SLICE) {
    const h = Math.min(SLICE, left)
    s.v += (-omega * omega * (s.x - target) - 2 * zeta * omega * s.v) * h
    s.x += s.v * h
  }
}

/** Speed (row widths per second) over the last ~0.1 s of the gesture; 0 if the finger rested before letting go. */
function releaseVelocity(samples: { x: number; t: number }[], now: number) {
  const last = samples[samples.length - 1]
  if (!last || now - last.t > 80) return 0
  const first = samples.find((s) => last.t - s.t <= 100) ?? last
  const dt = (last.t - first.t) / 1000
  return dt > 0.008 ? (last.x - first.x) / dt : 0
}

const newRow = (slot: number): Row => ({ x: slot, v: 0, lift: 0, finger: 0 })
const newMail = (): Mail => ({ x: 0, v: 0, h: 1, state: 'rest', age: 0, mark: 0, finger: 0 })

/**
 * Left: a playlist reordered by dragging (or Space + arrow keys). Right: a phone inbox whose rows
 * swipe left to reveal actions or to delete. Gesture state lives in refs and every frame is
 * stepped with scene time, so pausing freezes a row mid-air.
 */
function DragGesturesScene({ params, paused, thumb = false }: SceneProps) {
  const helpId = useId()
  const box = useRef<HTMLDivElement>(null)
  const els = useRef<Record<string, HTMLElement | null>>({})
  const ref = (key: string) => (node: HTMLElement | null) => {
    els.current[key] = node
  }

  // reorder list
  const order = useRef(ORIGINAL)
  const rows = useRef<Record<string, Row>>(Object.fromEntries(TRACKS.map((t, i) => [t.id, newRow(i)])))
  const drag = useRef<Drag | null>(null)
  const held = useRef<{ id: string; before: string[] } | null>(null) // keyboard grab
  const [slots, setSlots] = useState(ORIGINAL)
  const [grabbed, setGrabbed] = useState<string | null>(null)
  const [listNote, setListNote] = useState('')
  const [live, setLive] = useState('')

  // swipe list
  const mails = useRef<Record<string, Mail>>(Object.fromEntries(MAILS.map((m) => [m.id, newMail()])))
  const swipe = useRef<Swipe | null>(null)
  const [gone, setGone] = useState<string[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const toastRef = useRef<Toast | null>(null)
  const toastAt = useRef(0)

  // time and the self-playing demo
  const clock = useRef(0)
  const lastTouch = useRef(-Infinity)
  const demo = useRef({ on: false, t: 0, prevList: -1, prevSwipe: -1, flickV: 2, flickTime: 0.12 })
  const first = useRef(true)

  const trackOf = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0]
  const say = (text: string, inList = false) => {
    setLive(text)
    if (inList) setListNote(text)
  }

  // ---- reorder ----
  const setOrder = (next: string[]) => {
    order.current = next
    setSlots(next)
  }
  const moveTo = (id: string, slot: number) => {
    const next = order.current.filter((x) => x !== id)
    next.splice(slot, 0, id)
    setOrder(next)
  }
  const drop = (announce: boolean) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (announce) say(`${eul(trackOf(d.id).title)} ${order.current.indexOf(d.id) + 1}번째로 옮겼습니다.`, true)
  }
  const letGo = (announce: boolean) => {
    const h = held.current
    if (!h) return
    held.current = null
    setGrabbed(null)
    if (announce) say(`${eul(trackOf(h.id).title)} ${order.current.indexOf(h.id) + 1}번째에 내려놓았습니다.`, true)
  }

  // ---- swipe ----
  const closeOthers = (id: string) => {
    for (const [key, m] of Object.entries(mails.current)) if (key !== id && m.state === 'open') m.state = 'rest'
  }
  const setSwipeX = (s: Swipe, raw: number, t?: number) => {
    const m = mails.current[s.id]
    // dragging right only stretches a little: there is nothing on that side
    m.x = raw > 0 ? raw * 0.25 : Math.max(raw, -1)
    m.v = 0
    if (t === undefined) return
    s.samples.push({ x: m.x, t })
    while (s.samples.length > 2 && t - s.samples[0].t > 120) s.samples.shift()
  }
  const remove = (id: string, kind: 'delete' | 'archive', v: number, announce: boolean) => {
    const m = mails.current[id]
    m.state = 'leaving'
    m.v = Math.min(v, -2.5)
    const next = { id, text: kind === 'archive' ? '메일 1개를 보관했습니다' : '메일 1개를 삭제했습니다' }
    toastRef.current = next
    toastAt.current = clock.current
    setToast(next)
    const from = MAILS.find((x) => x.id === id)?.from ?? ''
    if (announce) say(`${from}의 메일을 ${kind === 'archive' ? '보관했습니다' : '삭제했습니다'}. 실행 취소할 수 있습니다.`)
  }
  /** Decide what a let-go row does: past the threshold (counting its speed) it goes, otherwise it rests open or closed. */
  const release = (id: string, v: number, announce: boolean) => {
    const m = mails.current[id]
    if (m.state !== 'drag') return
    const reach = -(m.x + v * PROJECT)
    if (reach >= params.swipeThreshold / 100) remove(id, 'delete', v, announce)
    else {
      m.state = reach >= OPEN * 0.5 ? 'open' : 'rest'
      m.v = v
    }
  }
  const restore = (id: string) => {
    const m = mails.current[id]
    if (m.state === 'rest' || m.state === 'open' || m.state === 'drag' || m.state === 'returning') return
    Object.assign(m, { state: 'returning', age: 0, x: 0, v: 0 })
    setGone((g) => g.filter((x) => x !== id))
  }
  const undo = (announce: boolean) => {
    const t = toastRef.current
    if (!t) return
    restore(t.id)
    toastRef.current = null
    setToast(null)
    if (announce) say('되돌렸습니다.')
  }
  const restoreAll = () => {
    for (const [id, m] of Object.entries(mails.current)) {
      if (m.state === 'open') m.state = 'rest'
      else restore(id)
    }
    toastRef.current = null
    setToast(null)
  }

  // ---- demo ----
  const stopDemo = () => {
    const d = demo.current
    if (!d.on) return
    d.on = false
    if (drag.current?.virtual) drop(false)
    const s = swipe.current
    if (s?.virtual) {
      swipe.current = null
      release(s.id, 0, false)
    }
  }
  const touched = () => {
    lastTouch.current = clock.current
    stopDemo()
  }
  const keyboardInside = () => {
    const a = document.activeElement
    if (!a || !box.current?.contains(a)) return false
    try {
      return a.matches(':focus-visible')
    } catch {
      return true
    }
  }
  const startVirtualSwipe = (id: string | undefined) => {
    if (!id) return
    closeOthers(id)
    const m = mails.current[id]
    m.state = 'drag'
    swipe.current = { id, pointerId: -1, startX: 0, startY: 0, startDx: m.x, rowPx: 1, axis: 'x', samples: [], virtual: true }
  }
  const endVirtualSwipe = (v: number) => {
    const s = swipe.current
    if (!s?.virtual) return
    swipe.current = null
    release(s.id, v, false)
  }
  const restingMail = (n: number) => MAILS.map((m) => m.id).filter((id) => mails.current[id].state === 'rest')[n]

  const runDemo = (dt: number) => {
    const d = demo.current
    const busy = held.current || (drag.current && !drag.current.virtual) || (swipe.current && !swipe.current.virtual) || keyboardInside()
    if (!thumb && (busy || clock.current - lastTouch.current <= AUTO_AFTER)) {
      stopDemo()
      return
    }
    if (!d.on) {
      Object.assign(d, { on: true, t: 0, prevList: -1, prevSwipe: -1 })
      setListNote('')
    } else d.t += dt

    // list: lift a song, carry it two places down; later carry it back up
    const pl = d.t % LIST_PERIOD
    if (passed(d.prevList, pl, 0) && order.current.join() !== ORIGINAL.join()) setOrder(ORIGINAL)
    for (const m of LIST_MOVES) {
      if (passed(d.prevList, pl, m.at)) {
        drop(false)
        const id = order.current[m.from]
        drag.current = { id, pointerId: -1, startY: 0, rowPx: 1, start: rows.current[id].x, offset: 0, virtual: true }
      }
      const p = (pl - m.at) / MOVE_TIME
      if (drag.current?.virtual && p >= 0 && p <= 1.2) drag.current.offset = m.by * easeInOut(clamp(p, 0, 1))
      if (passed(d.prevList, pl, m.at + MOVE_TIME + 0.2)) drop(false)
    }

    // inbox: a slow swipe that rests open, a tap that closes it, a short quick flick that deletes, then undo
    const ps = d.t % SWIPE_PERIOD
    if (passed(d.prevSwipe, ps, 0)) restoreAll()
    if (passed(d.prevSwipe, ps, 0.7)) startVirtualSwipe(restingMail(0))
    if (passed(d.prevSwipe, ps, 3.7)) {
      d.flickV = Math.max(1.6, (params.swipeThreshold / 100 + 0.06 - FLICK) / PROJECT)
      d.flickTime = FLICK / d.flickV
      startVirtualSwipe(restingMail(1))
    }
    const s = swipe.current
    if (s?.virtual) {
      if (ps >= 0.7 && ps < 1.7) setSwipeX(s, -0.3 * easeInOut(clamp((ps - 0.7) / 0.8, 0, 1)))
      if (ps >= 3.7) setSwipeX(s, -d.flickV * Math.min(ps - 3.7, d.flickTime))
    }
    if (passed(d.prevSwipe, ps, 1.7)) endVirtualSwipe(0)
    if (passed(d.prevSwipe, ps, 2.9)) {
      for (const m of Object.values(mails.current)) {
        if (m.state !== 'open') continue
        m.state = 'rest'
        m.finger = 1 // show the tap
      }
    }
    if (passed(d.prevSwipe, ps, 3.7 + d.flickTime)) endVirtualSwipe(-d.flickV)
    if (passed(d.prevSwipe, ps, 5.8)) undo(false)

    d.prevList = pl
    d.prevSwipe = ps
  }

  // ---- one simulation step ----
  const step = (dt: number) => {
    clock.current += dt
    runDemo(dt)
    const zeta = 1 - params.bounce

    const d = drag.current
    if (d) {
      // the held row sits exactly under the finger; the order changes once it passes half a row
      const r = rows.current[d.id]
      r.x = clamp(d.start + d.offset, -0.4, N - 0.6)
      r.v = 0
      const want = clamp(Math.round(r.x), 0, N - 1)
      if (order.current.indexOf(d.id) !== want) moveTo(d.id, want)
    }
    order.current.forEach((id, slot) => {
      const r = rows.current[id]
      if (d?.id !== id) stepSpring(r, slot, LIST_OMEGA, zeta, dt)
      r.lift = approach(r.lift, d?.id === id || held.current?.id === id ? 1 : 0, 16, dt)
      r.finger = approach(r.finger, d?.virtual && d.id === id ? 1 : 0, 12, dt)
    })

    const s = swipe.current
    for (const [id, m] of Object.entries(mails.current)) {
      m.mark = approach(m.mark, m.state === 'drag' ? 1 : 0, 14, dt)
      m.finger = approach(m.finger, s?.virtual && s.id === id ? 1 : 0, 10, dt)
      if (m.state === 'rest') stepSpring(m, 0, SWIPE_OMEGA, zeta, dt)
      else if (m.state === 'open') stepSpring(m, -OPEN, SWIPE_OMEGA, zeta, dt)
      else if (m.state === 'leaving') {
        stepSpring(m, -1.3, 14, 1, dt)
        if (m.x <= -1.02) Object.assign(m, { state: 'collapsing', age: 0 })
      } else if (m.state === 'collapsing') {
        m.age += dt
        m.h = 1 - easeInOut(clamp(m.age / COLLAPSE, 0, 1))
        if (m.age >= COLLAPSE) {
          Object.assign(m, { state: 'gone', h: 0 })
          setGone((g) => (g.includes(id) ? g : [...g, id]))
        }
      } else if (m.state === 'returning') {
        m.age += dt
        m.h = Math.max(m.h, easeOut(clamp(m.age / COLLAPSE, 0, 1)))
        if (m.age >= COLLAPSE) Object.assign(m, { state: 'rest', h: 1 })
      }
    }

    if (toastRef.current && clock.current - toastAt.current > TOAST_FOR) {
      toastRef.current = null
      setToast(null)
    }
  }

  // ---- write the frame into the DOM ----
  const paint = () => {
    const E = els.current
    for (const t of TRACKS) {
      const r = rows.current[t.id]
      const li = E[`row-${t.id}`]
      const card = E[`card-${t.id}`]
      const finger = E[`rowFinger-${t.id}`]
      const onTop = drag.current?.id === t.id || held.current?.id === t.id
      if (li) {
        li.style.transform = `translateY(${(r.x * 100).toFixed(2)}%) scale(${(1 + 0.04 * r.lift).toFixed(4)}) rotate(${(-0.8 * r.lift).toFixed(3)}deg)`
        li.style.zIndex = onTop ? '3' : r.lift > 0.02 ? '2' : '1'
      }
      if (card) card.style.boxShadow = `0 ${(1 + 12 * r.lift).toFixed(1)}px ${(3 + 26 * r.lift).toFixed(1)}px rgba(28, 24, 48, ${(0.07 + 0.17 * r.lift).toFixed(3)})`
      if (finger) finger.style.opacity = r.finger.toFixed(3)
    }

    const T = params.swipeThreshold / 100
    let top = 0
    for (const mail of MAILS) {
      const m = mails.current[mail.id]
      const wrap = E[`mail-${mail.id}`]
      const inner = E[`mailInner-${mail.id}`]
      const fg = E[`mailFg-${mail.id}`]
      const archive = E[`archive-${mail.id}`]
      const archiveLabel = E[`archiveLabel-${mail.id}`]
      const del = E[`delete-${mail.id}`]
      const delLabel = E[`deleteLabel-${mail.id}`]
      const marker = E[`marker-${mail.id}`]
      const finger = E[`mailFinger-${mail.id}`]
      if (wrap) {
        wrap.style.top = `${top.toFixed(3)}%`
        wrap.style.height = `${(m.h * ROW_PCT).toFixed(3)}%`
      }
      // the content keeps its full height while the row closes over it
      if (inner) inner.style.height = `${(100 / Math.max(m.h, 0.02)).toFixed(2)}%`
      if (fg) fg.style.transform = `translateX(${(m.x * 100).toFixed(2)}%)`

      // the revealed strip is split between the two buttons; past "open" the delete button
      // swallows archive, and past the threshold it fills the whole strip
      const R = Math.max(0, -m.x)
      let wa = R / 2
      let wd = R / 2
      if (R > OPEN) {
        const k = clamp((R - OPEN) / Math.max(0.01, T - OPEN), 0, 1)
        wa = (OPEN / 2) * (1 - k)
        wd = R - wa
      }
      const past = R >= T
      if (archive) {
        archive.style.right = `${(wd * 100).toFixed(2)}%`
        archive.style.width = `${(wa * 100).toFixed(2)}%`
      }
      if (archiveLabel) archiveLabel.style.opacity = clamp((wa - 0.05) / 0.08, 0, 1).toFixed(3)
      if (del) {
        del.style.width = `${(wd * 100).toFixed(2)}%`
        // past the threshold the label rides along the row's edge, like a full swipe on iOS
        del.style.justifyContent = past ? 'flex-start' : 'center'
        del.style.paddingLeft = past ? '4%' : '0'
      }
      if (delLabel) {
        delLabel.style.opacity = clamp((wd - 0.05) / 0.08, 0, 1).toFixed(3)
        delLabel.style.scale = past ? '1.15' : '1'
      }
      if (marker) {
        marker.style.left = `${((1 - T) * 100).toFixed(2)}%`
        marker.style.opacity = m.mark.toFixed(3)
      }
      if (finger) finger.style.opacity = m.finger.toFixed(3)
      top += m.h * ROW_PCT
    }

    const toastEl = E.toast
    if (toastEl) {
      const age = clock.current - toastAt.current
      const enter = easeOut(clamp(age / 0.3, 0, 1))
      toastEl.style.transform = `translateY(${((1 - enter) * 140).toFixed(1)}%)`
      toastEl.style.opacity = Math.min(enter, clamp((TOAST_FOR - age) / 0.3, 0, 1)).toFixed(3)
    }
  }

  useLoop(
    box,
    ({ delta }) => {
      if (first.current) {
        first.current = false
        // a paused page only ever shows this frame: let it catch the demo mid-gesture
        if (paused) for (let i = 0; i < Math.round(POSTER * 60); i++) step(1 / 60)
      }
      step(delta)
      paint()
    },
    {
      paused,
      speed: params.speed ?? 1,
      redrawKey: `${JSON.stringify(params)}|${slots.join()}|${gone.join()}|${toast?.id ?? ''}|${grabbed ?? ''}`,
    },
  )

  // ---- input: reorder ----
  const onRowDown = (e: PointerEvent<HTMLLIElement>, id: string) => {
    if (thumb || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    // on touch only the handle drags, so the rest of the row still scrolls the page
    if (e.pointerType === 'touch' && !(e.target as Element).closest('[data-handle]')) return
    touched()
    letGo(false)
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      id,
      pointerId: e.pointerId,
      startY: e.clientY,
      rowPx: Math.max(1, e.currentTarget.offsetHeight),
      start: rows.current[id].x,
      offset: 0,
      virtual: false,
    }
  }
  const onRowMove = (e: PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    if (d && !d.virtual && d.pointerId === e.pointerId) d.offset = (e.clientY - d.startY) / d.rowPx
  }
  const onRowUp = (e: PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    if (d && !d.virtual && d.pointerId === e.pointerId) drop(true)
  }
  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const h = held.current
    const title = trackOf(id).title
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (e.repeat) return
      touched()
      if (h?.id === id) letGo(true)
      else {
        held.current = { id, before: [...order.current] }
        setGrabbed(id)
        say(
          `${eul(title)} 들었습니다. 지금 ${order.current.indexOf(id) + 1}번째, 전체 ${N}개. 위아래 화살표로 옮기고 Space로 내려놓으세요.`,
          true,
        )
      }
    } else if (h?.id === id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      touched()
      const to = clamp(order.current.indexOf(id) + (e.key === 'ArrowUp' ? -1 : 1), 0, N - 1)
      moveTo(id, to)
      say(`${to + 1}번째로 옮겼습니다.`, true)
    } else if (h?.id === id && e.key === 'Escape') {
      e.preventDefault()
      touched()
      setOrder(h.before)
      held.current = null
      setGrabbed(null)
      say(`취소했습니다. ${eul(title)} 원래 자리로 돌려놓았습니다.`, true)
    }
  }

  // ---- input: swipe ----
  const onMailDown = (e: PointerEvent<HTMLDivElement>, id: string) => {
    const m = mails.current[id]
    if (thumb || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    if (m.state !== 'rest' && m.state !== 'open') return
    touched()
    closeOthers(id)
    e.currentTarget.setPointerCapture(e.pointerId)
    swipe.current = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startDx: m.x,
      rowPx: Math.max(1, e.currentTarget.offsetWidth),
      axis: null,
      samples: [{ x: m.x, t: e.timeStamp }],
      virtual: false,
    }
  }
  const onMailMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current
    if (!s || s.virtual || s.pointerId !== e.pointerId) return
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    if (!s.axis) {
      // wait until the direction is clear: sideways is ours, up and down belongs to scrolling
      if (Math.hypot(dx, dy) < 6) return
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (s.axis === 'x') mails.current[s.id].state = 'drag'
    }
    if (s.axis === 'x') setSwipeX(s, s.startDx + dx / s.rowPx, e.timeStamp)
  }
  const onMailUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current
    if (!s || s.virtual || s.pointerId !== e.pointerId) return
    swipe.current = null
    const m = mails.current[s.id]
    if (s.axis === 'x') release(s.id, e.type === 'pointercancel' ? 0 : releaseVelocity(s.samples, e.timeStamp), true)
    else if (!s.axis && m.state === 'open') m.state = 'rest' // a tap closes an open row
  }
  // keyboard users reach the buttons with Tab: focusing one opens its row
  const onActionsFocus = (id: string) => {
    touched()
    const m = mails.current[id]
    if (m.state !== 'rest') return
    closeOthers(id)
    m.state = 'open'
  }
  const onActionsBlur = (e: FocusEvent<HTMLDivElement>, id: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    const m = mails.current[id]
    if (m.state === 'open') m.state = 'rest'
  }

  const tab = thumb ? -1 : 0
  const panel = 'flex min-h-0 min-w-0 flex-1 flex-col justify-center'

  return (
    <div
      ref={box}
      className="@container size-full overflow-hidden bg-[#ebe9e3] font-sans text-neutral-900 select-none"
      style={{ containerType: 'size' }}
    >
      <div className={cn('flex size-full gap-[clamp(6px,2cqmin,20px)] p-[clamp(6px,2.4cqmin,22px)]', thumb ? 'flex-row' : 'flex-col @lg:flex-row')}>
        {/* reorder */}
        <section aria-label="끌어서 순서 바꾸기" className={cn(panel, 'gap-[clamp(3px,1.2cqh,10px)]')}>
          {!thumb && (
            <div className="flex items-baseline justify-between gap-2 px-1">
              <p className="font-semibold" style={{ fontSize: FS_HEAD }}>
                내 재생목록
              </p>
              <p className="truncate text-neutral-500" style={{ fontSize: FS_SUB }}>
                끌어서 순서 바꾸기
              </p>
            </div>
          )}
          <ol aria-label="재생목록" className="relative max-h-[22rem] min-h-0 w-full flex-1">
            {TRACKS.map((t, i) => (
              <li
                key={t.id}
                ref={ref(`row-${t.id}`)}
                aria-posinset={slots.indexOf(t.id) + 1}
                aria-setsize={N}
                className="absolute inset-x-0 top-0 cursor-grab py-[clamp(2px,0.6cqh,5px)] active:cursor-grabbing"
                style={{ height: `${100 / N}%`, transform: `translateY(${i * 100}%)`, touchAction: 'pan-y' }}
                onPointerDown={(e) => onRowDown(e, t.id)}
                onPointerMove={onRowMove}
                onPointerUp={onRowUp}
                onPointerCancel={onRowUp}
              >
                <div
                  ref={ref(`card-${t.id}`)}
                  className={cn(
                    'relative flex h-full items-center gap-[3%] rounded-[clamp(6px,1.4cqmin,12px)] bg-white pr-[4%] ring-1 ring-black/5',
                    grabbed === t.id && 'ring-2 ring-violet-500',
                  )}
                >
                  <button
                    type="button"
                    data-handle
                    tabIndex={tab}
                    aria-label={`${t.title} 옮기기, ${slots.indexOf(t.id) + 1}번째`}
                    aria-describedby={helpId}
                    aria-pressed={grabbed === t.id}
                    onKeyDown={(e) => onHandleKey(e, t.id)}
                    onBlur={() => {
                      if (held.current?.id === t.id) letGo(true)
                    }}
                    className="grid h-full w-[clamp(18px,8%,34px)] shrink-0 cursor-grab place-items-center rounded-l-[inherit] text-neutral-400 outline-none focus-visible:bg-violet-50 focus-visible:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-400"
                    style={{ touchAction: 'none' }}
                  >
                    <GripVerticalIcon className="size-[clamp(12px,3cqmin,18px)]" />
                  </button>
                  <span aria-hidden className="aspect-square h-[62%] shrink-0 rounded-[22%]" style={{ background: cover(t.hue) }} />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate font-semibold" style={{ fontSize: FS_MAIN }}>
                      {t.title}
                    </span>
                    <span className="truncate text-neutral-500" style={{ fontSize: FS_SUB }}>
                      {t.artist}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-neutral-400 tabular-nums" style={{ fontSize: FS_SUB }}>
                    {t.length}
                  </span>
                  <span ref={ref(`rowFinger-${t.id}`)} aria-hidden className={FINGER} style={{ left: '1.5%', opacity: 0 }} />
                </div>
              </li>
            ))}
          </ol>
          {!thumb && (
            <p aria-hidden className="truncate px-1 text-neutral-500" style={{ fontSize: FS_SUB }}>
              {listNote || HINT}
            </p>
          )}
        </section>

        {/* swipe */}
        <section aria-label="밀어서 삭제" className={cn(panel, 'items-center')}>
          <div className="flex h-full max-h-[34rem] w-full max-w-[26rem] flex-col overflow-hidden rounded-[clamp(12px,3.5cqmin,30px)] border-[clamp(3px,0.9cqmin,7px)] border-neutral-900 bg-white shadow-xl">
            {!thumb && (
              <>
                <div className="flex items-baseline justify-between px-[5%] pt-[clamp(5px,2cqh,16px)] pb-[clamp(2px,0.6cqh,6px)]">
                  <p className="font-semibold" style={{ fontSize: FS_HEAD }}>
                    받은 편지함
                  </p>
                  <p className="text-neutral-500 tabular-nums" style={{ fontSize: FS_SUB }}>
                    {MAILS.length - gone.length}개
                  </p>
                </div>
                <p className="truncate px-[5%] pb-[clamp(3px,1cqh,8px)] text-neutral-500" style={{ fontSize: FS_SUB }}>
                  왼쪽으로 밀기 · 짧아도 빠르게 튕기면 삭제
                </p>
              </>
            )}
            <div className="relative min-h-0 flex-1 border-t border-neutral-100">
              {MAILS.map((m, i) => {
                const isGone = gone.includes(m.id)
                return (
                  <div
                    key={m.id}
                    ref={ref(`mail-${m.id}`)}
                    inert={isGone}
                    aria-hidden={isGone || undefined}
                    className="absolute inset-x-0 overflow-hidden"
                    style={{ top: `${i * ROW_PCT}%`, height: `${ROW_PCT}%` }}
                  >
                    <div ref={ref(`mailInner-${m.id}`)} className="absolute inset-x-0 top-0 h-full">
                      <div
                        className="absolute inset-0 overflow-hidden bg-neutral-100"
                        onFocus={() => onActionsFocus(m.id)}
                        onBlur={(e) => onActionsBlur(e, m.id)}
                      >
                        <button
                          ref={ref(`archive-${m.id}`)}
                          type="button"
                          tabIndex={tab}
                          aria-label={`${m.from}의 메일 보관`}
                          onClick={() => {
                            touched()
                            remove(m.id, 'archive', 0, true)
                          }}
                          className="absolute inset-y-0 flex items-center justify-center overflow-hidden bg-amber-500 text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
                          style={{ right: 0, width: 0 }}
                        >
                          <span ref={ref(`archiveLabel-${m.id}`)} className="flex flex-col items-center gap-0.5 whitespace-nowrap" style={{ fontSize: FS_SUB }}>
                            <ArchiveIcon className="size-[clamp(11px,3cqmin,18px)]" />
                            보관
                          </span>
                        </button>
                        <button
                          ref={ref(`delete-${m.id}`)}
                          type="button"
                          tabIndex={tab}
                          aria-label={`${m.from}의 메일 삭제`}
                          onClick={() => {
                            touched()
                            remove(m.id, 'delete', 0, true)
                          }}
                          className="absolute inset-y-0 right-0 flex items-center justify-center overflow-hidden bg-rose-500 text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
                          style={{ width: 0 }}
                        >
                          <span ref={ref(`deleteLabel-${m.id}`)} className="flex flex-col items-center gap-0.5 whitespace-nowrap" style={{ fontSize: FS_SUB }}>
                            <Trash2Icon className="size-[clamp(11px,3cqmin,18px)]" />
                            삭제
                          </span>
                        </button>
                        {/* the threshold: let go beyond this line (or flick toward it) and the row is deleted */}
                        <span
                          ref={ref(`marker-${m.id}`)}
                          aria-hidden
                          className="pointer-events-none absolute inset-y-[14%] border-l-2 border-dashed border-white/90"
                          style={{ left: '40%', opacity: 0 }}
                        >
                          {!thumb && (
                            <span className="absolute -top-[2px] left-1 text-[10px] leading-none font-semibold text-white">기준</span>
                          )}
                        </span>
                      </div>
                      <div
                        ref={ref(`mailFg-${m.id}`)}
                        className="absolute inset-0 flex cursor-grab items-center gap-[3.5%] border-b border-neutral-100 bg-white px-[4.5%] active:cursor-grabbing"
                        style={{ touchAction: 'pan-y' }}
                        onPointerDown={(e) => onMailDown(e, m.id)}
                        onPointerMove={onMailMove}
                        onPointerUp={onMailUp}
                        onPointerCancel={onMailUp}
                      >
                        <span
                          aria-hidden
                          className="grid aspect-square h-[54%] shrink-0 place-items-center rounded-full font-semibold text-white"
                          style={{ background: `hsl(${m.hue} 55% 52%)`, fontSize: FS_SUB }}
                        >
                          {m.from[0]}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col leading-tight">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold" style={{ fontSize: FS_MAIN }}>
                              {m.from}
                            </span>
                            <span className="shrink-0 text-neutral-400" style={{ fontSize: FS_SUB }}>
                              {m.time}
                            </span>
                          </span>
                          <span className="truncate text-neutral-500" style={{ fontSize: FS_SUB }}>
                            {m.subject}
                          </span>
                        </span>
                        <span ref={ref(`mailFinger-${m.id}`)} aria-hidden className={FINGER} style={{ right: '16%', opacity: 0 }} />
                      </div>
                    </div>
                  </div>
                )
              })}

              {gone.length === MAILS.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500" style={{ fontSize: FS_SUB }}>
                  <p>편지함을 모두 정리했습니다</p>
                  <button
                    type="button"
                    tabIndex={tab}
                    onClick={() => {
                      touched()
                      restoreAll()
                    }}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    다시 채우기
                  </button>
                </div>
              )}

              {toast && (
                <div
                  ref={ref('toast')}
                  className="absolute inset-x-[4%] bottom-[3%] flex items-center justify-between gap-2 rounded-[clamp(6px,1.5cqmin,12px)] bg-neutral-900 px-[4%] py-[clamp(4px,1.4cqh,10px)] text-white shadow-lg"
                  style={{ fontSize: FS_SUB, opacity: 0 }}
                >
                  <span className="truncate">{toast.text}</span>
                  <button
                    type="button"
                    tabIndex={tab}
                    onClick={() => {
                      touched()
                      undo(true)
                    }}
                    className="shrink-0 rounded font-semibold text-amber-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    실행 취소
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="sr-only" aria-live="assertive">
        {live}
      </p>
      <p id={helpId} className="sr-only">
        Space나 Enter로 들고, 위아래 화살표로 옮긴 뒤 다시 Space로 내려놓습니다. Esc를 누르면 취소합니다.
      </p>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'drag-gestures',
  group: 'motion',
  name: '드래그와 스와이프',
  englishName: 'Drag & Swipe Gestures',
  aliases: ['Drag and drop', 'Drag to reorder', 'Swipe to delete', '끌어서 놓기', '밀어서 삭제'],
  description: '목록의 항목을 손으로 집어 순서를 바꾸고, 옆으로 밀어 지우는 동안 화면이 손끝을 그대로 따라오는 애니메이션',
  context: '할 일·재생목록 앱의 순서 바꾸기, 메일·메신저 목록의 밀어서 삭제·보관처럼 손으로 직접 만지는 목록에서 만납니다.',
  technique: 'DOM·CSS',
  interaction:
    '왼쪽 목록은 끌어서 순서를 바꾸고(키보드는 손잡이에서 Space → ↑↓ → Space), 오른쪽 메일은 왼쪽으로 밀거나 짧게 휙 튕겨 보세요.',
  traits: [
    {
      title: '손끝에 붙어 있다가 자리를 찾음',
      description:
        '끄는 동안에는 애니메이션 없이 손 위치에 바로 붙어 있습니다. 집은 항목은 그림자와 함께 살짝 커져 "들렸다"를 보여 주고, 나머지는 스프링으로 비켜서며 자리를 만듭니다.',
    },
    {
      title: '끌던 속도를 놓을 때 이어받음(관성)',
      description:
        '놓는 순간 거리만 보지 않고 끌던 속도로 조금 더 갔을 위치까지 계산해 판단합니다. 그래서 짧아도 빠르게 튕기면 삭제되고, 모자라면 탄성 있게 제자리로 돌아옵니다.',
    },
    {
      title: '손이 아니어도 할 수 있게',
      description:
        '같은 일을 키보드(Space로 들고 ↑↓로 옮기기)와 버튼(보관·삭제)으로도 할 수 있어야 하고, 지우는 동작에는 실행 취소를 함께 둡니다.',
    },
  ],
  params: [
    { key: 'swipeThreshold', label: '스와이프 기준 거리', min: 45, max: 90, step: 5, default: 60, unit: '%' },
    { key: 'bounce', label: '되돌아오는 탄성', min: 0, max: 0.8, step: 0.05, default: 0.4 },
  ],
  Scene: DragGesturesScene,
}
