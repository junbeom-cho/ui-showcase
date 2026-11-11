import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Gallery } from './gallery'
import { items } from './test-entries'

const user = userEvent.setup()
const searchBox = () => screen.getByRole('searchbox', { name: '컴포넌트 검색' })

it('shows every entry and the count', () => {
  render(<Gallery entries={items} />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
  expect(screen.getByText('3개 컴포넌트')).toBeInTheDocument()
})

it('filters as the user types and restores on clear', async () => {
  render(<Gallery entries={items} />)
  await user.type(searchBox(), 'modal')
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dialog'])
  expect(screen.getByText('1개 컴포넌트')).toBeInTheDocument()
  await user.clear(searchBox())
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
})

it('shows an empty state when nothing matches', async () => {
  render(<Gallery entries={items} />)
  await user.type(searchBox(), 'xyz')
  expect(screen.getByText("'xyz'에 해당하는 컴포넌트가 없습니다.")).toBeInTheDocument()
  expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
})
