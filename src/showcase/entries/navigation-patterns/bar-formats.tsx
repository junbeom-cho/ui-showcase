import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  BarChart3Icon,
  BriefcaseIcon,
  Building2Icon,
  ChevronDownIcon,
  CodeIcon,
  FileTextIcon,
  HeartIcon,
  HouseIcon,
  LogOutIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageSquareIcon,
  PackageIcon,
  PaletteIcon,
  PresentationIcon,
  RocketIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
  VideoIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch, PhoneFrame } from './frames'
import { Logo, NavBadge, NavItem, stay } from './parts'

const SITE_LINKS = [
  { id: 'home', label: '홈', path: '' },
  { id: 'features', label: '기능', path: 'features' },
  { id: 'pricing', label: '요금제', path: 'pricing' },
  { id: 'blog', label: '블로그', path: 'blog' },
  { id: 'support', label: '고객 지원', path: 'support' },
]

/** 1. Logo, links and actions in one bar; below 576px of width the links fold into ☰. */
export function TopNavFormat() {
  const [width, setWidth] = useState<'wide' | 'narrow'>('wide')
  const [current, setCurrent] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const page = SITE_LINKS.find((l) => l.id === current)!

  const go = (id: string) => {
    setCurrent(id)
    setMenuOpen(false)
  }

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !menuOpen) return
    setMenuOpen(false)
    menuButton.current?.focus()
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="화면 폭"
        value={width}
        onValueChange={(v) => {
          if (!v) return
          setWidth(v as 'wide' | 'narrow')
          setMenuOpen(false)
        }}
      >
        <ToggleGroupItem value="wide" className="px-3">
          넓은 화면
        </ToggleGroupItem>
        <ToggleGroupItem value="narrow" className="px-3">
          좁은 화면
        </ToggleGroupItem>
      </ToggleGroup>

      <BrowserFrame
        url={`moa.example/${page.path}`}
        className={cn(
          'h-80 transition-[max-width] duration-300 motion-reduce:transition-none',
          width === 'wide' ? 'max-w-2xl' : 'max-w-[21rem]',
        )}
      >
        {/* the bar answers to the width of this frame, not of the whole window */}
        <div className="@container flex h-full flex-col" onKeyDown={closeOnEscape}>
          <header className="relative z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
            <Logo />
            <nav aria-label="주 메뉴" className="flex min-w-0 flex-1 items-center">
              <ul aria-label="메뉴 링크" className="hidden items-center gap-0.5 @xl:flex">
                {SITE_LINKS.map((l) => (
                  <li key={l.id}>
                    <NavItem current={l.id === current} onSelect={() => go(l.id)}>
                      {l.label}
                    </NavItem>
                  </li>
                ))}
              </ul>
              <Button
                ref={menuButton}
                variant="ghost"
                size="icon-sm"
                aria-label="메뉴"
                aria-expanded={menuOpen}
                aria-controls={panelId}
                className="ml-auto @xl:hidden"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <XIcon /> : <MenuIcon />}
              </Button>
              {menuOpen && (
                <div
                  id={panelId}
                  className="absolute inset-x-0 top-full flex flex-col gap-1 border-b bg-background p-2 shadow-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 @xl:hidden"
                >
                  <ul aria-label="접힌 메뉴" className="flex flex-col">
                    {SITE_LINKS.map((l) => (
                      <li key={l.id}>
                        <a
                          href="#"
                          aria-current={l.id === current ? 'page' : undefined}
                          onClick={(event) => {
                            stay(event)
                            go(l.id)
                          }}
                          className="flex h-10 items-center rounded-md px-3 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1 grid grid-cols-2 gap-2 border-t px-1 pt-2">
                    <Button variant="outline" size="sm">
                      로그인
                    </Button>
                    <Button size="sm">시작하기</Button>
                  </div>
                </div>
              )}
            </nav>
            <div className="hidden shrink-0 items-center gap-1.5 @xl:flex">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
              <Button size="sm">시작하기</Button>
            </div>
          </header>
          <main className={cn('flex flex-1 flex-col gap-3 p-5', menuOpen && 'opacity-40')}>
            <p className="text-lg font-semibold">{page.label}</p>
            <ContentSketch rows={4} />
          </main>
        </div>
      </BrowserFrame>

      <p role="status" className="self-start text-sm text-muted-foreground">
        현재 페이지: {page.label} · {width === 'wide' ? '넓은 화면' : '좁은 화면'}
        {menuOpen && ' · ☰ 메뉴 펼침'}
      </p>
    </div>
  )
}

const DRAWER_PAGES: { id: string; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: 'home', label: '홈', icon: HouseIcon },
  { id: 'orders', label: '주문 내역', icon: PackageIcon },
  { id: 'wish', label: '찜한 상품', icon: HeartIcon },
  { id: 'coupons', label: '쿠폰', icon: TicketIcon, badge: 2 },
  { id: 'settings', label: '설정', icon: SettingsIcon },
]

