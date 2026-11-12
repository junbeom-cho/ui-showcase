import { useState } from 'react'
import {
  BarChart3Icon,
  BellIcon,
  CameraIcon,
  CloudIcon,
  FolderIcon,
  FolderOpenIcon,
  HeartIcon,
  HomeIcon,
  MailIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  search: { Icon: SearchIcon, label: '검색' },
  bell: { Icon: BellIcon, label: '알림' },
  cloud: { Icon: CloudIcon, label: '백업' },
  storage: { Icon: FolderOpenIcon, label: '저장 공간' },
  home: { Icon: HomeIcon, label: '홈' },
  projects: { Icon: FolderIcon, label: '프로젝트' },
  team: { Icon: UsersIcon, label: '팀' },
  settings: { Icon: SettingsIcon, label: '설정' },
  mail: { Icon: MailIcon, label: '메일' },
  heart: { Icon: HeartIcon, label: '하트' },
  camera: { Icon: CameraIcon, label: '카메라' },
  chart: { Icon: BarChart3Icon, label: '차트' },
} satisfies Record<string, { Icon: LucideIcon; label: string }>

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]
export const iconLabel = (name: IconName) => ICONS[name].label

const base = import.meta.env.BASE_URL

/**
 * One icon, drawn the way the current style draws icons (D-018). The box carries
 * data-style-icon so each style's CSS can turn it into a glossy tile, a flat
 * circle, a clay bubble and so on. The 3d-icons style swaps in a rendered image
 * and falls back to the line icon if that image cannot load.
 */
export function StyleIcon({
  name,
  styleId,
  slot,
  decorative = false,
  className,
}: {
  name: IconName
  styleId: string
  /** extra data-slot, so a style trait can point at this icon */
  slot?: string
  /** true when a visible text label already names the icon */
  decorative?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const { Icon, label } = ICONS[name]

  return (
    <span
      data-style-icon={name}
      data-slot={slot}
      className={cn('inline-flex size-5 shrink-0 items-center justify-center', className)}
    >
      {styleId === '3d-icons' && !failed ? (
        <img
          src={`${base}icons-3d/${name}.png`}
          alt={decorative ? '' : `${label} 아이콘`}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon aria-hidden className="size-full" />
      )}
    </span>
  )
}
