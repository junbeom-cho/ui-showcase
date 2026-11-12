import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const TAU = Math.PI * 2

type LayerDef = { color: string; shade: string; top: number; amp: number; waves: number; sea?: boolean }

// Back to front: far hills, two strips of sea, near dunes.
const LAYERS: LayerDef[] = [
  { color: '#f6cdb8', shade: '#eebaa4', top: 0.4, amp: 0.07, waves: 1.3 },
  { color: '#f0ae9b', shade: '#e49886', top: 0.48, amp: 0.06, waves: 1.9 },
  { color: '#e38f84', shade: '#d07870', top: 0.56, amp: 0.05, waves: 2.6 },
  { color: '#7fbcc2', shade: '#62a5ad', top: 0.64, amp: 0.016, waves: 14, sea: true },
  { color: '#4f98a6', shade: '#3b8191', top: 0.72, amp: 0.018, waves: 10, sea: true },
  { color: '#de7a62', shade: '#c7624f', top: 0.8, amp: 0.04, waves: 2.2 },
  { color: '#8d4256', shade: '#723145', top: 0.89, amp: 0.045, waves: 1.6 },
]
// which sheets survive when the slider asks for fewer: always keep far hills, sea and foreground
const PRIORITY = [0, 3, 6, 2, 5, 1, 4]
const BOAT_LAYER = 3
const SHADOW = 'rgba(96, 42, 38, 0.42)'

/** A prebuilt bitmap; (ox, oy) is where the local origin sits inside it, in CSS px. */
type Sprite = { img: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }

type Layer = { index: number; depth: number; phase: number; sprite: Sprite; edge: Float32Array; step: number; margin: number }

type Paper = {
  key: string
  sky: HTMLCanvasElement
  rays: Sprite
  sun: Sprite
  sunX: number
  sunY: number
  clouds: { sprite: Sprite; y: number; speed: number; offset: number }[]
  layers: Layer[]
}

function sprite(w: number, h: number, ox: number, oy: number, scale: number, paint: (c: CanvasRenderingContext2D) => void): Sprite {
  const img = document.createElement('canvas')
  img.width = Math.max(1, Math.ceil(w * scale))
  img.height = Math.max(1, Math.ceil(h * scale))
  const c = img.getContext('2d')
  if (c) {
    c.setTransform(scale, 0, 0, scale, ox * scale, oy * scale)
    paint(c)
  }
  return { img, ox, oy, w, h }
}

/** Paper fibre: light and dark specks plus a few short fibres, tiled as a pattern. */
function makeGrain(): HTMLCanvasElement {
  const size = 128
  const img = document.createElement('canvas')
  img.width = img.height = size
  const c = img.getContext('2d')
  if (!c) return img
  const data = c.createImageData(size, size)
  const rnd = seeded(91)
  for (let i = 0; i < size * size; i++) {
    const v = rnd()
    const light = v > 0.5
    const o = i * 4
    data.data[o] = data.data[o + 1] = data.data[o + 2] = light ? 255 : 60
    data.data[o + 3] = Math.abs(v - 0.5) * (light ? 44 : 60)
  }
  c.putImageData(data, 0, 0)
  c.lineWidth = 0.6
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const a = rnd() * Math.PI
    const l = 4 + rnd() * 10
    c.strokeStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(80,40,30,0.08)'
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    c.stroke()
  }
  return img
}

/** Fill a cut shape with a soft shadow that falls on whatever is already below it. */
function cut(c: CanvasRenderingContext2D, path: Path2D, fill: string | CanvasGradient, shadow: number, scale: number, offset = true) {
  c.save()
  if (shadow > 0) {
    c.shadowColor = SHADOW
    c.shadowBlur = shadow * scale
    c.shadowOffsetX = offset ? shadow * 0.12 * scale : 0
    c.shadowOffsetY = offset ? shadow * 0.3 * scale : 0
  }
  c.fillStyle = fill
  c.fill(path)
  c.restore()
}

function grainOver(c: CanvasRenderingContext2D, grain: HTMLCanvasElement, s: { ox: number; oy: number; w: number; h: number }) {
  const pattern = c.createPattern(grain, 'repeat')
  if (!pattern) return
  c.save()
  c.globalCompositeOperation = 'source-atop'
  c.fillStyle = pattern
  c.fillRect(-s.ox, -s.oy, s.w, s.h)
  c.restore()
}

