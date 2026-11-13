export const CATEGORIES = ['오디오', '입력 장치', '충전', '거치대', '저장 장치'] as const
export const BRANDS = ['소리랩', '키온', '파워업', '데스크핏'] as const

export type Category = (typeof CATEGORIES)[number]
export type Brand = (typeof BRANDS)[number]

export type Product = {
  id: number
  name: string
  category: Category
  brand: Brand
  price: number
  rating: number
  freeShipping: boolean
  description: string
}

/** The same 20 products in every search format, so the formats can be compared. */
export const PRODUCTS: Product[] = [
  { id: 1, name: '무선 블루투스 이어폰', category: '오디오', brand: '소리랩', price: 39000, rating: 4.5, freeShipping: true, description: '블루투스 5.3 무선 이어폰. 한 번 충전으로 8시간 들어요.' },
  { id: 2, name: '노이즈 캔슬링 헤드폰', category: '오디오', brand: '소리랩', price: 329000, rating: 4.8, freeShipping: true, description: '주변 소음을 줄여 주는 무선 헤드폰. 30시간 재생.' },
  { id: 3, name: '유선 이어폰', category: '오디오', brand: '소리랩', price: 12900, rating: 4.1, freeShipping: false, description: 'C타입 단자에 바로 꽂는 가벼운 이어폰.' },
  { id: 4, name: '블루투스 스피커', category: '오디오', brand: '소리랩', price: 59000, rating: 4.4, freeShipping: true, description: '물에 젖어도 되는 작은 스피커. 캠핑에 좋아요.' },
  { id: 5, name: '게이밍 헤드셋', category: '오디오', brand: '키온', price: 89000, rating: 4.2, freeShipping: false, description: '마이크가 달린 헤드셋. 7.1 입체 음향.' },
  { id: 6, name: '기계식 키보드', category: '입력 장치', brand: '키온', price: 129000, rating: 4.7, freeShipping: true, description: '갈축 스위치 키보드. 무선과 유선 모두 돼요.' },
  { id: 7, name: '무선 마우스', category: '입력 장치', brand: '키온', price: 29000, rating: 4.3, freeShipping: true, description: '클릭 소리가 작은 마우스. 건전지 하나로 1년.' },
  { id: 8, name: '블루투스 키보드', category: '입력 장치', brand: '키온', price: 45000, rating: 4.0, freeShipping: false, description: '태블릿과 휴대폰에 붙는 얇은 키보드.' },
  { id: 9, name: '트랙패드', category: '입력 장치', brand: '키온', price: 99000, rating: 3.9, freeShipping: true, description: '손가락 동작을 쓰는 넓은 트랙패드.' },
  { id: 10, name: 'USB-C 고속 충전기', category: '충전', brand: '파워업', price: 25000, rating: 4.6, freeShipping: true, description: '65W 고속 충전기. 노트북도 충전돼요.' },
  { id: 11, name: '휴대용 보조배터리', category: '충전', brand: '파워업', price: 35000, rating: 4.5, freeShipping: true, description: '10,000mAh 보조배터리. 비행기에 들고 탈 수 있어요.' },
  { id: 12, name: '무선 충전 패드', category: '충전', brand: '파워업', price: 19900, rating: 4.0, freeShipping: false, description: '휴대폰을 올려 두기만 하면 충전돼요.' },
  { id: 13, name: '3in1 충전 거치대', category: '충전', brand: '파워업', price: 69000, rating: 4.2, freeShipping: true, description: '휴대폰·시계·이어폰을 한 번에 무선 충전.' },
  { id: 14, name: '충전 케이블 2m', category: '충전', brand: '파워업', price: 9900, rating: 4.4, freeShipping: false, description: 'C타입 양쪽 2m 케이블. 꼬이지 않아요.' },
  { id: 15, name: '노트북 거치대', category: '거치대', brand: '데스크핏', price: 32000, rating: 4.6, freeShipping: true, description: '높이를 6단계로 맞추는 알루미늄 거치대.' },
  { id: 16, name: '모니터 받침대', category: '거치대', brand: '데스크핏', price: 45000, rating: 4.3, freeShipping: false, description: '서랍이 달린 원목 받침대.' },
  { id: 17, name: '태블릿 거치대', category: '거치대', brand: '데스크핏', price: 18000, rating: 4.1, freeShipping: false, description: '접어서 들고 다니는 거치대.' },
  { id: 18, name: '휴대폰 거치대', category: '거치대', brand: '데스크핏', price: 12000, rating: 3.8, freeShipping: false, description: '책상 위에 두는 각도 조절 거치대.' },
  { id: 19, name: '외장 SSD 1TB', category: '저장 장치', brand: '키온', price: 149000, rating: 4.7, freeShipping: true, description: '주머니에 들어가는 1TB 저장 장치. 초당 1,000MB.' },
  { id: 20, name: 'USB 메모리 64GB', category: '저장 장치', brand: '키온', price: 15000, rating: 4.2, freeShipping: false, description: '열쇠고리에 다는 작은 USB 메모리.' },
]

export type PriceRange = 'all' | 'under2' | '2to5' | '5to10' | 'over10'

export const PRICE_RANGES: { id: Exclude<PriceRange, 'all'>; label: string; test: (price: number) => boolean }[] = [
  { id: 'under2', label: '2만원 이하', test: (p) => p <= 20000 },
  { id: '2to5', label: '2만~5만원', test: (p) => p > 20000 && p <= 50000 },
  { id: '5to10', label: '5만~10만원', test: (p) => p > 50000 && p <= 100000 },
  { id: 'over10', label: '10만원 넘게', test: (p) => p > 100000 },
]

export const inPriceRange = (price: number, range: PriceRange) =>
  range === 'all' || PRICE_RANGES.find((r) => r.id === range)!.test(price)

export const priceLabel = (range: PriceRange) => PRICE_RANGES.find((r) => r.id === range)?.label ?? '전체'

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** Lower-cased words of a query; empty when there is nothing to look for. */
export function terms(query: string) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Every word of the query appears in the name or the description. */
export function matches(product: Product, query: string) {
  const words = terms(query)
  if (words.length === 0) return true
  const haystack = `${product.name} ${product.description}`.toLowerCase()
  return words.every((w) => haystack.includes(w))
}

export const search = (query: string) => PRODUCTS.filter((p) => matches(p, query))

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Cuts `text` into pieces, marking the ones that match a word of the query (any case). */
export function splitMatches(text: string, query: string): { text: string; match: boolean }[] {
  const words = terms(query)
  if (words.length === 0) return [{ text, match: false }]
  // longest first, so "블루투스" wins over "블루"
  const pattern = new RegExp(`(${words.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})`, 'gi')
  return text
    .split(pattern)
    .filter((piece) => piece !== '')
    .map((piece) => ({ text: piece, match: words.includes(piece.toLowerCase()) }))
}

/** Common misspellings and the word that was meant. */
export const CORRECTIONS: Record<string, string> = {
  블루투수: '블루투스',
  이어펀: '이어폰',
  키보트: '키보드',
  거치데: '거치대',
  보조베터리: '보조배터리',
}

export function correctionFor(query: string) {
  const fixed = terms(query).map((w) => CORRECTIONS[w] ?? w)
  const suggestion = fixed.join(' ')
  return suggestion !== terms(query).join(' ') ? suggestion : null
}
