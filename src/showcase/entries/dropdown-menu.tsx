import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ShowcaseEntry } from '../types'

function DropdownMenuPreview() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">메뉴 열기</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>프로필</DropdownMenuItem>
        <DropdownMenuItem>설정</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>로그아웃</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const dropdownMenuEntry: ShowcaseEntry = {
  id: 'dropdown-menu',
  name: 'Dropdown Menu',
  aliases: ['Menu', 'Popup menu', '드롭다운 메뉴'],
  description: '버튼을 누르면 아래로 펼쳐지는 동작 목록.',
  Preview: DropdownMenuPreview,
}
