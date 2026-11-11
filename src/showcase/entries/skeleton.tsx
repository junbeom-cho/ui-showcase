import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ShowcaseEntry } from '../types'

function SkeletonPreview() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

function SkeletonSpecimen() {
  return (
    <div className="flex w-full max-w-72 items-center gap-4">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton data-slot="skeleton-title" className="h-4 w-3/4" />
        <Skeleton data-slot="skeleton-line" className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function LoadThenShow() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), 1800)
    return () => window.clearTimeout(timer)
  }, [loading])

  return (
    <div className="flex w-full max-w-72 flex-col gap-4">
      <div className="flex h-14 items-center gap-3" aria-busy={loading} aria-live="polite">
        {loading ? (
          <>
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </>
        ) : (
          <>
            <Avatar size="lg">
              <AvatarFallback>김</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">김하늘</p>
              <p className="text-xs text-muted-foreground">프로덕트 디자이너, 서울</p>
            </div>
          </>
        )}
      </div>
      <Button size="xs" variant="outline" className="self-start" disabled={loading} onClick={() => setLoading(true)}>
        다시 불러오기
      </Button>
    </div>
  )
}

function ListSkeleton() {
  return (
    <ul className="flex w-full max-w-72 flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </li>
      ))}
    </ul>
  )
}

function CardSkeleton() {
  return (
    <div className="flex w-full max-w-56 flex-col gap-3 rounded-xl border bg-background p-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  )
}

export const skeletonEntry: ShowcaseEntry = {
  id: 'skeleton',
  name: 'Skeleton',
  aliases: ['Placeholder', 'Shimmer', 'Loading placeholder', '스켈레톤'],
  description: '콘텐츠가 로딩되는 동안 실제 모양을 흉내 내는 회색 자리표시자.',
  category: 'feedback',
  Preview: SkeletonPreview,
  anatomy: {
    Specimen: SkeletonSpecimen,
    parts: [
      { slot: 'skeleton', name: 'Skeleton', description: '프로필 사진 자리. 모양은 className으로 정함' },
      { slot: 'skeleton-title', name: 'Skeleton', description: '제목 한 줄 자리' },
      { slot: 'skeleton-line', name: 'Skeleton', description: '본문 줄 자리. 실제 글 길이와 비슷하게' },
    ],
  },
  examples: [
    {
      title: '불러온 뒤 내용으로 바꾸기',
      description: '1.8초 동안 스켈레톤을 보여준 뒤 실제 프로필로 바뀝니다. 다시 불러와 보세요.',
      Demo: LoadThenShow,
    },
    {
      title: '목록 자리표시',
      description: '목록 한 줄의 생김새(아이콘·제목·배지)를 그대로 흉내 냅니다.',
      Demo: ListSkeleton,
    },
    {
      title: '카드 자리표시',
      description: '이미지가 있는 카드는 이미지 비율까지 맞춰서, 로딩 뒤에 화면이 덜컥거리지 않게 합니다.',
      Demo: CardSkeleton,
    },
  ],
}
