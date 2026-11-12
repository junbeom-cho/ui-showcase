/** One small data set shown in every list format, so the formats can be compared side by side. */

export type Category = '카페' | '서점' | '공원' | '전시'

export type Place = {
  id: number
  name: string
  category: Category
  area: string
  rating: number
  /** visit date, YYYY-MM-DD */
  visited: string
  note: string
  /** hue for the drawn thumbnail */
  hue: number
}

export const PLACES: Place[] = [
  { id: 1, name: '모래시계 커피', category: '카페', area: '성수', rating: 4.6, visited: '2026-11-08', note: '창가 자리가 넓고 오후 햇빛이 좋다.', hue: 28 },
  { id: 2, name: '책방 오후', category: '서점', area: '연남', rating: 4.8, visited: '2026-11-02', note: '독립 출판물이 많다. 주인이 고른 시집 코너가 따로 있고, 작은 낭독회도 연다.', hue: 200 },
  { id: 3, name: '솔숲 공원', category: '공원', area: '서초', rating: 4.3, visited: '2026-10-27', note: '산책로 한 바퀴 40분.', hue: 130 },
  { id: 4, name: '빛과 그림자展', category: '전시', area: '종로', rating: 4.5, visited: '2026-10-19', note: '조명을 쓴 설치 작품 위주. 평일 오전이 한산하고, 마지막 방은 꼭 끝까지 기다려 볼 것.', hue: 265 },
  { id: 5, name: '느린 로스터리', category: '카페', area: '망원', rating: 4.2, visited: '2026-10-11', note: '드립 커피를 고르면 원두 설명 카드를 준다.', hue: 18 },
  { id: 6, name: '골목 서재', category: '서점', area: '해방촌', rating: 4.4, visited: '2026-10-03', note: '중고책과 새책이 섞여 있다.', hue: 190 },
  { id: 7, name: '물빛 정원', category: '공원', area: '마포', rating: 4.7, visited: '2026-09-21', note: '연못 둘레 벤치가 많다. 해 질 무렵 물에 비친 하늘이 특히 예쁘고 사람이 적다.', hue: 160 },
  { id: 8, name: '종이의 시간', category: '전시', area: '삼청', rating: 4.1, visited: '2026-09-14', note: '한지 공예 전시.', hue: 300 },
  { id: 9, name: '아침 빵집 카페', category: '카페', area: '을지로', rating: 4.5, visited: '2026-09-06', note: '오전 10시 소금빵이 금방 떨어진다. 2층 좌석.', hue: 40 },
  { id: 10, name: '구름 책방', category: '서점', area: '합정', rating: 4.6, visited: '2026-08-30', note: '그림책 전문.', hue: 215 },
  { id: 11, name: '하늘 숲길', category: '공원', area: '은평', rating: 4.4, visited: '2026-08-17', note: '나무 데크 길이 이어져 유모차도 다니기 쉽다.', hue: 110 },
  { id: 12, name: '소리 박물관', category: '전시', area: '용산', rating: 4.3, visited: '2026-08-09', note: '헤드폰으로 듣는 전시. 오래된 라디오 수집품이 볼만하다.', hue: 280 },
]

export const CATEGORIES: Category[] = ['카페', '서점', '공원', '전시']

export type SortKey = 'name' | 'rating' | 'visited'
export type SortDir = 'asc' | 'desc'

export function sortPlaces(places: Place[], key: SortKey, dir: SortDir): Place[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...places].sort((a, b) => {
    const order = key === 'rating' ? a.rating - b.rating : a[key].localeCompare(b[key], 'ko')
    return order * sign || a.id - b.id
  })
}

export function groupByCategory(places: Place[]): { category: Category; places: Place[] }[] {
  return CATEGORIES.map((category) => ({ category, places: places.filter((p) => p.category === category) })).filter(
    (g) => g.places.length > 0,
  )
}

/** Endless feed for the infinite-scroll example: page n repeats the set with new ids. */
export function feedPage(page: number, size = 6): Place[] {
  return Array.from({ length: size }, (_, i) => {
    const index = page * size + i
    const base = PLACES[index % PLACES.length]
    return { ...base, id: 1000 + index, name: index < PLACES.length ? base.name : `${base.name} ${Math.floor(index / PLACES.length) + 1}` }
  })
}

/** "2026-11-08" → "11월 8일" */
export const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}월 ${d}일`
}

/** "2026-11-08" → "2026년 11월" */
export const monthOf = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return `${y}년 ${m}월`
}
