export type Rect = { left: number; top: number; width: number; height: number }

export type Callout = Rect & {
  side: 'left' | 'right'
  /** centre of the number chip, in stage coordinates */
  chipX: number
  chipY: number
}

/** Minimum vertical distance between two chip centres on the same side. */
export const CHIP_GAP = 22
/** How far outside the specimen's edge the chip column sits. */
const MARGIN = 26

/**
 * Places a numbered chip for every part in the margin beside the specimen,
 * level with the part where possible, like callouts on a technical drawing.
 * Chips never cover the component itself.
 */
export function layoutCallouts(
  rects: (Rect | null)[],
  stageWidth: number,
  /** Outer edges of the specimen; chips sit outside these even if no part reaches them. */
  bounds?: { left: number; right: number },
): (Callout | null)[] {
  const present = rects.filter((r): r is Rect => r !== null)
  if (present.length === 0) return rects.map(() => null)

  const minLeft = Math.min(bounds?.left ?? Infinity, ...present.map((r) => r.left))
  const maxRight = Math.max(bounds?.right ?? -Infinity, ...present.map((r) => r.left + r.width))
  const placed: Record<Callout['side'], number[]> = { left: [], right: [] }
  const result: (Callout | null)[] = rects.map(() => null)

  // Small parts have the least room to move, so they choose first.
  const order = rects
    .map((r, i) => ({ r, i }))
    .filter((x): x is { r: Rect; i: number } => x.r !== null)
    .sort((a, b) => a.r.height - b.r.height)

  for (const { r, i } of order) {
    const center = r.left + r.width / 2
    const preferred: Callout['side'] =
      center > stageWidth * 0.6 && r.width < stageWidth * 0.4 ? 'right' : 'left'
    const other: Callout['side'] = preferred === 'left' ? 'right' : 'left'
    const middle = r.top + r.height / 2

    let side = preferred
    let chipY = levelSlot(r, placed[preferred])
    if (chipY === null) {
      chipY = levelSlot(r, placed[other])
      if (chipY !== null) side = other
    }
    chipY ??= Math.max(middle, ...placed[preferred]) + CHIP_GAP

    placed[side].push(chipY)
    result[i] = { ...r, side, chipY, chipX: side === 'left' ? minLeft - MARGIN : maxRight + MARGIN }
  }

  return result
}

/** The free chip position closest to the part's middle that stays level with the part. */
function levelSlot(r: Rect, taken: number[]): number | null {
  const middle = r.top + r.height / 2
  const free = (y: number) => taken.every((p) => Math.abs(p - y) >= CHIP_GAP)
  for (let k = 0; k <= 8; k++) {
    for (const y of k === 0 ? [middle] : [middle + k * CHIP_GAP, middle - k * CHIP_GAP]) {
      if (y >= r.top && y <= r.top + r.height && free(y)) return y
    }
  }
  return null
}
