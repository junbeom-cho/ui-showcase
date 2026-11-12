import type { ShowcaseEntry } from './types'

/** True when the trimmed, case-folded query is part of any field. An empty query matches everything. */
export function matchesQuery(fields: string[], query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return fields.some((text) => text.toLowerCase().includes(needle))
}

export function filterEntries(entries: ShowcaseEntry[], query: string): ShowcaseEntry[] {
  if (query.trim() === '') return entries
  return entries.filter((entry) =>
    matchesQuery([entry.name, ...entry.aliases, entry.description], query),
  )
}
