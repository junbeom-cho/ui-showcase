import { useEffect, useRef, type CSSProperties, type FocusEvent, type PointerEvent } from 'react'
import { MagnetIcon, MousePointer2Icon, SparklesIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { noise2 } from '../engine/noise'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const ACCENT = '#c8ff5a'
const MAX_TRAIL = 24
const HISTORY = 64 // pointer samples kept for the trail
const SAMPLE = 1 / 60 // trail sample spacing in scene seconds
const TRAIL_GAP = 2 // samples between two trail dots
const SLICE = 1 / 240
const SEG = 1.7 // seconds the virtual pointer spends around each stop
const LINGER = 1.2 // after the mouse leaves, the virtual pointer waits this long before wandering
const POSTER = 1.0 // a paused scene is drawn this far in: the virtual pointer has just reached a button

const LINKS = ['소개', '기능', '가격']
const MAGNETS = ['cta', 'primary', 'secondary'] as const
const HOVERS = ['link0', 'link1', 'link2', 'cta', 'primary', 'secondary']
const CARDS = [
  { key: 'card0', title: '따라오는 링', body: '남은 거리의 일부만 매 프레임 다가갑니다', Icon: MousePointer2Icon },
  { key: 'card1', title: '자석 버튼', body: '가까이 가면 버튼이 커서 쪽으로 끌려옵니다', Icon: MagnetIcon },
  { key: 'card2', title: '스포트라이트', body: '빛의 중심이 커서 위치를 따라 번집니다', Icon: SparklesIcon },
] as const
const PATH = ['primary', 'secondary', 'card0', 'card1', 'card2', 'cta', 'link1']
const MEASURED = [...HOVERS, ...CARDS.map((c) => c.key)]

const FS = {
  nav: 'clamp(9px, min(2.6cqh, 1.6cqw), 15px)',
  eyebrow: 'clamp(7px, min(2cqh, 1.3cqw), 12px)',
  title: 'clamp(16px, min(8.5cqh, 6.5cqw), 52px)',
  body: 'clamp(10px, min(2.8cqh, 1.9cqw), 16px)',
  button: 'clamp(9px, min(2.7cqh, 1.8cqw), 15px)',
  cardTitle: 'clamp(9px, min(2.7cqh, 1.8cqw), 15px)',
  cardBody: 'clamp(8px, min(2.2cqh, 1.5cqw), 13px)',
}

type Rect = { x: number; y: number; w: number; h: number }
type Body = { x: number; y: number; vx: number; vy: number }
type State = {
  first: boolean
  frames: number
  clock: number
  w: number
  h: number
  /** element boxes relative to the stage, without the magnet offsets */
  rects: Record<string, Rect>
  path: string[]
  real: { x: number; y: number; active: boolean; down: boolean; kind: string }
  wasReal: boolean
  idleSince: number
  pathT: number
  virt: Body
  /** the pointer every effect reacts to: the real one, or the virtual one when there is none */
  px: number
  py: number
  ring: { x: number; y: number; scale: number; fill: number }
  trail: Float32Array
  head: number
  count: number
  sinceSample: number
  magnets: Record<string, Body>
  glow: Record<string, number>
  focus: string | null
}

const body = (): Body => ({ x: 0, y: 0, vx: 0, vy: 0 })
const newState = (): State => ({
  first: true,
  frames: 0,
  clock: 0,
  w: 0,
  h: 0,
  rects: {},
  path: [],
  real: { x: 0, y: 0, active: false, down: false, kind: 'mouse' },
  wasReal: false,
  idleSince: -Infinity,
  pathT: 0,
  virt: body(),
  px: 0,
  py: 0,
  ring: { x: 0, y: 0, scale: 1, fill: 0 },
  trail: new Float32Array(HISTORY * 2),
  head: 0,
  count: 0,
  sinceSample: 0,
  magnets: Object.fromEntries(MAGNETS.map((k) => [k, body()])),
  glow: Object.fromEntries(CARDS.map((c) => [c.key, 0])),
  focus: null,
})

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt))
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** 2D damped spring toward (tx, ty), integrated in small fixed slices. */
function spring(p: Body, tx: number, ty: number, omega: number, zeta: number, dt: number) {
  for (let left = dt; left > 1e-6; left -= SLICE) {
    const h = Math.min(SLICE, left)
    p.vx += (-omega * omega * (p.x - tx) - 2 * zeta * omega * p.vx) * h
    p.vy += (-omega * omega * (p.y - ty) - 2 * zeta * omega * p.vy) * h
    p.x += p.vx * h
    p.y += p.vy * h
  }
}

