import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ShowcaseEntry } from '../types'

function CheckboxPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-notify" defaultChecked />
        <Label htmlFor="checkbox-notify">알림 받기</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-marketing" />
        <Label htmlFor="checkbox-marketing">마케팅 수신</Label>
      </div>
    </div>
  )
}

export const checkboxEntry: ShowcaseEntry = {
  id: 'checkbox',
  name: 'Checkbox',
  aliases: ['Check box', '체크박스'],
  description: '여러 항목 중 원하는 것을 각각 켜고 끄는 네모 선택 상자.',
  Preview: CheckboxPreview,
}
