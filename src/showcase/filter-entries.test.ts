import { filterEntries } from './filter-entries'
import { items } from './test-entries'

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
