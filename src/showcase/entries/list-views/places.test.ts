import { feedPage, groupByCategory, monthOf, PLACES, shortDate, sortPlaces } from './places'

it('sorts by rating, name or date in either direction', () => {
  expect(sortPlaces(PLACES, 'rating', 'desc')[0].name).toBe('책방 오후')
  expect(sortPlaces(PLACES, 'rating', 'asc')[0].name).toBe('종이의 시간')
  expect(sortPlaces(PLACES, 'name', 'asc')[0].name).toBe('골목 서재')
  expect(sortPlaces(PLACES, 'visited', 'asc')[0].name).toBe('소리 박물관')
  expect(PLACES[0].name).toBe('모래시계 커피') // the original is left alone
})

it('groups places by category in a fixed order', () => {
  const groups = groupByCategory(PLACES)
  expect(groups.map((g) => g.category)).toEqual(['카페', '서점', '공원', '전시'])
  expect(groups[0].places).toHaveLength(3)
})

it('feeds endless pages with unique ids', () => {
  const ids = [0, 1, 2, 3].flatMap((p) => feedPage(p).map((x) => x.id))
  expect(new Set(ids).size).toBe(24)
  expect(feedPage(2)[0].name).toBe('모래시계 커피 2')
})

it('writes dates the Korean way', () => {
  expect(shortDate('2026-11-08')).toBe('11월 8일')
  expect(monthOf('2026-09-21')).toBe('2026년 9월')
})
