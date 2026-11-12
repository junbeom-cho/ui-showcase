import { matchesQuery } from '@/showcase/filter-entries'
import type { DesignStyle } from './types'

export function filterStyles(styles: DesignStyle[], query: string): DesignStyle[] {
  if (query.trim() === '') return styles
  return styles.filter((s) =>
    matchesQuery([s.name, s.englishName, ...s.aliases, s.description], query),
  )
}
