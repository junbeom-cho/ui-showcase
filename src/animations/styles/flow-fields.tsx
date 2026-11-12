import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import type { Pointer } from '../engine/pointer'
import { noise3, seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const TAU = Math.PI * 2
const BG = '#0a0c18'
// colour follows the direction of travel, so each stream keeps one hue until it turns
const PALETTE = ['#ffd27f', '#ff9a6b', '#ff5e7e', '#c36bff', '#6c8cff', '#4fd9d2']
const NONE = 255

type Flow = {
  shape: string
  look: string
  n: number
  x: Float32Array
  y: Float32Array
  ox: Float32Array
  oy: Float32Array
  life: Float32Array
  bucket: Uint8Array
  rnd: () => number
}

function spawn(f: Flow, i: number, w: number, h: number) {
  f.x[i] = f.ox[i] = f.rnd() * w
  f.y[i] = f.oy[i] = f.rnd() * h
  f.life[i] = 1.5 + f.rnd() * 4.5
  f.bucket[i] = NONE
}

/** Move every particle one step along the field and remember which colour its segment gets. */
function advance(f: Flow, dt: number, time: number, w: number, h: number, freq: number, speed: number, pointer: Pointer) {
  const step = dt * 60 * speed
  const z = time * 0.1
  const swirlR = Math.min(w, h) * 0.22
  for (let i = 0; i < f.n; i++) {
    const x = f.x[i]
    const y = f.y[i]
    const a = noise3(x * freq, y * freq, z) * Math.PI * 2.2
    let vx = Math.cos(a)
    let vy = Math.sin(a)
    if (pointer.inside) {
      // the pointer adds a whirlpool to the field
      const dx = x - pointer.x
      const dy = y - pointer.y
      const d = Math.hypot(dx, dy) + 1e-3
      if (d < swirlR) {
        const k = (1 - d / swirlR) * 2.5
        vx += (-dy / d) * k
        vy += (dx / d) * k
        const l = Math.hypot(vx, vy) + 1e-6
        vx /= l
        vy /= l
      }
    }
    f.ox[i] = x
    f.oy[i] = y
    f.x[i] = x + vx * step
    f.y[i] = y + vy * step
    f.life[i] -= dt
    if (f.life[i] <= 0 || f.x[i] < -2 || f.x[i] > w + 2 || f.y[i] < -2 || f.y[i] > h + 2) spawn(f, i, w, h)
    else f.bucket[i] = Math.floor(((Math.atan2(vy, vx) + Math.PI) / TAU) * PALETTE.length) % PALETTE.length
  }
}

function paint(ctx: CanvasRenderingContext2D, f: Flow, thumb: boolean) {
  ctx.lineWidth = thumb ? 0.7 : 0.9
  ctx.globalAlpha = 0.22
  for (let b = 0; b < PALETTE.length; b++) {
    ctx.strokeStyle = PALETTE[b]
    ctx.beginPath()
    for (let i = 0; i < f.n; i++) {
      if (f.bucket[i] !== b) continue
      ctx.moveTo(f.ox[i], f.oy[i])
      ctx.lineTo(f.x[i], f.y[i])
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Wash toward the background; a fixed per-second strength keeps trails the same length at any frame rate. */
function fade(ctx: CanvasRenderingContext2D, dt: number, trail: number, w: number, h: number) {
  // not below ~1.5 %: weaker washes stall on 8-bit rounding and leave a grey haze
  const perFrame = 0.015 + (1 - trail) * 0.11
  ctx.globalAlpha = 1 - Math.pow(1 - perFrame, dt * 60)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1
}

function FlowFieldsScene({ params, paused, thumb }: SceneProps) {
  const flow = useRef<Flow | null>(null)

  const draw = ({ ctx, width: w, height: h, time, delta, pointer, resized, params, thumb }: CanvasFrame) => {
    const n = Math.round(params.count * (thumb ? 0.25 : 1))
    const shape = `${w}x${h}|${n}`
    const look = `${shape}|${params.flowSize}|${params.trail}`
    const min = Math.min(w, h)
    const freq = 3 / (params.flowSize * min)
    const speed = min * 0.0026

    // Rebuild on resize or a new count; while paused, also on any slider so the still picture matches it.
    // A rebuilt field is grown for a moment at once, so even a paused redraw shows full streams.
    if (resized || !flow.current || flow.current.shape !== shape || (delta === 0 && flow.current.look !== look)) {
      const f: Flow = {
        shape,
        look,
        n,
        x: new Float32Array(n),
        y: new Float32Array(n),
        ox: new Float32Array(n),
        oy: new Float32Array(n),
        life: new Float32Array(n),
        bucket: new Uint8Array(n),
        rnd: seeded(4242),
      }
      for (let i = 0; i < n; i++) {
        spawn(f, i, w, h)
        f.life[i] *= f.rnd() // stagger respawns
      }
      flow.current = f
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)
      // about 200k segments at most, so dragging the count slider stays responsive
      const warmup = thumb ? 50 : Math.round(Math.min(90, Math.max(30, 200000 / n)))
      for (let s = 0; s < warmup; s++) {
        fade(ctx, 1 / 60, params.trail, w, h)
        advance(f, 1 / 60, time, w, h, freq, speed, pointer)
        paint(ctx, f, thumb)
      }
      return
    }

    const f = flow.current
    f.look = look
    if (delta <= 0) return // nothing moved; the canvas still holds the last picture
    const dt = Math.min(delta, 0.05)
    fade(ctx, dt, params.trail, w, h)
    advance(f, dt, time, w, h, freq, speed, pointer)
    paint(ctx, f, thumb)
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#0a0c18]" />
}

export const animation: AnimationStyle = {
  id: 'flow-fields',
  name: '플로우 필드',
  englishName: 'Flow Fields',
  aliases: ['Vector field', 'Perlin flow', '흐름장'],
  description: '보이지 않는 바람결을 따라 수많은 점이 가는 선을 남기며 머리카락처럼 흐르는 그림',
  context: '제너러티브 아트 작품, 음악·브랜드 영상 배경, 데이터 시각화의 바람 지도에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 올리면 그 자리에 소용돌이가 생겨 흐름이 휘감깁니다.',
  traits: [
    { title: '노이즈로 만든 방향 지도', description: '화면의 모든 위치에 부드럽게 변하는 노이즈 값을 하나씩 두고, 그 값을 "이쪽으로 가라"는 각도로 씁니다.' },
    { title: '쌓이는 가는 선', description: '입자마다 아주 옅은 선을 조금씩 그리고 지우지 않아, 같은 길을 지난 선이 겹치며 비단결 같은 줄기가 생깁니다.' },
    { title: '천천히 바뀌는 흐름', description: '노이즈에 시간 축을 더해 방향 지도 자체가 서서히 변하고, 오래된 선은 조금씩 어두워져 화면이 하얗게 차지 않습니다.' },
  ],
  params: [
    { key: 'count', label: '입자 수', min: 500, max: 6000, step: 100, default: 2500, unit: '개' },
    { key: 'flowSize', label: '흐름 크기', min: 0.3, max: 3, step: 0.1, default: 1, unit: '×' },
    { key: 'trail', label: '남는 정도', min: 0, max: 1, step: 0.05, default: 0.75 },
  ],
  Scene: FlowFieldsScene,
}
