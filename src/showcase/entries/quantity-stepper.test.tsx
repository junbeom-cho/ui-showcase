import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../filter-entries'
import { quantityStepperEntry } from './quantity-stepper'

const user = () => userEvent.setup()
const demo = (title: string) => quantityStepperEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const field = (name: string) => screen.getByRole('spinbutton', { name })
const button = (name: string) => screen.getByRole('button', { name })

afterEach(() => {
  vi.useRealTimers()
})

it('is an input findable by every name, apart from the step indicator', () => {
  expect(quantityStepperEntry).toMatchObject({ id: 'quantity-stepper', name: 'Quantity Stepper', category: 'input' })
  expect(quantityStepperEntry.description).toMatch(/^[^.]+\.$/)
  for (const query of ['Number input', 'Spin button', 'Counter', 'Quantity selector', '수량 스테퍼', '숫자 입력']) {
    expect(filterEntries([quantityStepperEntry], query), query).toHaveLength(1)
  }
  expect(quantityStepperEntry.examples[0].description).toContain('Stepper(단계 표시)')
})

it('lists its examples after the state gallery', () => {
  expect(quantityStepperEntry.examples.map((x) => x.title)).toEqual([
    '상태 모음',
    '장바구니 수량',
    '직접 입력과 범위',
    '길게 눌러 빠르게',
    '인원 선택',
  ])
  for (const x of quantityStepperEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  const States = quantityStepperEntry.examples[0].Demo
  render(<States />)
  const cells = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(cells.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '호버', '포커스', '최솟값', '최댓값', '비활성', '오류', '1개면 삭제',
  ])
  expect(button('호버 늘리기')).toHaveAttribute('data-demo-state', 'hover')
  expect(screen.getByRole('group', { name: '포커스' })).toHaveAttribute('data-demo-state', 'focus')
  expect(button('최솟값 줄이기')).toBeDisabled()
  expect(button('최솟값 늘리기')).toBeEnabled()
  expect(button('최댓값 늘리기')).toBeDisabled()
  expect(field('비활성')).toBeDisabled()
  expect(field('오류')).toHaveAttribute('aria-invalid', 'true')
  expect(field('오류')).toHaveAccessibleDescription('재고가 3개 남았어요')
  expect(button('1개면 삭제 빼기')).toBeEnabled()
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = quantityStepperEntry.anatomy
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
  }
})

