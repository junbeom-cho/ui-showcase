import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { filterEntries } from './filter-entries'
import { ShowcaseCard } from './showcase-card'
import type { ShowcaseEntry } from './types'

export function Gallery({ entries }: { entries: ShowcaseEntry[] }) {
  const [query, setQuery] = useState('')
  const visible = filterEntries(entries, query)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          aria-label="컴포넌트 검색"
          placeholder="이름, 다른 이름, 설명으로 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="sm:max-w-sm"
        />
        <p className="text-sm text-muted-foreground">{visible.length}개 컴포넌트</p>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <ShowcaseCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-muted-foreground">
          '{query}'에 해당하는 컴포넌트가 없습니다.
        </p>
      )}
    </section>
  )
}
