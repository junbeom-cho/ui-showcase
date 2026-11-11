import { BoldIcon, CopyIcon, ItalicIcon, Share2Icon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ShowcaseEntry } from '../types'

function TooltipPreview() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">마우스를 올려 보세요</Button>
        </TooltipTrigger>
        <TooltipContent>짧은 설명이 여기에 표시됩니다</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Static drawing of an open tooltip; a live one would portal to <body>. */
function TooltipSpecimen() {
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <div
        data-slot="tooltip-content"
        className="relative rounded-md bg-foreground px-3 py-1.5 text-xs text-background"
      >
        링크 복사
        <span
          data-slot="tooltip-arrow"
          className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-foreground"
        />
      </div>
      <Button variant="outline" size="icon" data-slot="tooltip-trigger" tabIndex={-1} aria-label="링크 복사">
        <CopyIcon />
      </Button>
    </div>
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
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-2">
        {sides.map(({ side, label }) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline">{label}</Button>
            </TooltipTrigger>
            <TooltipContent side={side}>side="{side}"</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

const tools = [
  { icon: BoldIcon, label: '굵게', keys: 'Ctrl+B' },
  { icon: ItalicIcon, label: '기울임', keys: 'Ctrl+I' },
  { icon: Share2Icon, label: '공유하기' },
  { icon: TrashIcon, label: '삭제' },
]

function IconToolbar() {
  return (
    <TooltipProvider>
      <div role="toolbar" aria-label="편집 도구" className="flex gap-1 rounded-lg border bg-background p-1">
        {tools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tool.label}>
                <tool.icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {tool.label}
              {tool.keys && <span className="opacity-60">{tool.keys}</span>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

function Delays() {
  return (
    <div className="flex gap-3">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">바로 뜨기</Button>
          </TooltipTrigger>
          <TooltipContent>delayDuration 0ms</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider delayDuration={800}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">천천히 뜨기</Button>
          </TooltipTrigger>
          <TooltipContent>delayDuration 800ms</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export const tooltipEntry: ShowcaseEntry = {
  id: 'tooltip',
  name: 'Tooltip',
  aliases: ['Hint', '툴팁'],
  description: '요소에 마우스를 올리거나 포커스하면 잠깐 나타나는 짧은 설명.',
  category: 'overlay',
  Preview: TooltipPreview,
  anatomy: {
    Specimen: TooltipSpecimen,
    parts: [
      { slot: 'tooltip-trigger', name: 'TooltipTrigger', description: '마우스를 올리거나 포커스하는 대상' },
      { slot: 'tooltip-content', name: 'TooltipContent', description: '잠깐 떠오르는 설명 말풍선' },
      { slot: 'tooltip-arrow', name: 'TooltipArrow', description: '말풍선이 가리키는 쪽을 알려주는 꼬리' },
    ],
  },
  examples: [
    {
      title: '아이콘 버튼 설명',
      description: '글자 없는 아이콘 버튼에 이름과 단축키를 알려주는 가장 흔한 쓰임입니다.',
      Demo: IconToolbar,
    },
    {
      title: '나오는 방향',
      description: '공간에 따라 말풍선을 위·오른쪽·아래·왼쪽에 띄웁니다. 자리가 모자라면 반대쪽으로 뒤집힙니다.',
      Demo: Sides,
    },
    {
      title: '뜨기까지 걸리는 시간',
      description: '마우스가 지나가기만 해도 뜨면 거슬리므로 보통 약간 기다린 뒤 보여줍니다. 둘을 비교해 보세요.',
      Demo: Delays,
    },
  ],
}
