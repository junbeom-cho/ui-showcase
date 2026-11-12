import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { noise3, seeded } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

/** the whole picture uses these 16 colours and nothing else */
const PALETTE = [
  '#0b0a1f', // 0 ink
  '#1f2150', // 1 night blue
  '#3b3f86', // 2 indigo
  '#7452a0', // 3 violet
  '#e0697c', // 4 rose
  '#f7a75c', // 5 orange
  '#ffe9a8', // 6 cream
  '#3f86dd', // 7 sky blue
  '#86c3f2', // 8 light blue
  '#f6f7fb', // 9 white
  '#6d7fb8', // 10 haze blue
  '#35597a', // 11 slate
  '#234a3b', // 12 forest
  '#4c9a3c', // 13 grass
  '#7a4a2e', // 14 dirt
  '#e3473b', // 15 red
]
// ImageData is RGBA in memory, so a little-endian Uint32 reads it as ABGR
const PALETTE32 = Uint32Array.from(PALETTE, (hex) => {
  const v = parseInt(hex.slice(1), 16)
  return ((255 << 24) | ((v & 255) << 16) | (v & 0xff00) | (v >> 16)) >>> 0
})

// materials: what a pixel is; the time of day decides which palette colour it gets
const SKY = 0 // 0–3, top band to horizon band
const CLOUD = 4
const CLOUD_SHADE = 5
const FAR = 6
const SNOW = 7
const MID = 8
const NEAR = 9
const TREE = 10
const GRASS = 11
const DIRT = 12
const MORTAR = 13
const ROCK = 14
const ROCK_SHADE = 15
//                         sky0 sky1 sky2 sky3 cloud shade far snow mid near tree grass dirt mortar rock rockShade
const DAY = Uint8Array.of(7, 7, 8, 9, 9, 8, 10, 9, 11, 12, 12, 13, 14, 0, 10, 11)
const DUSK = Uint8Array.of(2, 3, 4, 5, 5, 4, 2, 4, 1, 12, 0, 13, 14, 0, 3, 2)
const NIGHT = Uint8Array.of(0, 0, 1, 1, 2, 1, 2, 10, 11, 0, 0, 12, 1, 0, 2, 1)
/** day phase 0–1: sunrise at 0, sunset at 0.5 */
const KEYS: [number, Uint8Array][] = [
  [0, DUSK],
  [0.07, DAY],
  [0.43, DAY],
  [0.5, DUSK],
  [0.57, NIGHT],
  [0.93, NIGHT],
  [1, DUSK],
]
/** 4×4 ordered-dither thresholds */
const BAYER = Float32Array.from([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], (b) => (b + 0.5) / 16)

const CLEAR = 255
const SPRITE_COLORS: Record<string, number> = { R: 15, S: 6, K: 0, B: 2, a: ROCK, b: ROCK_SHADE }
const sprite = (rows: string[]) => ({
  w: rows[0].length,
  h: rows.length,
  px: Uint8Array.from(rows.join(''), (ch) => SPRITE_COLORS[ch] ?? CLEAR),
})
// a 4-frame run cycle: contact, passing, contact, passing (passing frames stand one pixel taller)
const RUN_FRAMES = [
  sprite(['........', '..RRRR..', '.RRRRRRR', '.KSSSKS.', '..SSSSS.', '..RRRR..', '.SRRRRS.', '..RRRR..', '..BBBB..', '.BB..BB.', '.B....B.', 'KK....KK']),
  sprite(['..RRRR..', '.RRRRRRR', '.KSSSKS.', '..SSSSS.', '..RRRR..', '..RRRR..', '..RSRR..', '..BBBB..', '..BBB...', '...BBK..', '...B....', '...KK...']),
  sprite(['........', '..RRRR..', '.RRRRRRR', '.KSSSKS.', '..SSSSS.', '..RRRR..', '..RRRRS.', '.SRRRR..', '..BBBB..', '.BB..BB.', '.B.....B', 'K.....KK']),
  sprite(['..RRRR..', '.RRRRRRR', '.KSSSKS.', '..SSSSS.', '..RRRR..', '..RRRR..', '..RRSR..', '..BBBB..', '...BBB..', '..KBB...', '....B...', '...KK...']),
]
const JUMP_FRAME = sprite(['..RRRR..', '.RRRRRRR', '.KSSSKS.', 'S.SSSSS.', 'R.RRRR.S', '.RRRRRR.', '..RRRR..', '..BBBB..', '.BBBBB..', '.B...BB.', 'KK....K.', '........'])
const ROCK_SPRITE = sprite(['..aab.', '.aaaab', 'aaaabb', 'aaabbb'])

