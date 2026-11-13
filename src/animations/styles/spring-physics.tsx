import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import type { AnimationStyle, Params, SceneProps } from '../types'

const PAPER = '#f7f5ef'
const INK = '#1d1d24'
const MUTED = '#6b6f78'
const SPRING_COLOR = '#e5484d' // the spring row of the easing-curves scene
const EASE_COLOR = '#8a8f98'
const SANS = '"IBM Plex Sans KR", system-ui, sans-serif'
const MONO = '"IBM Plex Mono", ui-monospace, monospace'

const H = 1 / 600 // physics step: small and fixed, so stiff springs stay stable at any frame rate
const SAMPLE = 1 / 60 // graph sample spacing in scene seconds
const WINDOW = 4 // seconds of history in the graph
const SAMPLES = Math.round(WINDOW / SAMPLE)
const EASE_TIME = 0.6 // the comparison ball always takes this long, whatever happened before
const LIMIT = 1.2 // furthest the hand can pull, in track units
const STOP = 1.3 // end stops of the track
const AUTO_AFTER = 3
const PULL = 0.55
const HOLD = 0.25
const POSTER = 1.5 // a paused scene is drawn this far into the demo: just after a release

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
const easeOut = (p: number) => 1 - (1 - p) ** 3

/** ζ = c / (2√(km)): below 1 it overshoots, at 1 it settles fastest without overshooting, above 1 it creeps. */
const dampingRatio = (p: Params) => p.damping / (2 * Math.sqrt(p.stiffness * p.mass))

type Regime = { name: string; note: string; color: string }
function regimeOf(zeta: number): Regime {
  if (zeta < 0.97) return { name: '저감쇠', note: '지나쳤다 돌아오며 출렁임', color: '#7b4dff' }
  if (zeta <= 1.03) return { name: '임계 감쇠', note: '넘치지 않고 가장 빨리 멈춤', color: '#0f9d76' }
  return { name: '과감쇠', note: '넘치지 않고 느릿하게 다가감', color: '#2f6fed' }
}

/** Rough time to come within 2% of rest, from the slowest decay rate of the motion. */
function settleTime(p: Params) {
  const omega = Math.sqrt(p.stiffness / p.mass)
  const zeta = dampingRatio(p)
  const rate = zeta < 1 ? zeta * omega : omega * (zeta - Math.sqrt(zeta * zeta - 1))
  return rate > 0 ? 4 / rate : Infinity
}

type Sim = {
  first: boolean
  clock: number
  /** spring ball: displacement from rest (track units, right is +) and velocity (units/s) */
  x: number
  v: number
  /** comparison ball, moved by a fixed-length ease-out */
  e: number
  easeFrom: number
  easeAt: number
  held: 'hand' | 'key' | 'demo' | null
  target: number
  lastTouch: number
  demo: { on: boolean; phase: 'wait' | 'pull'; until: number; start: number; from: number; to: number; side: number }
  /** ring buffer of [spring, ease, held] samples for the graph */
  hist: Float32Array
  head: number
  count: number
  sinceSample: number
}

const newSim = (): Sim => ({
  first: true,
  clock: 0,
  x: 0,
  v: 0,
  e: 0,
  easeFrom: 0,
  easeAt: -10,
  held: null,
  target: 0,
  lastTouch: -Infinity,
  demo: { on: false, phase: 'wait', until: 0, start: 0, from: 0, to: 0, side: -1 },
  hist: new Float32Array(SAMPLES * 3),
  head: 0,
  count: 0,
  sinceSample: 0,
})

function hold(s: Sim, by: NonNullable<Sim['held']>) {
  s.held = by
  s.target = s.x
}

/** Let go: the spring keeps the hand's velocity; the ease-out starts a fresh fixed-length move from where it is. */
function letGo(s: Sim) {
  if (!s.held) return
  s.held = null
  s.easeFrom = s.e
  s.easeAt = s.clock
}

function record(s: Sim) {
  const i = s.head * 3
  s.hist[i] = s.x
  s.hist[i + 1] = s.e
  s.hist[i + 2] = s.held ? 1 : 0
  s.head = (s.head + 1) % SAMPLES
  s.count = Math.min(SAMPLES, s.count + 1)
}

