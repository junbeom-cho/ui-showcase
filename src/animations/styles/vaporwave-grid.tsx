import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const TAU = Math.PI * 2
const FAR = 60 // farthest grid row, in grid squares
const STRIPES = 7

type Vapor = {
  key: string
  hy: number
  floorH: number
  F: number
  sunX: number
  sunY: number
  R: number
  stars: Float32Array // x, y, size, phase
  ridge: Float32Array // x, y pairs
  sky: CanvasGradient
  halo: CanvasGradient
  sunFill: CanvasGradient
  mountain: CanvasGradient
  floor: CanvasGradient
  glow: CanvasGradient
  grid: CanvasGradient
  vignette: CanvasGradient
  scan: CanvasPattern | null
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function build(ctx: CanvasRenderingContext2D, key: string, w: number, h: number, params: Record<string, number>, thumb: boolean): Vapor {
  const hy = h * params.horizon
  const floorH = h - hy
  const F = w / 9 // pixels per grid square on the nearest row
  const R = params.sunSize * Math.min(w * 0.3, hy * 0.62)
  const sunX = w / 2
  const sunY = hy - R * 0.42
  const rnd = seeded(80)

  const starCount = thumb ? 35 : 90
  const stars = new Float32Array(starCount * 4)
  for (let i = 0; i < starCount; i++) {
    stars[i * 4] = rnd() * w
    stars[i * 4 + 1] = Math.pow(rnd(), 1.4) * hy * 0.8
    stars[i * 4 + 2] = rnd() < 0.15 ? 2 : 1
    stars[i * 4 + 3] = rnd() * TAU
  }

  // mountains on both sides, low in the middle so the sun shows
  const points = 28
  const ridge = new Float32Array(points * 2)
  for (let i = 0; i < points; i++) {
    const x = -0.05 * w + (i / (points - 1)) * 1.1 * w
    const side = smoothstep(0.08, 0.34, Math.abs(x / w - 0.5))
    const peak = i % 2 === 0 ? 0.55 + rnd() * 0.45 : 0.15 + rnd() * 0.25
    ridge[i * 2] = x
    ridge[i * 2 + 1] = hy - hy * 0.34 * peak * (0.08 + 0.92 * side)
  }

  const sky = ctx.createLinearGradient(0, 0, 0, hy)
  sky.addColorStop(0, '#0b0322')
  sky.addColorStop(0.45, '#2c0b56')
  sky.addColorStop(0.8, '#7b1a8f')
  sky.addColorStop(1, '#ff4fa0')

  const halo = ctx.createRadialGradient(sunX, sunY, R * 0.8, sunX, sunY, R * 2.2)
  halo.addColorStop(0, 'rgba(255, 90, 170, 0.45)')
  halo.addColorStop(1, 'rgba(255, 90, 170, 0)')

  const sunFill = ctx.createLinearGradient(0, sunY - R, 0, sunY + R)
  sunFill.addColorStop(0, '#fff17a')
  sunFill.addColorStop(0.4, '#ffa64d')
  sunFill.addColorStop(0.72, '#ff4f8b')
  sunFill.addColorStop(1, '#ff2d95')

  const mountain = ctx.createLinearGradient(0, hy * 0.6, 0, hy)
  mountain.addColorStop(0, '#2a0c4e')
  mountain.addColorStop(1, '#13042b')

  const floor = ctx.createLinearGradient(0, hy, 0, h)
  floor.addColorStop(0, '#3a0a52')
  floor.addColorStop(0.35, '#1a0433')
  floor.addColorStop(1, '#0b0220')

  const glowH = h * 0.09
  const glow = ctx.createLinearGradient(0, hy - glowH, 0, hy + glowH)
  glow.addColorStop(0, 'rgba(255, 70, 190, 0)')
  glow.addColorStop(0.5, 'rgba(255, 110, 200, 0.6)')
  glow.addColorStop(1, 'rgba(255, 70, 190, 0)')

  // grid fades into the horizon and turns from magenta to cyan as it comes closer
  const grid = ctx.createLinearGradient(0, hy, 0, h)
  grid.addColorStop(0, 'rgba(255, 60, 210, 0)')
  grid.addColorStop(0.1, 'rgba(255, 60, 210, 0.55)')
  grid.addColorStop(0.45, 'rgba(255, 70, 220, 1)')
  grid.addColorStop(1, 'rgba(40, 235, 255, 1)')

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(5, 0, 15, 0.55)')

  let scan: CanvasPattern | null = null
  if (!thumb) {
    const tile = document.createElement('canvas')
    tile.width = 1
    tile.height = 3
    const t = tile.getContext('2d')
    if (t) {
      t.fillStyle = 'rgba(0, 0, 0, 0.22)'
      t.fillRect(0, 0, 1, 1)
      scan = ctx.createPattern(tile, 'repeat')
    }
  }

  return { key, hy, floorH, F, sunX, sunY, R, stars, ridge, sky, halo, sunFill, mountain, floor, glow, grid, vignette, scan }
}

/** The sun with horizontal gaps that drift downward and widen as they go. */
function drawSun(ctx: CanvasRenderingContext2D, v: Vapor, time: number) {
  const { sunX: cx, sunY: cy, R } = v
  ctx.fillStyle = v.halo
  ctx.fillRect(cx - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TAU)
  ctx.clip()
  ctx.fillStyle = v.sunFill
  const start = cy - R * 0.05
  const end = cy + R
  const phase = (time * 0.3) % 1
  ctx.beginPath()
  let y = cy - R
  for (let j = 0; j < STRIPES; j++) {
    const t = (j + phase) / STRIPES
    const gy = start + (end - start) * t
    const gap = R * 0.17 * Math.pow(t, 1.3)
    if (gy - gap / 2 > y) ctx.rect(cx - R, y, R * 2, gy - gap / 2 - y)
    y = gy + gap / 2
  }
  if (y < end) ctx.rect(cx - R, y, R * 2, end - y)
  ctx.fill()
  ctx.restore()
}

function drawMountains(ctx: CanvasRenderingContext2D, v: Vapor, shift: number, thumb: boolean) {
  const r = v.ridge
  const n = r.length / 2
  ctx.save()
  ctx.translate(shift, 0)
  ctx.beginPath()
  ctx.moveTo(r[0], v.hy)
  for (let i = 0; i < n; i++) ctx.lineTo(r[i * 2], r[i * 2 + 1])
  ctx.lineTo(r[(n - 1) * 2], v.hy)
  ctx.closePath()
  ctx.fillStyle = v.mountain
  ctx.fill()

  // wireframe: each peak drops to the base between its neighbours, plus a half-height contour
  ctx.beginPath()
  for (let i = 0; i < n - 1; i++) {
    const bx = (r[i * 2] + r[i * 2 + 2]) / 2
    ctx.moveTo(r[i * 2], r[i * 2 + 1])
    ctx.lineTo(bx, v.hy)
    ctx.lineTo(r[i * 2 + 2], r[i * 2 + 3])
  }
  ctx.moveTo(r[0], v.hy - (v.hy - r[1]) * 0.45)
  for (let i = 1; i < n; i++) ctx.lineTo(r[i * 2], v.hy - (v.hy - r[i * 2 + 1]) * 0.45)
  ctx.strokeStyle = 'rgba(255, 90, 230, 0.4)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  for (let i = 0; i < n; i++) ctx.lineTo(r[i * 2], r[i * 2 + 1])
  ctx.strokeStyle = '#3ff0ff'
  if (!thumb) {
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  ctx.lineWidth = 1.4
  ctx.stroke()
  ctx.restore()
}

function VaporwaveGridScene({ params, paused, thumb }: SceneProps) {
  const state = useRef<Vapor | null>(null)
  const camera = useRef(0)

  const draw = ({ ctx, width: w, height: h, time, delta, pointer, resized, params, thumb }: CanvasFrame) => {
    const key = `${w}x${h}|${params.horizon}|${params.sunSize}|${thumb}`
    if (resized || !state.current || state.current.key !== key) state.current = build(ctx, key, w, h, params, thumb)
    const v = state.current
    const { hy, floorH, F } = v
    const cx = w / 2

    // steer the camera sideways with the pointer; drift a little on its own
    const target = pointer.inside ? (pointer.x / w - 0.5) * 3 : Math.sin(time * 0.15) * 0.6
    camera.current += (target - camera.current) * (1 - Math.exp(-delta * 2.5))
    const cam = camera.current

    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = v.sky
    ctx.fillRect(0, 0, w, hy + 1)

    ctx.fillStyle = '#ffffff'
    const s = v.stars
    for (let i = 0; i < s.length; i += 4) {
      ctx.globalAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * (1.2 + (i % 7) * 0.3) + s[i + 3]))
      ctx.fillRect(s[i], s[i + 1], s[i + 2], s[i + 2])
    }
    ctx.globalAlpha = 1

    drawSun(ctx, v, time)
    drawMountains(ctx, v, -cam * F * 0.06, thumb)

    ctx.fillStyle = v.floor
    ctx.fillRect(0, hy, w, floorH)

    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = v.glow
    ctx.fillRect(0, hy - h * 0.09, w, h * 0.18)

    // the floor: rows come toward the viewer, columns meet at the vanishing point
    const d = params.density
    const offset = (time * 1.2) % (1 / d)
    ctx.beginPath()
    for (let k = 1; k / d - offset < FAR; k++) {
      const z = k / d - offset
      if (z < 0.95) continue
      const y = hy + floorH / z
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    const topY = hy + floorH / FAR
    const reach = (w * 2.5) / F
    for (let j = Math.ceil((cam - reach) * d); j <= Math.floor((cam + reach) * d); j++) {
      const X = (j / d - cam) * F
      ctx.moveTo(cx + X / FAR, topY)
      ctx.lineTo(cx + X, h)
    }
    ctx.strokeStyle = v.grid
    if (!thumb) {
      ctx.globalAlpha = 0.28
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    ctx.lineWidth = thumb ? 1 : 1.3
    ctx.stroke()

    // a bright horizon line where sky meets floor
    ctx.fillStyle = 'rgba(255, 200, 240, 0.85)'
    ctx.fillRect(0, hy - 0.75, w, 1.5)
    ctx.globalCompositeOperation = 'source-over'

    ctx.fillStyle = v.vignette
    ctx.fillRect(0, 0, w, h)
    if (v.scan) {
      ctx.fillStyle = v.scan
      ctx.fillRect(0, 0, w, h)
    }
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#14042c]" />
}

export const animation: AnimationStyle = {
  id: 'vaporwave-grid',
  name: '베이퍼웨이브 그리드',
  englishName: 'Vaporwave Grid',
  aliases: ['Synthwave', 'Outrun', 'Retrowave', '레트로웨이브'],
  description: '보랏빛 하늘 아래 줄무늬 태양과 네온 격자 바닥이 끝없이 다가오는 80년대풍 풍경',
  context: '신스웨이브 음악 영상과 앨범 커버, 레트로 게임 화면, 80년대 감성 이벤트 포스터에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 좌우로 움직이면 카메라가 옆으로 미끄러지며 격자와 산이 함께 틀어집니다.',
  traits: [
    { title: '원근 격자 바닥', description: '가로줄은 멀수록 촘촘해지고 세로줄은 한 점(소실점)으로 모여, 평평한 바닥이 끝없이 이어지는 것처럼 보입니다.' },
    { title: '줄무늬 레트로 태양', description: '노랑에서 분홍으로 물든 큰 태양을 가로 틈으로 잘라 냅니다. 틈은 아래로 갈수록 넓어집니다.' },
    { title: '네온 색 조합', description: '짙은 남보라 배경에 자홍·청록 선을 빛나게 겹치고, 지평선을 밝게 번지게 해 80년대 컴퓨터 그래픽 느낌을 냅니다.' },
  ],
  params: [
    { key: 'density', label: '격자 밀도', min: 0.5, max: 2, step: 0.1, default: 1, unit: '×' },
    { key: 'horizon', label: '지평선 높이', min: 0.35, max: 0.7, step: 0.01, default: 0.55 },
    { key: 'sunSize', label: '태양 크기', min: 0.5, max: 1.5, step: 0.05, default: 1, unit: '×' },
  ],
  Scene: VaporwaveGridScene,
}
