import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { testAnimations } from '@/animations/test-animations'
import { designStyles } from '@/design-styles/registry'
import { AnimationNav, AppHeader, ComponentNav, StyleNav, sectionOf } from './app-sidebar'
import { items } from './test-entries'

const user = userEvent.setup()
const overview = { page: 'overview' } as const
const lists = { entries: items, styles: designStyles, animations: testAnimations }

describe('sectionOf', () => {
  it('maps routes to the three top-level sections', () => {
    expect(sectionOf({ page: 'overview' })).toBe('components')
    expect(sectionOf({ page: 'component', id: 'badge' })).toBe('components')
    expect(sectionOf({ page: 'styles' })).toBe('styles')
    expect(sectionOf({ page: 'style', id: 'flat' })).toBe('styles')
    expect(sectionOf({ page: 'animations' })).toBe('animations')
    expect(sectionOf({ page: 'animation', id: 'metaballs' })).toBe('animations')
  })
})

describe('AppHeader', () => {
  const tabs = () => screen.getByRole('navigation', { name: '대메뉴' })

  it('offers the three sections as top-level links', () => {
    render(<AppHeader {...lists} route={overview} />)
    expect(within(tabs()).getByRole('link', { name: 'UI 컴포넌트' })).toHaveAttribute('href', '#/')
    expect(within(tabs()).getByRole('link', { name: '스타일' })).toHaveAttribute('href', '#/styles')
    expect(within(tabs()).getByRole('link', { name: '애니메이션' })).toHaveAttribute('href', '#/animations')
  })

  it('marks the section of the current page', () => {
    const { unmount } = render(<AppHeader {...lists} route={{ page: 'component', id: 'badge' }} />)
    expect(within(tabs()).getByRole('link', { name: 'UI 컴포넌트' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs()).getByRole('link', { name: '스타일' })).not.toHaveAttribute('aria-current')
    unmount()
    const again = render(<AppHeader {...lists} route={{ page: 'style', id: 'flat' }} />)
    expect(within(tabs()).getByRole('link', { name: '스타일' })).toHaveAttribute('aria-current', 'page')
    again.unmount()
    render(<AppHeader {...lists} route={{ page: 'animation', id: 'test-wave' }} />)
    expect(within(tabs()).getByRole('link', { name: '애니메이션' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('AnimationNav', () => {
  const nav = () => screen.getByRole('navigation', { name: '애니메이션 목록' })
  const search = () => screen.getByRole('searchbox', { name: '애니메이션 검색' })

  it('lists an overview link and every animation in order, marking the current one', () => {
    render(<AnimationNav animations={testAnimations} route={{ page: 'animation', id: 'test-dots' }} />)
    const links = within(nav()).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '#/animations',
      ...testAnimations.map((a) => `#/animation/${a.id}`),
    ])
    expect(within(nav()).getByRole('link', { name: '점 무리' })).toHaveAttribute('aria-current', 'page')
  })

  it('searches by Korean, English or other names', async () => {
    render(<AnimationNav animations={testAnimations} route={{ page: 'animations' }} />)
    await user.type(search(), 'dots')
    expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['점 무리'])
    await user.clear(search())
    await user.type(search(), 'xyz')
    expect(screen.getByText("'xyz'와 일치하는 애니메이션이 없습니다.")).toBeInTheDocument()
  })
})

describe('ComponentNav', () => {
  const nav = () => screen.getByRole('navigation', { name: '컴포넌트 목록' })
  const search = () => screen.getByRole('searchbox', { name: '컴포넌트 검색' })

  it('groups links by category with an overview link first', () => {
    render(<ComponentNav entries={items} route={overview} />)
    expect(within(nav()).getByRole('link', { name: '개요' })).toHaveAttribute('href', '#/')
    expect(within(nav()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '정보 표시',
      '피드백',
      '오버레이',
    ])
    expect(within(nav()).getByRole('link', { name: 'Dialog' })).toHaveAttribute('href', '#/dialog')
    expect(within(nav()).queryByRole('link', { name: '뉴모피즘' })).toBeNull()
  })

  it('marks the current component', () => {
    render(<ComponentNav entries={items} route={{ page: 'component', id: 'badge' }} />)
    expect(within(nav()).getByRole('link', { name: 'Badge' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav()).getByRole('link', { name: '개요' })).not.toHaveAttribute('aria-current')
  })

  it('filters links by name, alias or description', async () => {
    render(<ComponentNav entries={items} route={overview} />)
    await user.type(search(), 'modal')
    expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', 'Dialog'])
  })

  it('says so when nothing matches', async () => {
    render(<ComponentNav entries={items} route={overview} />)
    await user.type(search(), 'xyz')
    expect(screen.getByText("'xyz'와 일치하는 컴포넌트가 없습니다.")).toBeInTheDocument()
  })

  it('calls onNavigate when a link is chosen', async () => {
    const onNavigate = vi.fn()
    render(<ComponentNav entries={items} route={overview} onNavigate={onNavigate} />)
    await user.click(within(nav()).getByRole('link', { name: 'Badge' }))
    expect(onNavigate).toHaveBeenCalled()
  })
})

describe('StyleNav', () => {
  const nav = () => screen.getByRole('navigation', { name: '스타일 목록' })
  const search = () => screen.getByRole('searchbox', { name: '스타일 검색' })

  it('lists an overview link and every style in order', () => {
    render(<StyleNav styles={designStyles} route={{ page: 'styles' }} />)
    const links = within(nav()).getAllByRole('link')
    expect(links[0]).toHaveTextContent('전체 보기')
    expect(links[0]).toHaveAttribute('href', '#/styles')
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links.slice(1).map((a) => a.getAttribute('href'))).toEqual(
      designStyles.map((s) => `#/style/${s.id}`),
    )
  })

  it('marks the current style', () => {
    render(<StyleNav styles={designStyles} route={{ page: 'style', id: 'flat' }} />)
    expect(within(nav()).getByRole('link', { name: '플랫 디자인' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav()).getByRole('link', { name: '전체 보기' })).not.toHaveAttribute('aria-current')
  })

  it('searches styles by Korean, English or other names', async () => {
    render(<StyleNav styles={designStyles} route={{ page: 'styles' }} />)
    await user.type(search(), 'soft ui')
    expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['뉴모피즘'])
  })

  it('says so when no style matches', async () => {
    render(<StyleNav styles={designStyles} route={{ page: 'styles' }} />)
    await user.type(search(), 'xyz')
    expect(screen.getByText("'xyz'와 일치하는 스타일이 없습니다.")).toBeInTheDocument()
  })
})
