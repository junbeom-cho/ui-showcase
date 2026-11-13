import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { navigationPatternsEntry } from '.'
import {
  HamburgerFormat,
  MegaMenuFormat,
  OverflowMenuFormat,
  SideRailFormat,
  StickyHeaderFormat,
  TabNavFormat,
  TopNavFormat,
  visibleCount,
} from './formats'

// jsdom lacks the pointer-capture and scrolling APIs that Radix menus and sliders call.
beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>
  const stubs: Record<string, () => unknown> = {
    hasPointerCapture: () => false,
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    scrollIntoView: () => {},
  }
  for (const [name, stub] of Object.entries(stubs)) {
    if (typeof proto[name] !== 'function') proto[name] = stub
  }
})

const status = () => screen.getByRole('status')
const user = () => userEvent.setup()

describe('entry', () => {
  it('is a navigation entry that search finds by every format name', () => {
    expect(navigationPatternsEntry.id).toBe('navigation-patterns')
    expect(navigationPatternsEntry.category).toBe('navigation')
    expect(navigationPatternsEntry.description).toMatch(/\.$/)
    for (const query of [
      'Navbar',
      'Hamburger menu',
      'Navigation rail',
      'Mega menu',
      'Overflow menu',
      'Sticky header',
      '햄버거 메뉴',
      '사이드 레일',
      '메가 메뉴',
      '더보기 메뉴',
      '고정 헤더',
    ]) {
      expect(filterEntries([navigationPatternsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    expect(navigationPatternsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '상단 내비게이션 바',
      '햄버거 메뉴',
      '사이드 레일',
      '메가 메뉴',
      '탭 내비게이션',
      '더보기 메뉴',
      '고정 헤더',
    ])
    for (const x of navigationPatternsEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with one menu item in each state, pinning hover and focus', () => {
    const States = navigationPatternsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '기본',
      '현재 페이지',
      '호버',
      '포커스',
      '알림 점',
      '비활성',
    ])
    const link = (i: number) => within(items[i]).getByRole('link')
    expect(link(0)).not.toHaveAttribute('aria-current')
    expect(link(1)).toHaveAttribute('aria-current', 'page')
    expect(link(2)).toHaveAttribute('data-demo-state', 'hover')
    expect(link(3)).toHaveAttribute('data-demo-state', 'focus')
    expect(link(4)).toHaveAccessibleName('소식, 새 소식 있음')
    expect(link(5)).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = navigationPatternsEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = navigationPatternsEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

it('top bar: marks the current page and folds the links into ☰ on a narrow screen', async () => {
  const u = user()
  render(<TopNavFormat />)
  const links = within(screen.getByRole('list', { name: '메뉴 링크' }))
  expect(links.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page')

  await u.click(links.getByRole('link', { name: '요금제' }))
  expect(links.getByRole('link', { name: '요금제' })).toHaveAttribute('aria-current', 'page')
  expect(links.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current')
  expect(screen.getByText('moa.example/pricing')).toBeInTheDocument()
  expect(status()).toHaveTextContent('현재 페이지: 요금제 · 넓은 화면')

  await u.click(screen.getByRole('radio', { name: '좁은 화면' }))
  const menu = screen.getByRole('button', { name: '메뉴' })
  await u.click(menu)
  expect(menu).toHaveAttribute('aria-expanded', 'true')
  const folded = within(screen.getByRole('list', { name: '접힌 메뉴' }))
  expect(folded.getByRole('link', { name: '요금제' })).toHaveAttribute('aria-current', 'page')
  await u.click(folded.getByRole('link', { name: '블로그' }))
  expect(screen.queryByRole('list', { name: '접힌 메뉴' })).toBeNull()
  expect(status()).toHaveTextContent('현재 페이지: 블로그 · 좁은 화면')

  await u.click(menu)
  await u.keyboard('{Escape}')
  expect(menu).toHaveAttribute('aria-expanded', 'false')
  expect(menu).toHaveFocus()
})

it('hamburger: focus moves into the panel, stays there, and returns to ☰ when it closes', async () => {
  const u = user()
  render(<HamburgerFormat />)
  const opener = screen.getByRole('button', { name: '메뉴 열기' })

  await u.click(opener)
  const panel = screen.getByRole('dialog', { name: '메뉴' })
  expect(within(panel).getByRole('link', { name: '홈' })).toHaveFocus()
  expect(within(panel).getByRole('link', { name: '쿠폰, 새 쿠폰 2장' })).toBeInTheDocument()
  // Tab wraps from the last control back to the first
  act(() => within(panel).getByRole('button', { name: '로그아웃' }).focus())
  await u.tab()
  expect(within(panel).getByRole('button', { name: '메뉴 닫기' })).toHaveFocus()

  await u.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
  expect(status()).toHaveTextContent('메뉴 닫힘 (Esc 키로 닫음)')

  await u.click(opener)
  await u.click(screen.getByRole('dialog').previousElementSibling as HTMLElement)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('바깥을 눌러 닫음')

  await u.click(opener)
  await u.click(within(screen.getByRole('dialog')).getByRole('link', { name: '주문 내역' }))
  expect(status()).toHaveTextContent('현재 페이지: 주문 내역 · 메뉴 닫힘 (항목을 골라 닫음)')
  await u.click(opener)
  expect(within(screen.getByRole('dialog')).getByRole('link', { name: '주문 내역' })).toHaveAttribute('aria-current', 'page')
})

it('side rail: icons only until it is widened, and the current page is marked', async () => {
  const u = user()
  render(<SideRailFormat />)
  const rail = within(screen.getByRole('navigation', { name: '앱 메뉴' }))
  expect(rail.getByRole('link', { name: '메일, 읽지 않음 12개' })).toHaveAttribute('aria-current', 'page')
  // collapsed, the name is there for screen readers only (plus a hover label)
  const hiddenName = () => rail.getByRole('link', { name: '캘린더' }).querySelector('.sr-only')
  expect(hiddenName()).toHaveTextContent('캘린더')
  expect(status()).toHaveTextContent('레일 접힘 (아이콘만)')

  await u.click(rail.getByRole('button', { name: '레일 펼치기' }))
  expect(hiddenName()).toBeNull()
  expect(rail.getAllByText('캘린더')).toHaveLength(1)
  expect(rail.getByRole('button', { name: '레일 접기' })).toBeInTheDocument()
  await u.click(rail.getByRole('link', { name: '캘린더' }))
  expect(rail.getByRole('link', { name: '캘린더' })).toHaveAttribute('aria-current', 'page')
  expect(status()).toHaveTextContent('현재: 캘린더 · 레일 펼침 (아이콘과 이름)')
})

it('mega menu: opens on click or ↓, closes with Esc or a click outside, and reports the pick', async () => {
  const u = user()
  render(<MegaMenuFormat />)
  const products = screen.getByRole('button', { name: '제품' })
  const solutions = screen.getByRole('button', { name: '솔루션' })

  await u.click(products)
  expect(products).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('region', { name: '만들기' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: '추천' })).toHaveTextContent('회의록 자동 요약')
  await u.click(screen.getByRole('link', { name: /화이트보드/ }))
  expect(products).toHaveAttribute('aria-expanded', 'false')
  expect(products).toHaveFocus()
  expect(status()).toHaveTextContent('고른 메뉴: 제품 › 화이트보드')

  act(() => solutions.focus())
  await u.keyboard('{ArrowDown}')
  expect(solutions).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: /마케팅/ })).toHaveFocus()
  await u.keyboard('{Escape}')
  expect(solutions).toHaveAttribute('aria-expanded', 'false')
  expect(solutions).toHaveFocus()

  await u.click(products)
  await u.click(status())
  expect(products).toHaveAttribute('aria-expanded', 'false')
})

it('tab navigation: links change the address and history; in-page tabs do not', async () => {
  const u = user()
  render(<TabNavFormat />)
  const back = screen.getByRole('button', { name: '뒤로' })
  expect(screen.getByText('shop.example/products/12')).toBeInTheDocument()
  expect(back).toBeDisabled()

  const sections = within(screen.getByRole('navigation', { name: '상품 정보' }))
  await u.click(sections.getByRole('link', { name: '리뷰 128' }))
  expect(sections.getByRole('link', { name: '리뷰 128' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('shop.example/products/12/reviews')).toBeInTheDocument()
  expect(status()).toHaveTextContent('주소가 /products/12/reviews로 바뀌었습니다')
  expect(status()).toHaveTextContent('방문 기록 2개')

  await u.click(screen.getByRole('tab', { name: '알림' }))
  expect(screen.getByRole('tab', { name: '알림' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('shop.example/products/12/reviews')).toBeInTheDocument()
  expect(status()).toHaveTextContent('주소와 방문 기록은 그대로예요')
  expect(status()).toHaveTextContent('방문 기록 2개')

  await u.click(back)
  expect(screen.getByText('shop.example/products/12')).toBeInTheDocument()
  expect(sections.getByRole('link', { name: '상세 정보' })).toHaveAttribute('aria-current', 'page')
  expect(status()).toHaveTextContent('뒤로 가기')
})

it('overflow menu: works out how many fit, keeping room for the 더보기 button', () => {
  expect(visibleCount(700)).toBe(9)
  expect(visibleCount(594)).toBe(9)
  expect(visibleCount(593)).toBe(7)
  expect(visibleCount(480)).toBe(5)
  expect(visibleCount(240)).toBe(2)
})

it('overflow menu: narrowing the frame moves items into 더보기, where they can still be chosen', async () => {
  const u = user()
  render(<OverflowMenuFormat />)
  expect(status()).toHaveTextContent('보이는 메뉴 5개 · 더보기 안에 4개 (IT, 날씨, 여행, 문화)')

  const width = screen.getByRole('slider', { name: '프레임 폭' })
  act(() => width.focus())
  await u.keyboard('{End}')
  expect(status()).toHaveTextContent('보이는 메뉴 9개 · 더보기 안에 0개')
  expect(screen.queryByRole('button', { name: /더보기/ })).toBeNull()
  await u.keyboard('{Home}')
  expect(status()).toHaveTextContent('보이는 메뉴 2개 · 더보기 안에 7개')

  await u.click(screen.getByRole('button', { name: '더보기' }))
  await u.click(screen.getByRole('menuitem', { name: '여행' }))
  expect(status()).toHaveTextContent('현재: 여행')
  expect(screen.getByRole('button', { name: '더보기, 현재 페이지 여행 포함' })).toBeInTheDocument()
})

it('sticky header: stays on top with a shadow once scrolled, and can step aside on the way down', async () => {
  const u = user()
  render(<StickyHeaderFormat />)
  const page = screen.getByTestId('product-page')
  const bar = screen.getByRole('group', { name: '종류' }).parentElement!
  const scrollTo = (top: number) => fireEvent.scroll(page, { target: { scrollTop: top } })
  expect(bar).toHaveClass('sticky', 'top-0', 'border-transparent')
  expect(status()).toHaveTextContent('헤더: 맨 위 · 그림자 없음 · 전체 12개')

  scrollTo(200)
  expect(bar).toHaveClass('shadow-md')
  expect(status()).toHaveTextContent('위에 붙어 있음')

  await u.click(screen.getByRole('radio', { name: '내리면 숨기기' }))
  scrollTo(400)
  expect(bar).toHaveClass('-translate-y-full')
  expect(status()).toHaveTextContent('숨김 (내리는 중, 올리면 다시 나옴)')
  scrollTo(300)
  expect(bar).not.toHaveClass('-translate-y-full')
  scrollTo(0)
  expect(status()).toHaveTextContent('맨 위 · 그림자 없음')

  await u.click(screen.getByRole('button', { name: '조명' }))
  expect(screen.getByRole('button', { name: '조명' })).toHaveAttribute('aria-pressed', 'true')
  expect(status()).toHaveTextContent('조명 4개')
})
