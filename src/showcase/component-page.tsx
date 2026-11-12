import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Anatomy } from './anatomy'
import { categories, groupByCategory } from './categories'
import { NeighbourLinks } from './neighbour-links'
import { hrefFor } from './route'
import { Specimen } from './specimen'
import type { ShowcaseEntry } from './types'

function Pager({ entry, entries }: { entry: ShowcaseEntry; entries: ShowcaseEntry[] }) {
  const ordered = groupByCategory(entries).flatMap((g) => g.entries)
  const index = ordered.findIndex((e) => e.id === entry.id)
  const link = (e?: ShowcaseEntry) => (e ? { href: hrefFor(e.id), name: e.name } : undefined)
  return <NeighbourLinks label="이전·다음 컴포넌트" prev={link(ordered[index - 1])} next={link(ordered[index + 1])} />
}

export function ComponentPage({ entry, entries }: { entry: ShowcaseEntry; entries: ShowcaseEntry[] }) {
  const category = categories.find((c) => c.id === entry.category)!

  return (
    <article className="flex flex-col gap-14">
      <header className="flex flex-col gap-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={hrefFor(null)}>개요</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{category.label}</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{entry.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl">{entry.name}</h1>
        <p className="max-w-[38rem] text-lg leading-relaxed text-ink">{entry.description}</p>
        {entry.aliases.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-ink-muted">다른 이름</span>
            {entry.aliases.map((alias) => (
              <Badge key={alias} variant="outline" className="border-rule bg-card font-normal text-ink">
                {alias}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">생김새</h2>
          <p className="text-ink-muted">
            번호는 코드에서 쓰는 부분 이름입니다. 목록에 마우스를 올리면 해당 부분이 강조됩니다.
          </p>
        </div>
        <Anatomy {...entry.anatomy} />
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">예시</h2>
        {entry.examples.map((example) => (
          <div key={example.title} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-ink">{example.title}</h3>
              <p className="max-w-[40rem] text-ink-muted">{example.description}</p>
            </div>
            <Specimen>
              <example.Demo />
            </Specimen>
          </div>
        ))}
      </section>

      <Pager entry={entry} entries={entries} />
    </article>
  )
}
