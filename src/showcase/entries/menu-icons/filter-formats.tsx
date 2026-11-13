import { useId, useState } from 'react'
import { ListFilterIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { BrowserFrame } from '../navigation-patterns/frames'
import { IconDemo, MenuIconButton, StairsIcon } from './parts'

type Product = { name: string; kind: string; price: number; soldOut: boolean; added: number }

const PRODUCTS: Product[] = [
  { name: '린넨 셔츠', kind: '상의', price: 39000, soldOut: false, added: 3 },
  { name: '와이드 팬츠', kind: '하의', price: 45000, soldOut: true, added: 5 },
  { name: '스니커즈', kind: '신발', price: 79000, soldOut: false, added: 1 },
  { name: '반팔 티', kind: '상의', price: 15000, soldOut: false, added: 6 },
  { name: '청바지', kind: '하의', price: 52000, soldOut: false, added: 2 },
  { name: '샌들', kind: '신발', price: 29000, soldOut: true, added: 4 },
]

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">조건에 맞는 상품이 없습니다</p>
  }
  return (
    <ul aria-label="상품" className="divide-y overflow-y-auto">
      {products.map((p) => (
        <li key={p.name} className="flex h-9 items-center gap-2 px-3 text-sm">
          <span className="flex-1 truncate">{p.name}</span>
          {p.soldOut && <span className="text-xs text-muted-foreground">품절</span>}
          <span className="tabular-nums">{won(p.price)}</span>
        </li>
      ))}
    </ul>
  )
}

const KINDS = ['상의', '하의', '신발']

/** 06. Lines narrowing to a point, like a funnel: opens the filters. */
export function DonerFormat() {
  const [kinds, setKinds] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const id = useId()
  const active = kinds.length + (inStock ? 1 : 0)
  const shown = PRODUCTS.filter((p) => (kinds.length === 0 || kinds.includes(p.kind)) && (!inStock || !p.soldOut))

  return (
    <IconDemo id="doner" status={`필터 ${active}개 적용 · 상품 ${shown.length}개 보임`}>
      <BrowserFrame url="shop.example/clothes" className="h-72">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <span className="text-sm font-semibold">옷</span>
          <Popover>
            <PopoverTrigger asChild>
              <MenuIconButton icon={ListFilterIcon} label="필터" badge={active ? `${active}개 적용` : undefined} />
            </PopoverTrigger>
            <PopoverContent align="end" aria-label="필터" className="w-52">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-xs font-medium text-muted-foreground">종류</legend>
                {KINDS.map((kind) => (
                  <div key={kind} className="flex items-center gap-2">
                    <Checkbox
                      id={`${id}-${kind}`}
                      checked={kinds.includes(kind)}
                      onCheckedChange={(on) => setKinds((k) => (on ? [...k, kind] : k.filter((x) => x !== kind)))}
                    />
                    <Label htmlFor={`${id}-${kind}`}>{kind}</Label>
                  </div>
                ))}
              </fieldset>
              <div className="flex items-center gap-2 border-t pt-2.5">
                <Checkbox id={`${id}-stock`} checked={inStock} onCheckedChange={(on) => setInStock(on === true)} />
                <Label htmlFor={`${id}-stock`}>품절 빼기</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={active === 0}
                onClick={() => {
                  setKinds([])
                  setInStock(false)
                }}
              >
                초기화
              </Button>
            </PopoverContent>
          </Popover>
        </header>
        <ProductList products={shown} />
      </BrowserFrame>
    </IconDemo>
  )
}

const SORTS: { id: string; label: string; compare: (a: Product, b: Product) => number }[] = [
  { id: 'new', label: '최신순', compare: (a, b) => a.added - b.added },
  { id: 'low', label: '낮은 가격순', compare: (a, b) => a.price - b.price },
  { id: 'high', label: '높은 가격순', compare: (a, b) => b.price - a.price },
  { id: 'name', label: '이름순', compare: (a, b) => a.name.localeCompare(b.name, 'ko') },
]

/** 08. Left-aligned lines stepping down: opens the sort order. */
export function StairsFormat() {
  const [sortId, setSortId] = useState('new')
  const sort = SORTS.find((s) => s.id === sortId)!
  const sorted = [...PRODUCTS].sort(sort.compare)

  return (
    <IconDemo id="stairs" status={`정렬: ${sort.label} · 맨 위 ${sorted[0].name}`}>
      <BrowserFrame url="shop.example/clothes" className="h-72">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <span className="text-sm font-semibold">옷</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuIconButton icon={StairsIcon} label={`정렬, 지금 ${sort.label}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel>정렬</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortId} onValueChange={setSortId}>
                {SORTS.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id}>
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <ProductList products={sorted} />
      </BrowserFrame>
    </IconDemo>
  )
}

const DEFAULT_SIZE = 15
const DEFAULT_LEADING = 1.6

/** 09. Slider knobs: opens fine-tuning controls — here, how the article reads. */
export function SlidersFormat() {
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [leading, setLeading] = useState(DEFAULT_LEADING)

  return (
    <IconDemo id="sliders" status={`글자 크기 ${size}px · 줄 간격 ${leading.toFixed(1)}`}>
      <BrowserFrame url="news.example/article/7" className="h-72" bodyClassName="overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <span className="text-sm font-semibold">오늘의 기사</span>
          <Popover>
            <PopoverTrigger asChild>
              <MenuIconButton icon={SlidersHorizontalIcon} label="보기 설정" />
            </PopoverTrigger>
            <PopoverContent align="end" aria-label="보기 설정" className="w-56 gap-4">
              <div className="flex flex-col gap-2">
                <p className="flex justify-between text-xs font-medium">
                  글자 크기 <span className="text-muted-foreground tabular-nums">{size}px</span>
                </p>
                <Slider min={12} max={22} value={[size]} onValueChange={([v]) => setSize(v)} thumbLabel="글자 크기" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex justify-between text-xs font-medium">
                  줄 간격 <span className="text-muted-foreground tabular-nums">{leading.toFixed(1)}</span>
                </p>
                <Slider
                  min={1.2}
                  max={2}
                  step={0.1}
                  value={[leading]}
                  onValueChange={([v]) => setLeading(Math.round(v * 10) / 10)}
                  thumbLabel="줄 간격"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSize(DEFAULT_SIZE)
                  setLeading(DEFAULT_LEADING)
                }}
              >
                기본값으로
              </Button>
            </PopoverContent>
          </Popover>
        </header>
        <p style={{ fontSize: size, lineHeight: leading }} className="p-4">
          아이콘에는 별명이 있습니다. 줄 세 개는 햄버거, 점 세 개는 케밥과 미트볼이라 부르지요. 별명은 모양을 말할 때
          편하지만, 버튼의 진짜 이름은 누르면 일어나는 일이어야 합니다.
        </p>
      </BrowserFrame>
    </IconDemo>
  )
}
