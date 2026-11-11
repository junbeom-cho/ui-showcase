import { Progress } from '@/components/ui/progress'
import type { ShowcaseEntry } from '../types'

function ProgressPreview() {
  return <Progress value={60} className="w-full max-w-56" aria-label="진행률 60%" />
}

export const progressEntry: ShowcaseEntry = {
  id: 'progress',
  name: 'Progress',
  aliases: ['Progress bar', '진행 표시줄'],
  description: '작업이 얼마나 진행됐는지 막대 길이로 보여준다.',
  Preview: ProgressPreview,
}
