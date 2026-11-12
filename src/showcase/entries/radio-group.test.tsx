import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { radioGroupEntry } from './radio-group'

const user = () => userEvent.setup()
const demo = (title: string) => radioGroupEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')

it('is an input with other names, a Korean sentence and distinct examples', () => {
  expect(radioGroupEntry.id).toBe('radio-group')
  expect(radioGroupEntry.name).toBe('Radio Group')
  expect(radioGroupEntry.category).toBe('input')
  expect(radioGroupEntry.aliases).toEqual(expect.arrayContaining(['Radio button', 'Option button', '라디오 버튼']))
  expect(radioGroupEntry.description).toMatch(/\.$/)
  expect(radioGroupEntry.examples.length).toBeGreaterThanOrEqual(4)
  expect(new Set(radioGroupEntry.examples.map((x) => x.title)).size).toBe(radioGroupEntry.examples.length)
  for (const x of radioGroupEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(radioGroupEntry.examples[0].title).toBe('상태 모음')
  const States = radioGroupEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '선택 안 됨', '선택됨', '포커스', '비활성', '비활성 (선택됨)', '오류',
  ])
  const radio = (name: string) => screen.getByRole('radio', { name })
  expect(radio('선택 안 됨')).not.toBeChecked()
  expect(radio('선택됨')).toBeChecked()
  expect(radio('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(radio('비활성')).toBeDisabled()
  expect(radio('비활성 선택됨')).toBeDisabled()
  expect(radio('비활성 선택됨')).toBeChecked()
  expect(radio('오류')).toHaveAttribute('aria-invalid', 'true')
})

it('names anatomy parts that exist in the specimen', () => {
  const { container } = render(<radioGroupEntry.anatomy.Specimen />)
  expect(radioGroupEntry.anatomy.parts.length).toBeGreaterThanOrEqual(2)
  for (const part of radioGroupEntry.anatomy.parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview and every example', () => {
  expect(() => render(<radioGroupEntry.Preview />)).not.toThrow()
  for (const x of radioGroupEntry.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it('shipping: the chosen method changes the total', async () => {
  const u = user()
  const Shipping = demo('배송 방법')
  render(<Shipping />)
  expect(screen.getByRole('radio', { name: '일반 배송' })).toBeChecked()
  expect(screen.getByRole('radio', { name: '일반 배송' })).toHaveAccessibleDescription('2~3일 뒤 도착')
  expect(status()).toHaveTextContent('합계₩27,000')
  await u.click(screen.getByRole('radio', { name: '빠른 배송' }))
  expect(status()).toHaveTextContent('합계₩29,000')
  await u.click(screen.getByText('매장 픽업'))
  expect(screen.getByRole('radio', { name: '매장 픽업' })).toBeChecked()
  expect(status()).toHaveTextContent('합계₩24,000')
})

it('plan cards: a click anywhere on a card picks it', async () => {
  const u = user()
  const Plans = demo('카드형 선택')
  render(<Plans />)
  expect(screen.getByRole('radio', { name: '프로' })).toBeChecked()
  await u.click(screen.getByText('5명까지 함께 편집'))
  expect(screen.getByRole('radio', { name: '팀' })).toBeChecked()
  expect(screen.getByRole('radio', { name: '프로' })).not.toBeChecked()
  expect(status()).toHaveTextContent('팀 요금제를 골랐습니다.')
})

it('horizontal: arrow keys move along the row and resize the sample', async () => {
  const u = user()
  const Row = demo('가로 배치')
  render(<Row />)
  const group = screen.getByRole('radiogroup', { name: '글자 크기' })
  expect(group).toHaveAttribute('aria-orientation', 'horizontal')
  await u.click(screen.getByRole('radio', { name: '보통' }))
  // Radix moves focus a tick after keydown and only checks the radio while the arrow is held
  await u.keyboard('{ArrowRight>}')
  await waitFor(() => expect(screen.getByRole('radio', { name: '크게' })).toBeChecked())
  await u.keyboard('{/ArrowRight}')
  expect(screen.getByText('다람쥐 헌 쳇바퀴에 타고파.')).toHaveAttribute('data-size', 'lg')
})

it('comparison: one radio, any number of checkboxes, one toggle', async () => {
  const u = user()
  const Compare = demo('라디오, 체크박스, 토글 그룹 비교')
  render(<Compare />)
  await u.click(screen.getByRole('radio', { name: '계좌이체' }))
  expect(screen.getByText('결제 수단: 계좌이체')).toBeInTheDocument()
  await u.click(screen.getByRole('checkbox', { name: '요리' }))
  expect(screen.getByText('관심사: 여행, 요리')).toBeInTheDocument()
  const views = screen.getByRole('radiogroup', { name: '보기 방식' })
  await u.click(within(views).getByRole('radio', { name: '격자' }))
  expect(screen.getByText('보기: 격자')).toBeInTheDocument()
  // clicking the chosen toggle again keeps it chosen
  await u.click(within(views).getByRole('radio', { name: '격자' }))
  expect(screen.getByText('보기: 격자')).toBeInTheDocument()
})
