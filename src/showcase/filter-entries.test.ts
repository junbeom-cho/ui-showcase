import { filterEntries, matchesQuery } from './filter-entries'

it('matchesQuery trims, ignores case and checks every field', () => {
  expect(matchesQuery(['뉴모피즘', 'Neumorphism', 'Soft UI'], '  soft ui ')).toBe(true)
  expect(matchesQuery(['플랫 디자인'], '')).toBe(true)
  expect(matchesQuery(['플랫 디자인'], 'glass')).toBe(false)
})
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
