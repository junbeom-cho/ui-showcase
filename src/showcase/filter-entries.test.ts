import { filterEntries } from './filter-entries'
import type { ShowcaseEntry } from './types'

const make = (id: string, name: string, aliases: string[], description: string): ShowcaseEntry => ({
  id,
  name,
  aliases,
  description,
  Preview: () => null,
})

const items = [
  make('badge', 'Badge', ['Tag', 'Chip'], '상태를 표시하는 작은 라벨.'),
  make('dialog', 'Dialog', ['Modal'], '화면 위에 뜨는 창.'),
  make('skeleton', 'Skeleton', [], '로딩 중 자리표시자.'),
]

it('returns all entries in order for an empty or blank query', () => {
  expect(filterEntries(items, '')).toEqual(items)
  expect(filterEntries(items, '   ')).toEqual(items)
})

it('matches name case-insensitively and ignores surrounding spaces', () => {
  expect(filterEntries(items, '  BADGE ').map((e) => e.id)).toEqual(['badge'])
})

it('matches aliases', () => {
  expect(filterEntries(items, 'modal').map((e) => e.id)).toEqual(['dialog'])
})

it('matches Korean description text', () => {
  expect(filterEntries(items, '로딩').map((e) => e.id)).toEqual(['skeleton'])
})

it('returns an empty array when nothing matches', () => {
  expect(filterEntries(items, 'carousel')).toEqual([])
})
