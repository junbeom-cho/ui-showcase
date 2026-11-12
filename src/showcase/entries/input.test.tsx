import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { inputEntry } from './input'

const user = () => userEvent.setup()
const demo = (title: string) => inputEntry.examples.find((x) => x.title === title)!.Demo

it('is a text field in the input category, findable by other names', () => {
  expect(inputEntry).toMatchObject({ id: 'input', name: 'Input', category: 'input' })
  expect(inputEntry.aliases).toEqual(expect.arrayContaining(['Text field', 'Text input', '입력창', '텍스트 필드']))
  expect(inputEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(inputEntry.examples[0].title).toBe('상태 모음')
  const States = inputEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '호버', '포커스', '입력됨', '비활성', '읽기 전용', '오류', '확인됨', '불러오는 중',
  ])
  const field = (name: string) => screen.getByRole('textbox', { name })
  expect(field('기본')).toHaveValue('')
  expect(field('기본')).toHaveAttribute('placeholder')
  expect(field('호버')).toHaveAttribute('data-demo-state', 'hover')
  expect(field('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(field('입력됨')).toHaveValue('김하늘')
  expect(field('비활성')).toBeDisabled()
  expect(field('읽기 전용')).toHaveAttribute('readonly')
  expect(field('오류')).toHaveAttribute('aria-invalid', 'true')
  expect(field('불러오는 중')).toHaveAttribute('aria-busy', 'true')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  const rest = inputEntry.examples.slice(1)
  expect(rest.length).toBeGreaterThanOrEqual(3)
  expect(new Set(inputEntry.examples.map((x) => x.title)).size).toBe(inputEntry.examples.length)
  for (const x of inputEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = inputEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [inputEntry.Preview, inputEntry.anatomy.Specimen, ...inputEntry.examples.map((x) => x.Demo)]
  const { container } = render(
    <>
      {[...demos, ...demos].map((Demo, i) => (
        <Demo key={i} />
      ))}
    </>,
  )
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
  expect(ids.length).toBeGreaterThan(0)
  expect(new Set(ids).size).toBe(ids.length)
})

it('specimen: the counter follows what is typed', async () => {
  const u = user()
  const Specimen = inputEntry.anatomy.Specimen
  render(<Specimen />)
  await u.type(screen.getByRole('textbox', { name: '닉네임' }), '하늘')
  expect(screen.getByText('2 / 12')).toBeInTheDocument()
})

it('label and help: a wrong email turns the help into an error after leaving the field', async () => {
  const u = user()
  const LabelAndHelp = demo('라벨과 도움말')
  render(<LabelAndHelp />)
  const email = screen.getByRole('textbox', { name: '이메일' })
  expect(email).toHaveAccessibleDescription('영수증을 받을 주소입니다.')

  await u.type(email, 'haneul')
  expect(screen.queryByRole('alert')).toBeNull() // not while still typing
  await u.tab()
  expect(screen.getByRole('alert')).toHaveTextContent('@가 빠졌습니다')
  expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(email).toHaveAccessibleDescription(/@가 빠졌습니다/)

  await u.type(email, '@mail.com')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(email).not.toHaveAttribute('aria-invalid')
  expect(screen.getByText('영수증을 받을 주소입니다.')).toBeInTheDocument()
})

it('icons and buttons: the clear button empties the search and the eye shows the password', async () => {
  const u = user()
  const IconsAndButtons = demo('아이콘과 버튼이 붙은 입력')
  render(<IconsAndButtons />)

  const search = screen.getByRole('searchbox', { name: '과일 검색' })
  expect(screen.queryByRole('button', { name: '검색어 지우기' })).toBeNull()
  await u.type(search, '포도')
  expect(screen.getByRole('status')).toHaveTextContent('1개 찾음: 포도')
  await u.click(screen.getByRole('button', { name: '검색어 지우기' }))
  expect(search).toHaveValue('')
  expect(search).toHaveFocus()
  expect(screen.getByRole('status')).toHaveTextContent('과일 8개')
  expect(screen.queryByRole('button', { name: '검색어 지우기' })).toBeNull()

  const password = screen.getByLabelText('비밀번호')
  const eye = screen.getByRole('button', { name: '비밀번호 보기' })
  expect(password).toHaveAttribute('type', 'password')
  expect(eye).toHaveAttribute('aria-pressed', 'false')
  await u.click(eye)
  expect(password).toHaveAttribute('type', 'text')
  expect(eye).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('적은 글자가 그대로 보입니다.')).toBeInTheDocument()
  await u.click(eye)
  expect(password).toHaveAttribute('type', 'password')
})

it('keyboards: each format sets the field type and draws its keyboard', async () => {
  const u = user()
  const KeyboardTypes = demo('입력 형식별 키보드')
  render(<KeyboardTypes />)
  const formats = screen.getByRole('radiogroup', { name: '입력 형식' })
  expect(within(formats).getAllByRole('radio').map((r) => r.textContent)).toEqual([
    '이메일', '전화번호', '수량', '인증번호', '웹사이트', '검색',
  ])
  expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email')
  expect(screen.getByRole('img', { name: /@와 \. 키/ })).toBeInTheDocument()

  await u.click(within(formats).getByRole('radio', { name: '전화번호' }))
  expect(screen.getByLabelText('전화번호')).toHaveAttribute('type', 'tel')
  expect(screen.getByRole('img', { name: /전화 숫자 패드/ })).toBeInTheDocument()

  await u.click(within(formats).getByRole('radio', { name: '인증번호' }))
  const code = screen.getByLabelText('인증번호')
  expect(code).toHaveAttribute('type', 'text')
  expect(code).toHaveAttribute('inputmode', 'numeric')
  expect(screen.getByText('type="text" inputMode="numeric"')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /숫자만 있는 패드/ })).toBeInTheDocument()

  await u.click(within(formats).getByRole('radio', { name: '검색' }))
  expect(screen.getByRole('searchbox', { name: '검색' })).toBeInTheDocument()
})

it('addons: the unit and prefix stay outside what is typed', async () => {
  const u = user()
  const Addons = demo('앞뒤 붙임 (addon)')
  render(<Addons />)
  const price = screen.getByRole('textbox', { name: '가격' })
  expect(price).toHaveValue('12,000')
  await u.clear(price)
  await u.type(price, '35000')
  expect(price).toHaveValue('35,000')
  expect(screen.getByRole('status')).toHaveTextContent('가격 35,000원')

  const site = screen.getByRole('textbox', { name: '홈페이지' })
  await u.clear(site)
  await u.click(site)
  await u.paste('https://my.shop')
  expect(site).toHaveValue('my.shop')
  expect(screen.getByRole('status')).toHaveTextContent('주소 https://my.shop')
})
