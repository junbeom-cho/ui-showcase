import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('things to try on the dashboard (D-019)', () => {
  const user = userEvent.setup()
  const sidebar = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="demo-sidebar"]')!

  it('switches views from the side menu', async () => {
    const { container } = render(<DemoApp styleId="flat" />)
    await user.click(within(sidebar(container)).getByRole('button', { name: '팀' }))
    expect(screen.getByRole('heading', { name: '팀원' })).toBeInTheDocument()
    expect(within(sidebar(container)).getByRole('button', { name: '팀' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(sidebar(container)).getByRole('button', { name: '프로젝트' }))
    expect(screen.getByRole('heading', { name: '모든 프로젝트' })).toBeInTheDocument()
    await user.click(within(sidebar(container)).getByRole('button', { name: '설정' }))
    expect(screen.getByRole('heading', { name: '계정 설정' })).toBeInTheDocument()
    await user.click(within(sidebar(container)).getByRole('button', { name: '홈' }))
    expect(screen.getByRole('heading', { name: '안녕하세요, 김하늘님' })).toBeInTheDocument()
  })

  it('changes the numbers with the period tabs', async () => {
    render(<DemoApp styleId="flat" />)
    expect(screen.getByText('12,480')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '이번 달' }))
    expect(screen.getByText('48,920')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '오늘' }))
    expect(screen.getByText('1,284')).toBeInTheDocument()
  })

  it('filters the projects with the search box', async () => {
    render(<DemoApp styleId="flat" />)
    await user.type(screen.getByRole('textbox', { name: '프로젝트 검색' }), '모바일')
    expect(screen.getAllByRole('listitem', { name: /프로젝트$/ }).map((li) => li.getAttribute('aria-label'))).toEqual([
      '모바일 앱 출시 프로젝트',
    ])
    await user.clear(screen.getByRole('textbox', { name: '프로젝트 검색' }))
    await user.type(screen.getByRole('textbox', { name: '프로젝트 검색' }), '없는 이름')
    expect(screen.getByText("'없는 이름'와 일치하는 프로젝트가 없습니다.")).toBeInTheDocument()
  })

  it('adds a project from the new-project dialog', async () => {
    render(<DemoApp styleId="flat" />)
    await user.click(screen.getByRole('button', { name: '새 프로젝트' }))
    await user.type(screen.getByRole('textbox', { name: '프로젝트 이름' }), '여름 캠페인')
    await user.click(screen.getByRole('button', { name: '만들기' }))
    expect(screen.getByRole('listitem', { name: '여름 캠페인 프로젝트' })).toBeInTheDocument()
  })

  it('opens notifications and marks them read', async () => {
    render(<DemoApp styleId="flat" />)
    await user.click(screen.getByRole('button', { name: '알림 3개' }))
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThanOrEqual(3)
    await user.click(screen.getByRole('menuitem', { name: '모두 읽음으로 표시' }))
    expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument()
  })

  it('confirms when settings are saved and restores them on cancel', async () => {
    render(<DemoApp styleId="flat" />)
    await user.click(screen.getByRole('switch', { name: '자동 백업' }))
    expect(screen.getByText('매일 새벽 3시에 백업합니다.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.getByRole('switch', { name: '자동 백업' })).not.toBeChecked()
    await user.click(screen.getByRole('switch', { name: '자동 백업' }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(screen.getByRole('status')).toHaveTextContent('설정을 저장했습니다')
  })
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
