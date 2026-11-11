import { Separator } from '@/components/ui/separator'
import type { ShowcaseEntry } from '../types'

function SeparatorPreview() {
  return (
    <div className="w-full max-w-56 text-sm">
      <p>위쪽 내용</p>
      <Separator className="my-3" />
      <p>아래쪽 내용</p>
      <div className="mt-4 flex h-5 items-center gap-3">
        <span>홈</span>
        <Separator orientation="vertical" />
        <span>문서</span>
        <Separator orientation="vertical" />
        <span>설정</span>
      </div>
    </div>
  )
}

export const separatorEntry: ShowcaseEntry = {
  id: 'separator',
  name: 'Separator',
  aliases: ['Divider', 'Rule', '구분선'],
  description: '콘텐츠 사이를 나누는 가로선이나 세로선.',
  Preview: SeparatorPreview,
}
