import { Button } from '@/components/ui/button'
import type { ShowcaseEntry } from '../types'

function ButtonPreview() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button>Button</Button>
      <Button variant="secondary">Button</Button>
      <Button variant="outline">Button</Button>
      <Button variant="ghost">Button</Button>
    </div>
  )
}

export const buttonEntry: ShowcaseEntry = {
  id: 'button',
  name: 'Button',
  aliases: ['CTA', '버튼'],
  description: '누르면 동작을 실행하는 요소.',
  Preview: ButtonPreview,
}
