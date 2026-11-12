import { useId, useState } from 'react'
import { BellIcon, CloudIcon, FolderOpenIcon, SearchIcon, type LucideIcon } from 'lucide-react'
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
import './styles/index.css'

/** Every data-slot inside the demo that a style trait may point at. */
export const DEMO_SLOTS = [
  'demo-backdrop',
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

type IconName = 'search' | 'bell' | 'cloud' | 'storage'

const ICONS: Record<IconName, { Icon: LucideIcon; alt: string }> = {
  search: { Icon: SearchIcon, alt: '검색 아이콘' },
  bell: { Icon: BellIcon, alt: '알림 아이콘' },
  cloud: { Icon: CloudIcon, alt: '백업 아이콘' },
  storage: { Icon: FolderOpenIcon, alt: '저장 공간 아이콘' },
}

const base = import.meta.env.BASE_URL

/** Line icon by default; a rendered 3D image in the 3d-icons style, falling back to the line icon. */
function DemoIcon({ name, styleId }: { name: IconName; styleId: string }) {
  const [failed, setFailed] = useState(false)
  const { Icon, alt } = ICONS[name]
  const threeD = styleId === '3d-icons'

  return (
    <span
      data-slot={`demo-icon-${name}`}
      className={cn('flex shrink-0 items-center justify-center', threeD ? 'size-8' : 'size-5')}
    >
      {threeD && !failed ? (
        <img
          src={`${base}icons-3d/${name}.png`}
          alt={alt}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon aria-hidden className="size-full" />
      )}
    </span>
  )
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

/**
 * The same small settings screen in every style. Only the CSS scoped by
 * data-design-style changes; content, layout and element count never do.
 */
export function DemoApp({ styleId }: { styleId: string }) {
  const uid = useId()

  return (
    <div
      data-design-style={styleId}
      data-slot="demo-backdrop"
      data-refraction={supportsRefraction() ? 'on' : 'off'}
      className="flex w-full max-w-[22rem] justify-center rounded-2xl p-5 sm:p-6"
    >
      {styleId === 'liquid-glass' && <LiquidGlassFilter />}
      <Card className="w-full max-w-[20rem] gap-5 px-5 py-5">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={`${base}avatar.svg`} alt="" />
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
          <p data-slot="demo-name" className="flex-1 font-semibold">
            김하늘
          </p>
          <Badge>프로</Badge>
        </div>

        <div className="flex items-center gap-3">
          <DemoIcon name="search" styleId={styleId} />
          <Input aria-label="설정 검색" placeholder="설정 검색" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <DemoIcon name="bell" styleId={styleId} />
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
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm">
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
  )
}
