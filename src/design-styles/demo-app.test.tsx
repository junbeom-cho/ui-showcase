import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoApp } from './demo-app'

it('scopes the demo with data-design-style', () => {
  const { container } = render(<DemoApp styleId="flat" />)
  expect(container.firstElementChild).toHaveAttribute('data-design-style', 'flat')
})

it('is a whole dashboard: top bar, side menu, stats, projects and settings', () => {
  const { container } = render(<DemoApp styleId="flat" />)
  expect(container.querySelector('[data-slot="demo-topbar"]')).not.toBeNull()
  expect(container.querySelector('[data-slot="demo-sidebar"]')).not.toBeNull()
  expect(screen.getByRole('heading', { name: '안녕하세요, 김하늘님' })).toBeInTheDocument()
  for (const label of ['방문자', '가입', '매출']) expect(screen.getByText(label)).toBeInTheDocument()
  for (const name of ['최근 프로젝트', '설정']) expect(screen.getByRole('heading', { name })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem', { name: /프로젝트/ })).toHaveLength(3)
})

it('labels its controls', () => {
  render(<DemoApp styleId="flat" />)
  expect(screen.getByRole('textbox', { name: '프로젝트 검색' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: '저장 공간 70%' })).toBeInTheDocument()
  expect(screen.getByRole('switch', { name: '알림 받기' })).toBeChecked()
  expect(screen.getByRole('switch', { name: '자동 백업' })).not.toBeChecked()
  for (const name of ['새 프로젝트', '저장', '취소']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  }
})

it('marks the current item in the side menu', () => {
  const { container } = render(<DemoApp styleId="flat" />)
  const sidebar = container.querySelector<HTMLElement>('[data-slot="demo-sidebar"]')!
  expect(within(sidebar).getByText('홈').closest('[aria-current]')).toHaveAttribute('aria-current', 'page')
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
