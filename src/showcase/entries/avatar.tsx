import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ShowcaseEntry } from '../types'

function AvatarPreview() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-12">
        <AvatarImage src="/avatar.svg" alt="프로필 이미지" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
    </div>
  )
}

export const avatarEntry: ShowcaseEntry = {
  id: 'avatar',
  name: 'Avatar',
  aliases: ['Profile image', '프로필 이미지'],
  description: '사용자를 나타내는 작은 원형 이미지. 이미지가 없으면 이니셜을 보여준다.',
  Preview: AvatarPreview,
}
