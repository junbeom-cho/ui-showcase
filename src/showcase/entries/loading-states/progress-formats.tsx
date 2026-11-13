import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircleIcon, PiggyBankIcon, RotateCcwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch } from '../navigation-patterns/frames'

/**
 * A circle that fills clockwise from the top. No `value` means unknown length:
 * a quarter arc spins instead (it stands still with reduced motion).
 */
function ProgressRing({
  value,
  max = 100,
  label,
  valueText,
  size = 112,
  stroke = 10,
  className,
  children,
}: {
  value?: number
  max?: number
  label: string
  valueText?: string
  size?: number
  stroke?: number
  className?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const known = value !== undefined
  const fraction = known ? Math.min(1, value / max) : 0.25

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={known ? 0 : undefined}
      aria-valuemax={known ? max : undefined}
      aria-valuenow={value}
      aria-valuetext={known ? valueText : undefined}
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${size} ${size}`}
        className={cn('absolute inset-0 -rotate-90', !known && 'motion-safe:animate-spin')}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
        <circle
          data-slot="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={cn(known && 'motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500')}
        />
      </svg>
      <div className="relative flex flex-col items-center text-center">{children}</div>
    </div>
  )
}

const GOAL = 5
const PREPARE_MS = 1200
const BACKUP_TICK = 100
const BACKUP_STEP = 5

/** 9. A circle that fills: a count toward a goal, and a backup that first prepares, then counts. */
export function ProgressRingFormat() {
  const [saved, setSaved] = useState(4)
  // null: not started · 'preparing': unknown length · number: percent
  const [backup, setBackup] = useState<null | 'preparing' | number>(null)
  const running = backup === 'preparing' || (typeof backup === 'number' && backup < 100)

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(
      () => setBackup((b) => (b === 'preparing' ? 0 : Math.min(100, (b ?? 0) + BACKUP_STEP))),
      backup === 'preparing' ? PREPARE_MS : BACKUP_TICK,
    )
    return () => window.clearTimeout(timer)
  }, [running, backup])

  const percent = Math.round((saved / GOAL) * 100)
  const reached = saved === GOAL

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-label="이번 달 저축" className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
          <p className="text-sm font-medium">이번 달 저축 목표</p>
          <ProgressRing
            label="이번 달 저축 목표"
            value={saved}
            max={GOAL}
            valueText={`${GOAL}회 중 ${saved}회`}
            className={reached ? 'text-emerald-500' : 'text-primary'}
          >
            <span className="text-2xl font-semibold text-foreground tabular-nums">{percent}%</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {saved}/{GOAL}회
            </span>
          </ProgressRing>
          <div className="flex gap-2">
            <Button size="sm" disabled={reached} onClick={() => setSaved((n) => n + 1)}>
              <PiggyBankIcon data-icon="inline-start" />
              저축하기
            </Button>
            <Button size="sm" variant="ghost" aria-label="저축 처음으로" disabled={saved === 0} onClick={() => setSaved(0)}>
              <RotateCcwIcon />
            </Button>
          </div>
        </section>

        <section
          aria-label="사진 백업"
          aria-busy={running}
          className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4"
        >
          <p className="text-sm font-medium">사진 백업</p>
          <ProgressRing
            label="사진 백업"
            value={typeof backup === 'number' ? backup : backup === null ? 0 : undefined}
            valueText={typeof backup === 'number' ? `${backup}%` : '시작 전'}
            className="text-primary"
          >
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {backup === 'preparing' ? '준비 중' : `${backup ?? 0}%`}
            </span>
          </ProgressRing>
          <Button size="sm" variant="outline" disabled={running} onClick={() => setBackup('preparing')}>
            {backup === null ? '백업 시작' : '다시 백업'}
          </Button>
        </section>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {reached ? '이번 달 목표를 채웠습니다. ' : `목표까지 ${GOAL - saved}회 남았습니다. `}
        {backup === null && '백업은 시작 전입니다.'}
        {backup === 'preparing' && '백업할 사진을 세는 중… 얼마나 걸릴지 아직 모릅니다.'}
        {typeof backup === 'number' && backup < 100 && `사진 백업 ${backup}%`}
        {backup === 100 && '사진 백업을 마쳤습니다.'}
      </p>
    </div>
  )
}

type PageId = 'home' | 'products' | 'support' | 'event'
type Speed = 'fast' | 'slow' | 'fail'

const PAGES: Record<PageId, { title: string; url: string }> = {
  home: { title: '홈', url: 'shop.example.com' },
  products: { title: '상품', url: 'shop.example.com/products' },
  support: { title: '고객센터', url: 'shop.example.com/support' },
  event: { title: '이벤트', url: 'shop.example.com/event' },
}

const LINKS: { to: PageId; speed: Speed; hint: string }[] = [
  { to: 'products', speed: 'fast', hint: '빠름' },
  { to: 'support', speed: 'slow', hint: '느림' },
  { to: 'event', speed: 'fail', hint: '실패' },
]

/** how long each kind of navigation takes before it lands or fails */
const NAV_MS: Record<Speed, number> = { fast: 600, slow: 4000, fail: 1500 }
const TRICKLE_MS = 200
/** the bar creeps toward this while waiting, and only the answer takes it to 100 */
const CREEP_TO = 90

type Bar = { percent: number; failed: boolean; fading: boolean }
type Nav = { to: PageId; speed: Speed }

/** 10. A thin bar along the top of the page while the next page loads (NProgress, YouTube). */
export function TopLoadingBarFormat() {
  const [page, setPage] = useState<PageId>('home')
  const [nav, setNav] = useState<Nav | null>(null)
  const [bar, setBar] = useState<Bar | null>(null)
  const [message, setMessage] = useState('위 메뉴를 눌러 다른 페이지로 가 보세요.')
  const [error, setError] = useState<string | null>(null)

  const go = (to: PageId, speed: Speed) => {
    setNav({ to, speed })
    setError(null)
    setBar({ percent: 8, failed: false, fading: false })
    setMessage(`${PAGES[to].title} 페이지를 여는 중…`)
  }

  // creep toward 90% in ever smaller steps until the page answers
  useEffect(() => {
    if (!nav) return
    const trickle = window.setInterval(
      () => setBar((b) => b && { ...b, percent: b.percent + (CREEP_TO - b.percent) * 0.15 }),
      TRICKLE_MS,
    )
    const land = window.setTimeout(() => {
      window.clearInterval(trickle)
      const failed = nav.speed === 'fail'
      setBar({ percent: 100, failed, fading: false })
      setNav(null)
      if (failed) {
        setError(`${PAGES[nav.to].title} 페이지를 열지 못했습니다. 지금 페이지에 그대로 있습니다.`)
        setMessage(`${PAGES[nav.to].title} 페이지를 열지 못했습니다.`)
      } else {
        setPage(nav.to)
        setMessage(`${PAGES[nav.to].title} 페이지를 열었습니다.`)
      }
    }, NAV_MS[nav.speed])
    return () => {
      window.clearInterval(trickle)
      window.clearTimeout(land)
    }
  }, [nav])

  // at 100% the bar stays a moment, fades, then goes away
  const finished = bar?.percent === 100
  useEffect(() => {
    if (!finished) return
    const fade = window.setTimeout(() => setBar((b) => b && { ...b, fading: true }), 250)
    const hide = window.setTimeout(() => setBar(null), 650)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(hide)
    }
  }, [finished])

  const current = PAGES[page]

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url={nav ? PAGES[nav.to].url : current.url} bodyClassName="h-64">
        {bar && (
          <div
            role="progressbar"
            aria-label="페이지 불러오는 중"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(bar.percent)}
            data-state={bar.failed ? 'failed' : bar.percent === 100 ? 'complete' : 'loading'}
            className={cn(
              'absolute inset-x-0 top-0 z-10 h-0.5 transition-opacity duration-300',
              bar.fading && 'opacity-0',
            )}
          >
            <div
              className={cn(
                'h-full rounded-r-full transition-[width] duration-200 ease-out',
                bar.failed ? 'bg-destructive' : 'bg-primary shadow-[0_0_8px] shadow-primary/60',
              )}
              style={{ width: `${bar.percent}%` }}
            />
          </div>
        )}
        <nav aria-label="사이트 메뉴" className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
          <Button
            size="xs"
            variant={page === 'home' ? 'secondary' : 'ghost'}
            aria-current={page === 'home' ? 'page' : undefined}
            onClick={() => go('home', 'fast')}
          >
            홈
          </Button>
          {LINKS.map((link) => (
            <Button
              key={link.to}
              size="xs"
              variant={page === link.to ? 'secondary' : 'ghost'}
              aria-current={page === link.to ? 'page' : undefined}
              onClick={() => go(link.to, link.speed)}
            >
              {PAGES[link.to].title}
              <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">{link.hint}</span>
            </Button>
          ))}
        </nav>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
            <AlertCircleIcon aria-hidden className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
        {/* the old page stays readable while the next one loads */}
        <div aria-busy={nav !== null} className="flex flex-col gap-3 p-4">
          <h3 className="text-base font-semibold">{current.title}</h3>
          <ContentSketch rows={4} />
        </div>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
