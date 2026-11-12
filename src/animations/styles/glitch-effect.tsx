import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const BACKGROUND = '#08080d'
const SANS = 'ui-sans-serif, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
const MONO = 'ui-monospace, "IBM Plex Mono", monospace'
/** SMPTE-style colour bars, the classic "no signal" test pattern */
const BARS = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']
const PLUGE = ['#0000c0', '#111111', '#c000c0', '#111111', '#00c0c0', '#111111', '#c0c0c0']
const BLOCK_COLORS = ['#ff00ff', '#00ffff', '#ffffff', '#39ff14', '#ff2a2a']
/** bursts can only start inside these slots of scene time */
const SLOT = 0.7

type Glitch = {
  w: number
  h: number
  dpr: number
  /** the clean picture, drawn once per resize */
  base: HTMLCanvasElement
  /** red-only and green+blue-only copies, rebuilt on burst frames */
  red: HTMLCanvasElement
  redCtx: CanvasRenderingContext2D | null
  cyan: HTMLCanvasElement
  cyanCtx: CanvasRenderingContext2D | null
  scan: CanvasPattern | null
  noise: CanvasPattern | null
  vignette: CanvasGradient
}

const hashInt = (n: number) => {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}

const deviceCanvas = (w: number, h: number, dpr: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  return canvas
}

/** dark screen, a huge title, a little UI and colour bars: lots of edges for the glitch to tear */
function paintBase(c: CanvasRenderingContext2D, w: number, h: number) {
  const S = Math.min(w, h)
  c.fillStyle = BACKGROUND
  c.fillRect(0, 0, w, h)
  c.strokeStyle = '#151522'
  c.lineWidth = 1
  const step = Math.max(20, S * 0.07)
  c.beginPath()
  for (let x = step; x < w; x += step) {
    c.moveTo(Math.round(x) + 0.5, 0)
    c.lineTo(Math.round(x) + 0.5, h)
  }
  for (let y = step; y < h; y += step) {
    c.moveTo(0, Math.round(y) + 0.5)
    c.lineTo(w, Math.round(y) + 0.5)
  }
  c.stroke()

  const barTop = h * 0.8
  const barW = w / BARS.length
  BARS.forEach((color, i) => {
    c.fillStyle = color
    c.fillRect(i * barW, barTop, barW + 1, h * 0.13)
    c.fillStyle = PLUGE[i]
    c.fillRect(i * barW, barTop + h * 0.13, barW + 1, h * 0.07)
  })

  const fs = Math.min(w * 0.19, h * 0.28)
  const cy = h * 0.4
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#f4f4f8'
  c.font = `900 ${fs}px ${SANS}`
  c.fillText('GLITCH', w / 2, cy)
  const small = Math.max(9, fs * 0.11)
  c.font = `500 ${small}px ${MONO}`
  c.fillStyle = '#8089a3'
  c.fillText('ERR_0x3F  //  SIGNAL INTERRUPTED', w / 2, cy + fs * 0.62)
  const pw = Math.min(w * 0.42, fs * 3)
  const ph = Math.max(5, fs * 0.06)
  const py = cy + fs * 0.85
  c.strokeStyle = '#3a3f58'
  c.strokeRect(w / 2 - pw / 2 + 0.5, py + 0.5, pw, ph)
  c.fillStyle = '#18e0ff'
  c.fillRect(w / 2 - pw / 2 + 2, py + 2, (pw - 3) * 0.62, ph - 3)

  c.textAlign = 'right'
  c.textBaseline = 'top'
  c.fillStyle = '#9aa3b8'
  c.font = `500 ${Math.max(9, S * 0.035)}px ${MONO}`
  c.fillText('CH 03  AUTO', w - S * 0.05, S * 0.05)
  c.textAlign = 'left'
}

/** the changing bits (blinking REC and a running timecode) drawn over the base each frame */
function paintOverlay(c: CanvasRenderingContext2D, w: number, h: number, time: number) {
  const S = Math.min(w, h)
  const size = Math.max(9, S * 0.035)
  c.font = `600 ${size}px ${MONO}`
  c.textAlign = 'left'
  c.textBaseline = 'top'
  if (Math.floor(time * 1.5) % 2 === 0) {
    c.fillStyle = '#ff3b30'
    c.beginPath()
    c.arc(S * 0.05 + size * 0.4, S * 0.05 + size * 0.55, size * 0.38, 0, Math.PI * 2)
    c.fill()
  }
  c.fillStyle = '#e8e8ee'
  c.fillText('REC', S * 0.05 + size, S * 0.05)
  const frames = Math.floor(time * 30)
  const pad = (n: number) => String(n).padStart(2, '0')
  c.fillStyle = '#c9cede'
  c.textBaseline = 'bottom'
  c.fillText(`00:${pad(Math.floor(time / 60) % 60)}:${pad(Math.floor(time) % 60)}:${pad(frames % 30)}`, S * 0.05, h * 0.8 - S * 0.03)
}

