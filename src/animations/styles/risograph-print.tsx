import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { fbm3, noise3, seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const PAPER = '#f4efe4'
/** spot inks in printing order: yellow, fluorescent pink, blue */
const INKS = ['#ffe800', '#ff48b0', '#0078bf']
/** each ink's resting misregistration direction; the slider scales it */
const DRIFT = [
  [0.25, -0.35],
  [1, 0.45],
  [-0.75, 0.85],
]
/** textures are a little larger than the stage so every layer can sample them at its own offset */
const PAD = 48
const SANS = 'ui-sans-serif, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
const MONO = 'ui-monospace, "IBM Plex Mono", monospace'

type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null; dots: CanvasPattern | null }
type Press = { w: number; h: number; dpr: number; layers: Layer[]; speck: HTMLCanvasElement | null; patch: HTMLCanvasElement | null; grain: HTMLCanvasElement | null }

/** a canvas filled pixel by pixel once; null where canvas is unavailable (tests) */
function texture(w: number, h: number, fill: (data: Uint8ClampedArray, w: number, h: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')
  if (!c) return null
  const image = c.createImageData(w, h)
  fill(image.data, w, h)
  c.putImageData(image, 0, 0)
  return canvas
}

/** a halftone tint: one dot per tile, drawn at device resolution and scaled back to CSS pixels */
function dotPattern(c: CanvasRenderingContext2D, ink: string, cell: number, dpr: number) {
  const tile = document.createElement('canvas')
  const size = Math.max(2, Math.round(cell * dpr))
  tile.width = size
  tile.height = size
  const t = tile.getContext('2d')
  if (!t) return null
  t.fillStyle = ink
  t.beginPath()
  t.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2)
  t.fill()
  const pattern = c.createPattern(tile, 'repeat')
  if (pattern && typeof DOMMatrix !== 'undefined') pattern.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]))
  return pattern
}

function buildPress(w: number, h: number, dpr: number): Press {
  const cell = Math.max(4, Math.round(Math.min(w, h) * 0.014))
  const layers = INKS.map((ink) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    const ctx = canvas.getContext('2d')
    return { canvas, ctx, dots: ctx ? dotPattern(ctx, ink, cell, dpr) : null }
  })
  const tw = Math.ceil(w) + PAD
  const th = Math.ceil(h) + PAD
  const rand = seeded(4242)
  // ink dropouts: mostly faint grain, with scattered fully missing specks
  const speck = texture(tw, th, (data) => {
    for (let i = 3; i < data.length; i += 4) {
      const r = rand()
      data[i] = r < 0.01 ? 255 : r < 0.04 ? 120 : Math.pow(rand(), 5) * 110
    }
  })
  // low-frequency blotches where the drum laid down less ink, scaled up smoothly when drawn
  const patch = texture(Math.ceil(tw / 12), Math.ceil(th / 12), (data, pw, ph) => {
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) data[(y * pw + x) * 4 + 3] = Math.max(0, fbm3(x * 0.16, y * 0.16, 3.3, 3)) * 2.2 * 255
  })
  // paper tooth, multiplied over everything at the end
  const grain = texture(tw, th, (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const v = 255 - Math.pow(rand(), 2.5) * 70
      data[i] = v
      data[i + 1] = v * 0.99
      data[i + 2] = v * 0.97
      data[i + 3] = 255
    }
  })
  return { w, h, dpr, layers, speck, patch, grain }
}

const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

/** the same crosshair on every plate shows the misregistration plainly */
function registrationMark(c: CanvasRenderingContext2D, x: number, y: number, r: number, ink: string) {
  c.strokeStyle = ink
  c.lineWidth = Math.max(1, r * 0.14)
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.moveTo(x - r * 1.6, y)
  c.lineTo(x + r * 1.6, y)
  c.moveTo(x, y - r * 1.6)
  c.lineTo(x, y + r * 1.6)
  c.stroke()
}

