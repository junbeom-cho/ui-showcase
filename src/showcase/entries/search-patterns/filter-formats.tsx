import { useId, useState } from 'react'
import { ChevronDownIcon, SlidersHorizontalIcon, StarIcon, TruckIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { BrowserFrame, PhoneFrame } from '../navigation-patterns/frames'
import { ProductRow } from './parts'
import {
  BRANDS,
  CATEGORIES,
  PRICE_RANGES,
  PRODUCTS,
  inPriceRange,
  priceLabel,
  type PriceRange,
  type Product,
} from './products'

const chipClass =
  'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border bg-background px-3 text-xs font-medium whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background'
const chipOnClass = 'border-foreground bg-foreground text-background hover:bg-foreground/85'

/** 4. A row of chips that each switch one filter on or off. */
export function FilterChipsFormat() {
  const [price, setPrice] = useState<PriceRange>('all')
  const [topRated, setTopRated] = useState(false)
  const [freeShipping, setFreeShipping] = useState(false)

  const results = PRODUCTS.filter(
    (p) => inPriceRange(p.price, price) && (!topRated || p.rating >= 4) && (!freeShipping || p.freeShipping),
  )
  const active = (price !== 'all' ? 1 : 0) + (topRated ? 1 : 0) + (freeShipping ? 1 : 0)
  const clearAll = () => {
    setPrice('all')
    setTopRated(false)
    setFreeShipping(false)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center border-b px-4">
          <p className="text-sm font-semibold">전자기기</p>
        </header>
        <div role="group" aria-label="필터" className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto px-3 py-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={price === 'all' ? '가격대' : `가격대: ${priceLabel(price)}`}
              className={cn(chipClass, price !== 'all' && chipOnClass)}
            >
              {price === 'all' ? '가격대' : priceLabel(price)}
              <ChevronDownIcon aria-hidden className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuRadioGroup value={price} onValueChange={(v) => setPrice(v as PriceRange)}>
                <DropdownMenuRadioItem value="all">전체</DropdownMenuRadioItem>
                {PRICE_RANGES.map((r) => (
                  <DropdownMenuRadioItem key={r.id} value={r.id}>
                    {r.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" aria-pressed={topRated} onClick={() => setTopRated((v) => !v)} className={chipClass}>
            <StarIcon aria-hidden className="size-3.5" />
            평점 4+
          </button>
          <button type="button" aria-pressed={freeShipping} onClick={() => setFreeShipping((v) => !v)} className={chipClass}>
            <TruckIcon aria-hidden className="size-3.5" />
            무료 배송
          </button>
        </div>
        <div className="flex h-9 shrink-0 items-center gap-2 border-b px-4 text-xs">
          <span className="font-medium tabular-nums">상품 {results.length}개</span>
          {active > 0 && (
            <>
              <Badge variant="secondary" className="gap-1">
                <SlidersHorizontalIcon aria-hidden className="size-3" />
                필터 {active}
              </Badge>
              <Button variant="link" size="xs" className="ml-auto px-0" onClick={clearAll}>
                모두 지우기
              </Button>
            </>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm font-medium">조건에 맞는 상품이 없어요</p>
              <p className="text-xs text-muted-foreground">필터를 하나씩 풀어 보세요.</p>
              <Button variant="outline" size="sm" onClick={clearAll}>
                필터 모두 지우기
              </Button>
            </div>
          ) : (
            <ul aria-label="상품" className="divide-y">
              {results.map((p) => (
                <li key={p.id}>
                  <ProductRow product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        상품 {results.length}개 / 전체 {PRODUCTS.length}개 · 필터 {active}개 적용
      </p>
    </div>
  )
}

type GroupKey = 'category' | 'brand' | 'shipping'
type FacetOption = { value: string; label: string; test: (p: Product) => boolean }
type FacetGroup = { key: GroupKey; label: string; options: FacetOption[] }
type Selected = Record<GroupKey, string[]>

const GROUPS: FacetGroup[] = [
  { key: 'category', label: '카테고리', options: CATEGORIES.map((c) => ({ value: c, label: c, test: (p) => p.category === c })) },
  { key: 'brand', label: '브랜드', options: BRANDS.map((b) => ({ value: b, label: b, test: (p) => p.brand === b })) },
  { key: 'shipping', label: '배송', options: [{ value: 'free', label: '무료 배송', test: (p) => p.freeShipping }] },
]

const NONE: Selected = { category: [], brand: [], shipping: [] }

/** Within a group the ticks are OR (오디오 or 충전); between groups they are AND. */
function passes(p: Product, group: FacetGroup, selected: Selected) {
  const chosen = selected[group.key]
  return chosen.length === 0 || group.options.some((o) => chosen.includes(o.value) && o.test(p))
}

export function facetResults(selected: Selected) {
  return PRODUCTS.filter((p) => GROUPS.every((g) => passes(p, g, selected)))
}

/** How many results ticking `option` would give, keeping the other groups as they are. */
export function facetCount(selected: Selected, groupKey: GroupKey, option: FacetOption) {
  return PRODUCTS.filter((p) => option.test(p) && GROUPS.every((g) => g.key === groupKey || passes(p, g, selected))).length
}

/** 5. Checkbox groups in a sidebar; each option shows how many results it would leave. */
export function FacetFilterFormat() {
  const [selected, setSelected] = useState<Selected>(NONE)
  const id = useId()
  const results = facetResults(selected)
  const chips = GROUPS.flatMap((g) => g.options.filter((o) => selected[g.key].includes(o.value)).map((o) => ({ group: g.key, option: o })))

  const toggle = (group: GroupKey, value: string, on: boolean) =>
    setSelected((prev) => ({
      ...prev,
      [group]: on ? [...prev[group], value] : prev[group].filter((v) => v !== value),
    }))

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <BrowserFrame url="shop.example/electronics" className="h-[27rem]" bodyClassName="@container">
        <div className="flex min-h-0 flex-1 flex-col @lg:flex-row">
          <aside
            aria-label="필터"
            className="flex max-h-44 shrink-0 flex-col gap-4 overflow-y-auto border-b p-3 @lg:max-h-none @lg:w-48 @lg:border-r @lg:border-b-0"
          >
            {GROUPS.map((g) => (
              <fieldset key={g.key} className="flex flex-col gap-1.5">
                <legend className="mb-1 text-xs font-semibold">{g.label}</legend>
                {g.options.map((o) => {
                  const checked = selected[g.key].includes(o.value)
                  const count = facetCount(selected, g.key, o)
                  const inputId = `${id}-${g.key}-${o.value}`
                  return (
                    <div key={o.value} className={cn('flex items-center gap-2', count === 0 && !checked && 'opacity-45')}>
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        disabled={count === 0 && !checked}
                        onCheckedChange={(v) => toggle(g.key, o.value, v === true)}
                      />
                      <Label htmlFor={inputId} className="flex flex-1 justify-between gap-2 text-sm font-normal">
                        {o.label}{' '}
                        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                      </Label>
                    </div>
                  )
                })}
              </fieldset>
            ))}
          </aside>
          <section aria-label="결과" className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2.5">
              <p className="mr-1 text-sm font-semibold tabular-nums">상품 {results.length}개</p>
              {chips.map(({ group, option }) => (
                <button
                  key={`${group}-${option.value}`}
                  type="button"
                  aria-label={`${option.label} 조건 빼기`}
                  onClick={() => toggle(group, option.value, false)}
                  className="inline-flex h-6 items-center gap-1 rounded-full bg-muted px-2 text-xs outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {option.label}
                  <XIcon aria-hidden className="size-3" />
                </button>
              ))}
              {chips.length > 0 && (
                <Button variant="link" size="xs" className="px-1" onClick={() => setSelected(NONE)}>
                  모두 지우기
                </Button>
              )}
            </div>
            <ul aria-label="상품" className="grid min-h-0 flex-1 content-start overflow-y-auto px-4 @xl:grid-cols-2 @xl:gap-x-4">
              {results.map((p) => (
                <li key={p.id} className="border-b">
                  <ProductRow product={p} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        상품 {results.length}개 · 고른 조건: {chips.length > 0 ? chips.map((c) => c.option.label).join(', ') : '없음'}
      </p>
    </div>
  )
}
