import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { PartyPopperIcon } from 'lucide-react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const COLORS = ['#ff4d6d', '#ffbe0b', '#06d6a0', '#3a86ff', '#8338ec', '#fb5607', '#ff70a6']
/** the back of each piece of paper: the same colour in shadow */
const BACKS = COLORS.map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  const dim = (v: number) => Math.round(v * 0.62)
  return `rgb(${dim((n >> 16) & 255)}, ${dim((n >> 8) & 255)}, ${dim(n & 255)})`
})

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  drag: number
  angle: number
  spin: number
  flip: number
  flipSpeed: number
  wobble: number
  wobbleSpeed: number
  sway: number
  size: number
  /** 0 rectangle, 1 round dot, 2 thin strip */
  shape: number
  color: number
  age: number
  life: number
}

type Burst = { kind: 'corners' | 'button' | 'point'; x?: number; y?: number }

const TAU = Math.PI * 2
const AUTO_AFTER = 4 // seconds without a click before it celebrates by itself again
const AUTO_EVERY = 2.6
const MAX_PIECES = 1600
const STEP = 1 / 60

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Adds n pieces leaving (x, y) around `angle`, up to `spread` radians either side. */
function spray(list: Piece[], rand: () => number, n: number, x: number, y: number, angle: number, spread: number, speed: number, size: number) {
  for (let k = 0; k < n; k++) {
    const a = angle + (rand() - 0.5) * 2 * spread
    const v = speed * (0.55 + rand() * 0.6)
    const shape = rand() < 0.5 ? 0 : rand() < 0.55 ? 1 : 2
    list.push({
      x: x + (rand() - 0.5) * size * 2,
      y: y + (rand() - 0.5) * size * 2,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      drag: (shape === 1 ? 2.2 : 2.6) + rand() * 1.1, // round dots cut through the air a little better
      angle: rand() * TAU,
      spin: (rand() - 0.5) * 12,
      flip: rand() * TAU,
      flipSpeed: 3 + rand() * 9,
      wobble: rand() * TAU,
      wobbleSpeed: 2 + rand() * 4,
      sway: 0.3 + rand() * 0.7,
      size: size * (0.75 + rand() * 0.5),
      shape,
      color: Math.floor(rand() * COLORS.length),
      age: 0,
      life: 3.4 + rand() * 2.2,
    })
  }
}

/** One physics step: gravity pulls, air drag slows, the paper sways and tumbles. */
function simulate(list: Piece[], dt: number, gravity: number, w: number, h: number) {
  let keep = 0
  for (const p of list) {
    p.age += dt
    p.vy += gravity * dt
    const slow = Math.exp(-p.drag * dt)
    p.vx *= slow
    p.vy *= slow
    p.wobble += p.wobbleSpeed * dt
    p.x += (p.vx + Math.sin(p.wobble) * p.sway * h * 0.07) * dt
    p.y += p.vy * dt
    p.angle += p.spin * dt
    p.flip += p.flipSpeed * dt
    if (p.age < p.life && p.y < h + 40 && p.x > -60 && p.x < w + 60) list[keep++] = p
  }
  list.length = keep
}

/**
 * Paper confetti on a canvas laid over a DOM card. Every piece is a small physics
 * body stepped with scene time, so pausing freezes the shower mid-air.
 */
function ConfettiScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const icon = useRef<SVGSVGElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const pieces = useRef<Piece[]>([])
  const rings = useRef<{ x: number; y: number; t: number }[]>([])
  const requests = useRef<Burst[]>([])
  const bursts = useRef(0)
  const now = useRef(0)
  const lastTouch = useRef(-AUTO_AFTER)
  const lastAuto = useRef(-1)
  const popAt = useRef(-10)
  const started = useRef(false)

  const draw = ({ ctx, width: w, height: h, time, delta, dpr, params, thumb }: CanvasFrame) => {
    now.current = time
    const list = pieces.current
    const size = Math.max(3, Math.min(10, Math.min(w, h) / 55))
    const count = Math.max(2, Math.round(params.count * (thumb ? 0.5 : 1)))
    const gravity = params.gravity * h * 0.9
    const power = params.power

    const buttonCenter = () => {
      const b = button.current?.getBoundingClientRect()
      const r = box.current?.getBoundingClientRect()
      if (!b || !r || b.width === 0) return { x: w / 2, y: h * 0.62 }
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height * 0.25 }
    }

    const fire = (burst: Burst) => {
      const rand = seeded(++bursts.current * 7919 + 101)
      if (burst.kind === 'corners') {
        // two cannons in the bottom corners, aimed across the middle toward the top
        for (const side of [0, 1]) {
          const ox = side ? w * 0.97 : w * 0.03
          const oy = h + 4
          const dx = w * (side ? 0.38 : 0.62) - ox
          const dy = -h * 0.05 - oy
          spray(list, rand, Math.ceil(count / 2), ox, oy, Math.atan2(dy, dx), 0.3, Math.hypot(dx, dy) * 2.9 * power, size)
        }
      } else if (burst.kind === 'button') {
        const o = buttonCenter()
        spray(list, rand, count, o.x, o.y, -Math.PI / 2, 1, h * 1.95 * power, size)
        popAt.current = time
      } else {
        const x = burst.x ?? w / 2
        const y = burst.y ?? h / 2
        spray(list, rand, count, x, y, -Math.PI / 2, 1.35, h * 1.35 * power, size)
        rings.current.push({ x, y, t: time })
      }
      if (list.length > MAX_PIECES) list.splice(0, list.length - MAX_PIECES)
    }

    // the very first frame already shows a shower in mid-air, so a paused picture is not empty
    if (!started.current) {
      started.current = true
      lastAuto.current = Math.floor(time / AUTO_EVERY)
      fire({ kind: 'corners' })
      for (let i = 0; i < 40; i++) simulate(list, STEP, gravity, w, h)
    }

    for (const burst of requests.current.splice(0)) fire(burst)

    // nobody is clicking: corners, then the button, then a spot on the stage, over and over
    if (thumb || time - lastTouch.current > AUTO_AFTER) {
      const slot = Math.floor(time / AUTO_EVERY)
      if (slot !== lastAuto.current) {
        lastAuto.current = slot
        const turn = slot % 3
        if (turn === 0) fire({ kind: 'corners' })
        else if (turn === 1) fire({ kind: 'button' })
        else {
          const r = seeded(slot * 31 + 7)
          fire({ kind: 'point', x: w * (0.15 + 0.7 * r()), y: h * (0.2 + 0.25 * r()) })
        }
      }
    }

    // small fixed steps keep the motion the same at any frame rate or speed
    const steps = Math.ceil(delta / STEP - 1e-6)
    for (let i = 0; i < steps; i++) simulate(list, delta / steps, gravity, w, h)

    ctx.clearRect(0, 0, w, h)

    // a ring where a click (or the demo's pretend click) landed
    rings.current = rings.current.filter((r) => time - r.t < 0.5)
    for (const r of rings.current) {
      const k = (time - r.t) / 0.5
      ctx.beginPath()
      ctx.arc(r.x, r.y, 6 + k * 28, 0, TAU)
      ctx.strokeStyle = `rgba(60, 40, 110, ${0.4 * (1 - k)})`
      ctx.lineWidth = 2
      ctx.stroke()
    }

    for (const p of list) {
      // squash one axis by cos(flip): the paper looks like it turns over in 3D
      const flip = Math.cos(p.flip)
      ctx.globalAlpha = clamp01((p.life - p.age) / 0.9)
      ctx.fillStyle = flip >= 0 ? COLORS[p.color] : BACKS[p.color]
      const c = Math.cos(p.angle) * dpr
      const s = Math.sin(p.angle) * dpr
      ctx.setTransform(c, s, -s * flip, c * flip, p.x * dpr, p.y * dpr)
      if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6)
      else if (p.shape === 1) {
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.36, 0, TAU)
        ctx.fill()
      } else ctx.fillRect(-p.size * 0.9, -p.size * 0.12, p.size * 1.8, p.size * 0.24)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.globalAlpha = 1

    // the card answers its own button with a little pop
    const k = (time - popAt.current) / 0.45
    const pop = k >= 0 && k < 1 ? Math.sin(k * Math.PI) : 0
    if (card.current) card.current.style.transform = pop ? `scale(${1 + pop * 0.035})` : ''
    if (icon.current) icon.current.style.transform = pop ? `rotate(${-pop * 18}deg) scale(${1 + pop * 0.2})` : ''
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (paused || thumb) return
    lastTouch.current = now.current
    if (button.current?.contains(e.target as Node)) return // the button's own click fires its burst
    const r = e.currentTarget.getBoundingClientRect()
    requests.current.push({ kind: 'point', x: e.clientX - r.left, y: e.clientY - r.top })
  }

  const celebrate = () => {
    if (paused) return
    lastTouch.current = now.current
    requests.current.push({ kind: 'button' })
  }

  return (
    <div
      ref={box}
      onPointerDown={onPointerDown}
      className="@container relative grid size-full cursor-pointer touch-manipulation place-items-center overflow-hidden select-none"
      style={{ containerType: 'size', background: 'radial-gradient(circle at 50% 38%, #fffaf0 0%, #fde8ef 55%, #e8e2ff 100%)' }}
    >
      <div
        ref={card}
        className="flex flex-col items-center bg-white/90 text-center shadow-[0_24px_60px_-24px_rgba(80,40,140,0.45)] ring-1 ring-black/5"
        style={{
          borderRadius: 'clamp(12px, 3cqmin, 24px)',
          padding: thumb ? '10px 18px' : 'clamp(14px, 5cqmin, 40px) clamp(18px, 7cqmin, 56px)',
          gap: 'clamp(4px, 1.6cqmin, 12px)',
        }}
      >
        <span
          className="grid place-items-center rounded-full bg-amber-100 text-amber-600"
          style={{ width: 'clamp(24px, 11cqmin, 72px)', height: 'clamp(24px, 11cqmin, 72px)' }}
        >
          <PartyPopperIcon ref={icon} className="size-[55%]" />
        </span>
        <h2 className="font-bold tracking-tight text-neutral-900" style={{ fontSize: 'clamp(15px, 6.5cqmin, 44px)' }}>
          축하합니다!
        </h2>
        {!thumb && (
          <p className="text-neutral-500" style={{ fontSize: 'clamp(11px, 2.4cqmin, 16px)' }}>
            30일 연속으로 목표를 달성했어요
          </p>
        )}
        <button
          ref={button}
          type="button"
          tabIndex={thumb ? -1 : 0}
          onClick={celebrate}
          className="mt-[clamp(2px,1cqmin,8px)] rounded-full bg-neutral-900 font-medium text-white outline-none hover:bg-neutral-800 focus-visible:ring-3 focus-visible:ring-violet-300"
          style={{ fontSize: 'clamp(10px, 2.3cqmin, 15px)', padding: 'clamp(4px, 1.2cqmin, 10px) clamp(10px, 3cqmin, 20px)' }}
        >
          한 번 더 축하하기
        </button>
      </div>
      {!thumb && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[clamp(8px,3cqh,20px)] text-center text-[clamp(10px,2cqmin,13px)] text-neutral-500">
          무대 아무 곳이나 눌러도 터집니다
        </p>
      )}
      {/* the confetti layer sits above the card but lets every click through */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} />
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'confetti',
  group: 'motion',
  name: '컨페티',
  englishName: 'Confetti',
  aliases: ['Confetti burst', 'Celebration animation', 'Party popper', '꽃가루 효과', '축하 효과'],
  description: '축하할 순간에 색종이 조각이 터져 나와 하늘하늘 뒤집히며 떨어지는 애니메이션',
  context: '결제·가입 완료 화면, 목표 달성 알림, 게임의 레벨 업처럼 사용자를 축하하는 순간에 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '버튼을 누르면 버튼에서, 무대 아무 곳이나 누르면 그 자리에서 터집니다. 4초 동안 가만히 두면 저절로 터집니다.',
  traits: [
    {
      title: '조각 하나하나의 물리',
      description:
        '조각마다 속도를 갖고, requestAnimationFrame으로 매 프레임 중력을 더하고 공기 저항으로 속도를 줄인 뒤 위치를 옮깁니다. 저항이 커서 처음엔 힘차게 솟구치다 금방 느려져 종이처럼 하늘하늘 떨어집니다.',
    },
    {
      title: '납작한 종이의 3D 착시',
      description:
        '조각을 돌리면서 한쪽 크기에 cos(각도)를 곱하면 얇아졌다 넓어지며 뒤집히는 것처럼 보입니다. 뒷면일 때는 색을 조금 어둡게 칠하고, 좌우로 살랑이는 흔들림을 더해 진짜 종이처럼 만듭니다.',
    },
    {
      title: '터뜨리고, 흐려지고, 치우기',
      description:
        '한 번에 수십~수백 조각을 방향·속도·색·모양을 무작위로 섞어 만들고, 수명이 끝날 즈음 흐려지다 지우거나 화면 밖으로 나가면 지웁니다. 조각이 많아도 Canvas 하나에 그려 가볍습니다.',
    },
  ],
  params: [
    { key: 'count', label: '조각 수', min: 20, max: 300, step: 10, default: 140, unit: '개' },
    { key: 'gravity', label: '중력', min: 0.2, max: 3, step: 0.1, default: 1, unit: '×' },
    { key: 'power', label: '퍼지는 힘', min: 0.3, max: 2, step: 0.1, default: 1, unit: '×' },
  ],
  Scene: ConfettiScene,
}
