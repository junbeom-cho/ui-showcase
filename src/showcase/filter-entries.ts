import type { ShowcaseEntry } from './types'

export function filterEntries(entries: ShowcaseEntry[], query: string): ShowcaseEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return entries

  return entries.filter((entry) =>
    [entry.name, ...entry.aliases, entry.description].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  )
}
