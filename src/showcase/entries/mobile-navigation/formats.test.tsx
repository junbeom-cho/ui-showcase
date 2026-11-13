import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { mobileNavigationEntry } from '.'
import { BackNavigationFormat, FabFormat, LargeTitleFormat } from './screen-formats'
import { BottomTabFormat, TopTabsFormat } from './tab-formats'

const status = () => screen.getByRole('status')
const user = () => userEvent.setup()
const scrollTo = (el: HTMLElement, top: number) => fireEvent.scroll(el, { target: { scrollTop: top } })

describe('entry', () => {
  it('is a mobile entry that search finds by every format name', () => {
    expect(mobileNavigationEntry.id).toBe('mobile-navigation')
    expect(mobileNavigationEntry.name).toBe('Mobile Navigation')
    expect(mobileNavigationEntry.category).toBe('mobile')
    expect(mobileNavigationEntry.description).toMatch(/^[^.]*[가-힣][^.]*\.$/)
    for (const query of [
      'Tab bar',
      'Bottom navigation',
      'Top tabs',
      'Floating action button',
      'FAB',
      'Speed dial',
      'Back navigation',
      'App bar',
      'Large title',
      'Navigation stack',
      '하단 탭바',
      '상단 탭',
      '플로팅 버튼',
      '뒤로 가기',
      '앱 바',
      '모바일 내비게이션',
    ]) {
      expect(filterEntries([mobileNavigationEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    const { examples } = mobileNavigationEntry
    expect(examples.map((x) => x.title)).toEqual(['상태 모음', '하단 탭 바', '상단 탭', '플로팅 버튼', '뒤로 가기', '큰 제목 헤더'])
    for (const x of examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with one tab bar item in each state, pinning pressed and focus', () => {
    const States = mobileNavigationEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual(['기본', '선택됨', '눌림', '포커스', '알림 배지', '비활성'])
    const link = (i: number) => within(items[i]).getByRole('link')
    expect(link(0)).not.toHaveAttribute('aria-current')
    expect(link(1)).toHaveAttribute('aria-current', 'page')
    expect(link(2)).toHaveAttribute('data-demo-state', 'active')
    expect(link(3)).toHaveAttribute('data-demo-state', 'focus')
    expect(link(4)).toHaveAccessibleName('알림, 새 알림 3개')
    expect(link(5)).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = mobileNavigationEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = mobileNavigationEntry.anatomy
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
      expect(part.description.trim()).not.toBe('')
    }
  })
})

it('bottom tab bar: switching tabs changes the screen, and the cart badge counts up', async () => {
  const u = user()
  render(<BottomTabFormat />)
  const tabs = within(screen.getByRole('navigation', { name: '하단 탭' }))
  expect(tabs.getAllByRole('link')).toHaveLength(5)
  expect(tabs.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page')

  await u.click(screen.getByRole('button', { name: '머그컵 담기' }))
  expect(status()).toHaveTextContent('현재 탭: 홈 · 장바구니 3개 · 머그컵 담음')
  await u.click(tabs.getByRole('link', { name: '장바구니, 3개 담김' }))
  expect(tabs.getByRole('link', { name: '장바구니, 3개 담김' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('담은 상품 3개')).toBeInTheDocument()
  expect(screen.queryByText('오늘의 추천')).toBeNull()

  await u.click(tabs.getByRole('link', { name: '내 정보' }))
  expect(screen.getByText('단골 등급')).toBeInTheDocument()
  expect(status()).toHaveTextContent('현재 탭: 내 정보')
})

it('top tabs: tap, swipe the content, and scroll a long row of tabs', async () => {
  const u = user()
  render(<TopTabsFormat />)
  const tab = (name: string) => screen.getByRole('tab', { name })
  expect(tab('전체')).toHaveAttribute('aria-selected', 'true')
  expect(status()).toHaveTextContent('현재 탭: 전체 (7건)')

  await u.click(tab('예약 완료'))
  expect(tab('예약 완료')).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel')).toHaveTextContent('강릉 솔밭 캠핑')
  expect(screen.getByRole('tabpanel')).not.toHaveTextContent('제주 바다숙소')
  expect(status()).toHaveTextContent('현재 탭: 예약 완료 (2건) · 눌러서 바꿈')

  const area = screen.getByTestId('swipe-area')
  const swipe = (from: number, to: number) => {
    fireEvent.pointerDown(area, { clientX: from })
    fireEvent.pointerUp(area, { clientX: to })
  }
  swipe(100, 220) // finger moves right: the previous tab
  expect(tab('예약 중')).toHaveAttribute('aria-selected', 'true')
  expect(status()).toHaveTextContent('현재 탭: 예약 중 (2건) · 밀어서 바꿈')
  swipe(100, 90) // too short to count
  expect(tab('예약 중')).toHaveAttribute('aria-selected', 'true')
  swipe(220, 100)
  swipe(220, 100)
  expect(tab('예약 완료')).toHaveAttribute('aria-selected', 'true')
  expect(status()).toHaveTextContent('마지막 탭이라 더 갈 곳이 없어요')

  await u.click(screen.getByRole('radio', { name: '탭 8개 (스크롤)' }))
  expect(screen.getAllByRole('tab')).toHaveLength(8)
  expect(screen.getByRole('tablist', { name: '예약 상태' })).toHaveClass('overflow-x-auto')
  await u.click(tab('찜한 곳'))
  expect(screen.getByText('이 탭에는 아직 없어요')).toBeInTheDocument()
  await u.click(screen.getByRole('radio', { name: '탭 3개' }))
  expect(tab('전체')).toHaveAttribute('aria-selected', 'true')
})

it('floating button: hides going down, returns small going up, and opens a speed dial', async () => {
  const u = user()
  render(<FabFormat />)
  const list = screen.getByTestId('memo-list')
  const fab = screen.getByRole('button', { name: '새 메모' })
  expect(status()).toHaveTextContent('버튼: 이름과 함께 (맨 위)')

  scrollTo(list, 200)
  expect(status()).toHaveTextContent('버튼: 숨김 (내리는 중)')
  expect(fab.parentElement).toHaveAttribute('inert')
  scrollTo(list, 120)
  expect(status()).toHaveTextContent('버튼: 작게 (아이콘만)')
  expect(fab.parentElement).not.toHaveAttribute('inert')

  await u.click(fab)
  expect(fab).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByTestId('scrim')).toBeInTheDocument()
  const dial = within(screen.getByRole('list', { name: '새 메모 종류' }))
  expect(dial.getAllByRole('button').map((b) => b.textContent)).toEqual(['사진 메모', '음성 메모', '글 메모'])
  await u.click(dial.getByRole('button', { name: '글 메모' }))
  expect(screen.queryByRole('list', { name: '새 메모 종류' })).toBeNull()
  expect(fab).toHaveFocus()
  expect(status()).toHaveTextContent('글 메모를 골랐어요')

  await u.click(fab)
  await u.click(screen.getByTestId('scrim'))
  expect(screen.queryByTestId('scrim')).toBeNull()
  expect(status()).toHaveTextContent('바깥을 눌러 닫음')

  await u.click(fab)
  await u.keyboard('{Escape}')
  expect(fab).toHaveAttribute('aria-expanded', 'false')
  expect(status()).toHaveTextContent('Esc로 닫음')
})

it('back navigation: screens stack up, ‹ pops one, and home clears them all', async () => {
  const u = user()
  render(<BackNavigationFormat />)
  expect(screen.queryByRole('button', { name: /뒤로/ })).toBeNull()
  expect(status()).toHaveTextContent('쌓인 화면: 목록')

  await u.click(screen.getByRole('button', { name: '핸드밀' }))
  await u.click(screen.getByRole('button', { name: '리뷰 128개 보기' }))
  expect(status()).toHaveTextContent('쌓인 화면: 목록 › 상품 상세 › 리뷰')
  expect(screen.getByText('배송이 빨랐어요')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '뒤로, 상품 상세' }))
  expect(screen.getByText('핸드밀')).toBeInTheDocument()
  expect(status()).toHaveTextContent('쌓인 화면: 목록 › 상품 상세 · 뒤로: 리뷰 화면을 닫고 상품 상세 화면으로 돌아옴')
  expect(screen.getByRole('button', { name: '뒤로, 목록' })).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '리뷰 128개 보기' }))
  await u.click(screen.getByRole('button', { name: '홈으로' }))
  expect(status()).toHaveTextContent('쌓인 화면: 목록 · 홈으로: 쌓인 화면을 모두 닫음')
  expect(screen.queryByRole('button', { name: /뒤로/ })).toBeNull()
})

it('large title: the big title folds into the bar as the page scrolls', () => {
  render(<LargeTitleFormat />)
  const page = screen.getByTestId('settings-page')
  const bigTitle = screen.getByRole('heading', { name: '설정' })
  expect(status()).toHaveTextContent('제목: 크게 (맨 위)')

  scrollTo(page, 24)
  expect(status()).toHaveTextContent('제목: 줄어드는 중')
  expect(bigTitle).toHaveStyle({ opacity: '0.5' })

  scrollTo(page, 120)
  expect(status()).toHaveTextContent('제목: 바 안으로 접힘')
  expect(bigTitle).toHaveStyle({ opacity: '0' })

  scrollTo(page, 0)
  expect(status()).toHaveTextContent('제목: 크게 (맨 위)')
})
