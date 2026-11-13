import { render, screen, within } from '@testing-library/react'
import { categories } from './categories'
import { filterEntries } from './filter-entries'
import { entries } from './registry'

const ids = () => entries.map((e) => e.id)
const byId = (id: string) => entries.find((e) => e.id === id)!

it('has all 43 components with unique kebab-case ids and non-empty text', () => {
  expect(entries).toHaveLength(43)
  expect(new Set(ids()).size).toBe(entries.length)
  for (const e of entries) {
    expect(e.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
    expect(e.name.trim()).not.toBe('')
    expect(e.description.trim()).not.toBe('')
  }
})

it('is sorted by name', () => {
  const names = entries.map((e) => e.name)
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')))
})

it('puts every component in a known category and leaves no category empty', () => {
  const known = categories.map((c) => c.id)
  for (const e of entries) expect(known).toContain(e.category)
  for (const c of known) expect(entries.some((e) => e.category === c)).toBe(true)
})

it.each(entries.map((e) => [e.id, e] as const))('%s has at least 3 distinct examples', (_id, e) => {
  expect(e.examples.length).toBeGreaterThanOrEqual(3)
  expect(new Set(e.examples.map((x) => x.title)).size).toBe(e.examples.length)
  for (const x of e.examples) expect(x.description.trim()).not.toBe('')
})

it.each(entries.map((e) => [e.id, e] as const))(
  '%s anatomy names parts that exist in its specimen',
  (_id, e) => {
    expect(e.anatomy.parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<e.anatomy.Specimen />)
    for (const part of e.anatomy.parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
      expect(part.description.trim()).not.toBe('')
    }
  },
)

it.each(entries.map((e) => [e.id, e] as const))('%s opens its examples with a labelled state gallery', (_id, e) => {
  expect(e.examples[0].title).toBe('상태 모음')
  const States = e.examples[0].Demo
  render(<States />)
  const list = screen.getByRole('list', { name: '상태 모음' })
  expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(4)
})

it('shows every button state, pinning the pointer and keyboard ones', () => {
  const States = byId('button').examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '호버', '눌림', '포커스', '비활성', '로딩', '성공', '오류', '선택됨',
  ])
  const button = (label: string) =>
    items.find((li) => li.lastElementChild?.textContent === label)!.querySelector('button')!
  expect(button('호버')).toHaveAttribute('data-demo-state', 'hover')
  expect(button('눌림')).toHaveAttribute('data-demo-state', 'hover active')
  expect(button('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(button('비활성')).toBeDisabled()
  expect(button('로딩')).toBeDisabled()
  expect(button('선택됨')).toHaveAttribute('aria-pressed', 'true')
})

it('shows the date picker in every format, after its day states', () => {
  const datePicker = byId('date-picker')
  expect(datePicker.category).toBe('input')
  expect(datePicker.examples.map((x) => x.title)).toEqual([
    '상태 모음',
    '캘린더',
    '휠 피커',
    '기간 선택',
    '빠른 선택 칩',
    '시간 슬롯',
    '월 선택',
    '날짜 입력',
    '체크인·체크아웃',
    '반복 설정',
  ])
})

it('shows the same places in every list format, after the row states', () => {
  const lists = byId('list-views')
  expect(lists.category).toBe('display')
  expect(lists.examples.map((x) => x.title)).toEqual([
    '상태 모음',
    '리스트',
    '그리드',
    '카드',
    '캐러셀',
    '테이블',
    '타임라인',
    '아코디언',
    '메이슨리',
    '무한 스크롤',
  ])
})

it.each(['Masonry', 'Carousel', 'Timeline', 'Infinite scroll', '목록'])('finds the list formats as %s', (query) => {
  expect(filterEntries(entries, query).map((e) => e.id)).toContain('list-views')
})

it.each([
  ['Calendar', 'date-picker'],
  ['달력', 'date-picker'],
])('finds the date picker as %s', (query, id) => {
  expect(filterEntries(entries, query).map((e) => e.id)).toContain(id)
})

it.each(entries.map((e) => [e.id, e] as const))('%s preview and examples render', (_id, e) => {
  expect(() => render(<e.Preview />)).not.toThrow()
  for (const x of e.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it.each([
  ['Modal', 'dialog'],
  ['Drawer', 'sheet'],
  ['Toggle', 'switch'],
  ['Chip', 'badge'],
  ['Divider', 'separator'],
  ['Placeholder', 'skeleton'],
])('finds %s under its shadcn name', (query, id) => {
  expect(filterEntries(entries, query).map((e) => e.id)).toContain(id)
})

it('keeps every sidebar demo inside its frame (no fixed positioning)', () => {
  const sidebar = byId('sidebar')
  const demos = [sidebar.Preview, sidebar.anatomy.Specimen, ...sidebar.examples.map((x) => x.Demo)]
  for (const Demo of demos) {
    const { container, unmount } = render(<Demo />)
    expect(container.querySelector('[class~="fixed"]')).toBeNull()
    unmount()
  }
})

it('shows avatar initials when the image is not loaded', () => {
  // jsdom never loads images, so Radix shows AvatarFallback — same as a broken image URL
  const Preview = byId('avatar').Preview
  render(<Preview />)
  expect(screen.getByText('AB')).toBeInTheDocument()
  expect(screen.getByText('CD')).toBeInTheDocument()
})