/** what each plate prints; shapes drift slowly with scene time */
function paintPlate(c: CanvasRenderingContext2D, i: number, layer: Layer, w: number, h: number, t: number, thumb: boolean) {
  const S = Math.min(w, h)
  const ink = INKS[i]
  c.fillStyle = ink
  if (i === 0) {
    // a big sun and a tilted band of stripes
    disc(c, w * 0.68 + Math.sin(t * 0.11) * w * 0.04, h * 0.36 + Math.cos(t * 0.09) * h * 0.05, S * 0.3)
    c.save()
    c.translate(w * 0.5, h * 0.82)
    c.rotate(-0.06 + Math.sin(t * 0.05) * 0.03)
    const gap = S * 0.05
    const shift = (t * S * 0.012) % gap
    // stripes slide down inside a fixed window, so they enter and leave without popping
    c.beginPath()
    c.rect(-w * 0.75, -S * 0.12, w * 1.5, gap * 5)
    c.clip()
    for (let k = -1; k < 5; k++) c.fillRect(-w * 0.75, -S * 0.12 + k * gap + shift, w * 1.5, gap * 0.5)
    c.restore()
  } else if (i === 1) {
    disc(c, w * 0.34 + Math.cos(t * 0.08) * w * 0.05, h * 0.52 + Math.sin(t * 0.1) * h * 0.06, S * 0.27)
    // a halftone band: the same ink at a lighter tint, made of dots
    if (layer.dots) {
      c.save()
      c.translate(w * 0.5, h * 0.5)
      c.rotate(0.55 + Math.sin(t * 0.06) * 0.08)
      c.fillStyle = layer.dots
      c.fillRect(-w, -S * 0.11, w * 2, S * 0.22)
      c.restore()
      c.fillStyle = ink
    }
    for (let k = 0; k < 5; k++) disc(c, w * 0.08 + k * S * 0.065 + Math.sin(t * 0.3 + k) * S * 0.01, h * 0.9, S * 0.02)
  } else {
    // a slowly breathing blob
    const bx = w * 0.56 + Math.sin(t * 0.07 + 1) * w * 0.06
    const by = h * 0.72 + Math.cos(t * 0.09) * h * 0.05
    c.beginPath()
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2
      const r = S * 0.22 * (1 + 0.2 * noise3(Math.cos(a) * 1.2, Math.sin(a) * 1.2, t * 0.12))
      if (k === 0) c.moveTo(bx + Math.cos(a) * r, by + Math.sin(a) * r)
      else c.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r)
    }
    c.closePath()
    c.fill()
    // bold type overprinted on the other inks
    const fs = Math.min(w * 0.26, h * 0.34)
    c.save()
    c.translate(w * 0.06, h * 0.07)
    c.rotate(-0.05 + Math.sin(t * 0.05) * 0.02)
    c.font = `900 ${fs}px ${SANS}`
    c.textBaseline = 'top'
    c.fillText('RISO', 0, 0)
    c.restore()
    if (!thumb) {
      c.font = `500 ${Math.max(9, S * 0.026)}px ${MONO}`
      c.textBaseline = 'alphabetic'
      c.fillText('RISOGRAPH · 3 SPOT COLORS · NO.03', w * 0.06, h * 0.965)
    }
  }
  registrationMark(c, w - S * 0.09, S * 0.09, S * 0.025, ink)
}