it('renders the preview, specimen and every example twice without clashing ids', () => {
  const { Preview, anatomy, examples } = quantityStepperEntry
  const demos = [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]
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

it('cart: changing a quantity updates the line and total; at 1 the minus removes the item', async () => {
  const u = user()
  const Cart = demo('장바구니 수량')
  render(<Cart />)
  expect(screen.getByText('합계 40,500원')).toBeInTheDocument()

  await u.click(button('원두 500g 늘리기'))
  expect(field('원두 500g')).toHaveAttribute('aria-valuenow', '3')
  expect(screen.getByTestId('line-beans')).toHaveTextContent('42,000원')
  expect(screen.getByText('합계 54,500원')).toBeInTheDocument()

  expect(screen.queryByRole('button', { name: '머그컵 줄이기' })).toBeNull()
  await u.click(button('머그컵 빼기'))
  expect(screen.queryByRole('spinbutton', { name: '머그컵' })).toBeNull()
  expect(status()).toHaveTextContent('‘머그컵’을(를) 장바구니에서 뺐습니다.')
  expect(screen.getByText('합계 45,500원')).toBeInTheDocument()

  await u.click(button('예시 처음으로'))
  expect(field('머그컵')).toBeInTheDocument()
})

it('type and range: a spinbutton that clamps typed values and steps with the keys', async () => {
  const u = user()
  const Range = demo('직접 입력과 범위')
  render(<Range />)
  const copies = field('인쇄 매수')
  expect(copies).toHaveAttribute('aria-valuemin', '1')
  expect(copies).toHaveAttribute('aria-valuemax', '100')
  expect(copies).toHaveAttribute('aria-valuetext', '1장')

  await u.clear(copies)
  await u.type(copies, '150{Enter}')
  expect(copies).toHaveValue('100')
  expect(copies).toHaveAttribute('aria-valuenow', '100')
  expect(status()).toHaveTextContent('150장은 너무 많아 최대 100장으로 맞췄습니다.')
  expect(button('인쇄 매수 늘리기')).toBeDisabled()

  await u.keyboard('{ArrowDown}')
  expect(copies).toHaveAttribute('aria-valuenow', '99')
  await u.keyboard('{PageDown}')
  expect(copies).toHaveAttribute('aria-valuenow', '89')
  await u.keyboard('{Home}')
  expect(copies).toHaveAttribute('aria-valuenow', '1')
  await u.keyboard('{PageUp}{ArrowUp}')
  expect(copies).toHaveAttribute('aria-valuenow', '12')
  expect(status()).toHaveTextContent('12장 인쇄합니다.')

  await u.clear(copies)
  await u.type(copies, '0')
  await u.tab()
  expect(copies).toHaveAttribute('aria-valuenow', '1')
  expect(status()).toHaveTextContent('0장은 너무 적어 최소 1장으로 맞췄습니다.')

  await u.clear(copies)
  await u.type(copies, 'ab{Enter}')
  expect(copies).toHaveValue('1')
  expect(status()).toHaveTextContent('숫자가 없어 1장으로 되돌렸습니다.')
})

it('hold: one click adds one step; holding repeats faster and the closing click adds nothing', () => {
  vi.useFakeTimers()
  const Hold = demo('길게 눌러 빠르게')
  render(<Hold />)
  const plus = button('사용할 포인트 늘리기')
  const points = field('사용할 포인트')

  fireEvent.click(plus)
  expect(points).toHaveAttribute('aria-valuenow', '10')

  fireEvent.pointerDown(plus)
  act(() => {
    vi.advanceTimersByTime(399)
  })
  expect(points).toHaveAttribute('aria-valuenow', '10')
  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(points).toHaveAttribute('aria-valuenow', '20')
  expect(status()).toHaveTextContent('1번째 반복')

  // the first second after the delay gives far more repeats than the delay itself would
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  const afterHold = Number(points.getAttribute('aria-valuenow'))
  expect(afterHold).toBeGreaterThan(100)

  fireEvent.pointerUp(plus)
  fireEvent.click(plus)
  expect(points).toHaveAttribute('aria-valuenow', String(afterHold))
  expect(status()).toHaveTextContent(`${afterHold.toLocaleString('ko-KR')}P 사용`)
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  expect(points).toHaveAttribute('aria-valuenow', String(afterHold))
})

it('guests: infants cannot outnumber adults, and seats stop at 8', async () => {
  const u = user()
  const Guests = demo('인원 선택')
  render(<Guests />)
  expect(status()).toHaveTextContent('게스트 2명 (성인 2명)')

  await u.click(button('유아 늘리기'))
  await u.click(button('유아 늘리기'))
  expect(button('유아 늘리기')).toBeDisabled()
  expect(button('성인 줄이기')).toBeDisabled()
  expect(status()).toHaveTextContent('게스트 2명, 유아 2명 (성인 2명, 유아 2명)')

  await u.click(button('유아 줄이기'))
  await u.click(button('성인 줄이기'))
  expect(field('성인')).toHaveAttribute('aria-valuenow', '1')

  const kids = field('아동')
  await u.click(kids)
  await u.keyboard('{End}')
  expect(kids).toHaveAttribute('aria-valuenow', '7')
  expect(button('성인 늘리기')).toBeDisabled()
  expect(status()).toHaveTextContent('게스트 8명, 유아 1명 (성인 1명, 아동 7명, 유아 1명)')
})
