import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { noise3 } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

/** donut.c's ramp, from the faintest mark to the densest glyph */
const RAMP = '.,-~:;=!*#$@'
const FONT = 'ui-monospace, "IBM Plex Mono", monospace'
const BACKGROUND = '#030704'
/** tier 0 is the drifting background, tiers 1–3 shade the torus from dim to bright */
const TIER_COLORS = ['#0f3a1d', '#1f8c46', '#4be37f', '#d2ffdf']
const TIERS = TIER_COLORS.length
const SPACE = 32
/** torus: a tube of radius 1 around a ring of radius 2, seen from 6 units away */
const R1 = 1
const R2 = 2
const K2 = 6
/** towards the light: upper left and a little towards the viewer (−z faces the viewer) */
const LIGHT = (() => {
  const v = [-0.45, 0.7, -0.55]
  const l = Math.hypot(v[0], v[1], v[2])
  return v.map((c) => c / l)
})()

type Grid = {
  fontSize: number
  charW: number
  rowH: number
  cols: number
  rows: number
  offsetX: number
  offsetY: number
  /** 1/z of the nearest torus point per cell, 0 = empty */
  depth: Float32Array
  /** ramp level + 1 per cell for the torus, 0 = empty */
  shade: Uint8Array
  /** one row of character codes per tier and row, written into strings for fillText */
  codes: Uint16Array
  used: Uint8Array
  levelCodes: Uint16Array
  thetaCos: Float32Array
  thetaSin: Float32Array
  phiCos: Float32Array
  phiSin: Float32Array
  k1: number
  glow: HTMLCanvasElement
  glowCtx: CanvasRenderingContext2D | null
  glowW: number
  glowH: number
  vignette: CanvasGradient
}

const rotX = (a: number) => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)]
const rotY = (a: number) => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)]
const rotZ = (a: number) => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1]
const mul = (a: number[], b: number[]) => {
  const out = new Array<number>(9)
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]
  return out
}

const angleTable = (n: number, f: (a: number) => number) => Float32Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2))

function buildGrid(ctx: CanvasRenderingContext2D, w: number, h: number, fontSize: number, charW: number): Grid {
  const rowH = fontSize * 1.1
  const cols = Math.ceil(w / charW)
  const rows = Math.ceil(h / rowH)
  // projection scale: small enough that the near rim stays on screen while the torus tumbles
  const k1 = Math.min(h * 1.05, w) * 0.62
  // sample the surface densely enough that neighbouring samples land less than a column apart
  const ringCols = (k1 * 0.6) / charW
  const nPhi = Math.min(900, Math.max(90, Math.ceil(Math.PI * 2 * ringCols * 1.25)))
  const nTheta = Math.min(320, Math.max(30, Math.ceil(((Math.PI * 2 * ringCols) / 3) * 1.5)))
  const glow = document.createElement('canvas')
  const glowW = Math.max(1, Math.ceil(w / 4))
  const glowH = Math.max(1, Math.ceil(h / 4))
  glow.width = glowW
  glow.height = glowH
  const glowCtx = glow.getContext('2d')
  if (glowCtx) glowCtx.imageSmoothingQuality = 'high'
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)')
  return {
    fontSize,
    charW,
    rowH,
    cols,
    rows,
    offsetX: (w - cols * charW) / 2,
    offsetY: (h - rows * rowH) / 2,
    depth: new Float32Array(cols * rows),
    shade: new Uint8Array(cols * rows),
    codes: new Uint16Array(TIERS * rows * cols),
    used: new Uint8Array(TIERS * rows),
    levelCodes: new Uint16Array(RAMP.length),
    thetaCos: angleTable(nTheta, Math.cos),
    thetaSin: angleTable(nTheta, Math.sin),
    phiCos: angleTable(nPhi, Math.cos),
    phiSin: angleTable(nPhi, Math.sin),
    k1,
    glow,
    glowCtx,
    glowW,
    glowH,
    vignette,
  }
}

