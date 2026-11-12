import { useId } from 'react'
import { PlusIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { supportsRefraction } from './refraction'
import { StyleIcon, type IconName } from './style-icon'
import './styles/index.css'

/** Every data-slot inside the demo that a style trait may point at. */
export const DEMO_SLOTS = [
  'demo-backdrop',
  'demo-topbar',
  'demo-sidebar',
  'card',
  'avatar',
  'badge',
  'demo-name',
  'input',
  'demo-icon-search',
  'demo-icon-bell',
  'demo-icon-cloud',
  'demo-icon-storage',
  'switch',
  'switch-thumb',
  'progress',
  'progress-indicator',
  'demo-actions',
  'button',
] as const

const base = import.meta.env.BASE_URL

/** The four icons a style trait can point at, each with its own data-slot. */
function DemoIcon({ name, styleId }: { name: 'search' | 'bell' | 'cloud' | 'storage'; styleId: string }) {
  return <StyleIcon name={name} styleId={styleId} slot={`demo-icon-${name}`} />
}

/**
 * Displacement map for the glass edge. Red carries the horizontal shift, green the
 * vertical one; 50% grey means "no shift". Both stay grey in the middle and ramp
 * towards the edges so only a band along the border bends, pulling the backdrop
 * inward like a lens. The two ramps are combined with `screen`, which keeps each
 * channel as it is because the other one is zero.
 */
const EDGE_MAP =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="h" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#ff0000"/><stop offset="0.14" stop-color="#800000"/>
          <stop offset="0.86" stop-color="#800000"/><stop offset="1" stop-color="#000000"/>
        </linearGradient>
        <linearGradient id="v" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#00ff00"/><stop offset="0.14" stop-color="#008000"/>
          <stop offset="0.86" stop-color="#008000"/><stop offset="1" stop-color="#000000"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#h)"/>
      <rect width="200" height="200" fill="url(#v)" style="mix-blend-mode:screen"/>
    </svg>`,
  )

/**
 * SVG filter used by the liquid-glass CSS through backdrop-filter: url(#…).
 * Thumbnails may render it more than once; every copy is identical.
 */
function LiquidGlassFilter() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter
        id="liquid-glass-refraction"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feImage href={EDGE_MAP} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="edgeMap" />
        <feDisplacementMap in="SourceGraphic" in2="edgeMap" scale={44} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

const MENU: { label: string; icon: IconName }[] = [
  { label: '홈', icon: 'home' },
  { label: '프로젝트', icon: 'projects' },
  { label: '팀', icon: 'team' },
  { label: '설정', icon: 'settings' },
]

const STATS = [
  { label: '방문자', value: '12,480', change: '+8.2%' },
  { label: '가입', value: '342', change: '-2.1%' },
  { label: '매출', value: '₩4.2M', change: '+12.5%' },
]

const PROJECTS = [
  { name: '웹사이트 리뉴얼', status: '진행 중', progress: 64 },
  { name: '모바일 앱 출시', status: '검토 중', progress: 88 },
  { name: '브랜드 가이드', status: '완료', progress: 100 },
]

/**
 * One web-app dashboard drawn in every style (D-016). Only the CSS scoped by
 * data-design-style changes; content, layout and element count never do.
 * Layout reacts to the demo's own width (container queries), so a shrunken
 * thumbnail still shows the desktop arrangement.
 */
export function DemoApp({ styleId }: { styleId: string }) {
  const uid = useId()

  return (
    <div
      data-design-style={styleId}
      data-slot="demo-backdrop"
      data-refraction={supportsRefraction() ? 'on' : 'off'}
      className="@container w-full rounded-2xl p-3 text-sm @lg:p-5"
    >
      {styleId === 'liquid-glass' && <LiquidGlassFilter />}
      <div className="flex flex-col gap-4">
        <div
          data-slot="demo-topbar"
          className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5 text-card-foreground ring-1 ring-foreground/10"
        >
          <span className="hidden shrink-0 font-semibold @2xl:block">스튜디오</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 @2xl:max-w-xs">
            <DemoIcon name="search" styleId={styleId} />
            <Input aria-label="프로젝트 검색" placeholder="프로젝트 검색" />
          </div>
          <span className="relative ml-auto flex shrink-0" title="새 알림 3개">
            <DemoIcon name="bell" styleId={styleId} />
            <Badge className="absolute -top-2 -right-2.5 h-4 min-w-4 px-1 text-[10px]">3</Badge>
          </span>
          <Avatar>
            <AvatarImage src={`${base}avatar.svg`} alt="" />
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
          <p data-slot="demo-name" className="hidden font-semibold @lg:block">
            김하늘
          </p>
        </div>

        <div className="flex gap-4">
          <div
            data-slot="demo-sidebar"
            className="hidden w-40 shrink-0 flex-col gap-1 rounded-xl bg-card p-2 text-card-foreground ring-1 ring-foreground/10 @3xl:flex"
          >
            {MENU.map(({ label, icon }, i) => (
              <span
                key={label}
                data-slot="demo-nav-item"
                aria-current={i === 0 ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2',
                  i === 0 ? 'bg-foreground/[.06] font-semibold' : 'opacity-75',
                )}
              >
                <StyleIcon name={icon} styleId={styleId} decorative />
                {label}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">안녕하세요, 김하늘님</h3>
                <p className="opacity-75">이번 주 진행 상황입니다.</p>
              </div>
              <Button>
                <PlusIcon data-icon="inline-start" />새 프로젝트
              </Button>
            </div>

            <div className="grid gap-3 @lg:grid-cols-3">
              {STATS.map((s) => (
                <Card key={s.label} size="sm" className="px-4">
                  <div className="flex items-center justify-between">
                    <span className="opacity-75">{s.label}</span>
                    <Badge variant="outline">{s.change}</Badge>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 @4xl:grid-cols-[1.4fr_1fr]">
              <Card className="gap-3 px-5">
                <h4 className="font-semibold">최근 프로젝트</h4>
                <ul className="flex flex-col gap-3">
                  {PROJECTS.map((p) => (
                    <li key={p.name} aria-label={`${p.name} 프로젝트`} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary">{p.status}</Badge>
                      </div>
                      <Progress value={p.progress} aria-label={`${p.name} 진행률 ${p.progress}%`} />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="gap-4 px-5">
                <h4 className="font-semibold">설정</h4>
                <div className="flex items-center gap-3">
                  <Label htmlFor={`${uid}-notify`} className="flex-1">
                    알림 받기
                  </Label>
                  <Switch id={`${uid}-notify`} defaultChecked />
                </div>
                <div className="flex items-center gap-3">
                  <DemoIcon name="cloud" styleId={styleId} />
                  <Label htmlFor={`${uid}-backup`} className="flex-1">
                    자동 백업
                  </Label>
                  <Switch id={`${uid}-backup`} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <DemoIcon name="storage" styleId={styleId} />
                    <span className="flex-1">저장 공간</span>
                    <span className="tabular-nums">70%</span>
                  </div>
                  <Progress value={70} aria-label="저장 공간 70%" />
                </div>
                <div data-slot="demo-actions" className="flex gap-2">
                  <Button className="flex-1">저장</Button>
                  <Button variant="outline" className="flex-1">
                    취소
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
