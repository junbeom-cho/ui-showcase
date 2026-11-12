import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  HomeView,
  INITIAL_PROJECTS,
  NotificationsMenu,
  ProjectsView,
  SettingsView,
  TeamView,
  type Project,
  type Settings,
} from './demo-views'
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

export type DemoView = 'home' | 'projects' | 'team' | 'settings'

const MENU: { view: DemoView; label: string; icon: IconName }[] = [
  { view: 'home', label: '홈', icon: 'home' },
  { view: 'projects', label: '프로젝트', icon: 'projects' },
  { view: 'team', label: '팀', icon: 'team' },
  { view: 'settings', label: '설정', icon: 'settings' },
]

const INITIAL_SETTINGS: Settings = { notify: true, backup: false }

/**
 * One web-app dashboard drawn in every style (D-016). Only the CSS scoped by
 * data-design-style changes; content, layout and element count never do.
 * Layout reacts to the demo's own width (container queries), so a shrunken
 * thumbnail still shows the desktop arrangement.
 *
 * It also works like a small app (D-019): the side menu switches views, the
 * search box filters projects, and the bell, dialog and settings respond.
 * Pass `view` and `onViewChange` to control the current view from outside.
 */
export function DemoApp({
  styleId,
  view: controlledView,
  onViewChange,
}: {
  styleId: string
  view?: DemoView
  onViewChange?: (view: DemoView) => void
}) {
  const [ownView, setOwnView] = useState<DemoView>('home')
  const view = controlledView ?? ownView
  const setView = (next: DemoView) => {
    setOwnView(next)
    onViewChange?.(next)
  }

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [query, setQuery] = useState('')
  const [unread, setUnread] = useState(3)
  const [savedSettings, setSavedSettings] = useState(INITIAL_SETTINGS)
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [notice, setNotice] = useState('')

  const createProject = (name: string) =>
    setProjects((list) => [
      { id: Math.max(0, ...list.map((p) => p.id)) + 1, name, status: '진행 중', progress: 0 },
      ...list,
    ])

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
            <StyleIcon name="search" styleId={styleId} slot="demo-icon-search" />
            <Input
              aria-label="프로젝트 검색"
              placeholder="프로젝트 검색"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                // Team and settings have no projects to filter; show the list that does.
                if (view === 'team' || view === 'settings') setView('projects')
              }}
            />
          </div>
          <NotificationsMenu styleId={styleId} unread={unread} onReadAll={() => setUnread(0)} />
          <Avatar>
            <AvatarImage src={`${base}avatar.svg`} alt="" />
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
          <p data-slot="demo-name" className="hidden font-semibold @lg:block">
            김하늘
          </p>
        </div>

        <div className="flex flex-col gap-4 @3xl:flex-row">
          <nav
            aria-label="데모 메뉴"
            data-slot="demo-sidebar"
            className="grid shrink-0 grid-cols-4 gap-1 rounded-xl bg-card p-2 text-card-foreground ring-1 ring-foreground/10 @3xl:flex @3xl:w-40 @3xl:flex-col @3xl:self-start"
          >
            {MENU.map((item) => (
              <button
                key={item.view}
                type="button"
                data-slot="demo-nav-item"
                aria-current={view === item.view ? 'page' : undefined}
                onClick={() => setView(item.view)}
                className={cn(
                  // narrow: four tabs with the label under the icon; wide: icon and label side by side
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs outline-none transition-colors hover:bg-foreground/[.04] focus-visible:ring-3 focus-visible:ring-ring/50 @xl:flex-row @xl:gap-2 @xl:px-3 @xl:text-sm @3xl:justify-start',
                  view === item.view ? 'bg-foreground/[.06] font-semibold' : 'opacity-75 hover:opacity-100',
                )}
              >
                <StyleIcon name={item.icon} styleId={styleId} decorative />
                {item.label}
              </button>
            ))}
          </nav>

          {view === 'home' && (
            <HomeView
              styleId={styleId}
              projects={projects}
              query={query}
              onCreate={createProject}
              settings={settings}
              onSettingsChange={(next) => {
                setSettings(next)
                setNotice('')
              }}
              notice={notice}
              onSave={() => {
                setSavedSettings(settings)
                setNotice('설정을 저장했습니다')
              }}
              onCancel={() => {
                setSettings(savedSettings)
                setNotice('저장한 설정으로 되돌렸습니다')
              }}
            />
          )}
          {view === 'projects' && <ProjectsView projects={projects} query={query} />}
          {view === 'team' && <TeamView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </div>
    </div>
  )
}
