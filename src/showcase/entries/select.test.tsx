import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { selectEntry } from './select'

// jsdom lacks the pointer-capture and scrolling APIs that Radix Select calls while opening.
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
const demo = (title: string) => selectEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')

it('is an input with other names, a Korean sentence and distinct examples', () => {
  expect(selectEntry.id).toBe('select')
  expect(selectEntry.name).toBe('Select')
  expect(selectEntry.category).toBe('input')
  expect(selectEntry.aliases).toEqual(expect.arrayContaining(['Dropdown', 'Picker', '선택 상자', '드롭다운']))
  expect(selectEntry.description).toMatch(/\.$/)
  expect(selectEntry.examples.length).toBeGreaterThanOrEqual(4)
  expect(new Set(selectEntry.examples.map((x) => x.title)).size).toBe(selectEntry.examples.length)
  for (const x of selectEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(selectEntry.examples[0].title).toBe('상태 모음')
  const States = selectEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '닫힘', '값 있음', '포커스', '열림', '비활성', '오류',
  ])
  expect(screen.getByRole('combobox', { name: '닫힘' })).toHaveTextContent('과일 선택')
  expect(screen.getByRole('combobox', { name: '값 있음' })).toHaveTextContent('사과')
  expect(screen.getByRole('combobox', { name: '포커스' })).toHaveAttribute('data-demo-state', 'focus')
  expect(screen.getByRole('combobox', { name: '비활성' })).toBeDisabled()
  expect(screen.getByRole('combobox', { name: '오류' })).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('img', { name: /열린 목록/ })).toHaveTextContent('바나나')
})

it('names anatomy parts that exist in the specimen', () => {
  const { container } = render(<selectEntry.anatomy.Specimen />)
  expect(selectEntry.anatomy.parts.length).toBeGreaterThanOrEqual(2)
  for (const part of selectEntry.anatomy.parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview and every example', () => {
  expect(() => render(<selectEntry.Preview />)).not.toThrow()
  for (const x of selectEntry.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it('groups: shows group names, and a sold-out item cannot be chosen', async () => {
  const u = user()
  const Grouped = demo('묶음과 구분선')
  render(<Grouped />)
  await u.click(screen.getByRole('combobox', { name: '재료' }))
  expect(screen.getByText('채소')).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '시금치 (품절)' })).toHaveAttribute('aria-disabled', 'true')
  await u.click(screen.getByRole('option', { name: '브로콜리' }))
  expect(status()).toHaveTextContent('채소 중 브로콜리')
})

it('linked: the second list follows the first and empties when it changes', async () => {
  const u = user()
  const Linked = demo('연결된 선택')
  render(<Linked />)
  const district = () => screen.getByRole('combobox', { name: '시·군·구' })
  expect(district()).toBeDisabled()

  await u.click(screen.getByRole('combobox', { name: '시·도' }))
  await u.click(screen.getByRole('option', { name: '서울특별시' }))
  expect(district()).toBeEnabled()
  await u.click(district())
  await u.click(screen.getByRole('option', { name: '마포구' }))
  expect(status()).toHaveTextContent('주소: 서울특별시 마포구')

  await u.click(screen.getByRole('combobox', { name: '시·도' }))
  await u.click(screen.getByRole('option', { name: '부산광역시' }))
  expect(district()).toHaveTextContent('시·군·구 선택')
  expect(status()).toHaveTextContent('부산광역시의 시·군·구를 고르세요.')
  await u.click(district())
  expect(screen.queryByRole('option', { name: '마포구' })).toBeNull()
  expect(screen.getByRole('option', { name: '해운대구' })).toBeInTheDocument()
})

it('form: asks for a value before it accepts the form', async () => {
  const u = user()
  const Form = demo('폼 안의 선택')
  render(<Form />)
  const trigger = screen.getByRole('combobox', { name: /문의 유형/ })
  await u.click(screen.getByRole('button', { name: '접수하기' }))
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  expect(trigger).toHaveAccessibleDescription('문의 유형을 골라 주세요.')

  await u.click(trigger)
  await u.click(screen.getByRole('option', { name: '환불' }))
  expect(trigger).not.toHaveAttribute('aria-invalid')
  await u.click(screen.getByRole('button', { name: '접수하기' }))
  expect(status()).toHaveTextContent('"환불" 문의를 접수했습니다.')
})

it('native comparison: both pick from the same list', async () => {
  const u = user()
  const Compare = demo('기본 select와 비교')
  render(<Compare />)
  await u.selectOptions(screen.getByRole('combobox', { name: '기본 <select>' }), '경비실')
  expect(screen.getByText('고른 값: 경비실')).toBeInTheDocument()
  await u.click(screen.getByRole('combobox', { name: 'Select 컴포넌트' }))
  await u.click(screen.getByRole('option', { name: '택배함' }))
  expect(screen.getByText('고른 값: 택배함')).toBeInTheDocument()
})
