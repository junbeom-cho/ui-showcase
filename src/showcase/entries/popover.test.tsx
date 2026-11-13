import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { popoverEntry } from './popover'

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
const demo = (title: string) => popoverEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')

it('is an overlay findable by other names, with a Korean sentence', () => {
  expect(popoverEntry).toMatchObject({ id: 'popover', name: 'Popover', category: 'overlay' })
  expect(popoverEntry.aliases).toEqual(expect.arrayContaining(['Popup', '팝오버']))
  expect(popoverEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(popoverEntry.examples[0].title).toBe('상태 모음')
  const States = popoverEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual(['닫힘', '호버', '포커스', '비활성', '열림'])
  const button = (label: string) => items.find((li) => li.lastElementChild?.textContent === label)!.querySelector('button')!
  expect(button('닫힘')).toHaveAttribute('aria-expanded', 'false')
  expect(button('호버')).toHaveAttribute('data-demo-state', 'hover')
  expect(button('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(button('비활성')).toBeDisabled()
  expect(screen.getByRole('img', { name: /열린 팝오버/ })).toHaveTextContent('링크 공유')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(popoverEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(popoverEntry.examples.map((x) => x.title)).size).toBe(popoverEntry.examples.length)
  for (const x of popoverEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = popoverEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [popoverEntry.Preview, popoverEntry.anatomy.Specimen, ...popoverEntry.examples.map((x) => x.Demo)]
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

it('a gallery trigger opens a real popover', async () => {
  const u = user()
  const States = popoverEntry.examples[0].Demo
  render(<States />)
  const closed = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('button', { name: '공유' })[0]
  await u.click(closed)
  expect(screen.getByRole('dialog')).toHaveTextContent('링크 공유')
  expect(closed).toHaveAttribute('aria-expanded', 'true')
})

it('help: the info button opens an explanation that Escape closes', async () => {
  const u = user()
  const Help = demo('도움말 설명')
  render(<Help />)
  await u.click(screen.getByRole('button', { name: '배송비 안내' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('3만 원 이상 사면 무료입니다.')
  expect(status()).toHaveTextContent('설명이 열렸습니다.')
  await u.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('ⓘ 버튼을 눌러 보세요.')
})

it('share: copies the link and says so', async () => {
  const u = user()
  const Share = demo('공유하기')
  render(<Share />)
  await u.click(screen.getByRole('button', { name: '공유' }))
  expect(screen.getByRole('textbox', { name: '공유 링크' })).toHaveValue('https://example.com/d/2026-plan')
  await u.click(screen.getByRole('button', { name: '복사' }))
  expect(screen.getByRole('button', { name: '복사됨' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('링크를 복사했습니다.')
  await expect(navigator.clipboard.readText()).resolves.toBe('https://example.com/d/2026-plan')
})

it('edit form: saving renames and closes, an empty name is refused', async () => {
  const u = user()
  const Rename = demo('작은 편집 폼')
  render(<Rename />)
  await u.click(screen.getByRole('button', { name: '이름 바꾸기' }))
  const field = screen.getByRole('textbox', { name: '새 이름' })
  expect(field).toHaveFocus()
  expect(field).toHaveValue('디자인 회의록')

  await u.clear(field)
  await u.click(screen.getByRole('button', { name: '저장' }))
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(field).toHaveAccessibleDescription('이름을 적어 주세요.')

  await u.type(field, '주간 회의록{Enter}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('주간 회의록')).toBeInTheDocument()
  expect(status()).toHaveTextContent('이름을 "주간 회의록"(으)로 바꿨습니다.')

  await u.click(screen.getByRole('button', { name: '이름 바꾸기' }))
  await u.click(screen.getByRole('button', { name: '취소' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('주간 회의록')).toBeInTheDocument()
})

it('placement: side and align can change while the popover stays open', async () => {
  const u = user()
  const Placement = demo('위치')
  render(<Placement />)
  expect(status()).toHaveTextContent('side="bottom" align="center": 버튼 아래에 열리고, 가운데를 맞춥니다.')

  await u.click(screen.getByRole('button', { name: '기준 버튼' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('side="bottom"align="center"')
  const sides = screen.getByRole('radiogroup', { name: 'side (여는 쪽)' })
  const aligns = screen.getByRole('radiogroup', { name: 'align (맞추는 곳)' })
  await u.click(within(sides).getByRole('radio', { name: '왼쪽' }))
  await u.click(within(aligns).getByRole('radio', { name: '끝' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('side="left"align="end"')
  expect(status()).toHaveTextContent('side="left" align="end": 버튼 왼쪽에 열리고, 끝 쪽 가장자리를 맞춥니다.')
})

it('comparison: the popover keeps working inside, the dialog must be answered', async () => {
  const u = user()
  const Compare = demo('Tooltip·Dialog와 비교')
  render(<Compare />)
  const [popoverButton, dialogButton] = screen.getAllByRole('button', { name: '눌러 보기' })

  await u.click(popoverButton)
  expect(status()).toHaveTextContent('Popover을(를) 열었습니다.')
  await u.click(screen.getByRole('button', { name: '안의 버튼' }))
  expect(status()).toHaveTextContent('Popover 안의 버튼을 눌렀습니다.')
  await u.keyboard('{Escape}')

  await u.click(dialogButton)
  const dialog = screen.getByRole('dialog', { name: '정말 나갈까요?' })
  expect(dialog).toBeInTheDocument()
  await u.click(within(dialog).getByRole('button', { name: '나가기' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('Dialog에서 "나가기"를 골랐습니다.')
})