function buildGlitch(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number): Glitch {
  const base = deviceCanvas(w, h, dpr)
  const b = base.getContext('2d')
  if (b) {
    b.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintBase(b, w, h)
  }
  const red = deviceCanvas(w, h, dpr)
  const cyan = deviceCanvas(w, h, dpr)

  // scanlines: one dark row in every three CSS pixels
  const lineTile = document.createElement('canvas')
  lineTile.width = 1
  lineTile.height = Math.max(3, Math.round(3 * dpr))
  const lt = lineTile.getContext('2d')
  let scan: CanvasPattern | null = null
  if (lt) {
    lt.fillStyle = 'rgba(0, 0, 0, 0.5)'
    lt.fillRect(0, lineTile.height - Math.max(1, Math.round(dpr)), 1, Math.max(1, Math.round(dpr)))
    scan = ctx.createPattern(lineTile, 'repeat')
    if (scan && typeof DOMMatrix !== 'undefined') scan.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]))
  }

  // static: a tile of random grey pixels, shifted around on every glitch bucket
  const noiseTile = document.createElement('canvas')
  noiseTile.width = 128
  noiseTile.height = 128
  const nt = noiseTile.getContext('2d')
  let noise: CanvasPattern | null = null
  if (nt) {
    const image = nt.createImageData(128, 128)
    const rand = seeded(777)
    for (let i = 0; i < image.data.length; i += 4) {
      const v = rand() * 255
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v
      image.data[i + 3] = 255
    }
    nt.putImageData(image, 0, 0)
    noise = ctx.createPattern(noiseTile, 'repeat')
  }

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')

  return { w, h, dpr, base, red, redCtx: red.getContext('2d'), cyan, cyanCtx: cyan.getContext('2d'), scan, noise, vignette }
}

/** how strong the glitch is right now (0 = clean), decided only by scene time */
function burstAt(time: number, frequency: number) {
  // every visit opens with a short burst, so a paused thumbnail shows the effect
  if (time < 0.4) return 1
  const k = Math.floor(time / SLOT)
  for (let s = k - 1; s <= k; s++) {
    const r = seeded(hashInt(s * 2654435 + 99))
    if (r() >= frequency * 0.7) continue
    const start = s * SLOT + r() * SLOT * 0.6
    const len = 0.12 + r() * 0.5
    if (time >= start && time < start + len) return 0.55 + r() * 0.45
  }
  return 0
}

