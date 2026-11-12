import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

const PAPER = '#efe9dc'
/** 0 is the paper itself, then red, blue, yellow and black */
const COLORS = [PAPER, '#d6392b', '#1f4fa0', '#f2bd1f', '#1c1b1a']
const FIGURES = 8
const QUARTER = Math.PI / 2

type Kind = 'turn' | 'flip' | 'swap'
/** what one tile shows: figure, background colour, figure colour, quarter turns, mirror */
type Look = { fig: number; bg: number; fg: number; rot: number; flip: number }
type Anim = { kind: Kind; t0: number; dur: number; dir: number; from: Look; to: Look }
type Pending = { kind: Kind; t0: number; dur: number; dir: number; seed: number }
type Cell = { x: number; y: number; look: Look; anim: Anim | null; next: Pending | null }
type Board = { n: number; size: number; cols: number; rows: number; ox: number; oy: number; cells: Cell[]; nextWave: number; waves: number; hover: number; wasDown: boolean }

const hashInt = (n: number) => {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function randomLook(rand: () => number): Look {
  // paper backgrounds are the most common, like a printed sheet with coloured tiles
  const bg = rand() < 0.38 ? 0 : 1 + Math.floor(rand() * 4)
  let fg = 1 + Math.floor(rand() * 4)
  if (fg === bg) fg = bg === 4 ? 3 : rand() < 0.5 ? 0 : 4
  return { fig: Math.floor(rand() * FIGURES), bg, fg, rot: Math.floor(rand() * 4), flip: rand() < 0.5 ? 1 : -1 }
}

function nextLook(kind: Kind, from: Look, dir: number, rand: () => number): Look {
  if (kind === 'turn') return { ...from, rot: from.rot + dir }
  // the back of a flipped tile is its mirror image in swapped colours
  if (kind === 'flip') return { ...from, flip: -from.flip, bg: from.fg, fg: from.bg }
  return randomLook(rand)
}

/** one figure inside a tile from −h to h; everything is ruler-and-compass geometry */
function figurePath(ctx: CanvasRenderingContext2D, fig: number, h: number) {
  ctx.beginPath()
  switch (fig) {
    case 0: // circle
      ctx.arc(0, 0, h * 0.72, 0, Math.PI * 2)
      break
    case 1: // half circle standing on the bottom edge
      ctx.arc(0, h, h, Math.PI, Math.PI * 2)
      ctx.closePath()
      break
    case 2: // quarter circle from a corner
      ctx.moveTo(-h, h)
      ctx.arc(-h, h, h * 2, -QUARTER, 0)
      ctx.closePath()
      break
    case 3: // triangle: the tile cut along its diagonal
      ctx.moveTo(-h, -h)
      ctx.lineTo(h, h)
      ctx.lineTo(-h, h)
      ctx.closePath()
      break
    case 4: // square
      ctx.rect(-h * 0.55, -h * 0.55, h * 1.1, h * 1.1)
      break
    case 5: // three stripes
      for (let i = 0; i < 3; i++) ctx.rect(-h, -h + i * h * 0.8, h * 2, h * 0.4)
      break
    case 6: // thick quarter arc
      ctx.arc(-h, h, h * 1.9, -QUARTER, 0)
      ctx.arc(-h, h, h * 1.05, 0, -QUARTER, true)
      ctx.closePath()
      break
    default: // leaf: where two corner circles overlap
      ctx.arc(-h, h, h * 2, -QUARTER, 0)
      ctx.arc(h, -h, h * 2, QUARTER, Math.PI)
      ctx.closePath()
  }
  ctx.fill()
}

function drawLook(ctx: CanvasRenderingContext2D, look: Look, h: number) {
  ctx.fillStyle = COLORS[look.bg]
  ctx.fillRect(-h, -h, h * 2, h * 2)
  ctx.save()
  ctx.rotate(look.rot * QUARTER)
  ctx.scale(look.flip, 1)
  ctx.fillStyle = COLORS[look.fg]
  figurePath(ctx, look.fig, h)
  ctx.restore()
}

function drawCell(ctx: CanvasRenderingContext2D, cell: Cell, h: number, time: number) {
  ctx.save()
  ctx.translate(cell.x, cell.y)
  const a = cell.anim
  if (!a) {
    drawLook(ctx, cell.look, h)
  } else {
    const p = Math.min(1, Math.max(0, (time - a.t0) / a.dur))
    const e = easeInOut(p)
    if (a.kind === 'turn') {
      // lift (shrink) while turning so the corners clear the neighbours
      const lift = 1 - 0.3 * Math.sin(Math.PI * e)
      ctx.rotate(a.dir * e * QUARTER)
      ctx.scale(lift, lift)
      drawLook(ctx, a.from, h)
    } else if (a.kind === 'flip') {
      // squash to a sliver, then open up showing the back
      ctx.scale(Math.max(0.001, Math.abs(Math.cos(Math.PI * e))), 1)
      drawLook(ctx, e < 0.5 ? a.from : a.to, h)
    } else {
      // swap: the new tile opens like an iris from the centre
      drawLook(ctx, a.from, h)
      if (e > 0) {
        ctx.beginPath()
        ctx.rect(-h, -h, h * 2, h * 2)
        ctx.clip()
        ctx.beginPath()
        ctx.arc(0, 0, e * h * 1.45, 0, Math.PI * 2)
        ctx.clip()
        drawLook(ctx, a.to, h)
      }
    }
  }
  ctx.restore()
}

function buildBoard(w: number, h: number, n: number, time: number): Board {
  // n square cells across the short side, as many as needed along the long side, centred
  const size = Math.min(w, h) / n
  const cols = Math.ceil(w / size - 1e-6)
  const rows = Math.ceil(h / size - 1e-6)
  const ox = (w - cols * size) / 2
  const oy = (h - rows * size) / 2
  const rand = seeded(20240611 + n)
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ x: ox + (c + 0.5) * size, y: oy + (r + 0.5) * size, look: randomLook(rand), anim: null, next: null })
  return { n, size, cols, rows, ox, oy, cells, nextWave: time + 0.8, waves: 0, hover: -1, wasDown: false }
}

