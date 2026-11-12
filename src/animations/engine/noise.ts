/**
 * Smooth gradient noise for canvas scenes. Values are roughly in [-1, 1] and
 * change gently: neighbouring inputs give neighbouring outputs.
 */

const PERM = (() => {
  // a fixed shuffle, so every visit looks the same
  const p = Array.from({ length: 256 }, (_, i) => i)
  let seed = 1337
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647
    const j = seed % (i + 1)
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  return Uint8Array.from([...p, ...p])
})()

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function grad3(hash: number, x: number, y: number, z: number) {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const zi = Math.floor(z) & 255
  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)
  const u = fade(x)
  const v = fade(y)
  const w = fade(z)
  const a = PERM[xi] + yi
  const aa = PERM[a] + zi
  const ab = PERM[a + 1] + zi
  const b = PERM[xi + 1] + yi
  const ba = PERM[b] + zi
  const bb = PERM[b + 1] + zi
  return lerp(
    lerp(lerp(grad3(PERM[aa], x, y, z), grad3(PERM[ba], x - 1, y, z), u), lerp(grad3(PERM[ab], x, y - 1, z), grad3(PERM[bb], x - 1, y - 1, z), u), v),
    lerp(
      lerp(grad3(PERM[aa + 1], x, y, z - 1), grad3(PERM[ba + 1], x - 1, y, z - 1), u),
      lerp(grad3(PERM[ab + 1], x, y - 1, z - 1), grad3(PERM[bb + 1], x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  )
}

export const noise2 = (x: number, y: number) => noise3(x, y, 0.5)

/** Several octaves of noise3 for a more natural, detailed field. */
export function fbm3(x: number, y: number, z: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * freq, y * freq, z * freq)
    freq *= 2
    amp *= 0.5
  }
  return sum
}

/**
 * A small seeded random generator, for scenes that must look the same every visit.
 * The seed is scrambled first, so neighbouring seeds such as `Math.floor(time * 8)`
 * and the next bucket start from unrelated values.
 */
export function seeded(seed: number) {
  let s = Math.floor(seed) >>> 0
  s = Math.imul(s ^ (s >>> 16), 0x85ebca6b) >>> 0
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0
  s = (s ^ (s >>> 16)) >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