/** logical pixels per scene second at the ground layer */
const RUN = 22
const MANUAL_JUMP = 0.7

type Cloud = { x: number; y: number; w: number; h: number; speed: number; mask: Uint8Array }
type World = {
  ps: number
  lw: number
  lh: number
  groundY: number
  sc: number
  buf: Uint8Array
  canvas: HTMLCanvasElement
  image: ImageData | null
  pixels: Uint32Array | null
  pctx: CanvasRenderingContext2D | null
  clouds: Cloud[]
  stars: Int16Array
}

const hashInt = (n: number) => {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}
const hash01 = (n: number) => hashInt(n) / 4294967296

function buildWorld(w: number, h: number, ps: number): World {
  const lw = Math.max(16, Math.ceil(w / ps))
  const lh = Math.max(16, Math.ceil(h / ps))
  const groundY = lh - Math.max(5, Math.round(lh * 0.2))
  const canvas = document.createElement('canvas')
  canvas.width = lw
  canvas.height = lh
  const pctx = canvas.getContext('2d')
  const image = pctx ? pctx.createImageData(lw, lh) : null
  const rand = seeded(9001)

  // clouds are rasterised once into little masks: a few round bumps on a flat bottom
  const cloudScale = Math.min(1.6, Math.max(0.6, lh / 90))
  const clouds: Cloud[] = []
  const maxClouds = Math.max(4, Math.round(lw / 14))
  for (let i = 0; i < maxClouds; i++) {
    const cw = Math.round((14 + rand() * 18) * cloudScale)
    const ch = Math.max(3, Math.round(cw * 0.38))
    const mask = new Uint8Array(cw * ch)
    const bumps = 3 + Math.floor(rand() * 3)
    const shadeFrom = ch - Math.max(1, Math.round(ch * 0.28))
    for (let b = 0; b < bumps; b++) {
      const bx = ((b + 0.5) / bumps) * cw
      const br = ch * (0.5 + rand() * 0.5)
      const by = ch - br * 0.7
      for (let py = 0; py < ch; py++)
        for (let px = 0; px < cw; px++)
          if ((px + 0.5 - bx) ** 2 + (py + 0.5 - by) ** 2 <= br * br) mask[py * cw + px] = py >= shadeFrom ? 2 : 1
    }
    clouds.push({ x: rand() * (lw + cw), y: Math.round(groundY * (0.05 + rand() * 0.38)), w: cw, h: ch, speed: 1.5 + rand() * 3, mask })
  }

  const starCount = Math.round((lw * groundY) / 70)
  const stars = new Int16Array(starCount * 2)
  for (let i = 0; i < starCount; i++) {
    stars[i * 2] = Math.floor(rand() * lw)
    stars[i * 2 + 1] = Math.floor(rand() * groundY * 0.72)
  }

  return {
    ps,
    lw,
    lh,
    groundY,
    sc: lh >= 150 ? 2 : 1,
    buf: new Uint8Array(lw * lh),
    canvas,
    image,
    pixels: image ? new Uint32Array(image.data.buffer) : null,
    pctx,
    clouds,
    stars,
  }
}

