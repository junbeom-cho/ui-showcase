import type { MouseEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ShowcaseEntry } from './types'

// Demo links (Breadcrumb, Pagination) use href="#"; following them would
// scroll the gallery back to the top, so the preview area swallows them.
function preventHashNavigation(event: MouseEvent<HTMLDivElement>) {
  const link = (event.target as Element).closest('a')
  if (link?.getAttribute('href') === '#') event.preventDefault()
}

export function ShowcaseCard({ entry }: { entry: ShowcaseEntry }) {
  const { Preview } = entry

  return (
    <Card id={entry.id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">{entry.name}</h2>
        </CardTitle>
        {entry.aliases.length > 0 && (
          <p className="text-xs text-muted-foreground">다른 이름: {entry.aliases.join(', ')}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          data-testid={`preview-${entry.id}`}
          onClick={preventHashNavigation}
          className="flex min-h-40 min-w-0 items-center justify-center rounded-md border border-dashed p-4"
        >
          <Preview />
        </div>
        <CardDescription>{entry.description}</CardDescription>
      </CardContent>
    </Card>
  )
}
