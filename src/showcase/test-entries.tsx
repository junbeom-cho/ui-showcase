import type { CategoryId, ShowcaseEntry } from './types'

const make = (
  id: string,
  name: string,
  aliases: string[],
  description: string,
  category: CategoryId,
): ShowcaseEntry => ({
  id,
  name,
  aliases,
  description,
  category,
  Preview: () => <span>preview of {id}</span>,
  anatomy: {
    Specimen: () => (
      <div data-slot={`${id}-root`}>
        <span data-slot={`${id}-label`}>specimen of {id}</span>
      </div>
    ),
    parts: [
      { slot: `${id}-root`, name: `${name}Root`, description: '바깥 틀' },
      { slot: `${id}-label`, name: `${name}Label`, description: '글자' },
    ],
  },
  examples: [
    { title: '기본', description: `${name} 기본 예시`, Demo: () => <span>basic {id}</span> },
    { title: '응용', description: `${name} 응용 예시`, Demo: () => <a href="#">link in {id}</a> },
  ],
})

export const badge = make('badge', 'Badge', ['Tag', 'Chip'], '상태를 표시하는 작은 라벨.', 'display')
export const dialog = make('dialog', 'Dialog', ['Modal'], '화면 위에 뜨는 창.', 'overlay')
export const skeleton = make('skeleton', 'Skeleton', [], '로딩 중 자리표시자.', 'feedback')
export const items = [badge, dialog, skeleton]
