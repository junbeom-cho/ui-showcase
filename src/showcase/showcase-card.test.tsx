import { fireEvent, render, screen, within } from '@testing-library/react'
import { ShowcaseCard } from './showcase-card'
import { badge, skeleton } from './test-entries'

it('shows name, aliases, preview and description', () => {
  const { container } = render(<ShowcaseCard entry={badge} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Badge' })).toBeInTheDocument()
  expect(screen.getByText('다른 이름: Tag, Chip')).toBeInTheDocument()
  expect(within(screen.getByTestId('preview-badge')).getByText('preview of badge')).toBeInTheDocument()
  expect(screen.getByText('상태를 표시하는 작은 라벨.')).toBeInTheDocument()
  expect(container.querySelector('#badge')).not.toBeNull()
})

it('keeps "#" links inside the preview from jumping to the top of the page', () => {
  const entry = { ...badge, Preview: () => <a href="#">3</a> }
  render(<ShowcaseCard entry={entry} />)
  const notPrevented = fireEvent.click(screen.getByRole('link', { name: '3' }))
  expect(notPrevented).toBe(false)
})

it('omits the alias line when there are no aliases', () => {
  render(<ShowcaseCard entry={skeleton} />)
  expect(screen.queryByText(/다른 이름/)).toBeNull()
})
