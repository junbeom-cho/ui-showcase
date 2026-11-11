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

export const skeletonEntry: ShowcaseEntry = {
  id: 'skeleton',
  name: 'Skeleton',
  aliases: ['Placeholder', 'Shimmer', 'Loading placeholder', '스켈레톤'],
  description: '콘텐츠가 로딩되는 동안 실제 모양을 흉내 내는 회색 자리표시자.',
  Preview: SkeletonPreview,
}
