import { Anatomy } from './anatomy'
import { groupByCategory } from './categories'
import { hrefFor } from './route'
import type { ShowcaseEntry } from './types'

/** A drawing sheet: live thumbnail on top, title block below. */
function EntryCard({ entry }: { entry: ShowcaseEntry }) {
  return (
    <article data-slot="app-surface" className="group relative flex flex-col overflow-hidden rounded-md border border-rule bg-card hover:border-blueprint has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blueprint/40">
      <div inert className="bg-graph flex h-48 min-w-0 items-center justify-center overflow-hidden p-5">
        <entry.Preview />
      </div>
      <div className="flex flex-col gap-0.5 border-t border-rule px-4 py-3">
        <h3 className="font-semibold text-ink">
          <a href={hrefFor(entry.id)} className="outline-none after:absolute after:inset-0">
            {entry.name}
          </a>
        </h3>
        {entry.aliases.length > 0 && (
          <p className="truncate text-[13px] text-ink-muted">{entry.aliases.join(', ')}</p>
        )}
      </div>
    </article>
  )
}

export function OverviewPage({ entries }: { entries: ShowcaseEntry[] }) {
  const featured = entries.find((e) => e.id === 'card')

  return (
    <div className="flex flex-col gap-16">
      <header className="grid items-start gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-5 xl:pt-10">
          <h1 className="text-[2.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink sm:text-[3.5rem]">
            컴포넌트 이름과 생김새를 함께 봅니다
          </h1>
          <p className="max-w-[34rem] text-lg leading-relaxed text-ink-muted">
            Skeleton, Sidebar, Badge처럼 이름만으로는 떠올리기 어려운 UI 컴포넌트 {entries.length}개를
            종류별로 모았습니다. 각 페이지에서 부분마다 붙은 이름을 번호로 확인하고, 직접 눌러 보세요.
          </p>
        </div>
        {featured && <Anatomy {...featured.anatomy} layout="stacked" />}
      </header>

      {groupByCategory(entries).map(({ category, entries: items }) => (
        <section key={category.id} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{category.label}</h2>
            <p className="text-ink-muted">{category.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
