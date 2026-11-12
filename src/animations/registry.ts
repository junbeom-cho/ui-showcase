import type { AnimationStyle } from './types'

/** Menu order: the order the user listed them in. */
export const ANIMATION_ORDER = [
  'liquid-morph',
  'ascii-art',
  'holographic-foil',
  'bauhaus-shapes',
  'neon-glow',
  'dithering',
  'clay-3d',
  'halftone-dots',
  'kinetic-typography',
  'pixel-art',
  'particle-swarm',
  'risograph-print',
  'glitch-effect',
  'topographic-lines',
  'glassmorphism',
  'paper-cutout',
  'vaporwave-grid',
  'flow-fields',
  'metaballs',
  'raymarched-fractals',
] as const

/** Every file in ./styles exports `animation`; the file name is its id. */
export const animationModules = import.meta.glob<{ animation: AnimationStyle }>('./styles/*.tsx', { eager: true })

export const animations: AnimationStyle[] = ANIMATION_ORDER.flatMap((id) => {
  const module = animationModules[`./styles/${id}.tsx`]
  return module ? [module.animation] : []
})