/** a wave picks a kind of change and a direction, and reaches each cell a little later than the last */
function startWave(b: Board, start: number, interval: number) {
  const rand = seeded(hashInt(b.waves * 7919 + 17))
  b.waves++
  const roll = rand()
  const kind: Kind | 'mixed' = roll < 0.32 ? 'turn' : roll < 0.58 ? 'flip' : roll < 0.84 ? 'swap' : 'mixed'
  const shape = Math.floor(rand() * 3)
  const ox = rand()
  const oy = rand()
  const share = 0.45 + rand() * 0.4
  const dir = rand() < 0.5 ? 1 : -1
  const spread = Math.min(1.6, interval * 0.55)
  const dur = Math.min(0.85, interval * 0.35)
  for (let i = 0; i < b.cells.length; i++) {
    const gx = b.cols > 1 ? (i % b.cols) / (b.cols - 1) : 0.5
    const gy = b.rows > 1 ? Math.floor(i / b.cols) / (b.rows - 1) : 0.5
    // radial ripple from a point, a diagonal sweep, or a left-to-right sweep
    const d = shape === 0 ? Math.min(1, Math.hypot(gx - ox, gy - oy) / 1.2) : shape === 1 ? (gx + gy) / 2 : dir > 0 ? gx : 1 - gx
    const take = rand() < share
    const cellKind: Kind = kind === 'mixed' ? (['turn', 'flip', 'swap'] as const)[Math.floor(rand() * 3)] : kind
    const seed = hashInt(b.waves * 104729 + i)
    if (take) b.cells[i].next = { kind: cellKind, t0: start + d * spread, dur, dir, seed }
  }
}

