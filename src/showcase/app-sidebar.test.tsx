import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavList } from './app-sidebar'
import { items } from './test-entries'

const user = userEvent.setup()
const nav = () => screen.getByRole('navigation', { name: '컴포넌트 목록' })

it('groups links by category with an overview link first', () => {
  render(<NavList entries={items} currentId={null} />)
  expect(within(nav()).getByRole('link', { name: '개요' })).toHaveAttribute('href', '#/')
  expect(within(nav()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
    '정보 표시',
    '피드백',
    '오버레이',
  ])
  expect(within(nav()).getByRole('link', { name: 'Dialog' })).toHaveAttribute('href', '#/dialog')
})

it('marks the current component', () => {
  render(<NavList entries={items} currentId="badge" />)
  expect(within(nav()).getByRole('link', { name: 'Badge' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav()).getByRole('link', { name: 'Dialog' })).not.toHaveAttribute('aria-current')
})

it('filters links by name, alias or description', async () => {
  render(<NavList entries={items} currentId={null} />)
  await user.type(screen.getByRole('searchbox', { name: '컴포넌트 검색' }), 'modal')
  const links = within(nav()).getAllByRole('link').map((a) => a.textContent)
  expect(links).toEqual(['개요', 'Dialog'])
})

it('says so when nothing matches', async () => {
  render(<NavList entries={items} currentId={null} />)
  await user.type(screen.getByRole('searchbox', { name: '컴포넌트 검색' }), 'xyz')
  expect(screen.getByText("'xyz'와 일치하는 컴포넌트가 없습니다.")).toBeInTheDocument()
})

it('calls onNavigate when a link is chosen', async () => {
  const onNavigate = vi.fn()
  render(<NavList entries={items} currentId={null} onNavigate={onNavigate} />)
  await user.click(within(nav()).getByRole('link', { name: 'Badge' }))
  expect(onNavigate).toHaveBeenCalled()
})
