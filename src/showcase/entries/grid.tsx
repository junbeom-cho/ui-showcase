import type { ShowcaseEntry } from '../types'

function GridPreview() {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="flex h-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground"
        >
          {n}
        </div>
      ))}
    </div>
  )
}

export const gridEntry: ShowcaseEntry = {
  id: 'grid',
  name: 'Grid',
  aliases: ['Grid layout', '그리드'],
  description: '요소를 행과 열의 격자로 배치하는 레이아웃. 카드 목록이나 갤러리에 주로 쓴다.',
  Preview: GridPreview,
}
