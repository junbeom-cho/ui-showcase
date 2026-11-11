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

export const tooltipEntry: ShowcaseEntry = {
  id: 'tooltip',
  name: 'Tooltip',
  aliases: ['Hint', '툴팁'],
  description: '요소에 마우스를 올리거나 포커스하면 잠깐 나타나는 짧은 설명.',
  Preview: TooltipPreview,
}
