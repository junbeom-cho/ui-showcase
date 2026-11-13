import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { filterEntries } from '../../filter-entries'
import { gesturesEntry } from '.'
import {
  DoubleTapFormat,
  DragFormat,
  EdgeSwipeFormat,
  LongPressFormat,
  PinchFormat,
  PullToRefreshFormat,
  SwipeFormat,
  SwipeToDeleteFormat,
  TapFormat,
} from './formats'
import { moveItem, passes } from './gesture'

// jsdom has no pointer capture and lays nothing out: give every box a phone-sized rect.
beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>
  for (const name of ['setPointerCapture', 'releasePointerCapture']) proto[name] ??= () => {}
})
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, x: 0, y: 0, width: 240, height: 400, right: 240, bottom: 400, toJSON: () => ({}),
  } as DOMRect)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const status = () => screen.getByRole('status')
const down = (el: Element, x: number, y: number, extra: object = {}) =>
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: x, clientY: y, ...extra })
const move = (el: Element, x: number, y: number, pointerId = 1) => fireEvent.pointerMove(el, { pointerId, clientX: x, clientY: y })
const up = (el: Element, x: number, y: number, pointerId = 1) => fireEvent.pointerUp(el, { pointerId, button: 0, clientX: x, clientY: y })
/** press, move in a few steps (so the axis locks first), let go */
const stroke = (el: Element, from: [number, number], to: [number, number]) => {
  down(el, ...from)
  for (const t of [0.1, 0.5, 1]) move(el, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t)
  up(el, ...to)
}

