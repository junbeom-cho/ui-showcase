import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { hoverCardEntry } from './hover-card'

// jsdom lacks the pointer-capture and scrolling APIs that Radix primitives may call.
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

const user = () => userEvent.setup()
const demo = (title: string) => hoverCardEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

it('is an overlay findable by other names, with a Korean sentence', () => {
  expect(hoverCardEntry).toMatchObject({ id: 'hover-card', name: 'Hover Card', category: 'overlay' })
  expect(hoverCardEntry.aliases).toEqual(
    expect.arrayContaining(['Preview card', 'Link preview', '호버 카드', '미리보기 카드']),
  )
  expect(hoverCardEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(hoverCardEntry.examples[0].title).toBe('상태 모음')
  const States = hoverCardEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual(['기본', '호버', '포커스', '열림', '불러오는 중'])
  const [plain, hovered, focused] = screen.getAllByRole('link', { name: '@haneul' })
  expect(plain).not.toHaveAttribute('data-demo-state')
  expect(hovered).toHaveAttribute('data-demo-state', 'hover')
  expect(focused).toHaveAttribute('data-demo-state', 'focus')
  expect(screen.getByRole('img', { name: /열린 카드/ })).toHaveTextContent('김하늘')
  expect(screen.getByRole('img', { name: /불러오는 중/ }).querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(hoverCardEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(hoverCardEntry.examples.map((x) => x.title)).size).toBe(hoverCardEntry.examples.length)
  for (const x of hoverCardEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = hoverCardEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [hoverCardEntry.Preview, hoverCardEntry.anatomy.Specimen, ...hoverCardEntry.examples.map((x) => x.Demo)]
  const { container } = render(
    <>
      {[...demos, ...demos].map((Demo, i) => (
        <Demo key={i} />
      ))}
    </>,
  )
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
  expect(new Set(ids).size).toBe(ids.length)
})

it('user preview: hovering a name opens its card after a short wait, leaving closes it', async () => {
  const u = user()
  const Users = demo('사용자 미리보기')
  render(<Users />)
  const link = screen.getByRole('link', { name: '@haneul' })

  await u.hover(link)
  expect(screen.queryByText(/버튼 모서리/)).toBeNull() // openDelay has not passed yet
  expect(await screen.findByText(/버튼 모서리/)).toBeInTheDocument()
  expect(screen.getByText('1,284')).toBeInTheDocument()
  expect(status()).toHaveTextContent('김하늘 님의 카드를 보고 있습니다.')

  await u.unhover(link)
  await waitForElementToBeRemoved(() => screen.queryByText(/버튼 모서리/))
  expect(status()).toHaveTextContent('@이름에 마우스를 올리거나')
})

it('user preview: keyboard focus opens the card too', async () => {
  const u = user()
  const Users = demo('사용자 미리보기')
  render(<Users />)
  await u.tab()
  expect(screen.getByRole('link', { name: '@haneul' })).toHaveFocus()
  expect(await screen.findByText(/버튼 모서리/)).toBeInTheDocument()
  await u.tab()
  expect(await screen.findByText(/키보드로도 다 되는 화면/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('박민준 님의 카드를 보고 있습니다.')
})

it('link preview: shows the title and summary before the link is followed', async () => {
  const u = user()
  const Links = demo('링크 미리보기')
  render(<Links />)
  await u.hover(screen.getByRole('link', { name: 'example.com/blog/combobox' }))
  expect(await screen.findByText('검색이 되는 선택 상자 만들기')).toBeInTheDocument()
  expect(screen.getByText(/Popover와 Command를 합쳐/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('"검색이 되는 선택 상자 만들기" 미리보기를 보고 있습니다.')
})

it('delays: the 0ms card opens at once, the 700ms card waits', async () => {
  const u = user()
  const Delays = demo('나타나는 지연')
  render(<Delays />)
  const instant = screen.getByRole('link', { name: '0ms' })
  await u.hover(instant)
  expect(await screen.findByText(/openDelay=0closeDelay=0/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('0ms 기다린 카드가 열렸습니다.')
  await u.unhover(instant)

  await u.hover(screen.getByRole('link', { name: '700ms' }))
  await pause(400)
  expect(screen.queryByText(/openDelay=700/)).toBeNull()
  expect(await screen.findByText(/openDelay=700/, {}, { timeout: 1500 })).toBeInTheDocument()
  expect(status()).toHaveTextContent('700ms 기다린 카드가 열렸습니다.')
})

it('comparison: the hover card opens on hover, the popover on a click', async () => {
  const u = user()
  const Compare = demo('Tooltip·Popover와 차이')
  render(<Compare />)
  expect(screen.getByText(/Hover Card가 열리지 않습니다/)).toBeInTheDocument()

  await u.hover(screen.getByRole('link', { name: '@minjun' }))
  expect(await screen.findByText(/키보드로도 다 되는 화면/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('Hover Card이(가) 열렸습니다.')

  await u.click(screen.getByRole('button', { name: '눌러 보기' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('눌러서 연 상자')
  expect(status()).toHaveTextContent('Popover이(가) 열렸습니다.')
})