function PixelArtScene({ params, paused, thumb }: SceneProps) {
  const world = useRef<World | null>(null)
  const view = useRef({ phase: 0.3, jumpAt: -10, wasDown: false })

  const draw = ({ ctx, width: w, height: h, time, delta, pointer, resized, params, thumb }: CanvasFrame) => {
    const ps = Math.max(2, Math.round(thumb ? params.pixelSize * 0.5 : params.pixelSize))
    let wd = world.current
    if (resized || !wd || wd.ps !== ps) {
      wd = buildWorld(w, h, ps)
      world.current = wd
    }
    const { lw, lh, groundY: gy, sc, buf, clouds, stars } = wd

    // the day advances by delta so dragging the day-length slider never jumps the sun
    const v = view.current
    v.phase = (v.phase + delta / Math.max(1, params.dayLength)) % 1
    if (delta > 0 && pointer.down && !v.wasDown && time - v.jumpAt > MANUAL_JUMP) v.jumpAt = time
    v.wasDown = pointer.down
    const phase = v.phase

    // palette swap between day, dusk and night, blended through ordered dither in quarter steps
    let k = 0
    while (k < KEYS.length - 2 && phase >= KEYS[k + 1][0]) k++
    const [p0, mapA] = KEYS[k]
    const [p1, mapB] = KEYS[k + 1]
    const blend = Math.round(((phase - p0) / (p1 - p0)) * 4) / 4
    const pick = (mat: number, x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] < blend ? mapB[mat] : mapA[mat])
    const nightness = mapA === NIGHT ? (mapB === NIGHT ? 1 : 1 - blend) : mapB === NIGHT ? blend : 0
    const put = (x: number, y: number, color: number) => {
      if (x >= 0 && x < lw && y >= 0 && y < lh) buf[y * lw + x] = color
    }

    // banded sky: solid bands with a checkerboard row where two bands meet
    for (let y = 0; y < gy; y++) {
      const c = (y / gy) * 3
      const band = Math.min(2, Math.floor(c))
      const f = c - band
      for (let x = 0; x < lw; x++) {
        const up = f > 0.7 || (f > 0.3 && ((x + y) & 1) === 1)
        buf[y * lw + x] = pick(SKY + band + (up ? 1 : 0), x, y)
      }
    }

    // stars fade in with the night and twinkle on a time bucket
    if (nightness > 0) {
      const tw = Math.floor(time * 2.5)
      for (let i = 0; i < stars.length / 2; i++) {
        if (hash01(i * 7 + 1) >= nightness || hash01(i * 31 + tw * 977) < 0.18) continue
        put(stars[i * 2], stars[i * 2 + 1], 6)
      }
    }

    // sun by day, moon by night, both on an arc that sets behind the mountains
    const r = Math.max(3, Math.round(lh * 0.07))
    const u = (phase % 0.5) / 0.5
    const bx = Math.round(-r + u * (lw + r * 2))
    const by = Math.round(gy - 1 - Math.sin(Math.PI * u) * gy * 0.72)
    const isSun = phase < 0.5
    const low = Math.sin(Math.PI * u) < 0.35
    for (let dy = -r - 1; dy <= r + 1; dy++) {
      for (let dx = -r - 1; dx <= r + 1; dx++) {
        const d = dx * dx + dy * dy
        if (d <= r * r + r * 0.8) {
          const crater = !isSun && ((dx === -1 && dy === -1) || (dx === 1 && dy === 1) || (dx === -2 && dy === 1 && r > 3))
          put(bx + dx, by + dy, isSun ? 6 : crater ? 10 : 9)
        } else if (isSun && low && d <= (r + 1) * (r + 1) + r) put(bx + dx, by + dy, 5)
      }
    }

    // clouds drift on their own and a little with the parallax
    const cloudCount = Math.round(params.clouds * clouds.length)
    for (let i = 0; i < cloudCount; i++) {
      const cl = clouds[i]
      const period = lw + cl.w + 8
      const cx = Math.floor((((cl.x - time * cl.speed) % period) + period) % period) - cl.w
      for (let py = 0; py < cl.h; py++)
        for (let px = 0; px < cl.w; px++) {
          const m = cl.mask[py * cl.w + px]
          if (!m) continue
          const X = cx + px
          const Y = cl.y + py
          if (X >= 0 && X < lw) put(X, Y, pick(m === 1 ? CLOUD : CLOUD_SHADE, X, Y))
        }
    }

    // three mountain layers scroll at different speeds: far slow, near fast (parallax)
    const s = time * RUN
    const farShift = Math.floor(s * 0.1)
    const midShift = Math.floor(s * 0.25)
    const nearShift = Math.floor(s * 0.5)
    const groundShift = Math.floor(s)
    const snowLine = gy - Math.round(lh * 0.34)
    const treeSpacing = 7 * sc
    for (let x = 0; x < lw; x++) {
      const fx = x + farShift
      const ridge = 1 - Math.abs(noise3(fx * 0.03, 1.7, 0.5))
      const farTop = gy - Math.round(lh * (0.16 + 0.24 * ridge * ridge + 0.04 * noise3(fx * 0.11, 2.3, 0.5)))
      for (let y = Math.max(0, farTop); y < gy; y++) {
        const snow = y < snowLine || (y === snowLine && ((x + y) & 1) === 0)
        buf[y * lw + x] = pick(snow ? SNOW : FAR, x, y)
      }

      const mx = x + midShift
      const midTop = gy - Math.round(lh * (0.1 + 0.11 * (noise3(mx * 0.045, 5.3, 0.5) * 0.5 + 0.5) + 0.03 * noise3(mx * 0.13, 6.1, 0.5)))
      for (let y = Math.max(0, midTop); y < gy; y++) buf[y * lw + x] = pick(MID, x, y)

      const nx = x + nearShift
      const nearTop = gy - Math.round(lh * (0.04 + 0.05 * (noise3(nx * 0.07, 9.1, 0.5) * 0.5 + 0.5)))
      const ti = Math.floor(nx / treeSpacing)
      if (hash01(ti * 13 + 5) < 0.5) {
        // pine trees: a triangle two pixels narrower every pixel up
        const treeH = 6 * sc - Math.abs(nx - (ti * treeSpacing + Math.floor(treeSpacing / 2))) * 2
        for (let y = Math.max(0, nearTop - treeH); y < nearTop; y++) buf[y * lw + x] = pick(TREE, x, y)
      }
      for (let y = Math.max(0, nearTop); y < gy; y++) buf[y * lw + x] = pick(NEAR, x, y)
    }

    // ground: two rows of grass over a brick pattern that scrolls at full speed
    const brickW = 8 * sc
    const brickH = 4 * sc
    for (let y = gy; y < lh; y++) {
      const ry = y - gy
      for (let x = 0; x < lw; x++) {
        const wx = x + groundShift
        let mat: number
        if (ry < sc) mat = GRASS
        else if (ry < sc * 2) mat = ((x + y) & 1) === 0 ? GRASS : DIRT
        else {
          const by2 = ry - sc * 2
          const row = Math.floor(by2 / brickH)
          const mortar = by2 % brickH === brickH - 1 || (wx + (row & 1) * (brickW / 2)) % brickW === 0
          mat = mortar ? MORTAR : DIRT
        }
        buf[y * lw + x] = pick(mat, x, y)
      }
    }
    for (let x = 0; x < lw; x++) if (hash01((x + groundShift) * 7 + 3) < 0.18) put(x, gy - 1, pick(GRASS, x, gy - 1))

    const blit = (spr: { w: number; h: number; px: Uint8Array }, x0: number, y0: number, materials: boolean) => {
      for (let py = 0; py < spr.h; py++)
        for (let px = 0; px < spr.w; px++) {
          const c = spr.px[py * spr.w + px]
          if (c === CLEAR) continue
          for (let oy = 0; oy < sc; oy++)
            for (let ox = 0; ox < sc; ox++) {
              const X = x0 + px * sc + ox
              const Y = y0 + py * sc + oy
              put(X, Y, materials ? pick(c, X, Y) : c)
            }
        }
    }

    // rocks on the road; the runner hops over each one
    const charX = Math.round(lw * 0.28)
    const runnerMid = s + charX + 4 * sc
    const spacing = 60 * sc
    const jumpBefore = 11 * sc
    const jumpAfter = 9 * sc
    const jumpHeight = 11 * sc
    let lift = 0
    const firstRock = Math.floor((groundShift - 10 * sc) / spacing) - 1
    const lastRock = Math.floor((groundShift + lw) / spacing) + 1
    for (let i = firstRock; i <= lastRock; i++) {
      if (i < 1 || hash01(i * 3 + 2) > 0.75) continue
      const rx = i * spacing + Math.floor(hash01(i * 3 + 1) * spacing * 0.4)
      blit(ROCK_SPRITE, rx - groundShift, gy - ROCK_SPRITE.h * sc, true)
      const d = rx + 3 * sc - runnerMid
      if (d < jumpBefore && d > -jumpAfter) lift = Math.max(lift, Math.sin((Math.PI * (jumpBefore - d)) / (jumpBefore + jumpAfter)) * jumpHeight)
    }
    const sinceJump = time - v.jumpAt
    if (sinceJump >= 0 && sinceJump < MANUAL_JUMP) lift = Math.max(lift, Math.sin((Math.PI * sinceJump) / MANUAL_JUMP) * jumpHeight * 1.15)
    const jh = Math.round(lift)
    // the cycle advances with distance (one frame per 3 ground pixels), so feet never slide
    const frame = jh > 0 ? JUMP_FRAME : RUN_FRAMES[Math.floor(s / (3 * sc)) & 3]
    blit(frame, charX, gy - frame.h * sc - jh, false)

    if (!wd.pctx || !wd.image || !wd.pixels) return
    const pixels = wd.pixels
    for (let i = 0; i < buf.length; i++) pixels[i] = PALETTE32[buf[i]]
    wd.pctx.putImageData(wd.image, 0, 0)
    // nearest-neighbour upscale keeps every logical pixel a hard-edged square
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(wd.canvas, 0, 0, lw * ps, lh * ps)
    ctx.imageSmoothingEnabled = true
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#0b0a1f]" />
}

