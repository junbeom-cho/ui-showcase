import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { textareaEntry } from './textarea'

const user = () => userEvent.setup()
const demo = (title: string) => textareaEntry.examples.find((x) => x.title === title)!.Demo

it('is a multi-line field in the input category, findable by other names', () => {
  expect(textareaEntry).toMatchObject({ id: 'textarea', name: 'Textarea', category: 'input' })
  expect(textareaEntry.aliases).toEqual(expect.arrayContaining(['Text area', 'Multiline text field', '여러 줄 입력']))
  expect(textareaEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(textareaEntry.examples[0].title).toBe('상태 모음')
  const States = textareaEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '호버', '포커스', '입력됨', '비활성', '읽기 전용', '오류', '글자 수 초과',
  ])
  const field = (name: string) => screen.getByRole('textbox', { name })
  expect(field('기본')).toHaveValue('')
  expect(field('호버')).toHaveAttribute('data-demo-state', 'hover')
  expect(field('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(field('비활성')).toBeDisabled()
  expect(field('읽기 전용')).toHaveAttribute('readonly')
  expect(field('오류')).toHaveAttribute('aria-invalid', 'true')

  const over = items.find((li) => li.lastElementChild?.textContent === '글자 수 초과')!
  const [count, limit] = within(over).getByText(/\/ 20$/).textContent!.split(' / ').map(Number)
  expect(count).toBeGreaterThan(limit)
  expect(field('글자 수 초과')).toHaveAttribute('aria-invalid', 'true')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(textareaEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(textareaEntry.examples.map((x) => x.title)).size).toBe(textareaEntry.examples.length)
  for (const x of textareaEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = textareaEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [textareaEntry.Preview, textareaEntry.anatomy.Specimen, ...textareaEntry.examples.map((x) => x.Demo)]
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

it('character count: counts as you type and turns red past the limit', async () => {
  const u = user()
  const CharacterCount = demo('글자 수 세기')
  render(<CharacterCount />)
  const bio = screen.getByRole('textbox', { name: '자기소개' })
  expect(screen.getByText(/^\d+ \/ 100$/)).toBeInTheDocument()

  await u.clear(bio)
  expect(screen.getByText('0 / 100')).toBeInTheDocument()
  await u.type(bio, '안녕하세요')
  expect(screen.getByText('5 / 100')).toBeInTheDocument()

  await u.paste('ㅋ'.repeat(90))
  expect(screen.getByText('95 / 100')).toBeInTheDocument()
  expect(screen.getByText('5자 남았습니다.')).toBeInTheDocument()

  await u.type(bio, 'ㅋㅋㅋㅋㅋㅋㅋ')
  expect(screen.getByText('102 / 100')).toHaveClass('text-destructive')
  expect(screen.getByRole('alert')).toHaveTextContent('2자를 줄여 주세요.')
  expect(bio).toHaveAttribute('aria-invalid', 'true')
  expect(bio).toHaveValue(`안녕하세요${'ㅋ'.repeat(97)}`) // nothing was cut off
})

it('auto grow: counts the lines and caps the height', async () => {
  const u = user()
  const AutoGrow = demo('자동으로 늘어나는 높이')
  render(<AutoGrow />)
  const list = screen.getByRole('textbox', { name: '장보기 목록' })
  expect(list).toHaveClass('max-h-40', 'overflow-y-auto')
  expect(screen.getByRole('status')).toHaveTextContent('항목 3개')

  await u.type(list, '{Enter}사과')
  expect(screen.getByRole('status')).toHaveTextContent('항목 4개')
  await u.click(screen.getByRole('button', { name: '10개 채우기' }))
  expect(screen.getByRole('status')).toHaveTextContent('항목 10개')
  await u.click(screen.getByRole('button', { name: '비우기' }))
  expect(list).toHaveValue('')
  expect(screen.getByRole('status')).toHaveTextContent('항목 0개')
})

it('comment box: send stays off until there is text, and Ctrl+Enter also sends', async () => {
  const u = user()
  const CommentBox = demo('댓글 작성')
  render(<CommentBox />)
  const draft = screen.getByRole('textbox', { name: '댓글 쓰기' })
  const send = screen.getByRole('button', { name: '보내기' })
  const comments = () => within(screen.getByRole('list', { name: '댓글' })).getAllByRole('listitem')
  expect(comments()).toHaveLength(1)
  expect(send).toBeDisabled()

  await u.type(draft, '   ')
  expect(send).toBeDisabled()
  await u.clear(draft)
  await u.type(draft, '저도 같은 생각이에요')
  expect(send).toBeEnabled()
  await u.click(send)
  expect(comments()).toHaveLength(2)
  expect(comments()[1]).toHaveTextContent('저도 같은 생각이에요')
  expect(draft).toHaveValue('')
  expect(draft).toHaveFocus()
  expect(send).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('댓글 2개')

  await u.type(draft, '첫 줄{Enter}둘째 줄')
  expect(comments()).toHaveLength(2) // plain Enter is a new line
  await u.keyboard('{Control>}{Enter}{/Control}')
  expect(comments()).toHaveLength(3)
  expect(comments()[2]).toHaveTextContent('첫 줄 둘째 줄')
  expect(screen.getByRole('status')).toHaveTextContent('댓글 3개')
})

it('resize handles: one field resizes vertically, the other not at all', () => {
  const ResizeHandles = demo('크기 조절 손잡이')
  render(<ResizeHandles />)
  expect(screen.getByRole('textbox', { name: /resize-y/ })).toHaveClass('resize-y', 'field-sizing-fixed')
  expect(screen.getByRole('textbox', { name: /resize-none/ })).toHaveClass('resize-none', 'field-sizing-fixed')
})
