import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ShowcaseEntry } from '../types'
import { MockScreen } from './mock-screen'

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

function SheetSpecimen() {
  return (
    <MockScreen>
      <div data-slot="sheet-overlay" className="absolute inset-0 bg-black/20" />
      <div
        data-slot="sheet-content"
        className="absolute inset-y-0 right-0 flex w-36 flex-col gap-3 border-l bg-background p-3 text-sm"
      >
        <div className="flex flex-col gap-1 pr-4">
          <p data-slot="sheet-title" className="font-medium">필터</p>
          <p data-slot="sheet-description" className="text-[11px] leading-snug text-muted-foreground">
            조건을 고르세요.
          </p>
        </div>
        <div aria-hidden className="flex flex-col gap-1.5">
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-4/5 rounded bg-muted" />
          <div className="h-2 w-3/5 rounded bg-muted" />
        </div>
        <span data-slot="sheet-close" className="absolute top-3 right-2.5 text-muted-foreground">
          <XIcon className="size-3.5" />
        </span>
      </div>
    </MockScreen>
  )
}

const sides = [
  { side: 'top', label: '위' },
  { side: 'right', label: '오른쪽' },
  { side: 'bottom', label: '아래' },
  { side: 'left', label: '왼쪽' },
] as const

function Sides() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sides.map(({ side, label }) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">{label}에서</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{label}에서 나온 Sheet</SheetTitle>
              <SheetDescription>side="{side}"로 나오는 방향을 정합니다.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}

const options = ['무료 배송', '오늘 출발', '할인 중', '리뷰 4점 이상']

function FilterSheet() {
  const [applied, setApplied] = useState<string[]>([])
  const [draft, setDraft] = useState<string[]>([])
  const count = Math.max(4, 120 - applied.length * 27)

  return (
    <div className="flex flex-col items-center gap-3">
      <Sheet onOpenChange={(open) => open && setDraft(applied)}>
        <SheetTrigger asChild>
          <Button variant="outline">필터{applied.length > 0 && ` ${applied.length}`}</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>필터</SheetTitle>
            <SheetDescription>적용을 눌러야 목록에 반영됩니다.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            {options.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`filter-${option}`}
                  checked={draft.includes(option)}
                  onCheckedChange={(checked) =>
                    setDraft((d) => (checked ? [...d, option] : d.filter((x) => x !== option)))
                  }
                />
                <Label htmlFor={`filter-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button onClick={() => setApplied(draft)}>적용</Button>
            </SheetClose>
            <Button variant="ghost" onClick={() => setDraft([])}>
              모두 지우기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        상품 {count}개 {applied.length > 0 && `(${applied.join(', ')})`}
      </p>
    </div>
  )
}

const cart = [
  { name: '무선 키보드', price: 59000 },
  { name: '마우스 패드', price: 12000 },
]

function CartSheet() {
  const total = cart.reduce((sum, item) => sum + item.price, 0)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>장바구니 ({cart.length})</Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>장바구니</SheetTitle>
          <SheetDescription>보던 페이지를 떠나지 않고 담은 상품을 확인합니다.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-1 flex-col divide-y px-4">
          {cart.map((item) => (
            <li key={item.name} className="flex justify-between py-3 text-sm">
              <span>{item.name}</span>
              <span className="tabular-nums">{item.price.toLocaleString()}원</span>
            </li>
          ))}
        </ul>
        <SheetFooter className="border-t">
          <p className="flex justify-between text-sm font-medium">
            <span>합계</span>
            <span className="tabular-nums">{total.toLocaleString()}원</span>
          </p>
          <SheetClose asChild>
            <Button>주문하기</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export const sheetEntry: ShowcaseEntry = {
  id: 'sheet',
  name: 'Sheet',
  aliases: ['Drawer', 'Off-canvas', 'Side panel', '시트'],
  description: '화면 가장자리에서 미끄러져 나오는 패널.',
  category: 'overlay',
  Preview: SheetPreview,
  anatomy: {
    Specimen: SheetSpecimen,
    parts: [
      { slot: 'sheet-overlay', name: 'SheetOverlay', description: '뒤 화면을 덮는 반투명 막' },
      { slot: 'sheet-content', name: 'SheetContent', description: '가장자리에서 나오는 패널' },
      { slot: 'sheet-title', name: 'SheetTitle', description: '패널의 제목' },
      { slot: 'sheet-description', name: 'SheetDescription', description: '무엇을 하는 패널인지 설명' },
      { slot: 'sheet-close', name: 'SheetClose', description: '패널을 닫는 X 버튼' },
    ],
  },
  examples: [
    {
      title: '나오는 방향',
      description: '네 방향 어디에서든 꺼낼 수 있습니다. 모바일 메뉴는 왼쪽, 필터는 오른쪽에서 주로 나옵니다.',
      Demo: Sides,
    },
    {
      title: '필터 패널',
      description: '조건을 고르고 적용을 누르면 목록 개수가 바뀝니다. 닫기만 하면 반영되지 않습니다.',
      Demo: FilterSheet,
    },
    {
      title: '장바구니 서랍',
      description: '쇼핑몰에서 담은 상품을 옆에서 꺼내 보는 "서랍(Drawer)" 형태입니다.',
      Demo: CartSheet,
    },
  ],
}
