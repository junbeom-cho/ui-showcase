import { useState, type ReactNode } from 'react'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { filterStyles } from '@/design-styles/filter-styles'
import type { DesignStyle } from '@/design-styles/types'
import { cn } from '@/lib/utils'
import { groupByCategory } from './categories'
import { filterEntries } from './filter-entries'
import { hrefFor, styleHref, type Route } from './route'
import type { ShowcaseEntry } from './types'

export type Section = 'components' | 'styles'

/** The top-level menu a route belongs to (D-015). */
export function sectionOf(route: Route): Section {
  return route.page === 'styles' || route.page === 'style' ? 'styles' : 'components'
}

type SectionProps = { entries: ShowcaseEntry[]; styles: DesignStyle[]; route: Route }

function NavLink({
  href,
  current,
  onNavigate,
  children,
}: {
  href: string
  current: boolean
  onNavigate?: () => void
  children: ReactNode
}) {
  return (
    <a
      href={href}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'block border-l-2 border-transparent py-1.5 pr-2 pl-3 text-[14px] text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-blueprint/40',
        current && 'border-blueprint font-medium text-blueprint hover:text-blueprint',
      )}
    >
      {children}
    </a>
  )
}

function SearchBox({ label, placeholder, value, onChange }: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="bg-card"
    />
  )
}

export function ComponentNav({ entries, route, onNavigate }: {
  entries: ShowcaseEntry[]
  route: Route
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState('')
  const groups = groupByCategory(filterEntries(entries, query))

  return (
    <div className="flex flex-col gap-5">
      <SearchBox label="컴포넌트 검색" placeholder="이름, 다른 이름으로 찾기" value={query} onChange={setQuery} />
      <nav aria-label="컴포넌트 목록" className="flex flex-col gap-5">
        <NavLink href={hrefFor(null)} current={route.page === 'overview'} onNavigate={onNavigate}>
          개요
        </NavLink>
        {groups.map(({ category, entries: list }) => (
          <section key={category.id} className="flex flex-col gap-1">
            <h2 className="pl-3 text-[13px] font-semibold text-ink">{category.label}</h2>
            <ul className="border-l border-rule">
              {list.map((entry) => (
                <li key={entry.id} className="-ml-px">
                  <NavLink
                    href={hrefFor(entry.id)}
                    current={route.page === 'component' && route.id === entry.id}
                    onNavigate={onNavigate}
                  >
                    {entry.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="px-3 text-sm text-ink-muted">'{query}'와 일치하는 컴포넌트가 없습니다.</p>
        )}
      </nav>
    </div>
  )
}

export function StyleNav({ styles, route, onNavigate }: {
  styles: DesignStyle[]
  route: Route
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState('')
  const searching = query.trim() !== ''
  const matching = filterStyles(styles, query)

  return (
    <div className="flex flex-col gap-5">
      <SearchBox label="스타일 검색" placeholder="한국어·영어 이름으로 찾기" value={query} onChange={setQuery} />
      <nav aria-label="스타일 목록" className="flex flex-col gap-1">
        {!searching && (
          <NavLink href={styleHref(null)} current={route.page === 'styles'} onNavigate={onNavigate}>
            전체 보기
          </NavLink>
        )}
        <ul className="mt-2 border-l border-rule">
          {matching.map((style) => (
            <li key={style.id} className="-ml-px">
              <NavLink
                href={styleHref(style.id)}
                current={route.page === 'style' && route.id === style.id}
                onNavigate={onNavigate}
              >
                {style.name}
              </NavLink>
            </li>
          ))}
        </ul>
        {matching.length === 0 && (
          <p className="px-3 text-sm text-ink-muted">'{query}'와 일치하는 스타일이 없습니다.</p>
        )}
      </nav>
    </div>
  )
}

function SectionNav({ entries, styles, route, onNavigate }: SectionProps & { onNavigate?: () => void }) {
  return sectionOf(route) === 'styles' ? (
    <StyleNav styles={styles} route={route} onNavigate={onNavigate} />
  ) : (
    <ComponentNav entries={entries} route={route} onNavigate={onNavigate} />
  )
}

const SECTIONS: { id: Section; label: string; href: string }[] = [
  { id: 'components', label: 'UI 컴포넌트', href: hrefFor(null) },
  { id: 'styles', label: '스타일', href: styleHref(null) },
]

/** Full-width top bar: brand, the two top-level menus, and (on phones) the section list in a Sheet. */
export function AppHeader({ entries, styles, route }: SectionProps) {
  const [open, setOpen] = useState(false)
  const section = sectionOf(route)

  return (
    <header
      data-slot="app-header"
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-rule bg-paper/95 px-4 backdrop-blur sm:gap-6 sm:px-6"
    >
      <a
        href={hrefFor(null)}
        className="hidden shrink-0 text-[17px] font-semibold tracking-tight text-ink outline-none focus-visible:ring-2 focus-visible:ring-blueprint/40 sm:block"
      >
        UI 쇼케이스
      </a>
      <nav aria-label="대메뉴" className="flex h-full shrink-0 gap-1">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={s.href}
            aria-current={section === s.id ? 'page' : undefined}
            className={cn(
              'flex items-center border-b-2 border-transparent px-2 text-[15px] whitespace-nowrap text-ink-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-blueprint/40 sm:px-3',
              section === s.id && 'border-blueprint font-semibold text-ink',
            )}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="목록 열기" className="ml-auto lg:hidden">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-paper p-5">
          <SheetHeader className="p-0">
            <SheetTitle>{section === 'styles' ? '스타일 목록' : '컴포넌트 목록'}</SheetTitle>
            <SheetDescription className="sr-only">목록과 검색</SheetDescription>
          </SheetHeader>
          <SectionNav entries={entries} styles={styles} route={route} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}

/** Fixed column on wide screens with the current section's list. */
export function AppSidebar(props: SectionProps) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-rule bg-paper px-5 py-6 lg:flex">
      <SectionNav {...props} />
    </aside>
  )
}
