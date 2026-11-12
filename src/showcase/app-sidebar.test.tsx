import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { designStyles } from '@/design-styles/registry'
import { AppHeader, ComponentNav, StyleNav, sectionOf } from './app-sidebar'
import { items } from './test-entries'

const user = userEvent.setup()
const overview = { page: 'overview' } as const

describe('sectionOf', () => {
  it('maps routes to the two top-level sections', () => {
    expect(sectionOf({ page: 'overview' })).toBe('components')
    expect(sectionOf({ page: 'component', id: 'badge' })).toBe('components')
    expect(sectionOf({ page: 'styles' })).toBe('styles')
    expect(sectionOf({ page: 'style', id: 'flat' })).toBe('styles')
  })
})

describe('AppHeader', () => {
  const tabs = () => screen.getByRole('navigation', { name: '대메뉴' })

  it('offers the two sections as top-level links', () => {
    render(<AppHeader entries={items} styles={designStyles} route={overview} />)
    expect(within(tabs()).getByRole('link', { name: 'UI 컴포넌트' })).toHaveAttribute('href', '#/')
    expect(within(tabs()).getByRole('link', { name: '스타일' })).toHaveAttribute('href', '#/styles')
  })

  it('marks the section of the current page', () => {
    const { unmount } = render(
      <AppHeader entries={items} styles={designStyles} route={{ page: 'component', id: 'badge' }} />,
    )
    expect(within(tabs()).getByRole('link', { name: 'UI 컴포넌트' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs()).getByRole('link', { name: '스타일' })).not.toHaveAttribute('aria-current')
    unmount()
    render(<AppHeader entries={items} styles={designStyles} route={{ page: 'style', id: 'flat' }} />)
    expect(within(tabs()).getByRole('link', { name: '스타일' })).toHaveAttribute('aria-current', 'page')
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
