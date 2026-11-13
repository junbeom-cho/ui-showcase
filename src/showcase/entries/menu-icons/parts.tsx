import type { ComponentProps, ComponentType, ReactNode } from 'react'
import {
  EllipsisIcon,
  EllipsisVerticalIcon,
  EqualIcon,
  GripIcon,
  ListFilterIcon,
  MenuIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { slotProps } from '../navigation-patterns/parts'

type GlyphProps = ComponentProps<'svg'>
export type Glyph = ComponentType<GlyphProps>

/** 3×3 filled squares; lucide only has the 3×3 dots (Grip). */
export function BentoIcon({ className, ...props }: GlyphProps) {
  const at = [3, 9.5, 16]
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" className={className} {...props}>
      {at.flatMap((y) => at.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1} />))}
    </svg>
  )
}

/** Left-aligned lines that get shorter, like steps; lucide has none without an arrow. */
export function StairsIcon({ className, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <path d="M4 5h16M4 12h11M4 19h6" />
    </svg>
  )
}

export type MenuIconInfo = {
  id: string
  no: string
  /** Korean nickname */
  ko: string
  en: string
  Glyph: Glyph
  /** what pressing it usually opens */
  opens: string
  /** the name the button should really have (aria-label, tooltip) */
  label: string
}

export const MENU_ICONS: MenuIconInfo[] = [
  { id: 'hamburger', no: '01', ko: '햄버거', en: 'Hamburger', Glyph: MenuIcon, opens: '내비게이션 서랍', label: '메뉴 열기' },
  { id: 'kebab', no: '02', ko: '케밥', en: 'Kebab', Glyph: EllipsisVerticalIcon, opens: '행·앱 바의 더보기 메뉴', label: '더보기' },
  { id: 'meatballs', no: '03', ko: '미트볼', en: 'Meatballs', Glyph: EllipsisIcon, opens: '카드·게시물의 더보기 동작', label: '게시물 옵션' },
  { id: 'waffle', no: '04', ko: '와플', en: 'Waffle', Glyph: GripIcon, opens: '다른 앱으로 가는 앱 런처', label: '앱 목록' },
  { id: 'bento', no: '05', ko: '벤토', en: 'Bento', Glyph: BentoIcon, opens: '바로가기·카테고리 판 (앱 런처로도 씀)', label: '전체 카테고리' },
  { id: 'doner', no: '06', ko: '도너', en: 'Döner', Glyph: ListFilterIcon, opens: '필터', label: '필터' },
  { id: 'veggie-burger', no: '07', ko: '베지 버거', en: 'Veggie burger', Glyph: EqualIcon, opens: '항목이 적은 짧은 메뉴', label: '메뉴' },
  { id: 'stairs', no: '08', ko: '계단', en: 'Stairs', Glyph: StairsIcon, opens: '정렬', label: '정렬' },
  { id: 'sliders', no: '09', ko: '슬라이더', en: 'Sliders', Glyph: SlidersHorizontalIcon, opens: '설정·세부 조정', label: '보기 설정' },
]

export const menuIcon = (id: string) => MENU_ICONS.find((icon) => icon.id === id)!

/**
 * An icon-only button. The name comes from `label` (what it does), not the glyph's nickname;
 * a badge dot adds `badge` to that name so it is heard as well as seen.
 */
export function MenuIconButton({
  icon: Icon,
  label,
  badge,
  slots = false,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'> & {
  icon: Glyph
  label: string
  badge?: string
  /** name the parts for the anatomy drawing */
  slots?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={badge ? `${label}, ${badge}` : label}
      {...slotProps(slots, 'menu-icon-button')}
      className={cn('relative', className)}
      {...props}
    >
      <Icon aria-hidden {...slotProps(slots, 'menu-icon-glyph')} />
      {badge && (
        <span
          aria-hidden
          {...slotProps(slots, 'menu-icon-badge')}
          className="absolute top-1 right-1 size-2 rounded-full bg-red-500 ring-2 ring-background"
        />
      )}
    </Button>
  )
}

/** Number, nickname, English name and what the icon opens, above each demo. */
export function IconCaption({ id }: { id: string }) {
  const { no, ko, en, Glyph, opens, label } = menuIcon(id)
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background">
        <Glyph className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          <span className="text-muted-foreground tabular-nums">{no}</span> {ko}{' '}
          <span className="font-normal text-muted-foreground">· {en}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          누르면 {opens} · 버튼 이름(aria-label) “{label}”
        </p>
      </div>
    </div>
  )
}

/** Caption, frame and a result line: the shape every icon demo shares. */
export function IconDemo({ id, status, children }: { id: string; status: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <IconCaption id={id} />
      {children}
      <p role="status" className="text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  )
}
