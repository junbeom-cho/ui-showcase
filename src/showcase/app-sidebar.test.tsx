import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { designStyles } from '@/design-styles/registry'
import { NavList } from './app-sidebar'
import { items } from './test-entries'

const user = userEvent.setup()
const nav = () => screen.getByRole('navigation', { name: '탐색 목록' })
const search = () => screen.getByRole('searchbox', { name: '검색' })
const overview = { page: 'overview' } as const

it('groups links by category with an overview link first', () => {
  render(<NavList entries={items} styles={[]} route={overview} />)
  expect(within(nav()).getByRole('link', { name: '개요' })).toHaveAttribute('href', '#/')
  expect(within(nav()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
    '정보 표시',
    '피드백',
    '오버레이',
  ])
  expect(within(nav()).getByRole('link', { name: 'Dialog' })).toHaveAttribute('href', '#/dialog')
})

it('marks the current component', () => {
  render(<NavList entries={items} styles={designStyles} route={{ page: 'component', id: 'badge' }} />)
  expect(within(nav()).getByRole('link', { name: 'Badge' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav()).getByRole('link', { name: 'Dialog' })).not.toHaveAttribute('aria-current')
  expect(within(nav()).getByRole('link', { name: '개요' })).not.toHaveAttribute('aria-current')
})

it('filters links by name, alias or description', async () => {
  render(<NavList entries={items} styles={[]} route={overview} />)
  await user.type(search(), 'modal')
  expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', 'Dialog'])
})

it('says so when nothing matches', async () => {
  render(<NavList entries={items} styles={designStyles} route={overview} />)
  await user.type(search(), 'xyz')
  expect(screen.getByText("'xyz'와 일치하는 항목이 없습니다.")).toBeInTheDocument()
})

it('calls onNavigate when a link is chosen', async () => {
  const onNavigate = vi.fn()
  render(<NavList entries={items} styles={designStyles} route={overview} onNavigate={onNavigate} />)
  await user.click(within(nav()).getByRole('link', { name: 'Badge' }))
  expect(onNavigate).toHaveBeenCalled()
})

it('adds a design-style group after the component categories', () => {
  render(<NavList entries={items} styles={designStyles} route={overview} />)
  const headings = within(nav()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(headings.at(-1)).toBe('디자인 스타일')
  expect(within(nav()).getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '#/styles')
  expect(within(nav()).getByRole('link', { name: '뉴모피즘' })).toHaveAttribute('href', '#/style/neumorphism')
})

it('marks the current style and the style index', () => {
  const { unmount } = render(<NavList entries={items} styles={designStyles} route={{ page: 'style', id: 'flat' }} />)
  expect(within(nav()).getByRole('link', { name: '플랫 디자인' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav()).getByRole('link', { name: '개요' })).not.toHaveAttribute('aria-current')
  unmount()
  render(<NavList entries={items} styles={designStyles} route={{ page: 'styles' }} />)
  expect(within(nav()).getByRole('link', { name: '전체 보기' })).toHaveAttribute('aria-current', 'page')
})

it('searches styles and components together', async () => {
  render(<NavList entries={items} styles={designStyles} route={overview} />)
  await user.type(search(), 'soft ui')
  expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', '뉴모피즘'])
})

it('hides the style group when no style matches', async () => {
  render(<NavList entries={items} styles={designStyles} route={overview} />)
  await user.type(search(), 'modal')
  expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', 'Dialog'])
  expect(within(nav()).queryByRole('heading', { name: '디자인 스타일' })).toBeNull()
})
