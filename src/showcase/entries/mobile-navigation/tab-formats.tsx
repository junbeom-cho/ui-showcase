import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { ChevronRightIcon, HeartIcon, HouseIcon, SearchIcon, ShoppingBagIcon, UserIcon, type LucideIcon } from 'lucide-react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '../navigation-patterns/frames'
import { NavBadge, slotProps, stay } from '../navigation-patterns/parts'

/** One destination in a bottom tab bar: icon over a short name. */
export function TabBarItem({
  icon: Icon,
  label,
  name,
  selected = false,
  count = 0,
  state,
  disabled = false,
  drawing = false,
  onSelect,
}: {
  icon: LucideIcon
  label: string
  /** spoken name when the badge needs words, e.g. "장바구니, 3개 담김" */
  name?: string
  selected?: boolean
  count?: number
  /** pin the pressed or keyboard look (state gallery) */
  state?: 'active' | 'focus'
  disabled?: boolean
  /** a picture of a tab: kept out of the tab order */
  drawing?: boolean
  onSelect?: () => void
}) {
  return (
    <a
      href={disabled ? undefined : '#'}
      role={disabled ? 'link' : undefined}
      aria-disabled={disabled || undefined}
      aria-current={selected ? 'page' : undefined}
      aria-label={name}
      data-demo-state={state}
      tabIndex={drawing && !disabled ? -1 : undefined}
      onClick={(event) => {
        stay(event)
        if (!disabled) onSelect?.()
      }}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-lg pt-2 pb-1 text-[10px] text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset active:bg-muted/80',
        selected && 'font-semibold text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <span
        className={cn(
          'relative grid h-7 w-11 place-items-center rounded-full transition-colors motion-reduce:transition-none',
          selected && 'bg-muted',
        )}
      >
        <Icon aria-hidden className={cn('size-5', selected && 'stroke-[2.4]')} />
        {count > 0 && <NavBadge count={count} className="absolute -top-1 right-0.5 ring-2 ring-background" />}
      </span>
      {label}
    </a>
  )
}

type Tab = 'home' | 'search' | 'cart' | 'wish' | 'me'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: '홈', icon: HouseIcon },
  { id: 'search', label: '검색', icon: SearchIcon },
  { id: 'cart', label: '장바구니', icon: ShoppingBagIcon },
  { id: 'wish', label: '찜', icon: HeartIcon },
  { id: 'me', label: '내 정보', icon: UserIcon },
]

const GOODS = ['머그컵', '원두 1kg', '드립 포트', '필터 100매']