function RisographPrintScene({ params, paused, thumb }: SceneProps) {
  const press = useRef<Press | null>(null)
  const view = useRef({ px: 0, py: 0 })

  const draw = ({ ctx, width: w, height: h, dpr, time, delta, pointer, resized, params, thumb }: CanvasFrame) => {
    let p = press.current
    if (resized || !p) {
      p = buildPress(w, h, dpr)
      press.current = p
    }

    // the pointer pulls the plates apart in its direction; eased by delta so paused frames hold still
    const v = view.current
    const ease = 1 - Math.exp(-delta * 3)
    v.px += ((pointer.inside ? pointer.x / w - 0.5 : 0) - v.px) * ease
    v.py += ((pointer.inside ? pointer.y / h - 0.5 : 0) - v.py) * ease

    const mis = params.misregistration * (thumb ? 0.6 : 1)
    const grain = params.grain

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < p.layers.length; i++) {
      const layer = p.layers[i]
      const c = layer.ctx
      if (!c) continue
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.globalCompositeOperation = 'source-over'
      c.globalAlpha = 1
      c.clearRect(0, 0, layer.canvas.width, layer.canvas.height)
      c.setTransform(p.dpr, 0, 0, p.dpr, 0, 0)
      paintPlate(c, i, layer, w, h, time, thumb)

      // uneven coverage: knock specks and soft blotches out of the ink, each plate at its own offset
      c.globalCompositeOperation = 'destination-out'
      const sx = (i * 17) % PAD
      const sy = (i * 29) % PAD
      if (p.speck) {
        c.globalAlpha = 0.2 + grain * 0.8
        c.drawImage(p.speck, -sx, -sy, w + PAD, h + PAD)
      }
      if (p.patch) {
        c.globalAlpha = 0.1 + grain * 0.45
        c.drawImage(p.patch, -PAD + sy, -PAD + sx, w + PAD, h + PAD)
      }
      c.globalCompositeOperation = 'source-over'
      c.globalAlpha = 1

      // misregistration: every plate lands a few pixels off, wandering slowly
      const spread = (i - 1) * (4 + mis) * 1.5
      const ox = mis * (DRIFT[i][0] + 0.45 * noise3(time * 0.35, i * 7.3, 0.5)) + v.px * spread
      const oy = mis * (DRIFT[i][1] + 0.45 * noise3(i * 7.3, time * 0.35, 4.5)) + v.py * spread
      // overlapping inks multiply like real transparent ink: pink × blue = purple, yellow × pink = orange
      ctx.globalCompositeOperation = 'multiply'
      ctx.save()
      ctx.translate(w / 2 + ox, h / 2 + oy)
      ctx.rotate((i - 1) * 0.0004 * mis)
      ctx.drawImage(layer.canvas, -w / 2, -h / 2, w, h)
      ctx.restore()
    }

    if (p.grain) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.15 + grain * 0.6
      ctx.drawImage(p.grain, -PAD / 2, -PAD / 2, w + PAD, h + PAD)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#f4efe4]" />
}

export const animation: AnimationStyle = {
  id: 'risograph-print',
  name: '리소그래프 인쇄',
  englishName: 'Risograph Print',
  aliases: ['Riso print', 'Risography', '리소 인쇄'],
  description: '형광 분홍·파랑·노랑 잉크가 살짝 어긋난 채 겹쳐 찍힌 인쇄물처럼 보이는 애니메이션',
  context: '독립 출판물, 전시·공연 포스터, 일러스트 굿즈와 감성적인 브랜드 웹사이트에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 움직이면 그 방향으로 색판이 더 크게 어긋납니다.',
  traits: [
    {
      title: '별색 잉크를 겹쳐 찍기',
      description: '색마다 판을 따로 만들어 한 색씩 찍기 때문에, 분홍과 파랑이 겹친 곳은 보라, 노랑과 분홍이 겹친 곳은 주황처럼 새 색이 생깁니다.',
    },
    {
      title: '살짝 어긋난 판',
      description: '종이가 기계를 지날 때마다 위치가 조금씩 달라져 색 경계가 몇 픽셀씩 어긋납니다. 오른쪽 위 십자 표시를 보면 판마다 어긋난 정도가 보입니다.',
    },
    {
      title: '거친 잉크 질감',
      description: '잉크가 고르게 묻지 않아 면에 작은 흰 점과 얼룩이 남고, 연한 색은 점(망점)을 찍어 표현하며 종이 결이 그대로 비칩니다.',
    },
  ],
  params: [
    { key: 'misregistration', label: '어긋남', min: 0, max: 16, step: 1, default: 5, unit: 'px' },
    { key: 'grain', label: '거친 정도', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  Scene: RisographPrintScene,
}
