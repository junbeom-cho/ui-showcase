import type { ShowcaseEntry } from './types'

const make = (id: string, name: string, aliases: string[], description: string): ShowcaseEntry => ({
  id,
  name,
  aliases,
  description,
  Preview: () => <span>preview of {id}</span>,
})

export const badge = make('badge', 'Badge', ['Tag', 'Chip'], '상태를 표시하는 작은 라벨.')
export const dialog = make('dialog', 'Dialog', ['Modal'], '화면 위에 뜨는 창.')
export const skeleton = make('skeleton', 'Skeleton', [], '로딩 중 자리표시자.')
export const items = [badge, dialog, skeleton]
