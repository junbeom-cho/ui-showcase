import { useLayoutEffect, useRef, useState } from 'react'
import { CheckIcon, MoreHorizontalIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch } from './frames'
import { navItemClass, stay } from './parts'

const SECTIONS = [
  { id: 'info', label: '상세 정보', path: '' },
  { id: 'reviews', label: '리뷰 128', path: '/reviews' },
  { id: 'qna', label: '문의', path: '/qna' },
  { id: 'delivery', label: '배송·교환', path: '/delivery' },
]

const SETTINGS_TABS = [
  { id: 'general', label: '일반', lines: 3 },
  { id: 'alerts', label: '알림', lines: 4 },
  { id: 'privacy', label: '개인정보', lines: 2 },
]

/** 7. Links that look like tabs: each one is its own page with its own address. */
export function TabNavFormat() {
  // every link click is a real navigation, so it leaves a history entry the back button can return to
  const [history, setHistory] = useState(['info'])
  const [panel, setPanel] = useState('general')
  const [note, setNote] = useState('위는 주소가 바뀌는 탭 내비게이션, 아래는 주소가 그대로인 탭입니다.')
  const current = SECTIONS.find((s) => s.id === history[history.length - 1])!
  const url = `shop.example/products/12${current.path}`

  const go = (id: string) => {
    if (id === current.id) return
    const next = SECTIONS.find((s) => s.id === id)!
    setHistory((h) => [...h, id])
    setNote(`링크 ‘${next.label}’: 주소가 /products/12${next.path}로 바뀌었습니다. 뒤로 가기로 돌아올 수 있어요.`)
  }

  const back = () => {
    const prev = SECTIONS.find((s) => s.id === history[history.length - 2])!
    setHistory((h) => h.slice(0, -1))
    setNote(`뒤로 가기: ‘${prev.label}’ 페이지로 돌아왔습니다.`)
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">① 탭 내비게이션 — 링크, 주소가 바뀜</p>
        <BrowserFrame url={url} onBack={back} canGoBack={history.length > 1}>
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div aria-hidden className="size-12 shrink-0 rounded-lg bg-muted" />
            <div>
              <p className="text-sm font-semibold">핸드드립 세트</p>
              <p className="text-xs text-muted-foreground">32,000원</p>
            </div>
          </div>
          <nav aria-label="상품 정보" className="no-scrollbar overflow-x-auto border-b px-2">
            <ul className="flex h-12 items-center">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href="#"
                    aria-current={s.id === current.id ? 'page' : undefined}
                    onClick={(event) => {
                      stay(event)
                      go(s.id)
                    }}
                    className={navItemClass}
                  >
                    {s.label}
                    {s.id === current.id && (
                      <span aria-hidden className="absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-foreground" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div key={current.id} className="flex flex-col gap-2 p-4 motion-safe:animate-in motion-safe:fade-in-0">
            <p className="text-sm font-medium">{current.label.replace(/ \d+$/, '')}</p>
            <ContentSketch rows={3} />
          </div>
        </BrowserFrame>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">② 탭 (Tabs) — 같은 페이지 안에서 내용만 바뀜</p>
        <div className="rounded-xl border bg-background p-4">
          <Tabs
            value={panel}
            onValueChange={(v) => {
              setPanel(v)
              const tab = SETTINGS_TABS.find((t) => t.id === v)!
              setNote(`탭 ‘${tab.label}’: 같은 페이지에서 내용만 바꿨습니다. 주소와 방문 기록은 그대로예요.`)
            }}
          >
            <TabsList aria-label="설정">
              {SETTINGS_TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SETTINGS_TABS.map((t) => (
              <TabsContent key={t.id} value={t.id} className="pt-3">
                <ContentSketch rows={t.lines} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {note} <span className="block text-xs">방문 기록 {history.length}개</span>
      </p>
    </div>
  )
}

const CHANNELS = ['홈', '뉴스', '스포츠', '연예', '경제', 'IT', '날씨', '여행', '문화']
// fixed widths keep the fitting arithmetic exact; three Korean letters fit in 64px
const ITEM_WIDTH = 64
const MORE_WIDTH = 88
// the frame's 1px borders and the bar's 8px side padding
const BAR_PADDING = 18

/** How many items fit in `width`, keeping room for the 더보기 button when some do not. */
export function visibleCount(width: number, total = CHANNELS.length) {
  const room = width - BAR_PADDING
  if (total * ITEM_WIDTH <= room) return total
  return Math.max(0, Math.floor((room - MORE_WIDTH) / ITEM_WIDTH))
}

/** 8. Items that no longer fit move into a "더보기" menu as the bar narrows. */
export function OverflowMenuFormat() {
  const [width, setWidth] = useState(480)
  const [measured, setMeasured] = useState(0)
  const [current, setCurrent] = useState('홈')
  const barRef = useRef<HTMLDivElement>(null)

  // the frame can be narrower than the slider asks for (small screens); use what it really got
  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return
    const read = () => setMeasured(el.clientWidth)
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const actual = measured > 0 ? Math.min(measured, width) : width
  const count = visibleCount(actual)
  const shown = CHANNELS.slice(0, count)
  const hidden = CHANNELS.slice(count)
  const currentHidden = hidden.includes(current)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex w-full max-w-sm items-center gap-3">
        <span className="shrink-0 text-sm font-medium">프레임 폭</span>
        <Slider
          min={240}
          max={680}
          step={8}
          value={[width]}
          onValueChange={([next]) => setWidth(next)}
          thumbLabel="프레임 폭"
        />
        <span className="w-14 shrink-0 text-right text-sm text-muted-foreground tabular-nums">{width}px</span>
      </div>

      <div ref={barRef} className="w-full">
        <div style={{ width }} className="max-w-full transition-[width] duration-150 motion-reduce:transition-none">
          <BrowserFrame url="news.example" className="h-64" bodyClassName="overflow-hidden">
            <nav aria-label="섹션" className="border-b px-2">
              <ul className="flex h-12 items-center">
                {shown.map((c) => (
                  <li key={c} className="w-16 shrink-0">
                    <a
                      href="#"
                      aria-current={c === current ? 'page' : undefined}
                      onClick={(event) => {
                        stay(event)
                        setCurrent(c)
                      }}
                      className={cn(navItemClass, 'w-full justify-center px-0')}
                    >
                      {c}
                      {c === current && (
                        <span aria-hidden className="absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-foreground" />
                      )}
                    </a>
                  </li>
                ))}
                {hidden.length > 0 && (
                  <li className="w-[88px] shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={currentHidden ? `더보기, 현재 페이지 ${current} 포함` : '더보기'}
                        className={cn(
                          navItemClass,
                          'w-full justify-center gap-1 px-0 aria-expanded:bg-muted',
                          currentHidden && 'font-medium text-foreground',
                        )}
                      >
                        더보기
                        <MoreHorizontalIcon aria-hidden className="size-4" />
                        {currentHidden && (
                          <span aria-hidden className="absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-foreground" />
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {hidden.map((c) => (
                          <DropdownMenuItem key={c} aria-current={c === current ? 'page' : undefined} onSelect={() => setCurrent(c)}>
                            <span className="flex-1">{c}</span>
                            {c === current && <CheckIcon aria-hidden />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )}
              </ul>
            </nav>
            <div className="flex flex-col gap-3 p-4">
              <p className="text-base font-semibold">{current}</p>
              <ContentSketch rows={3} />
            </div>
          </BrowserFrame>
        </div>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        보이는 메뉴 {shown.length}개 · 더보기 안에 {hidden.length}개{hidden.length > 0 && ` (${hidden.join(', ')})`} · 현재:{' '}
        {current}
      </p>
    </div>
  )
}