const inside = (r: Rect | undefined, x: number, y: number, pad = 0) =>
  !!r && r.w > 0 && x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad

/** Where the virtual pointer heads: the focused element, else a slow wander around one stop after another. */
function virtualTarget(s: State) {
  if (s.clock - s.idleSince < LINGER) return { x: s.virt.x, y: s.virt.y }
  const focused = s.focus ? s.rects[s.focus] : undefined
  if (focused) return { x: focused.x + focused.w / 2, y: focused.y + focused.h / 2 }
  if (!s.path.length) {
    // nothing measured yet: a loop across the stage
    return { x: s.w * (0.5 + 0.32 * Math.sin(s.pathT * 0.6)), y: s.h * (0.5 + 0.28 * Math.sin(s.pathT * 0.95)) }
  }
  const seg = Math.floor(s.pathT / SEG)
  const key = s.path[seg % s.path.length]
  const r = s.rects[key]
  // over a card it roams across the surface; over a button it stays near the middle
  const amp = key.startsWith('card') ? 0.7 : 0.35
  return {
    x: r.x + r.w * (0.5 + amp * noise2(s.pathT * 0.5, seg * 7.3)),
    y: r.y + r.h * (0.5 + amp * noise2(seg * 3.1 + 11, s.pathT * 0.5)),
  }
}

/**
 * A small dark landing page with a custom cursor (exact dot + lagging ring), a trail,
 * magnetic buttons and spotlight cards. Every effect reads one pointer: the real mouse
 * when it is over the stage, otherwise a virtual one that wanders between the parts.
 */