function buildLayer(index: number, w: number, h: number, scale: number, shadow: number, grain: HTMLCanvasElement, rnd: () => number): Layer {
  const def = LAYERS[index]
  const margin = w * 0.07
  const step = 4
  const n = Math.ceil((w + margin * 2) / step) + 2
  const edge = new Float32Array(n)
  // feature size follows the longer side, so a tall phone stage does not get squeezed waves
  const span = Math.max(w, h * 1.3)
  const p1 = rnd() * TAU
  const p2 = rnd() * TAU
  const p3 = rnd() * TAU
  let minY = h
  for (let i = 0; i < n; i++) {
    const u = (-margin + i * step) / span
    const y = def.sea
      ? def.top * h - def.amp * h * (Math.abs(Math.sin(u * def.waves * Math.PI + p1)) * 0.85 + 0.3 * Math.sin(u * 2.7 + p2))
      : def.top * h -
        def.amp * h * (0.62 * Math.sin(u * def.waves * TAU + p1) + 0.28 * Math.sin(u * def.waves * 2.3 * TAU + p2) + 0.1 * Math.sin(u * def.waves * 5.1 * TAU + p3))
    edge[i] = y
    minY = Math.min(minY, y)
  }
  const top = minY - shadow * 1.3 - 4 // room above the edge for the blurred shadow
  const bottom = h * 1.08
  const s = sprite(w + margin * 2, bottom - top, margin, -top, scale, (c) => {
    const path = new Path2D()
    path.moveTo(-margin, bottom)
    for (let i = 0; i < n; i++) path.lineTo(-margin + i * step, edge[i])
    path.lineTo(-margin + (n - 1) * step, bottom)
    path.closePath()

    // the sheet, a touch darker toward its foot as if lit from above
    const fill = c.createLinearGradient(0, minY, 0, h)
    fill.addColorStop(0, def.color)
    fill.addColorStop(1, def.shade)
    c.fillStyle = fill
    c.fill(path)
    grainOver(c, grain, { ox: margin, oy: -top, w: w + margin * 2, h: bottom - top })

    // the cut edge catches the light
    c.save()
    c.globalCompositeOperation = 'source-atop'
    c.strokeStyle = 'rgba(255, 248, 236, 0.55)'
    c.lineWidth = 1.6
    c.beginPath()
    for (let i = 0; i < n; i++) c.lineTo(-margin + i * step, edge[i])
    c.stroke()
    c.restore()

    // the shadow goes underneath, so it only shows on the sheet behind
    if (shadow > 0) {
      c.save()
      c.globalCompositeOperation = 'destination-over'
      c.shadowColor = SHADOW
      c.shadowBlur = shadow * scale
      c.shadowOffsetY = shadow * 0.3 * scale
      c.fillStyle = SHADOW
      c.fill(path)
      c.restore()
    }
  })
  return { index, depth: (index + 1) / LAYERS.length, phase: rnd() * TAU, sprite: s, edge, step, margin }
}

function buildPaper(key: string, w: number, h: number, dpr: number, count: number, shadowParam: number): Paper {
  const scale = Math.min(dpr, 1.5)
  const min = Math.min(w, h)
  const shadow = shadowParam * min * 0.028
  const grain = makeGrain()
  const rnd = seeded(2024)

  // sky: warm paper wash, brighter around the sun
  const sunX = w * 0.68
  const sunY = h * 0.34
  const R = min * 0.13
  const sky = sprite(w, h, 0, 0, scale, (c) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#f4c3b6')
    g.addColorStop(0.55, '#fde6cf')
    g.addColorStop(1, '#fcdcc4')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    const glow = c.createRadialGradient(sunX, sunY, R, sunX, sunY, R * 5)
    glow.addColorStop(0, 'rgba(255, 238, 196, 0.85)')
    glow.addColorStop(1, 'rgba(255, 238, 196, 0)')
    c.fillStyle = glow
    c.fillRect(0, 0, w, h)
    grainOver(c, grain, { ox: 0, oy: 0, w, h })
  }).img

  // a cut-paper sunburst behind three stacked discs
  const rr = R * 1.55
  const rays = sprite(rr * 2 + shadow * 3, rr * 2 + shadow * 3, rr + shadow * 1.5, rr + shadow * 1.5, scale, (c) => {
    const path = new Path2D()
    const points = 14
    for (let i = 0; i <= points * 2; i++) {
      const a = (i / (points * 2)) * TAU
      const r = i % 2 === 0 ? rr : R * 1.08
      path.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    path.closePath()
    cut(c, path, '#ffbf66', shadow * 0.8, scale, false)
    grainOver(c, grain, { ox: rr + shadow * 1.5, oy: rr + shadow * 1.5, w: rr * 2 + shadow * 3, h: rr * 2 + shadow * 3 })
  })
  const sunPad = R + shadow * 2
  const sun = sprite(sunPad * 2, sunPad * 2, sunPad, sunPad, scale, (c) => {
    const discs: [number, string][] = [
      [R, '#ffb84f'],
      [R * 0.76, '#ffcf75'],
      [R * 0.52, '#ffe4a3'],
    ]
    for (const [r, color] of discs) {
      const path = new Path2D()
      path.arc(0, 0, r, 0, TAU)
      cut(c, path, color, shadow * 0.7, scale)
    }
    grainOver(c, grain, { ox: sunPad, oy: sunPad, w: sunPad * 2, h: sunPad * 2 })
  })

  // puffy clouds: a few circles on a flat base, cut as one piece
  const clouds: Paper['clouds'] = []
  for (let i = 0; i < 3; i++) {
    const cw = min * (0.3 + rnd() * 0.14)
    const ch = cw * 0.42
    const pad = shadow * 2 + 2
    const s = sprite(cw + pad * 2, ch + pad * 2, pad, pad, scale, (c) => {
      const path = new Path2D()
      path.roundRect(0, ch * 0.55, cw, ch * 0.45, ch * 0.22)
      const bumps = 4
      for (let b = 0; b < bumps; b++) {
        const r = ch * (0.28 + 0.2 * Math.sin((b / (bumps - 1)) * Math.PI))
        const x = cw * (0.18 + (b / (bumps - 1)) * 0.64)
        path.moveTo(x + r, ch * 0.52)
        path.arc(x, ch * 0.52, r, 0, TAU)
      }
      cut(c, path, '#fff7ee', shadow * 0.8, scale)
      grainOver(c, grain, { ox: pad, oy: pad, w: cw + pad * 2, h: ch + pad * 2 })
    })
    clouds.push({ sprite: s, y: h * (0.08 + i * 0.1 + rnd() * 0.05), speed: w * (0.01 + rnd() * 0.012), offset: rnd() })
  }

  const chosen = PRIORITY.slice(0, count).sort((a, b) => a - b)
  const layers = chosen.map((index) => buildLayer(index, w, h, scale, shadow, grain, seeded(100 + index)))
  return { key, sky, rays, sun, sunX, sunY, clouds, layers }
}