export const animation: AnimationStyle = {
  id: 'pixel-art',
  name: '픽셀 아트',
  englishName: 'Pixel Art',
  aliases: ['8-bit', 'Sprite art', '도트 그래픽'],
  description: '아주 작은 해상도의 네모난 점으로 그린 풍경 속을 캐릭터가 달려가는 애니메이션',
  context: '레트로 게임과 인디 게임, 이모지·스티커, 복고풍 콘셉트의 웹사이트에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '화면을 누르면 캐릭터가 점프합니다.',
  traits: [
    {
      title: '작게 그려 크게 확대',
      description: '가로 백여 칸짜리 작은 그림을 그린 뒤 부드럽게 보정하지 않고 그대로 키워서, 픽셀 하나하나가 또렷한 네모로 보입니다.',
    },
    {
      title: '정해진 색 몇 개',
      description: '16색 팔레트 안에서만 색을 고르고, 중간 색이나 낮밤이 바뀌는 순간은 두 색을 바둑판처럼 섞는 디더링으로 표현합니다.',
    },
    {
      title: '몇 장짜리 동작과 겹겹의 배경',
      description: '달리기는 그림 4장을 번갈아 보여 주고, 먼 산은 느리게 가까운 땅은 빠르게 흘러 깊이감(패럴랙스)을 냅니다.',
    },
  ],
  params: [
    { key: 'pixelSize', label: '픽셀 크기', min: 3, max: 12, step: 1, default: 6, unit: 'px' },
    { key: 'dayLength', label: '하루 길이', min: 8, max: 60, step: 1, default: 24, unit: '초' },
    { key: 'clouds', label: '구름 양', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  Scene: PixelArtScene,
}
