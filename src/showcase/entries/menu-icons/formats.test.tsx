import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { menuIconsEntry } from '.'
import {
  BentoFormat,
  DonerFormat,
  HamburgerFormat,
  KebabFormat,
  MeatballsFormat,
  SlidersFormat,
  StairsFormat,
  VeggieBurgerFormat,
  WaffleFormat,
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
  it('is a navigation entry that search finds by every nickname', () => {
    expect(menuIconsEntry.id).toBe('menu-icons')
    expect(menuIconsEntry.name).toBe('Menu Icons')
    expect(menuIconsEntry.category).toBe('navigation')
    expect(menuIconsEntry.description).toMatch(/[가-힣].*\.$/)
    for (const query of [
      'Hamburger',
      'Kebab',
      'Meatballs',
      'Waffle',
      'Bento',
      'Döner',
      'Doner',
      'Veggie burger',
      'Stairs',
      'Sliders',
      '햄버거',
      '케밥',
      '미트볼',
      '와플',
      '벤토',
      '도너',
      '베지 버거',
      '계단',
      '슬라이더',
      '메뉴 아이콘',
    ]) {
      expect(filterEntries([menuIconsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists one example per icon after the state gallery, then the comparison', () => {
    expect(menuIconsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '햄버거',
      '케밥',
      '미트볼',
      '와플',
      '벤토',
      '도너',
      '베지 버거',
      '계단',
      '슬라이더',
      '한눈에 비교',
    ])
    for (const x of menuIconsEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with the hamburger button in each state, pinning pointer and keyboard ones', () => {
    const States = menuIconsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual(['기본', '호버', '눌림', '포커스', '열림', '알림 점'])
    const button = (i: number) => within(items[i]).getByRole('button')
    expect(button(0)).toHaveAccessibleName('메뉴 열기')
    expect(button(1)).toHaveAttribute('data-demo-state', 'hover')
    expect(button(2)).toHaveAttribute('data-demo-state', 'hover active')
    expect(button(3)).toHaveAttribute('data-demo-state', 'focus')
    expect(button(4)).toHaveAttribute('aria-expanded', 'true')
    expect(button(5)).toHaveAccessibleName('메뉴 열기, 새 소식 있음')
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = menuIconsEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = menuIconsEntry.anatomy
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })

  it('compares all nine and names the one picked', async () => {
    const u = user()
    const Compare = menuIconsEntry.examples.at(-1)!.Demo
    render(<Compare />)
    const cards = within(screen.getByRole('list', { name: '메뉴 아이콘 9가지' })).getAllByRole('button')
    expect(cards).toHaveLength(9)
    await u.click(cards[4])
    expect(cards[4]).toHaveAttribute('aria-pressed', 'true')
    expect(status()).toHaveTextContent('05 벤토(Bento)')
    expect(status()).toHaveTextContent('“전체 카테고리”')
  })
})

it('hamburger: opens the drawer inside the phone and returns focus to ☰ on Esc', async () => {
  const u = user()
  const { container } = render(<HamburgerFormat />)
  const opener = screen.getByRole('button', { name: '메뉴 열기' })
  await u.click(opener)
  const drawer = screen.getByRole('dialog', { name: '메뉴' })
  expect(container.contains(drawer)).toBe(true)
  // the modal drawer hides the rest of the page from screen readers while it is open
  expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('서랍 열림')

  await u.click(within(drawer).getByRole('link', { name: '저장함' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('현재 화면: 저장함 · 서랍 닫힘')

  await u.click(opener)
  expect(within(screen.getByRole('dialog')).getByRole('link', { name: '저장함' })).toHaveAttribute('aria-current', 'page')
  await u.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

it('kebab: each row has its own ⋮ whose actions act on that row', async () => {
  const u = user()
  render(<KebabFormat />)
  await u.click(screen.getByRole('button', { name: '회의록.docx 더보기' }))
  await u.click(screen.getByRole('menuitemcheckbox', { name: '즐겨찾기' }))
  expect(status()).toHaveTextContent('‘회의록.docx’ 즐겨찾기 추가')
  expect(screen.getByLabelText('즐겨찾기')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '기획서.pdf 더보기' }))
  await u.click(screen.getByRole('menuitem', { name: '삭제' }))
  expect(screen.queryByText('기획서.pdf')).toBeNull()
  expect(status()).toHaveTextContent('‘기획서.pdf’ 삭제 · 파일 2개')
})

it('meatballs: saves, hides and restores the post', async () => {
  const u = user()
  render(<MeatballsFormat />)
  const options = () => screen.getByRole('button', { name: '게시물 옵션' })
  await u.click(options())
  await u.click(screen.getByRole('menuitemcheckbox', { name: '저장' }))
  expect(status()).toHaveTextContent('글을 저장했습니다')

  await u.click(options())
  await u.click(screen.getByRole('menuitem', { name: '이 글 숨기기' }))
  expect(screen.queryByRole('article')).toBeNull()
  await u.click(screen.getByRole('button', { name: '되돌리기' }))
  expect(screen.getByRole('article', { name: '김하늘의 글' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('숨기기를 되돌렸습니다')
})

it('waffle: the launcher switches to another app', async () => {
  const u = user()
  render(<WaffleFormat />)
  await u.click(screen.getByRole('button', { name: '앱 목록' }))
  const launcher = screen.getByRole('dialog', { name: '앱 목록' })
  expect(within(launcher).getAllByRole('button')).toHaveLength(9)
  await u.click(within(launcher).getByRole('button', { name: '캘린더' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('work.example/캘린더')).toBeInTheDocument()
  expect(status()).toHaveTextContent('지금 앱: 캘린더 · 앱 런처 닫힘')
})

it('bento: the tiled board picks a category', async () => {
  const u = user()
  render(<BentoFormat />)
  await u.click(screen.getByRole('button', { name: '전체 카테고리' }))
  await u.click(within(screen.getByRole('dialog', { name: '전체 카테고리' })).getByRole('button', { name: '도서' }))
  expect(status()).toHaveTextContent('카테고리: 도서 · 판 닫힘')
  await u.click(screen.getByRole('button', { name: '전체 카테고리' }))
  expect(screen.getByRole('button', { name: '도서' })).toHaveAttribute('aria-current', 'true')
})

it('döner: filters narrow the list and the button says how many apply', async () => {
  const u = user()
  render(<DonerFormat />)
  expect(status()).toHaveTextContent('필터 0개 적용 · 상품 6개 보임')
  await u.click(screen.getByRole('button', { name: '필터' }))
  await u.click(screen.getByRole('checkbox', { name: '하의' }))
  await u.click(screen.getByRole('checkbox', { name: '품절 빼기' }))
  expect(status()).toHaveTextContent('필터 2개 적용 · 상품 1개 보임')
  expect(within(screen.getByRole('list', { name: '상품' })).getByText('청바지')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '필터, 2개 적용' })).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '초기화' }))
  expect(status()).toHaveTextContent('필터 0개 적용 · 상품 6개 보임')
})

it('veggie burger: = opens a short menu, while the look-alike handle reorders rows', async () => {
  const u = user()
  render(<VeggieBurgerFormat />)
  await u.click(screen.getByRole('button', { name: '메뉴' }))
  await u.click(screen.getByRole('menuitem', { name: '구독' }))
  expect(status()).toHaveTextContent('메뉴에서 ‘구독’을 골랐습니다')

  const handle = screen.getByRole('button', { name: '디자인 원칙 10가지 순서 바꾸기' })
  await u.click(handle)
  expect(status()).toHaveTextContent('손잡이는 메뉴를 열지 않습니다')
  expect(screen.queryByRole('menu')).toBeNull()
  act(() => handle.focus())
  await u.keyboard('{ArrowDown}')
  const rows = within(screen.getByRole('list', { name: '읽을 목록' })).getAllByRole('listitem')
  expect(rows.map((r) => r.textContent)).toEqual(['아이콘 이름 짓기', '디자인 원칙 10가지', '좋은 툴팁 쓰기'])
  expect(status()).toHaveTextContent('2번째로 옮겼습니다')
})

it('stairs: picking a sort order changes what comes first', async () => {
  const u = user()
  render(<StairsFormat />)
  expect(status()).toHaveTextContent('정렬: 최신순 · 맨 위 스니커즈')
  await u.click(screen.getByRole('button', { name: '정렬, 지금 최신순' }))
  await u.click(screen.getByRole('menuitemradio', { name: '낮은 가격순' }))
  expect(status()).toHaveTextContent('정렬: 낮은 가격순 · 맨 위 반팔 티')
  expect(screen.getByRole('button', { name: '정렬, 지금 낮은 가격순' })).toBeInTheDocument()
})

it('sliders: the settings change how the article reads, and reset', async () => {
  const u = user()
  render(<SlidersFormat />)
  await u.click(screen.getByRole('button', { name: '보기 설정' }))
  const size = screen.getByRole('slider', { name: '글자 크기' })
  act(() => size.focus())
  await u.keyboard('{End}')
  expect(status()).toHaveTextContent('글자 크기 22px · 줄 간격 1.6')
  await u.click(screen.getByRole('button', { name: '기본값으로' }))
  expect(status()).toHaveTextContent('글자 크기 15px · 줄 간격 1.6')
})
