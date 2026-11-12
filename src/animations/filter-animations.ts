import { matchesQuery } from '@/showcase/filter-entries'
import type { AnimationStyle } from './types'

export function filterAnimations(animations: AnimationStyle[], query: string): AnimationStyle[] {
  if (query.trim() === '') return animations
  return animations.filter((a) => matchesQuery([a.name, a.englishName, ...a.aliases, a.description], query))
}
