import { useState } from 'react'
import { BellIcon, CheckIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ShowcaseEntry } from '../types'

function BadgePreview() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge>New</Badge>
      <Badge variant="secondary">Beta</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  )
}

function BadgeSpecimen() {
  return (
    <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
      <CheckIcon data-slot="badge-icon" data-icon="inline-start" />
      <span data-slot="badge-label">결제 완료</span>
    </Badge>
  )
}

const variants = ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'] as const

function Variants() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  )
}

const statuses = [
  { label: '진행 중', dot: 'bg-blue-500' },
  { label: '검토 대기', dot: 'bg-amber-500' },
  { label: '완료', dot: 'bg-emerald-500' },
  { label: '보류', dot: 'bg-neutral-400' },
]

function StatusBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {statuses.map((s) => (
        <Badge key={s.label} variant="outline" className="gap-1.5">
          <span className={`size-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </Badge>
      ))}
    </div>
  )
}

function CountBadge() {
  const [count, setCount] = useState(3)
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Button variant="outline" size="icon" aria-label={`알림 ${count}개`} onClick={() => setCount(0)}>
          <BellIcon />
        </Button>
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 min-w-5 justify-center rounded-full px-1 tabular-nums">
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </div>
      <Button size="sm" variant="secondary" onClick={() => setCount((c) => c + 1)}>
        알림 하나 더
      </Button>
      <span className="text-xs text-muted-foreground">종을 누르면 읽음 처리</span>
    </div>
  )
}

function RemovableTags() {
  const [tags, setTags] = useState(['디자인', '리액트', '접근성'])
  const [draft, setDraft] = useState('')

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <div className="flex min-h-7 flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              aria-label={`${tag} 지우기`}
              onClick={() => setTags((t) => t.filter((x) => x !== tag))}
              className="rounded-full p-0.5 hover:bg-foreground/10"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted-foreground">태그가 없습니다. 아래에 입력해 추가하세요.</span>}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const value = draft.trim()
          if (value && !tags.includes(value)) setTags((t) => [...t, value])
          setDraft('')
        }}
      >
        <Input
          aria-label="새 태그"
          placeholder="새 태그"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="outline">추가</Button>
      </form>
    </div>
  )
}

export const badgeEntry: ShowcaseEntry = {
  id: 'badge',
  name: 'Badge',
  aliases: ['Tag', 'Chip', 'Label', 'Pill', '배지'],
  description: '상태나 분류를 짧은 텍스트로 표시하는 작은 라벨.',
  category: 'display',
  Preview: BadgePreview,
  anatomy: {
    Specimen: BadgeSpecimen,
    parts: [
      { slot: 'badge', name: 'Badge', description: '둥근 모서리의 작은 바탕' },
      { slot: 'badge-icon', name: 'icon', description: '상태를 그림으로 보충하는 아이콘 (선택)' },
      { slot: 'badge-label', name: 'label', description: '한두 단어의 짧은 글' },
    ],
  },
  examples: [
    {
      title: '변형 (variant)',
      description: '강조 정도와 의미에 따라 색과 테두리를 바꿉니다.',
      Demo: Variants,
    },
    {
      title: '상태 표시',
      description: '작업 상태처럼 종류가 정해진 값을 색 점과 함께 보여줍니다.',
      Demo: StatusBadges,
    },
    {
      title: '숫자 배지',
      description: '아이콘 버튼 모서리에 붙여 읽지 않은 개수를 알려줍니다.',
      Demo: CountBadge,
    },
    {
      title: '지울 수 있는 태그',
      description: '입력한 키워드를 칩(Chip)으로 쌓고 X로 지웁니다. 새 태그를 추가해 보세요.',
      Demo: RemovableTags,
    },
  ],
}
