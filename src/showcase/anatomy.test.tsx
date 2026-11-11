import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Anatomy } from './anatomy'
import { badge } from './test-entries'

const user = userEvent.setup()
const renderBadge = () => render(<Anatomy {...badge.anatomy} />)

it('lists every part in order with its name and description', () => {
  renderBadge()
  const items = within(screen.getByRole('list', { name: '부분 이름' })).getAllByRole('listitem')
  expect(items.map((li) => li.textContent)).toEqual(['1BadgeRoot바깥 틀', '2BadgeLabel글자'])
})

it('draws one numbered marker per part found in the specimen', () => {
  renderBadge()
  expect(screen.getByText('specimen of badge')).toBeInTheDocument()
  expect(screen.getAllByTestId('anatomy-marker').map((m) => m.textContent)).toEqual(['1', '2'])
})

it('skips parts whose slot is missing instead of crashing', () => {
  const parts = [...badge.anatomy.parts, { slot: 'missing', name: 'Missing', description: '없음' }]
  render(<Anatomy Specimen={badge.anatomy.Specimen} parts={parts} />)
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(2)
})

it('hides the markers but keeps the list when the toggle is off', async () => {
  renderBadge()
  await user.click(screen.getByRole('switch', { name: '부분 번호 표시' }))
  expect(screen.queryAllByTestId('anatomy-marker')).toHaveLength(0)
  expect(screen.getByRole('list', { name: '부분 이름' })).toBeInTheDocument()
})

it('highlights the matching marker while a list item is hovered', async () => {
  renderBadge()
  await user.hover(screen.getByText('BadgeLabel'))
  const [root, label] = screen.getAllByTestId('anatomy-marker')
  expect(label).toHaveAttribute('data-state', 'active')
  expect(root).toHaveAttribute('data-state', 'dimmed')
  await user.unhover(screen.getByText('BadgeLabel'))
  expect(label).toHaveAttribute('data-state', 'idle')
})
