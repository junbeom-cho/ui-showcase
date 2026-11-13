import { useState } from 'react'
import {
  CalendarIcon,
  CheckSquareIcon,
  FolderIcon,
  MailIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch } from './frames'
import { NavBadge, stay } from './parts'

type RailPage = { id: string; label: string; icon: LucideIcon; badge?: number }

const RAIL_PAGES: RailPage[] = [
  { id: 'mail', label: '메일', icon: MailIcon, badge: 12 },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'contacts', label: '연락처', icon: UsersIcon },
  { id: 'tasks', label: '할 일', icon: CheckSquareIcon },
  { id: 'files', label: '파일', icon: FolderIcon },
]

const SETTINGS: RailPage = { id: 'settings', label: '설정', icon: SettingsIcon }

/** A narrow strip of icons on the left that widens to show its labels. */
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