function GlitchEffectScene({ params, paused, thumb }: SceneProps) {
  const glitch = useRef<Glitch | null>(null)

  const draw = ({ ctx, width: w, height: h, dpr, time, pointer, resized, params, thumb }: CanvasFrame) => {
    let g = glitch.current
    if (resized || !g) {
      g = buildGlitch(ctx, w, h, dpr)
      glitch.current = g
    }
    const { base, red, cyan, redCtx, cyanCtx } = g
    const S = Math.min(w, h)

    // pressing holds the glitch on; otherwise bursts come and go on scene time
    const amount = pointer.down ? 1 : burstAt(time, params.frequency)
    const I = params.intensity * amount
    // all randomness of a frame comes from a 15 Hz bucket, so a paused redraw repeats it exactly
    const bucket = Math.floor(time * 15)
    const rnd = seeded(hashInt(bucket * 7 + 1))

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    // vertical roll: the picture slips upwards and wraps, with a black bar at the seam
    const roll = I > 0 && rnd() < 0.15 * I ? Math.floor(rnd() * h) : 0
    const paintSource = (c: CanvasRenderingContext2D) => {
      if (roll) {
        c.drawImage(base, 0, -roll, w, h)
        c.drawImage(base, 0, h - roll, w, h)
        c.fillStyle = '#000'
        c.fillRect(0, h - roll - S * 0.015, w, S * 0.03)
      } else c.drawImage(base, 0, 0, w, h)
      paintOverlay(c, w, h, time)
    }

    if (I > 0 && redCtx && cyanCtx) {
      // RGB split: rebuild a red-only and a green+blue-only copy, then add them back slightly apart
      for (const [c, tint] of [
        [redCtx, '#ff0000'],
        [cyanCtx, '#00ffff'],
      ] as const) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0)
        c.globalCompositeOperation = 'source-over'
        paintSource(c)
        c.globalCompositeOperation = 'multiply'
        c.fillStyle = tint
        c.fillRect(0, 0, w, h)
        c.globalCompositeOperation = 'source-over'
      }
      const split = (2 + rnd() * 14) * I * (S / 500)
      const splitY = (rnd() - 0.5) * 4 * I
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(red, split, splitY, w, h)
      ctx.drawImage(cyan, -split, 0, w, h)

      // torn slices: horizontal strips pushed sideways
      const slices = 2 + Math.floor(rnd() * 9 * I)
      for (let i = 0; i < slices; i++) {
        const y = rnd() * (h - 2)
        const sh = Math.min(h - y, Math.max(2, Math.pow(rnd(), 2) * h * 0.12))
        const dx = (rnd() - 0.5) * w * (0.04 + 0.3 * rnd()) * I
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = '#000'
        ctx.fillRect(0, y, w, sh)
        ctx.globalCompositeOperation = 'lighter'
        ctx.drawImage(red, 0, y * dpr, red.width, sh * dpr, dx + split * 1.5, y, w, sh)
        ctx.drawImage(cyan, 0, y * dpr, cyan.width, sh * dpr, dx - split * 1.5, y, w, sh)
      }
      ctx.globalCompositeOperation = 'source-over'

      // blocky corruption: displaced copies, smeared rows and inverted colour blocks
      const blocks = Math.floor(rnd() * 14 * I)
      for (let i = 0; i < blocks; i++) {
        const bw = S * (0.03 + rnd() * 0.3)
        const bh = S * (0.01 + rnd() * 0.06)
        const x = rnd() * w
        const y = rnd() * h
        const kind = rnd()
        if (kind < 0.4) {
          const sx = Math.min(w - 1, rnd() * w)
          const sy = Math.min(h - 1, rnd() * h)
          ctx.drawImage(base, sx * dpr, sy * dpr, Math.min(bw, w - sx) * dpr, Math.min(bh, h - sy) * dpr, x, y, Math.min(bw, w - sx), Math.min(bh, h - sy))
        } else if (kind < 0.65) {
          const sy = Math.min(h - 1, rnd() * h)
          ctx.drawImage(base, Math.min(x, w - 1) * dpr, sy * dpr, Math.min(bw, w - x) * dpr, dpr, x, y, Math.min(bw, w - x), bh * 2)
        } else {
          ctx.globalCompositeOperation = 'difference'
          ctx.fillStyle = BLOCK_COLORS[Math.floor(rnd() * BLOCK_COLORS.length)]
          ctx.fillRect(x, y, bw, bh)
          ctx.globalCompositeOperation = 'source-over'
        }
      }

      // a frame or two of full colour inversion
      if (rnd() < 0.18 * I) {
        ctx.globalCompositeOperation = 'difference'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
      }
    } else {
      paintSource(ctx)
      // between bursts: an occasional single torn line keeps the signal feeling fragile
      const micro = seeded(hashInt(Math.floor(time * 20) * 13 + 5))
      if (micro() < 0.03 + 0.06 * params.frequency) {
        const y = micro() * (h - 1)
        const sh = Math.min(h - y, 1 + micro() * S * 0.02)
        const dx = (micro() - 0.5) * S * 0.12 * Math.max(0.3, params.intensity)
        ctx.drawImage(base, 0, y * dpr, base.width, sh * dpr, dx, y, w, sh)
      }
    }

    // CRT finish: scanlines, a slow rolling bright band, static and vignette
    if (g.scan) {
      ctx.fillStyle = g.scan
      ctx.fillRect(0, 0, w, h)
    }
    const bandY = (((time * 0.12) % 1.4) - 0.2) * h
    const band = ctx.createLinearGradient(0, bandY, 0, bandY + h * 0.18)
    band.addColorStop(0, 'rgba(255, 255, 255, 0)')
    band.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
    band.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = band
    ctx.fillRect(0, bandY, w, h * 0.18)
    if (g.noise && !thumb) {
      const nr = seeded(hashInt(Math.floor(time * 30) * 3 + 2))
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.035 + 0.22 * I
      ctx.save()
      ctx.translate(-nr() * 128, -nr() * 128)
      ctx.fillStyle = g.noise
      ctx.fillRect(0, 0, w + 128, h + 128)
      ctx.restore()
      ctx.globalAlpha = 1
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = g.vignette
    ctx.fillRect(0, 0, w, h)
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#08080d]" />
}

export const animation: AnimationStyle = {
  id: 'glitch-effect',
  name: '글리치 효과',
  englishName: 'Glitch Effect',
  aliases: ['Glitch art', 'Datamosh', '화면 깨짐 효과'],
  description: '멀쩡하던 화면이 순간순간 찢기고 색이 어긋나며 깨지는 디지털 오류 애니메이션',
  context: '게임 타이틀, 사이버펑크 콘셉트 웹사이트, 뮤직비디오와 SNS 영상 전환 효과에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '화면을 누르고 있는 동안 계속 깨집니다.',
  traits: [
    {
      title: '가로로 찢긴 띠',
      description: '화면을 가로 띠로 잘라 일부를 옆으로 밀어내, 신호가 끊긴 비디오처럼 그림이 어긋납니다.',
    },
    {
      title: 'RGB 채널 분리',
      description: '빨강과 청록(초록+파랑) 채널을 서로 다른 위치에 찍어 글자 가장자리에 색 번짐이 생깁니다.',
    },
    {
      title: '평소엔 멀쩡, 가끔 폭발',
      description: '대부분은 스캔라인만 보이는 안정된 화면이다가 짧은 순간 블록 노이즈와 색 반전이 몰아쳐 더 눈에 띕니다.',
    },
  ],
  params: [
    { key: 'intensity', label: '강도', min: 0, max: 1, step: 0.05, default: 0.65 },
    { key: 'frequency', label: '빈도', min: 0, max: 1, step: 0.05, default: 0.4 },
  ],
  Scene: GlitchEffectScene,
}
