import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ShowcaseEntry } from '../types'

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Dialog 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>정말 삭제할까요?</DialogTitle>
          <DialogDescription>삭제한 항목은 되돌릴 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const dialogEntry: ShowcaseEntry = {
  id: 'dialog',
  name: 'Dialog',
  aliases: ['Modal', 'Popup', '모달'],
  description: '화면 위에 떠서 다른 조작을 막고 응답을 기다리는 창.',
  Preview: DialogPreview,
}