/** Nobody touching: pull the ball to one side, hold it a moment, let go, wait until it has settled, repeat. */
function runDemo(s: Sim, p: Params, thumb: boolean) {
  const d = s.demo
  const userHolds = s.held === 'hand' || s.held === 'key'
  if (!thumb && (userHolds || s.clock - s.lastTouch <= AUTO_AFTER)) {
    if (d.on) {
      d.on = false
      if (s.held === 'demo') letGo(s)
    }
    return
  }
  if (!d.on) Object.assign(d, { on: true, phase: 'wait', until: s.clock + 0.3 })
  if (d.phase === 'wait' && s.clock >= d.until) {
    d.side = -d.side
    Object.assign(d, { phase: 'pull', start: s.clock, from: s.x, to: d.side * 0.8 })
    hold(s, 'demo')
  }
  if (d.phase === 'pull') {
    const t = s.clock - d.start
    s.target = d.from + (d.to - d.from) * easeInOut(Math.min(1, t / PULL))
    if (t >= PULL + HOLD) {
      letGo(s)
      Object.assign(d, { phase: 'wait', until: s.clock + clamp(settleTime(p), 1.4, 4.5) })
    }
  }
}

function advance(s: Sim, dt: number, p: Params, thumb: boolean) {
  runDemo(s, p, thumb)
  if (s.held) {
    // the hand sets the position; the velocity is how fast the hand moved, smoothed a little
    if (dt > 0) s.v += ((s.target - s.x) / dt - s.v) * Math.min(1, dt * 25)
    s.x = s.target
  }
  const k = p.stiffness
  const c = p.damping
  const m = p.mass
  for (let left = dt; left > 1e-7; left -= H) {
    const h = Math.min(H, left)
    s.clock += h
    if (!s.held) {
      // F = −kx − cv, a = F / m (semi-implicit Euler)
      s.v += ((-k * s.x - c * s.v) / m) * h
      s.x += s.v * h
      if (Math.abs(s.x) > STOP) {
        s.x = Math.sign(s.x) * STOP
        s.v *= -0.4
      }
    }
    s.e = s.held ? s.x : s.easeFrom * (1 - easeOut(clamp((s.clock - s.easeAt) / EASE_TIME, 0, 1)))
    s.sinceSample += h
    if (s.sinceSample >= SAMPLE) {
      s.sinceSample -= SAMPLE
      record(s)
    }
  }
}

type Layout = {
  pad: number
  wide: boolean
  infoH: number
  y1: number
  y2: number
  r: number
  wallX: number
  right: number
  restX: number
  unit: number
  graph: { x: number; y: number; w: number; h: number }
}

function layoutFor(w: number, h: number, thumb: boolean): Layout {
  const pad = thumb ? 10 : Math.max(14, Math.min(w, h) * 0.04)
  const wide = w >= 520
  const infoH = thumb ? 18 : wide ? Math.min(92, h * 0.18) : Math.min(84, h * 0.2)
  const graphH = h * (thumb ? 0.36 : 0.33)
  const graph = { x: pad, y: h - pad - graphH, w: w - pad * 2, h: graphH }
  const top = pad + infoH
  const bottom = graph.y - (thumb ? 6 : pad)
  const r = clamp(Math.min(w, h) * 0.045, 6, 20)
  const wallX = pad + 6
  const right = w - pad
  const restX = wallX + (right - wallX) * 0.5
  const unit = Math.max(1, Math.min(restX - wallX - r * 2.5, right - r - restX) / STOP)
  return { pad, wide, infoH, y1: top + (bottom - top) * 0.36, y2: top + (bottom - top) * 0.8, r, wallX, right, restX, unit, graph }
}

function coil(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, amp: number, turns: number) {
  const lead = Math.min(10, Math.max(2, (x1 - x0) * 0.08))
  const len = x1 - x0 - lead * 2
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x0 + lead, y)
  for (let i = 1; i <= turns * 2; i++) ctx.lineTo(x0 + lead + (len * (i - 0.5)) / (turns * 2), y + (i % 2 ? -amp : amp))
  ctx.lineTo(x1 - lead, y)
  ctx.lineTo(x1, y)
  ctx.stroke()
}

