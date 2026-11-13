import { useState } from 'react'
import {
  CalendarIcon,
  CheckSquareIcon,
  ChevronRightIcon,
  FolderIcon,
  HeartIcon,
  HouseIcon,
  MailIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingBagIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch, PhoneFrame } from './frames'
import { NavBadge, stay } from './parts'

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

/** 3. Four or five top destinations always in reach of the thumb. */
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
              const selected = t.id === tab
              const count = t.id === 'cart' ? cart : 0
              return (
                <li key={t.id}>
                  <a
                    href="#"
                    aria-current={selected ? 'page' : undefined}
                    aria-label={count > 0 ? `${t.label}, ${count}개 담김` : undefined}
                    onClick={(event) => {
                      stay(event)
                      setTab(t.id)
                      setNote('')
                    }}
                    className={cn(
                      'flex flex-col items-center gap-0.5 pt-2 pb-1 text-[10px] text-muted-foreground outline-none focus-visible:bg-muted',
                      selected && 'font-semibold text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'relative grid h-7 w-11 place-items-center rounded-full transition-colors motion-reduce:transition-none',
                        selected && 'bg-muted',
                      )}
                    >
                      <t.icon aria-hidden className={cn('size-5', selected && 'stroke-[2.4]')} />
                      {count > 0 && <NavBadge count={count} className="absolute -top-1 right-0.5 ring-2 ring-background" />}
                    </span>
                    {t.label}
                  </a>
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

type RailPage = { id: string; label: string; icon: LucideIcon; badge?: number }

const RAIL_PAGES: RailPage[] = [
  { id: 'mail', label: '메일', icon: MailIcon, badge: 12 },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'contacts', label: '연락처', icon: UsersIcon },
  { id: 'tasks', label: '할 일', icon: CheckSquareIcon },
  { id: 'files', label: '파일', icon: FolderIcon },
]

const SETTINGS: RailPage = { id: 'settings', label: '설정', icon: SettingsIcon }

/** 4. A narrow strip of icons on the left that widens to show its labels. */
export function SideRailFormat() {
  const [expanded, setExpanded] = useState(false)
  const [current, setCurrent] = useState('mail')
  const page = [...RAIL_PAGES, SETTINGS].find((p) => p.id === current)!

  const item = (p: RailPage) => {
    const selected = p.id === current
    return (
      <li key={p.id}>
        <a
          href="#"
          aria-current={selected ? 'page' : undefined}
          aria-label={p.badge ? `${p.label}, 읽지 않음 ${p.badge}개` : undefined}
          onClick={(event) => {
            stay(event)
            setCurrent(p.id)
          }}
          className={cn(
            'group/rail relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            selected && 'bg-foreground/10 font-medium text-foreground',
          )}
        >
          <span className="relative shrink-0">
            <p.icon aria-hidden className="size-[18px]" />
            {p.badge && !expanded && <NavBadge className="absolute -top-0.5 -right-0.5 ring-2 ring-muted" />}
          </span>
          <span className={cn('flex-1 truncate', !expanded && 'sr-only')}>{p.label}</span>
          {p.badge && expanded && <NavBadge count={p.badge} />}
          {!expanded && (
            // a label that appears beside the icon on hover or focus; the link already has the name
            <span
              aria-hidden
              className="pointer-events-none absolute left-full z-20 ml-2 hidden rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background group-hover/rail:block group-focus-visible/rail:block"
            >
              {p.label}
            </span>
          )}
        </a>
      </li>
    )
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url="work.example/mail" className="h-80" bodyClassName="flex-row">
        <nav
          aria-label="앱 메뉴"
          className={cn(
            'flex shrink-0 flex-col gap-1 border-r bg-muted/60 p-2 transition-[width] duration-200 motion-reduce:transition-none',
            expanded ? 'w-44' : 'w-[3.75rem]',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? '레일 접기' : '레일 펼치기'}
            className="ml-1 text-muted-foreground"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
          </Button>
          <ul className="flex flex-col gap-1">{RAIL_PAGES.map(item)}</ul>
          <ul className="mt-auto flex flex-col">{item(SETTINGS)}</ul>
        </nav>
        <main className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <p className="text-lg font-semibold">{page.label}</p>
          <ContentSketch rows={5} />
        </main>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        현재: {page.label} · 레일 {expanded ? '펼침 (아이콘과 이름)' : '접힘 (아이콘만)'}
      </p>
    </div>
  )
}
