import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ShowcaseEntry } from '../types'

function SwitchPreview() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-dark-mode" />
      <Label htmlFor="switch-dark-mode">다크 모드</Label>
    </div>
  )
}

export const switchEntry: ShowcaseEntry = {
  id: 'switch',
  name: 'Switch',
  aliases: ['Toggle', 'Toggle switch', '스위치'],
  description: '설정을 바로 켜거나 끄는 좌우 슬라이드 형태의 토글.',
  Preview: SwitchPreview,
}