function ball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath()
  ctx.ellipse(x, y + r * 0.95, r * 0.8, r * 0.18, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(30, 30, 40, 0.1)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 0.32, r * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.fill()
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) {
  ctx.font = `600 ${size}px ${SANS}`
  const w = ctx.measureText(text).width + size * 1.2
  const h = size * 1.7
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + size * 0.6, y + h / 2 + 0.5)
  return w
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, font: string, color: string, base: CanvasTextBaseline = 'alphabetic') {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = base
  ctx.fillText(value, x, y)
}

function drawInfo(ctx: CanvasRenderingContext2D, L: Layout, p: Params, w: number) {
  const zeta = dampingRatio(p)
  const regime = regimeOf(zeta)
  const big = clamp(L.infoH * 0.3, 14, 26)
  const small = clamp(L.infoH * 0.15, 10, 13)
  const x = L.pad
  const y = L.pad
  const label = `ζ = ${zeta.toFixed(2)}`
  text(ctx, label, x, y, `600 ${big}px ${MONO}`, INK, 'top')
  const zw = ctx.measureText(label).width
  pill(ctx, L.wide ? `${regime.name} · ${regime.note}` : regime.name, x + zw + 10, y + (big - small * 1.7) / 2, small, regime.color)
  text(ctx, `c / (2√(k·m)) = ${p.damping} / (2√(${p.stiffness} × ${p.mass.toFixed(1)}))`, x, y + big + small * 0.9, `${small}px ${MONO}`, MUTED, 'top')
  const omega = Math.sqrt(p.stiffness / p.mass)
  text(ctx, `고유 진동수 √(k/m) = ${omega.toFixed(1)} rad/s`, x, y + big + small * 2.5, `${small}px ${SANS}`, MUTED, 'top')

  if (!L.wide) return
  // the damping-ratio scale: where this spring sits between bouncy and sluggish
  const sw = Math.min(300, w * 0.3)
  const sx = w - L.pad - sw
  const by = y + small * 1.6
  const max = 2.5
  const at = (z: number) => sx + (Math.min(z, max) / max) * sw
  text(ctx, '감쇠비 ζ', sx, y, `600 ${small}px ${SANS}`, INK, 'top')
  ctx.fillStyle = 'rgba(123, 77, 255, 0.22)'
  ctx.fillRect(sx, by, at(1) - sx, 8)
  ctx.fillStyle = 'rgba(47, 111, 237, 0.22)'
  ctx.fillRect(at(1), by, sx + sw - at(1), 8)
  ctx.fillStyle = '#0f9d76'
  ctx.fillRect(at(1) - 1.5, by - 4, 3, 16)
  ctx.textAlign = 'center'
  text(ctx, '저감쇠', at(0.5), by + 14, `${small}px ${SANS}`, MUTED, 'top')
  text(ctx, '임계', at(1), by + 14, `${small}px ${SANS}`, '#0f9d76', 'top')
  text(ctx, '과감쇠', at(1.8), by + 14, `${small}px ${SANS}`, MUTED, 'top')
  ctx.textAlign = 'left'
  const mx = at(zeta)
  ctx.beginPath()
  ctx.moveTo(mx, by - 1)
  ctx.lineTo(mx - 6, by - 10)
  ctx.lineTo(mx + 6, by - 10)
  ctx.closePath()
  ctx.fillStyle = regime.color
  ctx.fill()
  if (zeta > max) text(ctx, '›', mx + 7, by - 12, `600 ${small}px ${MONO}`, regime.color, 'top')
}

