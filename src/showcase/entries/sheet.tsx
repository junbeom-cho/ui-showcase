import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ShowcaseEntry } from '../types'

function SheetPreview() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Sheet 열기</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>필터</SheetTitle>
          <SheetDescription>검색 결과를 좁힐 조건을 고르세요.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}

export const sheetEntry: ShowcaseEntry = {
  id: 'sheet',
  name: 'Sheet',
  aliases: ['Drawer', 'Off-canvas', 'Side panel', '시트'],
  description: '화면 가장자리에서 미끄러져 나오는 패널.',
  Preview: SheetPreview,
}
