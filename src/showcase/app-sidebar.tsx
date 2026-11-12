import { useState } from 'react'
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

type NavProps = {
  entries: ShowcaseEntry[]
  styles: DesignStyle[]
  route: Route
  onNavigate?: () => void
}

function NavLink({
  href,
  current,
  onNavigate,
  children,
}: {
  href: string
  current: boolean
  onNavigate?: () => void
  children: React.ReactNode
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

function GroupHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="pl-3 text-[13px] font-semibold text-ink">{children}</h2>
}

export function NavList({ entries, styles, route, onNavigate }: NavProps) {
  const [query, setQuery] = useState('')
  const searching = query.trim() !== ''
  const groups = groupByCategory(filterEntries(entries, query))
  const matchingStyles = filterStyles(styles, query)
  const showStyles = styles.length > 0 && (!searching || matchingStyles.length > 0)

  return (
    <div className="flex flex-col gap-5">
      <Input
        type="search"
        aria-label="검색"
        placeholder="컴포넌트·스타일 찾기"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="bg-white"
      />
      <nav aria-label="탐색 목록" className="flex flex-col gap-5">
        <NavLink href={hrefFor(null)} current={route.page === 'overview'} onNavigate={onNavigate}>
          개요
        </NavLink>
        {groups.map(({ category, entries: list }) => (
          <section key={category.id} className="flex flex-col gap-1">
            <GroupHeading>{category.label}</GroupHeading>
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
        {showStyles && (
          <section className="flex flex-col gap-1 border-t border-rule pt-5">
            <GroupHeading>디자인 스타일</GroupHeading>
            <ul className="border-l border-rule">
              {!searching && (
                <li className="-ml-px">
                  <NavLink href={styleHref(null)} current={route.page === 'styles'} onNavigate={onNavigate}>
                    전체 보기
                  </NavLink>
                </li>
              )}
              {matchingStyles.map((style) => (
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
          </section>
        )}
        {groups.length === 0 && !showStyles && (
          <p className="px-3 text-sm text-ink-muted">'{query}'와 일치하는 항목이 없습니다.</p>
        )}
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <a
      href={hrefFor(null)}
      className="text-[17px] font-semibold tracking-tight text-ink outline-none focus-visible:ring-2 focus-visible:ring-blueprint/40"
    >
      UI 쇼케이스
    </a>
  )
}

/** Fixed column on wide screens. */
export function AppSidebar(props: NavProps) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-rule bg-paper px-5 py-6 lg:flex">
      <Brand />
      <NavList {...props} />
    </aside>
  )
}

/** Top bar with the same list in a Sheet on narrow screens. */
export function MobileNav(props: Omit<NavProps, 'onNavigate'>) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
      <Brand />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="탐색 목록 열기">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-paper p-5">
          <SheetHeader className="p-0">
            <SheetTitle>탐색 목록</SheetTitle>
            <SheetDescription className="sr-only">컴포넌트와 디자인 스타일 목록, 검색</SheetDescription>
          </SheetHeader>
          <NavList {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