function drawBoat(ctx: CanvasRenderingContext2D, L: Layer, offX: number, offY: number, time: number, w: number, size: number, shadow: number) {
  const bx = w * (0.3 + 0.1 * Math.sin(time * 0.09))
  const fi = (bx - offX + L.margin) / L.step
  const i = Math.max(1, Math.min(L.edge.length - 2, Math.floor(fi)))
  const f = Math.min(1, Math.max(0, fi - i))
  const y = L.edge[i] * (1 - f) + L.edge[i + 1] * f + offY
  const slope = (L.edge[i + 1] - L.edge[i - 1]) / (2 * L.step)
  const angle = Math.atan(slope) * 0.6 + Math.sin(time * 1.3) * 0.04

  ctx.save()
  ctx.translate(bx, y)
  ctx.rotate(angle)
  ctx.shadowColor = SHADOW
  ctx.shadowBlur = shadow
  ctx.shadowOffsetY = shadow * 0.3
  ctx.fillStyle = '#6e3b3f'
  ctx.fillRect(-size * 0.025, -size * 1.0, size * 0.05, size * 0.85)
  ctx.fillStyle = '#f6dcbc'
  ctx.beginPath()
  ctx.moveTo(-size * 0.05, -size * 0.82)
  ctx.lineTo(-size * 0.05, -size * 0.26)
  ctx.lineTo(-size * 0.4, -size * 0.26)
  ctx.fill()
  ctx.fillStyle = '#fff4e4'
  ctx.beginPath()
  ctx.moveTo(size * 0.04, -size * 0.95)
  ctx.lineTo(size * 0.46, -size * 0.26)
  ctx.lineTo(size * 0.04, -size * 0.26)
  ctx.fill()
  ctx.fillStyle = '#b9534b'
  ctx.beginPath()
  ctx.moveTo(-size * 0.56, -size * 0.2)
  ctx.lineTo(size * 0.56, -size * 0.2)
  ctx.lineTo(size * 0.38, size * 0.12)
  ctx.lineTo(-size * 0.4, size * 0.12)
  ctx.fill()
  ctx.restore()
}

function drawBirds(ctx: CanvasRenderingContext2D, time: number, w: number, h: number, min: number, shadow: number) {
  ctx.save()
  ctx.fillStyle = '#7d3a4e'
  ctx.shadowColor = SHADOW
  ctx.shadowBlur = shadow * 0.5
  ctx.shadowOffsetY = shadow * 0.25
  for (let b = 0; b < 2; b++) {
    const x = ((time * w * 0.028 + b * w * 0.08 + w * 0.15) % (w * 1.4)) - w * 0.2
    const y = h * (0.2 + b * 0.05) + Math.sin(time * 0.8 + b * 2) * h * 0.012
    const s = min * (0.024 - b * 0.005)
    const flap = Math.sin(time * 6.5 + b * 1.7)
    const tip = -s * 0.55 * flap
    ctx.beginPath()
    ctx.moveTo(0 + x, y + s * 0.12)
    ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.35 * flap - s * 0.1, x - s, y + tip)
    ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.05 * flap + s * 0.12, x, y + s * 0.3)
    ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.05 * flap + s * 0.12, x + s, y + tip)
    ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.35 * flap - s * 0.1, x, y + s * 0.12)
    ctx.fill()
  }
  ctx.restore()
}

