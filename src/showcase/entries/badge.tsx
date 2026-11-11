import { Badge } from '@/components/ui/badge'
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

export const badgeEntry: ShowcaseEntry = {
  id: 'badge',
  name: 'Badge',
  aliases: ['Tag', 'Chip', 'Label', 'Pill', '배지'],
  description: '상태나 분류를 짧은 텍스트로 표시하는 작은 라벨.',
  Preview: BadgePreview,
}
