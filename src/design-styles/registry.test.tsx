import { render } from '@testing-library/react'
import { DEMO_SLOTS, DemoApp } from './demo-app'
import { filterStyles } from './filter-styles'
import { designStyles } from './registry'

const ORDER = [
  'skeuomorphism',
  'flat',
  'material',
  'neumorphism',
  'glassmorphism',
  'claymorphism',
  'neo-brutalism',
  '3d-icons',
  'liquid-glass',
  // added in D-026
  'swiss',
  'editorial',
  'terminal',
  'y2k',
  'memphis',
  'aurora',
]

it('lists the 15 styles in the fixed order', () => {
  expect(designStyles.map((s) => s.id)).toEqual(ORDER)
})

it('gives every style its names, description and context', () => {
  for (const s of designStyles) {
    expect(s.name.trim(), s.id).not.toBe('')
    expect(s.englishName.trim(), s.id).not.toBe('')
    expect(s.description.trim(), s.id).not.toBe('')
    expect(s.context.trim(), s.id).not.toBe('')
  }
})

it.each(designStyles.map((s) => [s.id, s] as const))('%s has 3–4 traits pointing at demo slots', (_id, s) => {
  expect(s.traits.length).toBeGreaterThanOrEqual(3)
  expect(s.traits.length).toBeLessThanOrEqual(4)
  const { container } = render(<DemoApp styleId={s.id} />)
  for (const t of s.traits) {
    expect(DEMO_SLOTS).toContain(t.slot)
    expect(container.querySelector(`[data-slot="${t.slot}"]`), t.slot).not.toBeNull()
    expect(t.title.trim()).not.toBe('')
    expect(t.description.trim()).not.toBe('')
  }
})

it('renders the same text in every style', () => {
  const texts = designStyles.map((s) => render(<DemoApp styleId={s.id} />).container.textContent)
  expect(new Set(texts).size).toBe(1)
  for (const copy of ['김하늘', '새 프로젝트', '최근 프로젝트', '알림 받기', '자동 백업', '저장 공간', '70%', '저장', '취소']) {
    expect(texts[0]).toContain(copy)
  }
})

it('filterStyles finds by Korean, English and alias', () => {
  expect(filterStyles(designStyles, 'soft ui').map((s) => s.id)).toEqual(['neumorphism'])
  expect(filterStyles(designStyles, '클레이').map((s) => s.id)).toEqual(['claymorphism'])
  expect(filterStyles(designStyles, 'GLASS').map((s) => s.id)).toEqual(['glassmorphism', 'liquid-glass'])
})