describe('entry', () => {
  it('is a mobile entry that search finds by every gesture name', () => {
    expect(gesturesEntry.id).toBe('gestures')
    expect(gesturesEntry.category).toBe('mobile')
    expect(gesturesEntry.description).toMatch(/[가-힣].*\.$/)
    for (const query of ['Touch gestures', 'Long press', 'Swipe to delete', 'Pinch to zoom', 'Pull to refresh', 'Edge swipe', '제스처', '길게 누르기', '밀어서 삭제', '핀치', '두 번 탭', '당겨서 새로고침', '가장자리 스와이프']) {
      expect(filterEntries([gesturesEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the gestures after the state gallery, each explained in Korean', () => {
    expect(gesturesEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음', '탭', '길게 누르기', '스와이프', '밀어서 삭제', '드래그', '핀치', '두 번 탭', '당겨서 새로고침', '가장자리 스와이프',
    ])
    for (const x of gesturesEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with a touch target in each state, pinning pressed and focus', () => {
    const States = gesturesEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '기본', '눌림', '길게 누르는 중', '끄는 중', '놓음 (실행)', '취소 (밖으로 벗어남)', '비활성', '키보드 포커스',
    ])
    const button = (i: number) => within(items[i]).getByRole('button')
    expect(button(1)).toHaveAttribute('data-demo-state', 'active')
    expect(button(6)).toBeDisabled()
    expect(button(7)).toHaveAttribute('data-demo-state', 'focus')
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = gesturesEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = gesturesEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })
})

it('completes a gesture by distance or by a flick', () => {
  expect(passes(130, 0, 240)).toBe(true)
  expect(passes(60, 0, 240)).toBe(false)
  expect(passes(60, 0.9, 240)).toBe(true)
  expect(passes(5, 2, 240)).toBe(false) // a twitch is not a flick
  expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
})

it('tap: counts taps and misses, and widens the small target', () => {
  render(<TapFormat />)
  fireEvent.click(screen.getByRole('button', { name: '좋아요' }))
  expect(status()).toHaveTextContent('좋아요 1 · 저장 0 · 빗나감 0')
  fireEvent.click(screen.getByRole('button', { name: '저장' }).parentElement!)
  expect(status()).toHaveTextContent('빗나감 1')
  fireEvent.click(screen.getByRole('switch'))
  fireEvent.click(screen.getByRole('button', { name: '저장' }))
  expect(status()).toHaveTextContent('저장 (넓힌 44pt 영역)')
})

it('long press: holding opens the menu, moving cancels it, ⋯ opens it from the keyboard', () => {
  vi.useFakeTimers()
  render(<LongPressFormat />)
  const row = screen.getByText('회의 메모').closest('button')!

  down(row, 50, 50)
  act(() => vi.advanceTimersByTime(300))
  expect(screen.queryByRole('menu')).toBeNull()
  move(row, 50, 80)
  act(() => vi.advanceTimersByTime(500))
  expect(screen.queryByRole('menu')).toBeNull()
  expect(status()).toHaveTextContent('취소')
  up(row, 50, 80)

  down(row, 50, 50)
  act(() => vi.advanceTimersByTime(500))
  up(row, 50, 50)
  const menu = screen.getByRole('menu', { name: '‘회의 메모’ 메뉴' })
  expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus()
  fireEvent.click(within(menu).getByRole('menuitem', { name: '고정' }))
  expect(status()).toHaveTextContent('‘회의 메모’ 맨 위에 고정함')

  fireEvent.click(screen.getByRole('button', { name: '‘여행 계획’ 메뉴' }))
  fireEvent.click(screen.getByRole('menuitem', { name: '삭제' }))
  expect(screen.queryByText('여행 계획')).toBeNull()
})

it('swipe: a long drag or the buttons and keys turn the card; a short slow drag springs back', () => {
  render(<SwipeFormat />)
  const carousel = screen.getByRole('region', { name: /특가 카드/ })
  stroke(carousel, [200, 100], [60, 100])
  expect(status()).toHaveTextContent('2 / 4 · 새로 들어온 드리퍼 · 절반 넘게 밀어 넘김')
  stroke(carousel, [200, 100], [170, 100])
  expect(status()).toHaveTextContent('2 / 4')
  expect(status()).toHaveTextContent('덜 밀어 제자리로')
  fireEvent.click(screen.getByRole('button', { name: '다음 카드' }))
  fireEvent.keyDown(carousel, { key: 'ArrowRight' })
  expect(status()).toHaveTextContent('4 / 4')
  expect(screen.getByRole('button', { name: '다음 카드' })).toBeDisabled()
})

it('swipe to delete: past half deletes with undo, a short slide opens the button, Delete works too', () => {
  vi.useFakeTimers()
  render(<SwipeToDeleteFormat />)
  const row = (text: string) => screen.getByText(text).closest('button')!

  stroke(row('회의 자료 공유드려요'), [200, 20], [40, 20])
  act(() => vi.advanceTimersByTime(200))
  expect(screen.queryByText('회의 자료 공유드려요')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '되돌리기' }))
  expect(screen.getByText('회의 자료 공유드려요')).toBeInTheDocument()

  stroke(row('주말에 등산 갈래?'), [200, 20], [140, 20])
  fireEvent.click(screen.getByRole('button', { name: '삭제' }))
  act(() => vi.advanceTimersByTime(200))
  expect(screen.queryByText('주말에 등산 갈래?')).toBeNull()

  fireEvent.keyDown(row('사진 보냈어요'), { key: 'Delete' })
  act(() => vi.advanceTimersByTime(200))
  expect(screen.queryByText('사진 보냈어요')).toBeNull()
  expect(status()).toHaveTextContent('Delete 키')
})

it('drag: the handle carries a row, ↑↓ moves it from the keyboard', () => {
  render(<DragFormat />)
  const names = () => within(screen.getByRole('list', { name: '과일 순위' })).getAllByRole('listitem').map((li) => li.textContent)
  const handle = (name: string) => screen.getByRole('button', { name: new RegExp(`‘${name}’`) })

  const h = handle('딸기')
  down(h, 10, 10)
  move(h, 10, 60)
  move(h, 10, 98)
  up(h, 10, 98)
  expect(names()[2]).toContain('딸기')
  expect(status()).toHaveTextContent('‘딸기’ 1위 → 3위 (끌어서)')

  fireEvent.keyDown(handle('딸기'), { key: 'ArrowUp' })
  expect(names()[1]).toContain('딸기')
  expect(status()).toHaveTextContent('‘딸기’ 3위 → 2위 (↑ 키)')
})

