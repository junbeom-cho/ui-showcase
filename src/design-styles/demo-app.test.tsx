import { fireEvent, render, screen } from '@testing-library/react'
import { DemoApp } from './demo-app'

it('scopes the demo with data-design-style', () => {
  const { container } = render(<DemoApp styleId="flat" />)
  expect(container.firstElementChild).toHaveAttribute('data-design-style', 'flat')
})

it('labels the search box and the storage bar', () => {
  render(<DemoApp styleId="flat" />)
  expect(screen.getByRole('textbox', { name: '설정 검색' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: '저장 공간 70%' })).toBeInTheDocument()
  expect(screen.getByRole('switch', { name: '알림 받기' })).toBeChecked()
  expect(screen.getByRole('switch', { name: '자동 백업' })).not.toBeChecked()
})

it('uses line icons outside the 3d-icons style', () => {
  render(<DemoApp styleId="flat" />)
  expect(screen.queryByAltText('알림 아이콘')).toBeNull()
})

it('uses 3D images only in the 3d-icons style', () => {
  render(<DemoApp styleId="3d-icons" />)
  expect(screen.getByAltText('알림 아이콘')).toHaveAttribute('src', expect.stringContaining('icons-3d/bell.png'))
  for (const alt of ['검색 아이콘', '백업 아이콘', '저장 공간 아이콘']) {
    expect(screen.getByAltText(alt)).toBeInTheDocument()
  }
})

it('bends the liquid-glass backdrop only near the card edges', () => {
  const { container } = render(<DemoApp styleId="liquid-glass" />)
  const filter = container.querySelector('filter#liquid-glass-refraction')!
  const edgeMap = filter.querySelector('feImage')
  expect(edgeMap, 'edge displacement map').not.toBeNull()
  expect(filter.querySelector('feTurbulence'), 'whole-card noise').toBeNull()
  expect(filter.querySelector('feDisplacementMap')).toHaveAttribute('in2', edgeMap!.getAttribute('result')!)
})

it('falls back to a line icon when a 3D image fails to load', () => {
  const { container } = render(<DemoApp styleId="3d-icons" />)
  fireEvent.error(screen.getByAltText('알림 아이콘'))
  expect(screen.queryByAltText('알림 아이콘')).toBeNull()
  expect(container.querySelector('[data-slot="demo-icon-bell"] svg')).not.toBeNull()
})
