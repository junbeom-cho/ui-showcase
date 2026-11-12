import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

function Cells({ className, count = 6, span }: { className: string; count?: number; span?: boolean }) {
  return (
    <div className={cn('grid w-full max-w-40', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn('h-5 rounded-sm bg-muted', span && i === 0 && 'col-span-2 bg-primary/20')}
        />
      ))}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '2열', node: <Cells className="grid-cols-2 gap-1.5" /> },
        { label: '3열', node: <Cells className="grid-cols-3 gap-1.5" /> },
        { label: '4열', node: <Cells className="grid-cols-4 gap-1.5" count={8} /> },
        { label: '좁은 간격', node: <Cells className="grid-cols-3 gap-0.5" /> },
        { label: '넓은 간격', node: <Cells className="grid-cols-3 gap-3" /> },
        { label: '칸 합치기', node: <Cells className="grid-cols-3 gap-1.5" count={5} span /> },
      ]}
    />
  )
}

const cell = 'flex items-center justify-center rounded-md bg-muted text-xs text-muted-foreground'

function GridPreview() {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={cn(cell, 'h-10')}>
          {n}
        </div>
      ))}
    </div>
  )
}

function GridSpecimen() {
  return (
    <div data-slot="grid" className="grid w-full max-w-80 grid-cols-3 gap-3">
      <div data-slot="grid-cell" className={cn(cell, 'h-14')}>1</div>
      <div data-slot="grid-span" className={cn(cell, 'col-span-2 h-14 bg-primary/10 text-foreground')}>
        두 칸 차지
      </div>
      {[3, 4, 5].map((n) => (
        <div key={n} className={cn(cell, 'h-14')}>
          {n}
        </div>
      ))}
    </div>
  )
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">{label}</span>
      {options.map((option) => (
        <Button
          key={option.value}
          size="xs"
          variant={option.value === value ? 'default' : 'outline'}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

const columnClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as const

function ColumnCount() {
  const [cols, setCols] = useState<2 | 3 | 4>(3)
  return (
    <div className="flex w-full flex-col gap-4">
      <Segmented
        label="열 개수"
        value={cols}
        onChange={setCols}
        options={[
          { value: 2, label: '2열' },
          { value: 3, label: '3열' },
          { value: 4, label: '4열' },
        ]}
      />
      <div className={cn('grid gap-2', columnClass[cols])}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={cn(cell, 'h-12')}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

function BentoGrid() {
  return (
    <div className="grid w-full grid-cols-4 grid-rows-[repeat(3,3.5rem)] gap-2">
      <div className={cn(cell, 'col-span-2 row-span-2 bg-primary/10 text-foreground')}>2×2</div>
      <div className={cn(cell, 'col-span-2')}>가로 2칸</div>
      <div className={cell}>1</div>
      <div className={cn(cell, 'row-span-2')}>세로 2칸</div>
      <div className={cn(cell, 'col-span-3')}>가로 3칸</div>
    </div>
  )
}

const widths = { narrow: 'max-w-40', medium: 'max-w-64', wide: 'max-w-full' } as const

function AutoFillGrid() {
  const [width, setWidth] = useState<keyof typeof widths>('medium')
  return (
    <div className="flex w-full flex-col gap-4">
      <Segmented
        label="바깥 너비"
        value={width}
        onChange={setWidth}
        options={[
          { value: 'narrow', label: '좁게' },
          { value: 'medium', label: '보통' },
          { value: 'wide', label: '넓게' },
        ]}
      />
      <div
        className={cn(
          'grid w-full grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 rounded-md border border-dashed p-2 motion-safe:transition-[max-width]',
          widths[width],
        )}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={cn(cell, 'h-12')}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

export const gridEntry: ShowcaseEntry = {
  id: 'grid',
  name: 'Grid',
  aliases: ['Grid layout', '그리드'],
  description: '요소를 행과 열의 격자로 배치하는 레이아웃. 카드 목록이나 갤러리에 주로 쓴다.',
  category: 'layout',
  Preview: GridPreview,
  anatomy: {
    Specimen: GridSpecimen,
    parts: [
      { slot: 'grid', name: 'grid container', description: '열 개수와 칸 사이 간격(gap)을 정하는 바깥 틀' },
      { slot: 'grid-cell', name: 'grid item', description: '격자 한 칸을 차지하는 요소' },
      { slot: 'grid-span', name: 'col-span', description: '여러 칸을 이어서 차지하는 요소' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '그리드는 상태 대신 열 개수, 칸 사이 간격, 칸 합치기로 모양이 달라집니다.',
      Demo: States,
    },
    {
      title: '열 개수 바꾸기',
      description: '같은 항목도 열 개수에 따라 줄바꿈 위치가 달라집니다.',
      Demo: ColumnCount,
    },
    {
      title: '칸 합치기',
      description: '가로·세로로 여러 칸을 차지하게 하면 벤토 박스 같은 배치가 됩니다.',
      Demo: BentoGrid,
    },
    {
      title: '너비에 맞춰 자동 배치',
      description: '칸의 최소 너비만 정해 두면, 바깥 너비에 따라 한 줄에 들어가는 개수가 저절로 바뀝니다.',
      Demo: AutoFillGrid,
    },
  ],
}