it('pinch: two fingers, Shift-drag, ctrl+wheel and buttons all zoom', () => {
  render(<PinchFormat />)
  const photo = screen.getByRole('group', { name: /확대할 사진/ })

  down(photo, 100, 200)
  down(photo, 140, 200, { pointerId: 2 })
  move(photo, 200, 200, 2)
  expect(status()).toHaveTextContent('배율 2.5× (두 손가락 핀치)')
  up(photo, 200, 200, 2)
  up(photo, 100, 200)

  fireEvent.click(screen.getByRole('button', { name: '원래대로' }))
  down(photo, 140, 200, { shiftKey: true }) // mirror finger at x = 100, 40px apart
  move(photo, 160, 200) // 80px apart
  expect(status()).toHaveTextContent('배율 2.0× (Shift+끌기로 흉내 낸 핀치)')
  up(photo, 160, 200)

  fireEvent.click(screen.getByRole('button', { name: '원래대로' }))
  fireEvent.wheel(photo, { deltaY: -200, ctrlKey: true })
  expect(status()).toHaveTextContent('Ctrl/⌘ + 휠')
  fireEvent.click(screen.getByRole('button', { name: '확대' }))
  expect(status()).toHaveTextContent('(+ 버튼)')
})

it('double tap: two quick taps like the photo, one tap waits before it acts', () => {
  vi.useFakeTimers()
  render(<DoubleTapFormat />)
  const photo = screen.getByRole('img', { name: '바닷가 사진' })

  up(photo, 100, 100)
  up(photo, 102, 101)
  expect(status()).toHaveTextContent('두 번 탭: 좋아요 ♥')
  expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'true')

  up(photo, 100, 100)
  expect(screen.getByText(/두 번째 탭을 기다리는 중/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '사진 정보' })).toHaveAttribute('aria-pressed', 'false')
  act(() => vi.advanceTimersByTime(300))
  expect(screen.getByRole('button', { name: '사진 정보' })).toHaveAttribute('aria-pressed', 'true')
  expect(status()).toHaveTextContent('300ms 기다린 뒤')

  fireEvent.click(screen.getByRole('switch'))
  up(photo, 100, 100)
  expect(status()).toHaveTextContent('바로 반응')
})

it('pull to refresh: a long pull loads 3 new deals, a short one cancels', () => {
  vi.useFakeTimers()
  render(<PullToRefreshFormat />)
  const list = screen.getByText('드립 포트 15%').closest('ul')!.parentElement!

  stroke(list, [100, 50], [100, 90])
  expect(status()).toHaveTextContent('덜 당겨서 취소')

  stroke(list, [100, 50], [100, 250])
  expect(status()).toHaveTextContent('불러오는 중')
  act(() => vi.advanceTimersByTime(1200))
  expect(status()).toHaveTextContent('새 특가 3개를 불러옴 (당겨서)')
  expect(screen.getAllByText('새로')).toHaveLength(3)

  fireEvent.click(screen.getByRole('button', { name: '새로고침' }))
  act(() => vi.advanceTimersByTime(1200))
  expect(status()).toHaveTextContent('(새로고침 버튼)')
})

it('edge swipe: only a drag from the left edge goes back; the back button always does', () => {
  render(<EdgeSwipeFormat />)
  const detail = screen.getByRole('region', { name: '메일 보기' })

  stroke(detail, [120, 200], [230, 200])
  expect(status()).toHaveTextContent('가장자리가 아닌 곳에서 끌어 아무 일도 없음')
  stroke(detail, [5, 200], [40, 200])
  expect(status()).toHaveTextContent('덜 끌어 제자리로')
  stroke(detail, [5, 200], [180, 200])
  expect(status()).toHaveTextContent('이전 화면으로 돌아감 (끌어서)')

  fireEvent.click(screen.getByRole('button', { name: /주말에 등산 갈래/ }))
  fireEvent.click(screen.getByRole('button', { name: '받은 편지함' }))
  expect(status()).toHaveTextContent('이전 화면으로 돌아감 (뒤로 버튼)')
})
