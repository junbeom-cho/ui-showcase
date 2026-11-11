import { render, screen, within } from '@testing-library/react'
import { OverviewPage } from './overview-page'
import { items } from './test-entries'

it('shows one section per category with a card per component', () => {
  render(<OverviewPage entries={items} />)
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
    '정보 표시',
    '피드백',
    '오버레이',
  ])
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    'Badge',
    'Skeleton',
    'Dialog',
  ])
})

it('links each card to its component page', () => {
  render(<OverviewPage entries={items} />)
  const card = screen.getByRole('heading', { level: 3, name: 'Dialog' }).closest('article')!
  expect(within(card).getByRole('link', { name: 'Dialog' })).toHaveAttribute('href', '#/dialog')
  expect(within(card).getByText('preview of dialog')).toBeInTheDocument()
})