function drawGraph(ctx: CanvasRenderingContext2D, s: Sim, L: Layout, thumb: boolean) {
  const G = L.graph
  ctx.beginPath()
  ctx.roundRect(G.x, G.y, G.w, G.h, 8)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(30, 30, 40, 0.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  const inset = thumb ? 4 : 8
  const yOf = (v: number) => G.y + G.h / 2 - (v / STOP) * (G.h / 2 - inset)
  const xOf = (i: number) => G.x + G.w - ((s.count - 1 - i) / (SAMPLES - 1)) * G.w
  const at = (i: number) => ((s.head - s.count + i + SAMPLES) % SAMPLES) * 3

  // shaded where a hand held the ball
  ctx.fillStyle = 'rgba(30, 30, 40, 0.06)'
  for (let i = 0; i < s.count; i++) if (s.hist[at(i) + 2]) ctx.fillRect(xOf(i) - G.w / SAMPLES, G.y + 1, G.w / SAMPLES + 0.5, G.h - 2)

  ctx.strokeStyle = 'rgba(30, 30, 40, 0.25)'
  ctx.beginPath()
  ctx.moveTo(G.x, yOf(0))
  ctx.lineTo(G.x + G.w, yOf(0))
  ctx.stroke()

  const line = (offset: number, color: string, width: number) => {
    if (s.count < 2) return
    ctx.beginPath()
    for (let i = 0; i < s.count; i++) {
      const y = yOf(s.hist[at(i) + offset])
      if (i === 0) ctx.moveTo(xOf(i), y)
      else ctx.lineTo(xOf(i), y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }
  line(1, EASE_COLOR, thumb ? 1.2 : 1.6)
  line(0, SPRING_COLOR, thumb ? 1.6 : 2.2)

  if (thumb) return
  const f = `11px ${SANS}`
  text(ctx, '제자리', G.x + 8, yOf(0) - 4, f, MUTED)
  text(ctx, `위치 · 최근 ${WINDOW}초`, G.x + 8, G.y + 8, `600 11px ${SANS}`, INK, 'top')
  ctx.textAlign = 'right'
  text(ctx, '지금', G.x + G.w - 6, G.y + G.h - 6, f, MUTED)
  // legend
  const lx = G.x + G.w - 8
  text(ctx, 'ease-out', lx, G.y + 8, f, MUTED, 'top')
  const ew = ctx.measureText('ease-out').width
  ctx.fillStyle = EASE_COLOR
  ctx.fillRect(lx - ew - 22, G.y + 14, 16, 2)
  text(ctx, '스프링', lx - ew - 34, G.y + 8, f, MUTED, 'top')
  const sw = ctx.measureText('스프링').width
  ctx.fillStyle = SPRING_COLOR
  ctx.fillRect(lx - ew - 34 - sw - 22, G.y + 14, 16, 2.5)
  ctx.textAlign = 'left'
}

function render(f: CanvasFrame, s: Sim, L: Layout, thumb: boolean) {
  const { ctx, width: w, height: h, params: p } = f
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)

  if (thumb) {
    const zeta = dampingRatio(p)
    const regime = regimeOf(zeta)
    pill(ctx, `${regime.name} ζ ${zeta.toFixed(2)}`, L.pad, L.pad - 2, 9, regime.color)
  } else drawInfo(ctx, L, p, w)

  // where both balls come to rest
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(30, 30, 40, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(L.restX, L.y1 - L.r * 2)
  ctx.lineTo(L.restX, L.y2 + L.r * 1.6)
  ctx.stroke()
  ctx.setLineDash([])

  const labelFont = thumb ? `600 9px ${SANS}` : `600 ${clamp(L.r * 0.7, 11, 14)}px ${SANS}`
  const noteFont = `${clamp(L.r * 0.62, 10, 12)}px ${SANS}`
  const shown = (v: number) => clamp(v, -STOP, STOP)

  // track 1: the spring, fixed to a wall on the left
  const y1 = L.y1
  ctx.fillStyle = 'rgba(30, 30, 40, 0.08)'
  ctx.fillRect(L.wallX, y1 + L.r + 2, L.right - L.wallX, 2)
  ctx.fillStyle = '#3a3e48'
  ctx.fillRect(L.wallX - 6, y1 - L.r * 1.5, 6, L.r * 3)
  ctx.strokeStyle = 'rgba(30, 30, 40, 0.35)'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    const yy = y1 - L.r * 1.5 + (i + 0.5) * ((L.r * 3) / 5)
    ctx.beginPath()
    ctx.moveTo(L.wallX - 6, yy)
    ctx.lineTo(L.wallX - 11, yy + 5)
    ctx.stroke()
  }
  const bx = L.restX + shown(s.x) * L.unit
  ctx.strokeStyle = '#4a4f5a'
  ctx.lineWidth = thumb ? 1.2 : 1.8
  ctx.lineJoin = 'round'
  coil(ctx, L.wallX, bx - L.r, y1, L.r * 0.65, thumb ? 7 : 11)
  ball(ctx, bx, y1, L.r, SPRING_COLOR)
  if (s.held) {
    // the hand (or the demo's virtual hand) holding the ball
    ctx.beginPath()
    ctx.arc(bx, y1, L.r + 5, 0, Math.PI * 2)
    ctx.strokeStyle = s.held === 'demo' ? 'rgba(30, 30, 40, 0.35)' : 'rgba(229, 72, 77, 0.55)'
    ctx.lineWidth = 2
    if (s.held === 'demo') ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  } else if (!thumb && Math.abs(s.v) > 0.15) {
    // velocity arrow: the spring carries this into the next frame
    const len = clamp(s.v * L.unit * 0.12, -L.unit * 0.6, L.unit * 0.6)
    const ax = bx + Math.sign(len) * (L.r + 4)
    ctx.strokeStyle = 'rgba(229, 72, 77, 0.6)'
    ctx.fillStyle = 'rgba(229, 72, 77, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ax, y1)
    ctx.lineTo(ax + len, y1)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ax + len + Math.sign(len) * 6, y1)
    ctx.lineTo(ax + len, y1 - 4)
    ctx.lineTo(ax + len, y1 + 4)
    ctx.closePath()
    ctx.fill()
  }
  text(ctx, '스프링', L.wallX + 6, y1 - L.r * 1.5 - 6, labelFont, INK)
  if (!thumb) {
    const lw = ctx.measureText('스프링').width
    text(ctx, '힘으로 계산 · 공을 끌었다 놓아 보세요', L.wallX + 14 + lw, y1 - L.r * 1.5 - 6, noteFont, MUTED)
    ctx.textAlign = 'center'
    text(ctx, '제자리', L.restX, L.y2 + L.r * 1.6 + 14, noteFont, MUTED)
    ctx.textAlign = 'left'
  }

  // track 2: the same pull, finished by a plain ease-out of fixed length
  const y2 = L.y2
  const r2 = L.r * 0.85
  ctx.fillStyle = 'rgba(30, 30, 40, 0.08)'
  ctx.fillRect(L.wallX, y2 + r2 + 2, L.right - L.wallX, 2)
  ball(ctx, L.restX + shown(s.e) * L.unit, y2, r2, EASE_COLOR)
  text(ctx, 'ease-out', L.wallX + 6, y2 - r2 - 8, labelFont, INK)
  if (!thumb) {
    const lw = ctx.measureText('ease-out').width
    text(ctx, `시간으로 계산 · 늘 ${EASE_TIME}초, 놓는 속도는 무시`, L.wallX + 14 + lw, y2 - r2 - 8, noteFont, MUTED)
  }

  drawGraph(ctx, s, L, thumb)
}

/**
 * A ball on a spring next to a ball moved by a fixed-length ease-out. The spring is integrated
 * from F = −kx − cv with scene time, so the sliders change the physics, not a curve.
 */
function SpringPhysicsScene({ params, paused, thumb = false }: SceneProps) {
  const sim = useRef<Sim | null>(null)
  sim.current ??= newSim()
  const layout = useRef<Layout | null>(null)
  const handle = useRef<HTMLButtonElement>(null)
  const grab = useRef<{ pointerId: number; offset: number } | null>(null)

  const draw = (f: CanvasFrame) => {
    const s = sim.current
    if (!s) return
    const L = layoutFor(f.width, f.height, thumb)
    layout.current = L
    if (s.first) {
      s.first = false
      // a paused page only ever shows this frame: let it catch the ball just after a release
      if (paused) for (let i = 0; i < Math.round(POSTER * 60); i++) advance(s, 1 / 60, f.params, thumb)
    }
    advance(s, f.delta, f.params, thumb)
    render(f, s, L, thumb)

    // an invisible button sits on the ball: it takes the drag (touch-action: none only here) and the keyboard
    const el = handle.current
    if (el) {
      const size = Math.max(44, L.r * 2 + 18)
      el.style.width = el.style.height = `${size}px`
      el.style.transform = `translate(${(L.restX + clamp(s.x, -STOP, STOP) * L.unit - size / 2).toFixed(1)}px, ${(L.y1 - size / 2).toFixed(1)}px)`
    }
  }

  const localX = (e: PointerEvent<HTMLElement>) => e.clientX - (e.currentTarget.parentElement?.getBoundingClientRect().left ?? 0)

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    const L = layout.current
    if (!s || !L || thumb || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    s.lastTouch = s.clock
    hold(s, 'hand')
    grab.current = { pointerId: e.pointerId, offset: L.restX + s.x * L.unit - localX(e) }
  }
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    const L = layout.current
    const g = grab.current
    if (!s || !L || !g || g.pointerId !== e.pointerId) return
    s.target = clamp((localX(e) + g.offset - L.restX) / L.unit, -LIMIT, LIMIT)
    s.lastTouch = s.clock
  }
  const onUp = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    const g = grab.current
    if (!s || !g || g.pointerId !== e.pointerId) return
    grab.current = null
    s.lastTouch = s.clock
    if (e.type === 'pointercancel') s.v = 0
    letGo(s)
  }

  // keyboard: hold ← or → to pull, release the key to let go
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const s = sim.current
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!s || !dir) return
    e.preventDefault()
    s.lastTouch = s.clock
    if (s.held !== 'key') hold(s, 'key')
    s.target = clamp(s.target + dir * 0.12, -LIMIT, LIMIT)
  }
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (!s || s.held !== 'key' || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
    s.lastTouch = s.clock
    s.v = 0
    letGo(s)
  }
  const onBlur = () => {
    const s = sim.current
    if (s?.held === 'key') letGo(s)
  }

  return (
    <div className="relative size-full overflow-hidden bg-[#f7f5ef]">
      <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} />
      <button
        ref={handle}
        type="button"
        tabIndex={thumb ? -1 : 0}
        aria-label="스프링 공. 왼쪽·오른쪽 화살표를 누르고 있으면 당기고, 떼면 놓습니다."
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        className="absolute top-0 left-0 size-11 cursor-grab rounded-full outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#e5484d]/70 active:cursor-grabbing"
        style={{ touchAction: 'none', transform: 'translate(-100px, -100px)' }}
      />
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'spring-physics',
  group: 'motion',
  name: '스프링 물리',
  englishName: 'Spring Physics',
  aliases: ['Spring animation', 'Physics-based animation', 'Damped spring', '용수철 애니메이션', '감쇠 진동'],
  description: '용수철에 매달린 공처럼 정해진 시간 없이 당기는 힘과 마찰만으로 움직임이 정해지는 애니메이션',
  context: 'iOS·Android의 기본 화면 움직임, 끌었다 놓는 시트와 카드, Framer Motion·React Spring 같은 라이브러리의 spring 설정에서 만납니다.',
  technique: 'Canvas 2D',
  interaction: '빨간 공을 끌었다가 놓아 보세요. 휙 던지면 그 속도를 이어받습니다. 키보드는 공에서 ←·→를 누르고 있다가 떼면 됩니다.',
  traits: [
    {
      title: '강성·감쇠·질량',
      description:
        '강성 k는 제자리로 끌어당기는 힘, 감쇠 c는 움직임을 붙잡는 마찰, 질량 m은 공의 무게입니다. 몇 초 동안 움직일지는 정하지 않고, 이 세 값이 결과로 정합니다.',
    },
    {
      title: '감쇠비 ζ로 나뉘는 세 모양',
      description:
        'ζ = c / (2√(km))가 1보다 작으면 제자리를 지나쳤다 돌아오며 출렁이고(저감쇠), 1이면 넘치지 않으면서 가장 빨리 서고(임계 감쇠), 1보다 크면 느릿하게 다가갑니다(과감쇠).',
    },
    {
      title: '놓는 순간의 속도를 이어받음',
      description:
        '스프링은 손을 뗄 때의 속도에서 그대로 출발해 움직임이 끊기지 않습니다. 시간으로 정한 ease-out(회색 공)은 속도를 모르기 때문에 휙 던져도 늘 같은 모양으로 돌아옵니다.',
    },
  ],
  params: [
    { key: 'stiffness', label: '강성 k', min: 20, max: 400, step: 5, default: 125 },
    { key: 'damping', label: '감쇠 c', min: 0, max: 60, step: 1, default: 10 },
    { key: 'mass', label: '질량 m', min: 0.2, max: 5, step: 0.1, default: 1 },
  ],
  Scene: SpringPhysicsScene,
}
