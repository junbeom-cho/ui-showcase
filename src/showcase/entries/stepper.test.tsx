import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { stepperEntry } from './stepper'

const user = () => userEvent.setup()
const demo = (title: string) => stepperEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const children = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>(':scope > li')]
const steps = (name: string) => children(screen.getByRole('list', { name }))
const title = (step: HTMLElement) => step.querySelector('[data-slot="step-title"]')?.textContent
const currentTitle = (name: string) => {
  const current = steps(name).filter((li) => li.getAttribute('aria-current') === 'step')
  return current.length === 1 ? title(current[0]) : current.length
}

it('is a navigation item findable as steps or a wizard', () => {
  expect(stepperEntry).toMatchObject({ id: 'stepper', name: 'Stepper', category: 'navigation' })
  expect(stepperEntry.aliases).toEqual(expect.arrayContaining(['Steps', 'Wizard', 'Progress steps', '단계 표시']))
  expect(stepperEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery', () => {
  expect(stepperEntry.examples[0].title).toBe('상태 모음')
  const States = stepperEntry.examples[0].Demo
  render(<States />)
  const cells = children(screen.getByRole('list', { name: '상태 모음' }))
  expect(cells.map((li) => li.lastElementChild?.textContent)).toEqual([
    '완료', '현재', '대기', '오류', '건너뜀 (선택 단계)', '포커스',
  ])
  const step = (name: string) => steps(name)[0]
  expect(step('완료')).toHaveAttribute('data-status', 'complete')
  expect(step('완료')).toHaveTextContent('(완료)')
  expect(step('현재')).toHaveAttribute('aria-current', 'step')
  expect(step('대기')).toHaveAttribute('data-status', 'upcoming')
  expect(step('대기')).not.toHaveAttribute('aria-current')
  expect(step('오류')).toHaveAttribute('data-status', 'error')
  expect(step('오류')).toHaveTextContent('카드 승인 실패')
  expect(step('오류').querySelector('[data-slot="step-indicator"]')).toHaveTextContent('!')
  expect(step('건너뜀')).toHaveAttribute('data-status', 'skipped')
  expect(within(step('포커스')).getByRole('button', { name: /장바구니/ })).toHaveAttribute('data-demo-state', 'focus')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(stepperEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(stepperEntry.examples.map((x) => x.title)).size).toBe(stepperEntry.examples.length)
  for (const x of stepperEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = stepperEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [stepperEntry.Preview, stepperEntry.anatomy.Specimen, ...stepperEntry.examples.map((x) => x.Demo)]
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

it('horizontal: next and back move the current step and fill the finished ones', async () => {
  const u = user()
  const Order = demo('가로 단계')
  render(<Order />)
  expect(currentTitle('주문 단계')).toBe('장바구니')
  expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  expect(status()).toHaveTextContent('1 / 4단계: 장바구니')

  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(currentTitle('주문 단계')).toBe('배송 정보')
  expect(steps('주문 단계')[0]).toHaveAttribute('data-status', 'complete')
  await u.click(screen.getByRole('button', { name: '이전' }))
  expect(currentTitle('주문 단계')).toBe('장바구니')

  await u.click(screen.getByRole('button', { name: '다음' }))
  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(currentTitle('주문 단계')).toBe('결제')
  await u.click(screen.getByRole('button', { name: '결제하기' }))
  expect(status()).toHaveTextContent('주문을 마쳤습니다')
  expect(currentTitle('주문 단계')).toBe(0)
  for (const step of steps('주문 단계')) expect(step).toHaveAttribute('data-status', 'complete')
  await u.click(screen.getByRole('button', { name: '처음부터' }))
  expect(currentTitle('주문 단계')).toBe('장바구니')
})

it('vertical: the current step opens its content under the title', async () => {
  const u = user()
  const Vertical = demo('세로 단계')
  render(<Vertical />)
  expect(currentTitle('시계 설정 단계')).toBe('계정 만들기')
  expect(steps('시계 설정 단계')[0]).toHaveTextContent('1분이면 끝납니다')
  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(steps('시계 설정 단계')[1]).toHaveTextContent('3초 동안 누릅니다')
  expect(steps('시계 설정 단계')[0]).not.toHaveTextContent('1분이면 끝납니다')
  await u.click(screen.getByRole('button', { name: '다음' }))
  await u.click(screen.getByRole('button', { name: '마치기' }))
  expect(status()).toHaveTextContent('설정을 모두 마쳤습니다.')
})

it('wizard: next is blocked with an error until the field is valid, and finished steps go back', async () => {
  const u = user()
  const Wizard = demo('회원가입 마법사')
  render(<Wizard />)
  const email = screen.getByRole('textbox', { name: '이메일' })

  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 아닙니다')
  expect(steps('회원가입 단계')[0]).toHaveAttribute('data-status', 'error')
  expect(currentTitle('회원가입 단계')).toBe('이메일')
  expect(status()).toHaveTextContent('1 / 4단계: 이메일')
  expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(email).toHaveFocus()

  await u.type(email, 'haneul')
  expect(screen.getByRole('alert')).toBeInTheDocument()
  await u.type(email, '@mail.com')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(steps('회원가입 단계')[0]).toHaveAttribute('data-status', 'current')

  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(status()).toHaveTextContent('2 / 4단계: 비밀번호')
  expect(steps('회원가입 단계')[0]).toHaveAttribute('data-status', 'complete')
  await u.type(screen.getByLabelText('비밀번호'), 'short{Enter}')
  expect(screen.getByRole('alert')).toHaveTextContent('8자 이상')
  await u.type(screen.getByLabelText('비밀번호'), '-day-42{Enter}')
  expect(status()).toHaveTextContent('3 / 4단계: 닉네임')
  await u.type(screen.getByRole('textbox', { name: '닉네임' }), '하늘{Enter}')
  expect(status()).toHaveTextContent('4 / 4단계: 확인')
  expect(screen.getByText('haneul@mail.com')).toBeInTheDocument()

  // a finished step is a button back to it, and the value is still there
  await u.click(within(screen.getByRole('list', { name: '회원가입 단계' })).getByRole('button', { name: /비밀번호/ }))
  expect(status()).toHaveTextContent('2 / 4단계: 비밀번호')
  expect(screen.getByLabelText('비밀번호')).toHaveValue('short-day-42')
  await u.click(within(screen.getByRole('list', { name: '회원가입 단계' })).getByRole('button', { name: /닉네임/ }))
  expect(status()).toHaveTextContent('3 / 4단계: 닉네임')
  await u.click(screen.getByRole('button', { name: '다음' }))
  await u.click(screen.getByRole('button', { name: '가입하기' }))
  expect(status()).toHaveTextContent('가입 완료: haneul@mail.com')
  expect(screen.getByText(/환영합니다, 하늘님/)).toBeInTheDocument()
})

it('compact: the bar and the dots follow the same step', async () => {
  const u = user()
  const Compact = demo('진행 막대형과 점형')
  render(<Compact />)
  const bar = screen.getByRole('progressbar', { name: '진행 막대' })
  expect(bar).toHaveAttribute('aria-valuenow', '40')
  expect(bar).toHaveAttribute('aria-valuetext', '5단계 중 2단계')
  // dots have no visible title, only hidden text
  const currentDot = () => steps('점형 단계').find((li) => li.getAttribute('aria-current') === 'step')
  expect(currentDot()).toHaveTextContent('배송지')

  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(bar).toHaveAttribute('aria-valuenow', '60')
  expect(currentDot()).toHaveTextContent('배송 방법')
  expect(status()).toHaveTextContent('5단계 중 3단계: 배송 방법')
  await u.click(screen.getByRole('button', { name: '다음' }))
  await u.click(screen.getByRole('button', { name: '다음' }))
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  expect(bar).toHaveAttribute('aria-valuenow', '100')
})
