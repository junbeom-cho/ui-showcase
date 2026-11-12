import { fireEvent, render, screen } from '@testing-library/react'
import { ICON_NAMES, StyleIcon } from './style-icon'

it('offers twelve icons', () => {
  expect(ICON_NAMES).toEqual([
    'search', 'bell', 'cloud', 'storage', 'home', 'projects', 'team', 'settings', 'mail', 'heart', 'camera', 'chart',
  ])
})

it('draws a line icon in a box the style CSS can dress', () => {
  const { container } = render(<StyleIcon name="heart" styleId="flat" />)
  const box = container.firstElementChild!
  expect(box).toHaveAttribute('data-style-icon', 'heart')
  expect(box.querySelector('svg')).not.toBeNull()
})

it('uses the rendered 3D image in the 3d-icons style', () => {
  render(<StyleIcon name="heart" styleId="3d-icons" />)
  expect(screen.getByAltText('하트 아이콘')).toHaveAttribute('src', expect.stringContaining('icons-3d/heart.png'))
})

it('falls back to the line icon when the 3D image fails', () => {
  const { container } = render(<StyleIcon name="heart" styleId="3d-icons" />)
  fireEvent.error(screen.getByAltText('하트 아이콘'))
  expect(container.querySelector('[data-style-icon] svg')).not.toBeNull()
})

it('can carry a data-slot for traits', () => {
  const { container } = render(<StyleIcon name="bell" styleId="flat" slot="demo-icon-bell" />)
  expect(container.firstElementChild).toHaveAttribute('data-slot', 'demo-icon-bell')
})