function CursorEffectsScene({ params, paused, thumb = false }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const els = useRef<Record<string, HTMLElement | null>>({})
  const st = useRef<State | null>(null)
  st.current ??= newState()
  const ref = (key: string) => (node: HTMLElement | null) => {
    els.current[key] = node
  }

  const measure = () => {
    const root = box.current
    const s = st.current
    if (!root || !s) return
    const rb = root.getBoundingClientRect()
    s.w = rb.width
    s.h = rb.height
    for (const key of MEASURED) {
      const el = els.current[key]
      if (!el) continue
      const r = el.getBoundingClientRect()
      const off = s.magnets[key]
      s.rects[key] = { x: r.left - rb.left - (off?.x ?? 0), y: r.top - rb.top - (off?.y ?? 0), w: r.width, h: r.height }
    }
    s.path = PATH.filter((k) => (s.rects[k]?.w ?? 0) > 0)
  }

  const step = (s: State, dt: number) => {
    s.clock += dt
    const useReal = !thumb && s.real.active
    if (useReal) {
      s.px = s.real.x
      s.py = s.real.y
    } else {
      if (s.wasReal) {
        // the mouse just left: the virtual pointer takes over from where it was
        s.virt = { x: s.px, y: s.py, vx: 0, vy: 0 }
        s.idleSince = s.clock
      }
      const t = virtualTarget(s)
      if (s.clock - s.idleSince >= LINGER) s.pathT += dt
      spring(s.virt, t.x, t.y, 7, 0.8, dt)
      s.px = s.virt.x
      s.py = s.virt.y
    }
    s.wasReal = useReal

    // the ring: linear interpolation, the same share of the remaining distance every 1/60 s
    const share = 1 - Math.pow(1 - clamp(params.follow, 0.001, 1), dt * 60)
    s.ring.x += (s.px - s.ring.x) * share
    s.ring.y += (s.py - s.ring.y) * share
    const overButton = HOVERS.some((k) => inside(s.rects[k], s.px, s.py, 4))
    const overCard = CARDS.some((c) => inside(s.rects[c.key], s.px, s.py))
    const press = s.real.down && useReal ? 0.8 : 1
    s.ring.scale = approach(s.ring.scale, (overButton ? 1.9 : overCard ? 1.3 : 1) * press, 14, dt)
    s.ring.fill = approach(s.ring.fill, overButton ? 1 : 0, 14, dt)

    // magnetic buttons: pulled a share of the way toward the pointer, sprung back (a little wobbly) when it leaves
    const reachBase = Math.min(s.w, s.h) * 0.12
    for (const key of MAGNETS) {
      const r = s.rects[key]
      const m = s.magnets[key]
      if (!r || r.w === 0) continue
      const dx = s.px - (r.x + r.w / 2)
      const dy = s.py - (r.y + r.h / 2)
      const reach = Math.max(r.w, r.h) / 2 + reachBase
      const pull = params.magnet * 0.45 * (1 - smoothstep(reach * 0.45, reach, Math.hypot(dx, dy)))
      spring(m, dx * pull, dy * pull, 16, 0.32, dt)
    }

    // spotlight cards: brighter the closer the pointer is
    for (const { key } of CARDS) {
      const r = s.rects[key]
      if (!r) continue
      const ox = Math.max(r.x - s.px, 0, s.px - r.x - r.w)
      const oy = Math.max(r.y - s.py, 0, s.py - r.y - r.h)
      s.glow[key] = approach(s.glow[key], 1 - smoothstep(0, reachBase * 1.6 + 30, Math.hypot(ox, oy)), 10, dt)
    }

    // trail history, sampled at a fixed scene-time rate
    s.sinceSample += dt
    for (let n = 0; s.sinceSample >= SAMPLE && n < HISTORY; n++) {
      s.sinceSample -= SAMPLE
      s.trail[s.head * 2] = s.px
      s.trail[s.head * 2 + 1] = s.py
      s.head = (s.head + 1) % HISTORY
      s.count = Math.min(HISTORY, s.count + 1)
    }
    if (s.sinceSample > SAMPLE) s.sinceSample = 0
  }

  const paint = (s: State) => {
    const E = els.current
    // the real cursor is hidden only while the mouse is over a playing stage
    box.current?.toggleAttribute('data-hide-cursor', !paused && !thumb && s.real.active && s.real.kind !== 'touch')

    const dot = E.dot
    if (dot) dot.style.transform = `translate(${s.px.toFixed(1)}px, ${s.py.toFixed(1)}px) translate(-50%, -50%) scale(${s.real.down ? 0.6 : 1})`
    const ring = E.ring
    if (ring) {
      ring.style.transform = `translate(${s.ring.x.toFixed(1)}px, ${s.ring.y.toFixed(1)}px) translate(-50%, -50%) scale(${s.ring.scale.toFixed(3)})`
      ring.style.backgroundColor = `rgba(255, 255, 255, ${(0.95 * s.ring.fill).toFixed(3)})`
      ring.style.borderWidth = `${(1.5 / s.ring.scale).toFixed(2)}px` // the line stays thin as the ring grows
    }

    const n = Math.round(params.trailLength)
    for (let i = 0; i < MAX_TRAIL; i++) {
      const el = E[`trail${i}`]
      if (!el) continue
      const back = (i + 1) * TRAIL_GAP
      if (i >= n || back >= s.count) {
        el.style.opacity = '0'
        continue
      }
      const at = (s.head - 1 - back + HISTORY * 2) % HISTORY
      const k = 1 - (i + 1) / (n + 1)
      el.style.opacity = (0.6 * k).toFixed(3)
      el.style.transform = `translate(${s.trail[at * 2].toFixed(1)}px, ${s.trail[at * 2 + 1].toFixed(1)}px) translate(-50%, -50%) scale(${(0.3 + 0.7 * k).toFixed(3)})`
    }

    for (const key of MAGNETS) {
      const m = s.magnets[key]
      const btn = E[key]
      const label = E[`${key}Label`]
      if (btn) btn.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`
      // the label moves a little further than its button: a hint of depth
      if (label) label.style.translate = `${(m.x * 0.35).toFixed(2)}px ${(m.y * 0.35).toFixed(2)}px`
    }

    for (const { key } of CARDS) {
      const el = E[key]
      const r = s.rects[key]
      if (!el || !r) continue
      el.style.setProperty('--x', `${(s.px - r.x).toFixed(1)}px`)
      el.style.setProperty('--y', `${(s.py - r.y).toFixed(1)}px`)
      el.style.setProperty('--o', s.glow[key].toFixed(3))
    }
  }

  const redraw = useLoop(
    box,
    ({ delta }) => {
      const s = st.current
      if (!s) return
      // fonts and layout can settle after the first frames, so look at the boxes again now and then
      if (s.frames++ % 30 === 0) measure()
      if (s.first) {
        s.first = false
        const start = { x: s.w * 0.14, y: s.h * 0.92 }
        s.virt = { ...start, vx: 0, vy: 0 }
        s.ring = { ...start, scale: 1, fill: 0 }
        s.px = start.x
        s.py = start.y
        // a paused page only ever shows this frame: let the virtual pointer reach the first button
        if (paused) for (let i = 0; i < Math.round(POSTER * 60); i++) step(s, 1 / 60)
      }
      step(s, delta)
      paint(s)
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  useEffect(() => {
    const root = box.current
    if (!root) return
    const observer = new ResizeObserver(() => {
      measure()
      redraw()
    })
    observer.observe(root)
    return () => observer.disconnect()
    // measure only touches refs, so the first render's copy is as good as any
  }, [redraw])

  const local = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = st.current
    if (!s || thumb) return
    // a finger only counts while it touches the screen
    if (e.pointerType === 'touch' && !s.real.down) return
    Object.assign(s.real, local(e), { active: true, kind: e.pointerType })
    e.currentTarget.toggleAttribute('data-hide-cursor', !paused && e.pointerType !== 'touch')
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = st.current
    if (!s || thumb) return
    s.real.down = true
    onMove(e)
  }
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = st.current
    if (!s) return
    s.real.down = false
    if (e.pointerType === 'touch') s.real.active = false
  }
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    const s = st.current
    if (!s) return
    s.real.active = false
    s.real.down = false
    e.currentTarget.removeAttribute('data-hide-cursor')
  }
  // keyboard focus: with no mouse around, the virtual pointer goes to the focused control
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const s = st.current
    if (!s) return
    let visible = true
    try {
      visible = (e.target as Element).matches(':focus-visible')
    } catch {
      visible = true
    }
    const key = Object.keys(els.current).find((k) => els.current[k] === e.target)
    s.focus = key && visible ? key : null
  }
  const onBlur = () => {
    const s = st.current
    if (s) s.focus = null
  }

  const tab = thumb ? -1 : 0
  const control = 'outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c11]'

  return (
    <div
      ref={box}
      className="@container relative size-full overflow-hidden bg-[#0b0c11] font-sans text-[#eceef3] select-none data-[hide-cursor]:cursor-none data-[hide-cursor]:[&_*]:cursor-none"
      style={{ containerType: 'size' }}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* backdrop: a faint dot grid and a soft violet glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: 'clamp(14px, 3cqmin, 26px) clamp(14px, 3cqmin, 26px)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-[35%] left-1/2 h-[75%] w-[70%] -translate-x-1/2 rounded-full bg-[#7c5cff]/25 blur-3xl" />

      <div className="relative flex size-full flex-col px-[4cqw] py-[3cqh]">
        {/* site header */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-[0.4em] font-semibold" style={{ fontSize: FS.nav }}>
            <span aria-hidden className="size-[1em] rounded-full bg-[conic-gradient(from_200deg,#c8ff5a,#7c5cff,#c8ff5a)]" />
            모션랩
          </span>
          <div className="flex items-center gap-[2.4cqw]" style={{ fontSize: FS.nav }}>
            {LINKS.map((label, i) => (
              <button key={label} ref={ref(`link${i}`)} type="button" tabIndex={tab} className={cn('rounded px-1 text-white/65 hover:text-white @max-md:hidden', control)}>
                {label}
              </button>
            ))}
            <button ref={ref('cta')} type="button" tabIndex={tab} className={cn('rounded-full bg-white/10 px-[1.1em] py-[0.45em] ring-1 ring-white/15', control)}>
              <span ref={ref('ctaLabel')} className="block">
                시작하기
              </span>
            </button>
          </div>
        </div>

        {/* hero */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.2cqh] text-center">
          <p className="font-mono tracking-[0.2em] text-[#c8ff5a] uppercase" style={{ fontSize: FS.eyebrow }}>
            cursor effects
          </p>
          <p className="leading-[1.1] font-semibold tracking-[-0.03em]" style={{ fontSize: FS.title }}>
            손끝을 따라오는 화면
          </p>
          {!thumb && (
            <p className="max-w-[46ch] text-white/60" style={{ fontSize: FS.body }}>
              커서가 닿기 전에 무엇을 누를 수 있는지 먼저 알려 줍니다.
            </p>
          )}
          <div className="mt-[1cqh] flex items-center gap-[2.4cqw]" style={{ fontSize: FS.button }}>
            <button
              ref={ref('primary')}
              type="button"
              tabIndex={tab}
              className={cn('rounded-full bg-[#c8ff5a] px-[1.4em] py-[0.75em] font-semibold text-[#0b0c11] shadow-[0_8px_30px_rgba(200,255,90,0.25)]', control)}
            >
              <span ref={ref('primaryLabel')} className="block">
                무료로 시작하기
              </span>
            </button>
            <button ref={ref('secondary')} type="button" tabIndex={tab} className={cn('rounded-full px-[1.4em] py-[0.75em] ring-1 ring-white/25', control)}>
              <span ref={ref('secondaryLabel')} className="block">
                둘러보기 →
              </span>
            </button>
          </div>
        </div>

        {/* feature cards with a spotlight that follows the pointer */}
        <div className="grid grid-cols-3 gap-[2cqw]" style={{ height: '24cqh' }}>
          {CARDS.map(({ key, title, body: text, Icon }) => (
            <div
              key={key}
              ref={ref(key)}
              className="relative rounded-[clamp(8px,1.6cqmin,14px)] p-px"
              style={{ background: 'rgba(255,255,255,0.09)', '--x': '50%', '--y': '50%', '--o': 0, '--r': 'clamp(90px, 22cqw, 260px)' } as CSSProperties}
            >
              {/* the border lights up where the pointer is */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{ opacity: 'var(--o)', background: `radial-gradient(var(--r) circle at var(--x) var(--y), ${ACCENT}, transparent 65%)` }}
              />
              <div className="relative flex h-full flex-col justify-end gap-[0.6cqh] overflow-hidden rounded-[inherit] bg-[#13151c] p-[clamp(6px,1.8cqmin,16px)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ opacity: 'var(--o)', background: 'radial-gradient(var(--r) circle at var(--x) var(--y), rgba(200,255,90,0.16), transparent 70%)' }}
                />
                <Icon aria-hidden className="relative mb-auto size-[clamp(12px,3.2cqmin,22px)] text-[#c8ff5a]" />
                <p className="relative truncate font-semibold" style={{ fontSize: FS.cardTitle }}>
                  {title}
                </p>
                <p className="relative line-clamp-2 text-white/55 @max-md:hidden" style={{ fontSize: FS.cardBody }}>
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* the custom cursor: trail, lagging ring, exact dot */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: MAX_TRAIL }, (_, i) => (
          <span
            key={i}
            ref={ref(`trail${i}`)}
            className="absolute top-0 left-0 size-[clamp(4px,1.1cqmin,8px)] rounded-full bg-[#c8ff5a]"
            style={{ opacity: 0 }}
          />
        ))}
        <span
          ref={ref('ring')}
          className="absolute top-0 left-0 size-[clamp(20px,5cqmin,40px)] rounded-full border-[1.5px] border-solid border-white mix-blend-difference"
          style={{ transform: 'translate(-100px, -100px)' }}
        />
        <span
          ref={ref('dot')}
          className="absolute top-0 left-0 size-[clamp(5px,1.2cqmin,8px)] rounded-full bg-[#c8ff5a]"
          style={{ transform: 'translate(-100px, -100px)' }}
        />
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'cursor-effects',
  group: 'motion',
  name: '커서 효과',
  englishName: 'Cursor Effects',
  aliases: ['Custom cursor', 'Cursor follower', 'Magnetic button', 'Spotlight hover', '마우스 커서 효과'],
  description: '마우스를 늦게 따라오는 링과 꼬리, 가까이 가면 끌려오는 자석 버튼, 커서 위치를 비추는 카드 조명처럼 포인터에 반응하는 애니메이션',
  context: '제품 소개 페이지, 디자인 스튜디오·포트폴리오 사이트, 기능을 카드로 늘어놓은 랜딩 페이지처럼 데스크톱으로 보는 화려한 웹사이트에서 만납니다.',
  technique: 'DOM·CSS',
  interaction: '무대 위에서 마우스를 움직여 버튼과 카드에 가까이 가 보세요. 마우스가 무대 밖에 있거나 터치 화면이면 가상의 커서가 대신 돌아다닙니다.',
  traits: [
    {
      title: '선형 보간으로 따라오는 커서',
      description:
        '링은 매 프레임 남은 거리의 일정 비율(따라오는 정도)만큼만 다가가서, 빨리 움직이면 뒤처졌다가 부드럽게 따라붙습니다. 작은 점은 실제 위치를 그대로 보여 주고, 진짜 커서는 무대 안에서 재생 중일 때만 숨깁니다.',
    },
    {
      title: '가까이 가면 끌려오는 자석 버튼',
      description:
        '버튼 중심과 커서 사이 거리의 일부만큼 버튼을 옮기고, 멀어지면 스프링으로 살짝 출렁이며 돌아옵니다. 누를 수 있다는 신호가 되지만, 너무 세면 오히려 누르기 어려워집니다.',
    },
    {
      title: '커서를 비추는 스포트라이트',
      description:
        'radial-gradient의 중심을 CSS 변수 --x, --y로 커서 위치에 맞춥니다. 커서에 가까운 카드는 테두리까지 은은하게 밝아져 지금 어디를 보고 있는지 알려 줍니다.',
    },
  ],
  params: [
    { key: 'follow', label: '따라오는 정도', min: 0.03, max: 1, step: 0.01, default: 0.15 },
    { key: 'magnet', label: '자석 세기', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'trailLength', label: '꼬리 길이', min: 0, max: 24, step: 1, default: 12, unit: '개' },
  ],
  Scene: CursorEffectsScene,
}