function PaperCutoutScene({ params, paused, thumb }: SceneProps) {
  const paper = useRef<Paper | null>(null)
  const look = useRef({ x: 0, y: 0 })

  const draw = ({ ctx, width: w, height: h, dpr, time, delta, pointer, resized, params }: CanvasFrame) => {
    const count = Math.round(params.layers)
    const key = `${w}x${h}|${dpr}|${count}|${params.shadow}`
    if (resized || !paper.current || paper.current.key !== key) paper.current = buildPaper(key, w, h, dpr, count, params.shadow)
    const p = paper.current
    const min = Math.min(w, h)
    const shadow = params.shadow * min * 0.028 * dpr // live shadows are in device pixels

    // ease the parallax toward the pointer, back to centre when it leaves
    const view = look.current
    const k = 1 - Math.exp(-delta * 3)
    view.x += ((pointer.inside ? pointer.x / w - 0.5 : 0) - view.x) * k
    view.y += ((pointer.inside ? pointer.y / h - 0.5 : 0) - view.y) * k

    ctx.drawImage(p.sky, 0, 0, w, h)

    const sx = p.sunX - view.x * w * 0.01
    const sy = p.sunY - view.y * h * 0.01 + Math.sin(time * 0.3) * h * 0.004
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(time * 0.06)
    ctx.drawImage(p.rays.img, -p.rays.ox, -p.rays.oy, p.rays.w, p.rays.h)
    ctx.restore()
    ctx.drawImage(p.sun.img, sx - p.sun.ox, sy - p.sun.oy, p.sun.w, p.sun.h)

    for (const c of p.clouds) {
      const span = w + c.sprite.w * 2
      const x = ((c.offset * span + time * c.speed) % span) - c.sprite.w - view.x * w * 0.012
      ctx.drawImage(c.sprite.img, x - c.sprite.ox, c.y - c.sprite.oy - view.y * h * 0.01, c.sprite.w, c.sprite.h)
    }

    drawBirds(ctx, time, w, h, min, shadow)

    // each sheet is rigid paper: it only slides, more the closer it is
    for (const L of p.layers) {
      const d = L.depth
      const offX = Math.sin(time * (0.3 + 0.05 * L.index) + L.phase) * w * (0.004 + 0.012 * d) - view.x * w * 0.05 * d
      const offY = Math.sin(time * 0.45 + L.phase * 1.3) * h * (0.002 + 0.005 * d) - view.y * h * 0.03 * d
      const s = L.sprite
      ctx.drawImage(s.img, offX - s.ox, offY - s.oy, s.w, s.h)
      if (L.index === BOAT_LAYER) drawBoat(ctx, L, offX, offY, time, w, min * 0.085, shadow)
    }
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#fde6cf]" />
}

export const animation: AnimationStyle = {
  id: 'paper-cutout',
  name: '페이퍼 컷아웃',
  englishName: 'Paper Cutout',
  aliases: ['Paper cut', 'Layered paper', '종이 오리기'],
  description: '색종이를 오려 여러 겹 겹쳐 놓은 듯한 언덕과 바다가 천천히 흔들리는 애니메이션',
  context: '동화책 일러스트, 앱 온보딩 화면, 계절 이벤트 배너와 라이트 박스 장식에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 움직이면 가까운 종이일수록 더 크게 움직여 겹 사이의 깊이가 드러납니다.',
  traits: [
    { title: '겹마다 드리운 그림자', description: '앞장이 뒷장 위에 부드러운 그림자를 떨어뜨려, 평면 그림인데도 종이가 실제로 쌓여 있는 것처럼 보입니다.' },
    { title: '평평한 색과 종이 결', description: '그러데이션 대신 장마다 한 가지 색을 쓰고, 표면에 미세한 종이 결을 얹어 손으로 만든 느낌을 냅니다.' },
    { title: '단단한 종이의 움직임', description: '모양이 출렁이지 않고 장 전체가 미끄러지듯 움직입니다. 가까운 장일수록 크게 움직여 시차가 생깁니다.' },
  ],
  params: [
    { key: 'layers', label: '층 수', min: 3, max: 7, step: 1, default: 6, unit: '장' },
    { key: 'shadow', label: '그림자 깊이', min: 0, max: 2, step: 0.1, default: 1, unit: '×' },
  ],
  Scene: PaperCutoutScene,
}
