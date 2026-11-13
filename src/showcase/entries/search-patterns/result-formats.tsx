import { useState, type FormEvent } from 'react'
import { SearchIcon, StarIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BrowserFrame } from '../navigation-patterns/frames'
import { Highlight, objectParticle, ProductRow } from './parts'
import {
  correctionFor,
  inPriceRange,
  priceLabel,
  search,
  terms,
  won,
  type PriceRange,
  type Product,
} from './products'

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'rating'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'relevance', label: '관련도순' },
  { id: 'price-asc', label: '낮은 가격순' },
  { id: 'price-desc', label: '높은 가격순' },
  { id: 'rating', label: '평점순' },
]

/** Name matches count for more than description-only matches; ties go to the better rated. */
export function sortResults(list: Product[], sort: Sort, query: string) {
  const words = terms(query)
  const score = (p: Product) => (words.every((w) => p.name.toLowerCase().includes(w)) ? 2 : 1)
  const sorted = [...list]
  if (sort === 'relevance') sorted.sort((a, b) => score(b) - score(a) || b.rating - a.rating)
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
  return sorted
}

/** 6. Results with the searched words marked, a count and a sort order. */
export function HighlightResultsFormat() {
  const [query, setQuery] = useState('무선')
  const [sort, setSort] = useState<Sort>('relevance')
  const q = query.trim()
  const results = sortResults(search(q), sort, q)
  const sortLabel = SORTS.find((s) => s.id === sort)!.label

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url={`shop.example/search?q=${q}`} className="h-[26rem]">
        <div className="flex flex-col gap-3 border-b px-4 py-3">
          <InputGroup className="h-9">
            <InputGroupInput
              type="search"
              aria-label="검색어"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="[&::-webkit-search-cancel-button]:appearance-none"
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
          </InputGroup>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              {q ? <>‘{q}’ 검색 결과 </> : <>전체 상품 </>}
              <span className="font-semibold tabular-nums">{results.length}개</span>
            </p>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger size="sm" aria-label="정렬">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ul aria-label="검색 결과" className="min-h-0 flex-1 divide-y overflow-y-auto px-4">
          {results.map((p) => (
            <li key={p.id} className="flex flex-col gap-0.5 py-2.5">
              <p className="text-sm font-medium">
                <Highlight text={p.name} query={q} />
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <Highlight text={p.description} query={q} />
              </p>
              <p className="flex items-center gap-2 text-xs">
                <span className="font-medium tabular-nums">{won(p.price)}</span>
                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                  <StarIcon aria-hidden className="size-3 fill-amber-400 text-amber-400" />
                  {p.rating.toFixed(1)}
                </span>
              </p>
            </li>
          ))}
          {results.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">맞는 상품이 없어요</li>}
        </ul>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {q ? `‘${q}’` : '전체'} 결과 {results.length}개 · {sortLabel}
      </p>
    </div>
  )
}

const START_QUERY = '블루투수'
const START_PRICE: PriceRange = 'under2'
const SIMILAR = ['이어폰', '스피커', '무선']

/** A magnifier with a question mark, drawn instead of an image. */
function NoResultsArt() {
  return (
    <svg aria-hidden viewBox="0 0 96 80" fill="none" className="h-20 w-24">
      <ellipse cx="48" cy="72" rx="30" ry="4" className="fill-muted" />
      <circle cx="42" cy="34" r="22" strokeWidth="4" className="fill-background stroke-muted-foreground/60" />
      <path d="M58 50l14 14" strokeWidth="6" strokeLinecap="round" className="stroke-muted-foreground/60" />
      <path
        d="M36 28a6 6 0 1 1 8.5 5.5c-1.6.8-2.5 2-2.5 3.5v1.5"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-amber-500"
      />
      <circle cx="42" cy="45" r="2" className="fill-amber-500" />
    </svg>
  )
}

/** 7. Zero results: say so plainly, then offer a way out (spelling, similar words, fewer filters). */
export function NoResultsFormat() {
  const [input, setInput] = useState(START_QUERY)
  const [query, setQuery] = useState(START_QUERY)
  const [price, setPrice] = useState<PriceRange>(START_PRICE)

  const byQuery = search(query)
  const results = byQuery.filter((p) => inPriceRange(p.price, price))
  const correction = correctionFor(query)
  const hiddenByFilter = byQuery.length - results.length
  const atStart = query === START_QUERY && price === START_PRICE

  const searchFor = (q: string) => {
    setInput(q)
    setQuery(q)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (input.trim()) setQuery(input.trim())
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url={`shop.example/search?q=${query}`} className="h-[30rem]">
        <div className="flex flex-col gap-2 border-b px-4 py-3">
          <form role="search" aria-label="상품 검색" onSubmit={submit}>
            <InputGroup className="h-9">
              <InputGroupInput
                type="search"
                aria-label="검색어"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="[&::-webkit-search-cancel-button]:appearance-none"
              />
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
            </InputGroup>
          </form>
          {price !== 'all' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">필터</span>
              <button
                type="button"
                aria-label={`가격 조건 ${priceLabel(price)} 빼기`}
                onClick={() => setPrice('all')}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-foreground px-2 text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {priceLabel(price)}
                <XIcon aria-hidden className="size-3" />
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {results.length > 0 ? (
            <>
              <p className="pt-3 text-sm">
                ‘{query}’ 검색 결과 <span className="font-semibold tabular-nums">{results.length}개</span>
              </p>
              <ul aria-label="검색 결과" className="divide-y">
                {results.map((p) => (
                  <li key={p.id}>
                    <ProductRow product={p} query={query} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-5 text-center">
              <NoResultsArt />
              <div className="flex flex-col gap-1">
                <h4 className="text-base font-semibold">‘{query}’ 검색 결과가 없어요</h4>
                <p className="text-sm text-muted-foreground">
                  {hiddenByFilter > 0
                    ? `필터 때문에 상품 ${hiddenByFilter}개가 가려져 있어요.`
                    : '검색어나 필터를 바꾸면 찾을 수 있을지도 몰라요.'}
                </p>
              </div>
              <ul className="flex w-full max-w-xs flex-col gap-2 text-left text-sm">
                <li className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2">
                  <span>철자를 확인해 보세요.</span>
                  {correction && (
                    <span>
                      혹시{' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="inline h-auto p-0 align-baseline text-sm"
                        onClick={() => searchFor(correction)}
                      >
                        ‘{correction}’
                      </Button>
                      {objectParticle(correction)} 찾으셨나요?
                    </span>
                  )}
                </li>
                <li className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-3 py-2">
                  <span>비슷한 검색어</span>
                  <span className="flex flex-wrap gap-1.5">
                    {SIMILAR.map((w) => (
                      <Button key={w} variant="outline" size="xs" onClick={() => searchFor(w)}>
                        {w}
                      </Button>
                    ))}
                  </span>
                </li>
              </ul>
              {price !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setPrice('all')}>
                  필터 해제
                </Button>
              )}
            </div>
          )}
          {!atStart && (
            <Button
              variant="link"
              size="xs"
              className="my-2 px-0"
              onClick={() => {
                searchFor(START_QUERY)
                setPrice(START_PRICE)
              }}
            >
              결과 없음 화면 다시 보기
            </Button>
          )}
        </div>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        ‘{query}’ 결과 {results.length}개 · 필터: {price === 'all' ? '없음' : priceLabel(price)}
        {results.length === 0 && hiddenByFilter > 0 && ` (필터를 풀면 ${hiddenByFilter}개)`}
      </p>
    </div>
  )
}