function AsciiArtScene({ params, paused, thumb }: SceneProps) {
  const grid = useRef<Grid | null>(null)
  const view = useRef({ tiltA: 0, tiltC: 0 })

  const draw = ({ ctx, width: w, height: h, time, delta, pointer, resized, params, thumb }: CanvasFrame) => {
    const fontSize = Math.round(thumb ? Math.max(6, params.cellSize * 0.6) : params.cellSize)
    ctx.font = `500 ${fontSize}px ${FONT}`
    // measured every frame: the web font may arrive after the first frame and change the advance
    const charW = Math.max(1, ctx.measureText('MMMMMMMMMM').width / 10)
    let g = grid.current
    if (resized || !g || g.fontSize !== fontSize || Math.abs(g.charW - charW) > 0.01) {
      g = buildGrid(ctx, w, h, fontSize, charW)
      grid.current = g
    }
    const { cols, rows, depth, shade, codes, used, levelCodes } = g

    // the pointer tilts the torus; eased with delta so a paused redraw keeps the same tilt
    const v = view.current
    const ease = 1 - Math.exp(-delta * 4)
    v.tiltA += ((pointer.inside ? (pointer.y / h - 0.5) * 1.4 : 0) - v.tiltA) * ease
    v.tiltC += ((pointer.inside ? (pointer.x / w - 0.5) * 1.8 : 0) - v.tiltC) * ease
    const m = mul(rotY(v.tiltC), mul(rotX(0.9 + time * 0.6 + v.tiltA), rotZ(time * 0.35)))
    // light in object space (Mᵀ · light), so each sample needs only a dot product
    const lx = m[0] * LIGHT[0] + m[3] * LIGHT[1] + m[6] * LIGHT[2]
    const ly = m[1] * LIGHT[0] + m[4] * LIGHT[1] + m[7] * LIGHT[2]
    const lz = m[2] * LIGHT[0] + m[5] * LIGHT[1] + m[8] * LIGHT[2]

    // a smaller character set posterises the shading: fewer glyphs, harder steps
    const levels = Math.max(2, Math.min(RAMP.length, Math.round(params.levels)))
    for (let i = 0; i < levels; i++) levelCodes[i] = RAMP.charCodeAt(Math.round((i * (RAMP.length - 1)) / (levels - 1)))

    // project the torus into the cell grid, keeping the nearest sample per cell (z-buffer)
    depth.fill(0)
    shade.fill(0)
    const { thetaCos, thetaSin, phiCos, phiSin, k1, charW: cw, rowH, offsetX, offsetY } = g
    const cx0 = w / 2 - offsetX
    const cy0 = h / 2 - offsetY
    for (let i = 0; i < thetaCos.length; i++) {
      const ct = thetaCos[i]
      const st = thetaSin[i]
      const ringR = R2 + R1 * ct
      const py = R1 * st
      for (let j = 0; j < phiCos.length; j++) {
        const cp = phiCos[j]
        const sp = phiSin[j]
        const px = ringR * cp
        const pz = -ringR * sp
        const ooz = 1 / (m[6] * px + m[7] * py + m[8] * pz + K2)
        const sx = cx0 + k1 * ooz * (m[0] * px + m[1] * py + m[2] * pz)
        const sy = cy0 - k1 * ooz * (m[3] * px + m[4] * py + m[5] * pz)
        if (sx < 0 || sy < 0) continue
        const col = Math.floor(sx / cw)
        const row = Math.floor(sy / rowH)
        if (col >= cols || row >= rows) continue
        const idx = row * cols + col
        if (ooz <= depth[idx]) continue
        depth[idx] = ooz
        const lum = ct * cp * lx + st * ly - ct * sp * lz
        const t = Math.min(1, Math.max(0, (lum + 0.2) / 1.2))
        shade[idx] = Math.min(levels - 1, Math.floor(t * levels)) + 1
      }
    }

    // write characters into per-tier rows; empty cells get a faint drifting noise field
    codes.fill(SPACE)
    used.fill(0)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = shade[r * cols + c]
        let code: number
        let tier: number
        if (s) {
          const level = s - 1
          const f = level / (levels - 1)
          code = levelCodes[level]
          tier = f < 0.3 ? 1 : f < 0.7 ? 2 : 3
        } else {
          const n = noise3(c * 0.06 - time * 0.25, r * 0.11, time * 0.18)
          if (n < 0.2) continue
          code = RAMP.charCodeAt(Math.min(3, Math.floor((n - 0.2) * 9)))
          tier = 0
        }
        codes[(tier * rows + r) * cols + c] = code
        used[tier * rows + r] = 1
      }
    }

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, w, h)
    // one fillText per tier and row: a monospace font keeps every glyph on the grid
    ctx.textBaseline = 'top'
    for (let tier = 0; tier < TIERS; tier++) {
      ctx.fillStyle = TIER_COLORS[tier]
      for (let r = 0; r < rows; r++) {
        if (!used[tier * rows + r]) continue
        const start = (tier * rows + r) * cols
        const line = String.fromCharCode.apply(null, codes.subarray(start, start + cols) as unknown as number[])
        ctx.fillText(line, offsetX, offsetY + r * rowH)
      }
    }

    // phosphor glow: a quarter-size copy scaled back up blurs for free, then adds light
    if (g.glowCtx && params.glow > 0) {
      g.glowCtx.globalCompositeOperation = 'copy'
      g.glowCtx.drawImage(ctx.canvas, 0, 0, g.glowW, g.glowH)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = Math.min(1, params.glow)
      ctx.drawImage(g.glow, 0, 0, w, h)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.fillStyle = g.vignette
    ctx.fillRect(0, 0, w, h)
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#030704]" />
}

export const animation: AnimationStyle = {
  id: 'ascii-art',
  name: '아스키 아트',
  englishName: 'ASCII Art',
  aliases: ['Text art', 'ASCII donut', '문자 그림'],
  description: '밝기에 맞춰 고른 글자들을 칸마다 찍어 회전하는 도넛을 그려 내는 애니메이션',
  context: '터미널 프로그램, 개발자 포트폴리오, 레트로 감성의 웹사이트 배경에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 올린 쪽으로 도넛이 기울어집니다.',
  traits: [
    {
      title: '밝기를 글자로',
      description: '「.」처럼 잉크가 적은 글자는 어둡게, 「@」처럼 빽빽한 글자는 밝게 보이는 점을 이용해 명암을 글자 하나로 나타냅니다.',
    },
    {
      title: '고정폭 글자 격자',
      description: '모든 글자의 폭이 같은 고정폭 글꼴이라 화면이 바둑판처럼 칸으로 나뉘고, 칸 하나가 픽셀 하나 역할을 합니다.',
    },
    {
      title: '옛 단말기 화면 느낌',
      description: '검은 바탕에 초록 글자를 쓰고 은은하게 번지게 해 오래된 CRT 모니터의 형광 화면처럼 보이게 합니다.',
    },
  ],
  params: [
    { key: 'cellSize', label: '글자 크기', min: 8, max: 24, step: 1, default: 12, unit: 'px' },
    { key: 'levels', label: '글자 단계', min: 3, max: 12, step: 1, default: 12, unit: '단계' },
    { key: 'glow', label: '빛 번짐', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  Scene: AsciiArtScene,
}