function BauhausShapesScene({ params, paused, thumb }: SceneProps) {
  const board = useRef<Board | null>(null)

  const draw = ({ ctx, width: w, height: h, time, delta, pointer, resized, params }: CanvasFrame) => {
    const n = Math.round(params.cells)
    let b = board.current
    if (resized || !b || b.n !== n) {
      b = buildBoard(w, h, n, time)
      board.current = b
    }
    const interval = params.interval

    // waves are scheduled on scene time, so pausing freezes them mid-ripple
    while (time >= b.nextWave) {
      startWave(b, b.nextWave, interval)
      b.nextWave += interval
    }

    // the pointer turns the tile it passes over and swaps the one it presses (only while playing)
    let hover = -1
    if (pointer.inside) {
      const c = Math.floor((pointer.x - b.ox) / b.size)
      const r = Math.floor((pointer.y - b.oy) / b.size)
      if (c >= 0 && c < b.cols && r >= 0 && r < b.rows) hover = r * b.cols + c
    }
    if (delta > 0 && hover >= 0) {
      const cell = b.cells[hover]
      const pressed = pointer.down && !b.wasDown
      if (!cell.anim && (pressed || hover !== b.hover)) {
        const kind: Kind = pressed ? 'swap' : 'turn'
        const dir = pointer.x > cell.x ? 1 : -1
        cell.anim = { kind, t0: time, dur: pressed ? 0.6 : 0.45, dir, from: cell.look, to: nextLook(kind, cell.look, dir, seeded(hashInt(Math.floor(time * 1000)))) }
      }
    }
    b.hover = hover
    b.wasDown = pointer.down

    for (const cell of b.cells) {
      if (cell.anim && time >= cell.anim.t0 + cell.anim.dur) {
        cell.look = cell.anim.to
        cell.anim = null
      }
      if (!cell.anim && cell.next && time >= cell.next.t0) {
        const q = cell.next
        // a cell that was busy starts late from now instead of jumping halfway in
        const t0 = time - q.t0 > 0.1 ? time : q.t0
        cell.anim = { kind: q.kind, t0, dur: q.dur, dir: q.dir, from: cell.look, to: nextLook(q.kind, cell.look, q.dir, seeded(q.seed)) }
        cell.next = null
      }
    }

    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, w, h)
    // a thin paper gutter between tiles keeps the grid readable
    const half = b.size * 0.47
    // still tiles first, moving tiles on top so their lifted corners overlap neighbours cleanly
    for (const cell of b.cells) if (!cell.anim) drawCell(ctx, cell, half, time)
    for (const cell of b.cells) if (cell.anim) drawCell(ctx, cell, half, time)
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#efe9dc]" />
}

export const animation: AnimationStyle = {
  id: 'bauhaus-shapes',
  name: '바우하우스 도형',
  englishName: 'Bauhaus Shapes',
  aliases: ['Bauhaus pattern', 'Geometric tiles', '기하학 패턴'],
  description: '빨강·파랑·노랑·검정의 원과 삼각형, 사각형 타일이 물결처럼 차례로 돌고 뒤집히는 애니메이션',
  context: '포스터, 브랜드 패턴, 앱 온보딩 일러스트와 모션 그래픽에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '칸 위로 마우스를 지나가면 그 칸이 돌고, 누르면 새 도형으로 바뀝니다.',
  traits: [
    { title: '기본 도형만 사용', description: '원, 반원, 사분원, 삼각형, 사각형처럼 자와 컴퍼스로 그릴 수 있는 도형만으로 화면을 짭니다.' },
    { title: '원색 팔레트', description: '빨강, 파랑, 노랑의 원색에 검정과 미색 종이를 더한 다섯 가지 색만 씁니다.' },
    { title: '격자와 리듬', description: '모든 도형이 같은 크기의 칸에 들어가고, 한 점에서 퍼져 나가듯 시차를 두고 바뀌어 화면에 리듬이 생깁니다.' },
  ],
  params: [
    { key: 'cells', label: '칸 수', min: 3, max: 12, step: 1, default: 5, unit: '칸' },
    { key: 'interval', label: '바뀌는 간격', min: 1.5, max: 8, step: 0.5, default: 3, unit: '초' },
  ],
  Scene: BauhausShapesScene,
}
