import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../filter-entries'
import { drawerEntry } from './drawer'

// jsdom lacks the pointer-capture and scrolling APIs that vaul calls when a press starts inside the drawer.
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
  window.scrollTo = (() => {}) as typeof window.scrollTo

  // vaul slides the drawer out with a CSS animation that jsdom never plays, so Radix would
  // keep the closed drawer (and the aria-hidden page behind it) waiting for animationend.
  const noSlide = document.createElement('style')
  noSlide.textContent =
    '[data-vaul-drawer][data-vaul-snap-points][data-vaul-drawer-direction][data-state]{animation-name:none!important}'
  document.head.append(noSlide)
})

const user = () => userEvent.setup()
const demo = (title: string) => drawerEntry.examples.find((x) => x.title === title)!.Demo
// While a modal drawer is open, Radix hides the page behind it from the accessibility tree.
const status = () => screen.getByRole('status', { hidden: true })
const gone = (name: string) => waitFor(() => expect(screen.queryByRole('dialog', { name })).toBeNull())

it('is a mobile component with other names, a Korean sentence and distinct examples', () => {
  expect(drawerEntry.id).toBe('drawer')
  expect(drawerEntry.name).toBe('Drawer')
  expect(drawerEntry.category).toBe('mobile')
  expect(drawerEntry.aliases).toEqual(expect.arrayContaining(['Bottom sheet', 'Action sheet', '바텀 시트', '드로어']))
  expect(drawerEntry.description).toMatch(/\.$/)
  expect(drawerEntry.examples.map((x) => x.title)).toEqual([
    '상태 모음',
    '바텀 시트',
    '스냅 지점',
    '공유 시트·액션 시트',
    '폼이 든 드로어',
    'Drawer·Sheet·Dialog 비교',
  ])
  for (const x of drawerEntry.examples) expect(x.description.trim()).not.toBe('')
  for (const query of ['Bottom sheet', 'Action sheet', '바텀 시트']) {
    expect(filterEntries([drawerEntry], query), query).toHaveLength(1)
  }
})

it('opens with a drawing of every drawer state', () => {
  const States = drawerEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '닫힘',
    '열림(손잡이)',
    '끌어내리는 중',
    '반만 열림(스냅)',
    '전체 열림',
  ])
  for (const li of items) expect(within(li).getByRole('img')).toHaveAccessibleName()
})

it('names anatomy parts that exist in the specimen', () => {
  const { container } = render(<drawerEntry.anatomy.Specimen />)
  expect(drawerEntry.anatomy.parts.length).toBeGreaterThanOrEqual(2)
  for (const part of drawerEntry.anatomy.parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview and every example', () => {
  expect(() => render(<drawerEntry.Preview />)).not.toThrow()
  for (const x of drawerEntry.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it('bottom sheet: opens, and says how it was closed', async () => {
  const u = user()
  const BottomSheet = demo('바텀 시트')
  render(<BottomSheet />)

  await u.click(screen.getByRole('button', { name: '주문 상세 보기' }))
  const sheet = await screen.findByRole('dialog', { name: '주문 상세' })
  expect(within(sheet).getByText('원두 1kg')).toBeInTheDocument()
  expect(status()).toHaveTextContent('손잡이를 잡고 아래로 끌어내리면 닫힙니다')

  await u.click(within(sheet).getByRole('button', { name: '닫기' }))
  await gone('주문 상세')
  expect(status()).toHaveTextContent('닫기 버튼으로 닫았습니다')

  await u.click(screen.getByRole('button', { name: '주문 상세 보기' }))
  await screen.findByRole('dialog', { name: '주문 상세' })
  await u.keyboard('{Escape}')
  await gone('주문 상세')
  expect(status()).toHaveTextContent('Esc 키로 닫았습니다')
})

it('snap points: opens half way and expands to full height', async () => {
  const u = user()
  const Snap = demo('스냅 지점')
  render(<Snap />)
  expect(status()).toHaveTextContent('지도 위의 장소를 눌러')

  await u.click(screen.getByRole('button', { name: '성수 카페 거리' }))
  const drawer = await screen.findByRole('dialog', { name: '성수 카페 거리' })
  expect(status()).toHaveTextContent('반만 열림 (화면의 40%)')

  await u.click(within(drawer).getByRole('button', { name: '전체로 펼치기' }))
  expect(status()).toHaveTextContent('전체 열림 (화면의 100%)')
  await u.click(within(drawer).getByRole('button', { name: '반으로 줄이기' }))
  expect(status()).toHaveTextContent('반만 열림')
})

it('action sheet: choosing an action closes the sheet and reports it', async () => {
  const u = user()
  const Actions = demo('공유 시트·액션 시트')
  render(<Actions />)

  await u.click(screen.getByRole('button', { name: '사진 공유' }))
  const sheet = await screen.findByRole('dialog', { name: '공유하기' })
  expect(within(sheet).getByRole('button', { name: '삭제' })).toHaveClass('text-destructive')
  await u.click(within(sheet).getByRole('button', { name: '링크 복사' }))
  await gone('공유하기')
  expect(status()).toHaveTextContent('"링크 복사"을(를) 골랐습니다')

  await u.click(screen.getByRole('button', { name: '사진 공유' }))
  await u.click(within(await screen.findByRole('dialog', { name: '공유하기' })).getByRole('button', { name: '취소' }))
  await gone('공유하기')
  expect(status()).toHaveTextContent('아무것도 고르지 않고 취소했습니다')
})

it('form drawer: stays open until the form is filled, then closes on submit', async () => {
  const u = user()
  const Form = demo('폼이 든 드로어')
  render(<Form />)

  await u.click(screen.getByRole('button', { name: '의견 보내기' }))
  const drawer = await screen.findByRole('dialog', { name: '의견 보내기' })
  const text = within(drawer).getByRole('textbox', { name: /의견/ })

  await u.click(within(drawer).getByRole('button', { name: '보내기' }))
  expect(text).toHaveAttribute('aria-invalid', 'true')
  expect(text).toHaveAccessibleDescription('의견을 한 글자 이상 적어 주세요.')
  expect(screen.getByRole('dialog', { name: '의견 보내기' })).toBeInTheDocument()

  await u.click(within(drawer).getByRole('radio', { name: '좋아요' }))
  await u.type(text, '좋아요')
  await u.click(within(drawer).getByRole('button', { name: '보내기' }))
  await gone('의견 보내기')
  expect(status()).toHaveTextContent('의견을 보냈습니다: 좋아요 · 3자')
})

it('comparison: opens a drawer, a sheet and a dialog', async () => {
  const u = user()
  const Compare = demo('Drawer·Sheet·Dialog 비교')
  render(<Compare />)

  await u.click(screen.getByRole('button', { name: 'Drawer 열기' }))
  const drawer = await screen.findByRole('dialog', { name: 'Drawer' })
  expect(status()).toHaveTextContent('마지막으로 연 것: Drawer')
  await u.click(within(drawer).getByRole('button', { name: '닫기' }))
  await gone('Drawer')

  await u.click(screen.getByRole('button', { name: 'Sheet 열기' }))
  expect(await screen.findByRole('dialog', { name: 'Sheet' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('마지막으로 연 것: Sheet')
  await u.keyboard('{Escape}')
  await gone('Sheet')

  await u.click(screen.getByRole('button', { name: 'Dialog 열기' }))
  const dialog = await screen.findByRole('dialog', { name: 'Dialog' })
  expect(status()).toHaveTextContent('마지막으로 연 것: Dialog')
  await u.click(within(dialog).getByRole('button', { name: '확인' }))
  await gone('Dialog')
})
