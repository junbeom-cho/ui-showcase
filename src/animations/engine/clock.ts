/** Longest step a frame may take, so a tab coming back from the background does not jump. */
export const MAX_STEP = 0.1

/**
 * Scene time in seconds. It only moves while playing, scaled by speed, so pausing
 * freezes the picture and changing speed never makes it jump.
 */
export function advance(time: number, realDelta: number, speed: number, paused: boolean): { time: number; delta: number } {
  if (paused) return { time, delta: 0 }
  const delta = Math.min(Math.max(realDelta, 0), MAX_STEP) * speed
  return { time: time + delta, delta }
}
