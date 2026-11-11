import { render, screen, within } from '@testing-library/react'
import { ComponentPage } from './component-page'
import { badge, dialog, items, skeleton } from './test-entries'

it('shows name, aliases, description, anatomy and examples', () => {
  render(<ComponentPage entry={badge} entries={items} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument()
  expect(screen.getByText('Tag')).toBeInTheDocument()
  expect(screen.getByText('Chip')).toBeInTheDocument()
  expect(screen.getByText('상태를 표시하는 작은 라벨.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: '생김새' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: '부분 이름' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: '예시' })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['기본', '응용'])
  expect(screen.getByText('basic badge')).toBeInTheDocument()
})

it('shows the category in the breadcrumb', () => {
  render(<ComponentPage entry={dialog} entries={items} />)
  const crumbs = screen.getByRole('navigation', { name: 'breadcrumb' })
  expect(within(crumbs).getByRole('link', { name: '개요' })).toHaveAttribute('href', '#/')
  expect(within(crumbs).getByText('오버레이')).toBeInTheDocument()
})

it('links to the previous and next components in sidebar order', () => {
  // sidebar order: badge (display) → skeleton (feedback) → dialog (overlay)
  render(<ComponentPage entry={skeleton} entries={items} />)
  const pager = screen.getByRole('navigation', { name: '이전·다음 컴포넌트' })
  expect(within(pager).getByRole('link', { name: /Badge/ })).toHaveAttribute('href', '#/badge')
  expect(within(pager).getByRole('link', { name: /Dialog/ })).toHaveAttribute('href', '#/dialog')
})

it('omits the alias row when there are none', () => {
  render(<ComponentPage entry={skeleton} entries={items} />)
  expect(screen.queryByText('다른 이름')).toBeNull()
})