function TabScreen({ tab, cart, onAdd }: { tab: Tab; cart: number; onAdd: (name: string) => void }) {
  if (tab === 'home') {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 p-3 text-xs font-medium text-orange-900 dark:from-amber-500/20 dark:to-orange-500/25 dark:text-orange-100">
          이번 주 원두 20% 할인
        </div>
        <p className="text-xs font-medium text-muted-foreground">오늘의 추천</p>
        <ul className="grid grid-cols-2 gap-2">
          {GOODS.map((name) => (
            <li key={name} className="flex flex-col gap-1.5 rounded-lg border p-2">
              <div aria-hidden className="aspect-[4/3] rounded bg-muted" />
              <p className="truncate text-xs font-medium">{name}</p>
              <Button size="xs" variant="outline" onClick={() => onAdd(name)} aria-label={`${name} 담기`}>
                담기
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (tab === 'search') {
    return (
      <div className="flex flex-col gap-3">
        <div aria-hidden className="flex h-9 items-center gap-2 rounded-full bg-muted px-3 text-xs text-muted-foreground">
          <SearchIcon className="size-3.5" />
          무엇을 찾으세요?
        </div>
        <p className="text-xs font-medium text-muted-foreground">인기 검색어</p>
        <div className="flex flex-wrap gap-1.5">
          {['콜드브루', '디카페인', '텀블러', '핸드밀'].map((t) => (
            <span key={t} className="rounded-full border px-2.5 py-1 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>
    )
  }
  if (tab === 'cart') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">담은 상품 {cart}개</p>
        {cart === 0 && <p className="py-8 text-center text-sm text-muted-foreground">장바구니가 비었어요</p>}
        <ul className="flex flex-col gap-2">
          {Array.from({ length: Math.min(cart, 4) }, (_, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-lg border p-2">
              <div aria-hidden className="size-9 shrink-0 rounded bg-muted" />
              <span className="flex-1 text-xs font-medium">{GOODS[i % GOODS.length]}</span>
            </li>
          ))}
        </ul>
        {cart > 4 && <p className="text-xs text-muted-foreground">외 {cart - 4}개</p>}
      </div>
    )
  }
  if (tab === 'wish') {
    return (
      <ul className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} aria-hidden className="relative aspect-square rounded-lg bg-muted">
            <HeartIcon className="absolute right-1.5 bottom-1.5 size-3.5 fill-red-500 text-red-500" />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted text-sm font-semibold">
          하
        </span>
        <div>
          <p className="text-sm font-medium">김하늘</p>
          <p className="text-xs text-muted-foreground">단골 등급</p>
        </div>
      </div>
      <ul className="divide-y rounded-lg border text-xs">
        {['주문 내역', '쿠폰', '설정'].map((t) => (
          <li key={t} className="flex items-center justify-between px-3 py-2.5">
            {t}
            <ChevronRightIcon aria-hidden className="size-3.5 text-muted-foreground" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Four or five top destinations always in reach of the thumb. */
export function BottomTabFormat() {
  const [tab, setTab] = useState<Tab>('home')
  const [cart, setCart] = useState(2)
  const [note, setNote] = useState('')
  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center border-b px-4">
          <p className="text-sm font-semibold">{current.label}</p>
        </header>
        <div key={tab} className="min-h-0 flex-1 overflow-y-auto p-3 motion-safe:animate-in motion-safe:fade-in-0">
          <TabScreen
            tab={tab}
            cart={cart}
            onAdd={(name) => {
              setCart((c) => c + 1)
              setNote(`${name} 담음`)
            }}
          />
        </div>
        <nav aria-label="하단 탭" className="shrink-0 border-t bg-background pb-2">
          <ul className="grid grid-cols-5">
            {TABS.map((t) => {
              const count = t.id === 'cart' ? cart : 0
              return (
                <li key={t.id}>
                  <TabBarItem
                    icon={t.icon}
                    label={t.label}
                    name={count > 0 ? `${t.label}, ${count}개 담김` : undefined}
                    count={count}
                    selected={t.id === tab}
                    onSelect={() => {
                      setTab(t.id)
                      setNote('')
                    }}
                  />
                </li>
              )
            })}
          </ul>
        </nav>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        현재 탭: {current.label} · 장바구니 {cart}개{note && ` · ${note}`}
      </p>
    </div>
  )
}

type Booking = { place: string; date: string; status: string }

const BOOKINGS: Booking[] = [
  { place: '제주 바다숙소', date: '12월 3일 · 2박', status: 'pending' },
  { place: '강릉 솔밭 캠핑', date: '12월 10일 · 1박', status: 'confirmed' },
  { place: '서울 루프탑 카페', date: '12월 14일 · 오후 2시', status: 'pending' },
  { place: '부산 요트 투어', date: '12월 21일 · 오전 10시', status: 'confirmed' },
  { place: '경주 한옥 스테이', date: '11월 2일 · 1박', status: 'used' },
  { place: '여수 밤바다 투어', date: '10월 18일', status: 'cancelled' },
  { place: '전주 한복 대여', date: '10월 5일', status: 'refunded' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: '예약 중',
  confirmed: '예약 완료',
  used: '이용 완료',
  cancelled: '취소',
  refunded: '환불',
}

const FEW_TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '예약 중' },
  { id: 'confirmed', label: '예약 완료' },
]

const MANY_TABS = [
  ...FEW_TABS,
  { id: 'used', label: '이용 완료' },
  { id: 'cancelled', label: '취소' },
  { id: 'refunded', label: '환불' },
  { id: 'review', label: '리뷰 쓰기' },
  { id: 'saved', label: '찜한 곳' },
]

const bookingsFor = (tab: string) => (tab === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === tab))

/** Tabs under the app bar; the line follows the chosen tab, and the content can be swiped. */
export function TopTabsFormat() {
  const [many, setMany] = useState(false)
  const [tab, setTab] = useState('all')
  const [direction, setDirection] = useState(1)
  const [how, setHow] = useState('')
  const tabs = many ? MANY_TABS : FEW_TABS
  const index = tabs.findIndex((t) => t.id === tab)
  const listRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)
  const swipeFrom = useRef<number | null>(null)

  // slide the line under the chosen tab and, when the row scrolls, bring that tab into the middle
  useLayoutEffect(() => {
    const list = listRef.current
    const line = lineRef.current
    const chosen = list?.querySelector<HTMLElement>('[data-state="active"]')
    if (!list || !line || !chosen) return
    line.style.width = `${chosen.offsetWidth}px`
    line.style.transform = `translateX(${chosen.offsetLeft}px)`
    list.scrollLeft = chosen.offsetLeft - (list.clientWidth - chosen.offsetWidth) / 2
  }, [tab, many])

  const choose = (next: number, way: string) => {
    if (next < 0 || next >= tabs.length) {
      setHow(next < 0 ? '첫 탭이라 더 갈 곳이 없어요' : '마지막 탭이라 더 갈 곳이 없어요')
      return
    }
    if (next === index) return
    setDirection(next > index ? 1 : -1)
    setTab(tabs[next].id)
    setHow(way)
  }

  const endSwipe = (event: PointerEvent) => {
    if (swipeFrom.current === null) return
    const dx = event.clientX - swipeFrom.current
    swipeFrom.current = null
    if (Math.abs(dx) >= 40) choose(dx < 0 ? index + 1 : index - 1, '밀어서 바꿈')
  }

  const shown = bookingsFor(tab)

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="탭 개수"
        value={many ? 'many' : 'few'}
        onValueChange={(v) => {
          if (!v) return
          setMany(v === 'many')
          if (v === 'few' && !FEW_TABS.some((t) => t.id === tab)) setTab('all')
          setHow('')
        }}
      >
        <ToggleGroupItem value="few" className="px-3">
          탭 3개
        </ToggleGroupItem>
        <ToggleGroupItem value="many" className="px-3">
          탭 8개 (스크롤)
        </ToggleGroupItem>
      </ToggleGroup>

      <PhoneFrame>
        <TabsPrimitive.Root
          value={tab}
          onValueChange={(v) => choose(tabs.findIndex((t) => t.id === v), '눌러서 바꿈')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="flex h-11 shrink-0 items-center px-4">
            <p className="text-sm font-semibold">예약 내역</p>
          </header>
          <TabsPrimitive.List
            ref={listRef}
            aria-label="예약 상태"
            className="relative flex shrink-0 overflow-x-auto scroll-smooth border-b [scrollbar-width:none]"
          >
            {tabs.map((t) => (
              <TabsPrimitive.Trigger
                key={t.id}
                value={t.id}
                className={cn(
                  'h-10 text-sm whitespace-nowrap text-muted-foreground outline-none focus-visible:bg-muted data-[state=active]:font-semibold data-[state=active]:text-foreground',
                  many ? 'shrink-0 px-3.5' : 'flex-1',
                )}
              >
                {t.label}
              </TabsPrimitive.Trigger>
            ))}
            <span
              ref={lineRef}
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground transition-[transform,width] duration-300 motion-reduce:transition-none"
            />
          </TabsPrimitive.List>
          <div
            data-testid="swipe-area"
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto select-none"
            onPointerDown={(event) => {
              swipeFrom.current = event.clientX
            }}
            onPointerUp={endSwipe}
            onPointerCancel={() => {
              swipeFrom.current = null
            }}
          >
            <TabsPrimitive.Content
              key={tab}
              value={tab}
              className={cn(
                'flex flex-col gap-2 p-3 outline-none motion-safe:animate-in motion-safe:fade-in-0',
                direction > 0 ? 'motion-safe:slide-in-from-right-8' : 'motion-safe:slide-in-from-left-8',
              )}
            >
              {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">이 탭에는 아직 없어요</p>}
              <ul className="flex flex-col gap-2">
                {shown.map((b) => (
                  <li key={b.place} className="flex items-center gap-2.5 rounded-lg border p-2.5">
                    <div aria-hidden className="size-10 shrink-0 rounded-md bg-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{b.place}</p>
                      <p className="text-[11px] text-muted-foreground">{b.date}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px]">{STATUS_LABEL[b.status]}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-center text-[11px] text-muted-foreground">← 옆으로 밀어서 탭 바꾸기 →</p>
            </TabsPrimitive.Content>
          </div>
        </TabsPrimitive.Root>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        현재 탭: {tabs[index].label} ({shown.length}건){how && ` · ${how}`}
      </p>
    </div>
  )
}

/** The tab bar as it appears in the anatomy drawing. */
export function TabBarDrawing({ slots = false }: { slots?: boolean }) {
  return (
    <nav aria-label="하단 탭 그림" {...slotProps(slots, 'mobile-tab-bar')} className="shrink-0 border-t bg-background pb-1.5">
      <ul className="grid grid-cols-4">
        {TABS.filter((t) => t.id !== 'wish').map((t, i) => (
          <li key={t.id}>
            <TabBarItem drawing icon={t.icon} label={t.label} selected={i === 1} count={t.id === 'cart' ? 2 : 0} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