/** 2. ☰ slides a panel in over the screen; focus goes in, Esc or the backdrop closes it. */
export function HamburgerFormat() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('home')
  const [closedBy, setClosedBy] = useState('')
  const menuButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const returnFocus = useRef(false)
  const page = DRAWER_PAGES.find((p) => p.id === current)!

  useEffect(() => {
    if (open) {
      // start where the reader is: on the current page's link
      panel.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus()
    } else if (returnFocus.current) {
      returnFocus.current = false
      menuButton.current?.focus()
    }
  }, [open])

  const close = (how: string) => {
    returnFocus.current = true
    setOpen(false)
    setClosedBy(how)
  }

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close('Esc 키로 닫음')
      return
    }
    if (event.key !== 'Tab' || !panel.current) return
    // keep Tab inside the open panel
    const focusables = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <div inert={open} className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
            <Button
              ref={menuButton}
              variant="ghost"
              size="icon"
              aria-label="메뉴 열기"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </Button>
            <p className="text-sm font-semibold">{page.label}</p>
          </header>
          <div key={current} className="flex flex-1 flex-col gap-3 p-4 motion-safe:animate-in motion-safe:fade-in-0">
            <div aria-hidden className="h-20 rounded-lg bg-muted" />
            <ContentSketch rows={5} />
          </div>
        </div>

        {open && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 z-10 bg-black/40 motion-safe:animate-in motion-safe:fade-in-0"
              onClick={() => close('바깥을 눌러 닫음')}
            />
            <div
              ref={panel}
              role="dialog"
              aria-label="메뉴"
              onKeyDown={onPanelKeyDown}
              className="absolute inset-y-0 left-0 z-20 flex w-[78%] flex-col bg-background shadow-xl motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
            >
              <div className="flex items-center gap-2.5 border-b px-3 py-3">
                <span aria-hidden className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                  하
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">김하늘</p>
                  <p className="truncate text-xs text-muted-foreground">sky@example.com</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="메뉴 닫기" onClick={() => close('닫기 버튼으로 닫음')}>
                  <XIcon />
                </Button>
              </div>
              <nav aria-label="앱 메뉴" className="flex-1 overflow-y-auto p-2">
                <ul className="flex flex-col gap-0.5">
                  {DRAWER_PAGES.map((p) => (
                    <li key={p.id}>
                      <a
                        href="#"
                        aria-current={p.id === current ? 'page' : undefined}
                        aria-label={p.badge ? `${p.label}, 새 쿠폰 ${p.badge}장` : undefined}
                        onClick={(event) => {
                          stay(event)
                          setCurrent(p.id)
                          close('항목을 골라 닫음')
                        }}
                        className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                      >
                        <p.icon aria-hidden className="size-4" />
                        <span className="flex-1">{p.label}</span>
                        {p.badge && <NavBadge count={p.badge} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                  <LogOutIcon data-icon="inline-start" />
                  로그아웃
                </Button>
              </div>
            </div>
          </>
        )}
      </PhoneFrame>

      <p role="status" className="self-start text-sm text-muted-foreground">
        현재 페이지: {page.label} · 메뉴 {open ? '열림' : '닫힘'}
        {!open && closedBy && ` (${closedBy})`}
      </p>
    </div>
  )
}

type MegaLink = { label: string; description: string; icon: LucideIcon }
type MegaMenu = {
  id: string
  label: string
  columns: { heading: string; links: MegaLink[] }[]
  promo: { title: string; text: string; cta: string }
}

const MEGA_MENUS: MegaMenu[] = [
  {
    id: 'products',
    label: '제품',
    columns: [
      {
        heading: '만들기',
        links: [
          { label: '문서', description: '함께 쓰고 고치는 글', icon: FileTextIcon },
          { label: '화이트보드', description: '포스트잇처럼 생각 펼치기', icon: PaletteIcon },
          { label: '프레젠테이션', description: '문서를 바로 발표 화면으로', icon: PresentationIcon },
        ],
      },
      {
        heading: '협업',
        links: [
          { label: '댓글과 멘션', description: '필요한 사람만 불러오기', icon: MessageSquareIcon },
          { label: '화상 회의', description: '문서를 띄운 채 회의', icon: VideoIcon },
          { label: '공유 링크', description: '바깥 사람과 안전하게', icon: UsersIcon },
        ],
      },
      {
        heading: '관리',
        links: [
          { label: '권한 관리', description: '팀·폴더별 보기와 편집', icon: ShieldCheckIcon },
          { label: '사용 통계', description: '누가 무엇을 얼마나 쓰나', icon: BarChart3Icon },
        ],
      },
    ],
    promo: { title: '새 기능: 회의록 자동 요약', text: '회의가 끝나면 할 일과 결정만 골라 정리해 줘요.', cta: '자세히 보기' },
  },
  {
    id: 'solutions',
    label: '솔루션',
    columns: [
      {
        heading: '팀별',
        links: [
          { label: '마케팅', description: '캠페인 일정과 자료를 한곳에', icon: MegaphoneIcon },
          { label: '개발', description: '기획서에서 출시 노트까지', icon: CodeIcon },
          { label: '디자인', description: '시안과 피드백 모으기', icon: PaletteIcon },
        ],
      },
      {
        heading: '규모별',
        links: [
          { label: '스타트업', description: '무료로 시작해 함께 크기', icon: RocketIcon },
          { label: '중견기업', description: '부서 간 협업과 결재', icon: BriefcaseIcon },
          { label: '대기업', description: '보안 인증과 전담 지원', icon: Building2Icon },
        ],
      },
    ],
    promo: { title: '고객 사례', text: '120명 팀이 회의 시간을 30% 줄인 방법을 읽어 보세요.', cta: '사례 읽기' },
  },
]

/** 6. A wide panel of grouped links and a promo, opened by click or keyboard. */
export function MegaMenuFormat() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const focusFirst = useRef(false)
  const panelId = useId()
  const open = MEGA_MENUS.find((m) => m.id === openId)

  // a click anywhere outside the bar and its panel closes it
  useEffect(() => {
    if (!openId) return
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openId])

  useEffect(() => {
    if (openId && focusFirst.current) {
      focusFirst.current = false
      document.getElementById(panelId)?.querySelector<HTMLElement>('a')?.focus()
    }
  }, [openId, panelId])

  const onTriggerKeyDown = (event: KeyboardEvent, id: string) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusFirst.current = true
      setOpenId(id)
    }
  }

  const onNavKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !openId) return
    const id = openId
    setOpenId(null)
    triggers.current[id]?.focus()
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <BrowserFrame url="moa.example" className="h-[26rem]">
        <nav
          ref={navRef}
          aria-label="주 메뉴"
          onKeyDown={onNavKeyDown}
          onBlur={(event) => {
            // tabbing out of the bar and its panel closes the panel
            if (!event.currentTarget.contains(event.relatedTarget as Node | null) && event.relatedTarget) setOpenId(null)
          }}
          className="@container relative z-10 border-b bg-background"
        >
          <div className="flex h-12 items-center gap-2 px-3">
            <Logo className="mr-2" />
            <ul className="flex min-w-0 items-center gap-0.5">
              {MEGA_MENUS.map((m) => (
                <li key={m.id}>
                  <button
                    ref={(el) => {
                      triggers.current[m.id] = el
                    }}
                    type="button"
                    aria-expanded={openId === m.id}
                    aria-controls={openId === m.id ? panelId : undefined}
                    onClick={() => setOpenId((o) => (o === m.id ? null : m.id))}
                    onKeyDown={(event) => onTriggerKeyDown(event, m.id)}
                    className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
                  >
                    {m.label}
                    <ChevronDownIcon
                      aria-hidden
                      className={cn('size-3.5 transition-transform motion-reduce:transition-none', openId === m.id && 'rotate-180')}
                    />
                  </button>
                </li>
              ))}
              <li className="hidden @md:block">
                <NavItem onSelect={() => setChosen('요금제')}>요금제</NavItem>
              </li>
            </ul>
            <Button size="sm" className="ml-auto">
              시작하기
            </Button>
          </div>

          {open && (
            <div
              id={panelId}
              className="absolute inset-x-0 top-full grid max-h-80 gap-4 overflow-y-auto border-b bg-background p-4 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 @lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))_minmax(0,1.15fr)]"
              style={{ '--cols': open.columns.length } as CSSProperties}
            >
              {open.columns.map((col) => (
                <section key={col.heading} aria-label={col.heading} className="flex flex-col gap-1">
                  <h4 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{col.heading}</h4>
                  <ul className="flex flex-col gap-0.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href="#"
                          onClick={(event) => {
                            stay(event)
                            setChosen(`${open.label} › ${link.label}`)
                            setOpenId(null)
                            triggers.current[open.id]?.focus()
                          }}
                          className="flex items-start gap-2.5 rounded-md p-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <link.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-medium">{link.label}</span>
                            <span className="text-xs text-muted-foreground">{link.description}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <aside
                aria-label="추천"
                className="flex flex-col justify-between gap-3 rounded-lg bg-gradient-to-br from-blue-50 to-violet-100 p-4 dark:from-blue-500/15 dark:to-violet-500/20"
              >
                <div className="flex flex-col gap-1.5">
                  <SparklesIcon aria-hidden className="size-5 text-violet-600 dark:text-violet-300" />
                  <p className="text-sm font-semibold">{open.promo.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{open.promo.text}</p>
                </div>
                <a
                  href="#"
                  onClick={(event) => {
                    stay(event)
                    setChosen(`${open.label} › ${open.promo.title}`)
                    setOpenId(null)
                    triggers.current[open.id]?.focus()
                  }}
                  className="text-sm font-medium underline underline-offset-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {open.promo.cta} →
                </a>
              </aside>
            </div>
          )}
        </nav>
        <main className="relative flex flex-1 flex-col gap-3 p-5">
          <p className="text-lg font-semibold">{chosen ? chosen.split(' › ').pop() : '함께 일하는 공간, 모아'}</p>
          <ContentSketch rows={4} />
          {open && <div aria-hidden className="absolute inset-0 bg-foreground/5" />}
        </main>
      </BrowserFrame>

      <p role="status" className="text-sm text-muted-foreground">
        {open ? `${open.label} 메뉴 열림 · ` : ''}
        {chosen ? `고른 메뉴: ${chosen}` : '아직 고른 메뉴 없음'}
      </p>
    </div>
  )
}
