import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { tagInputEntry } from './tag-input'

const user = () => userEvent.setup()
const demo = (title: string) => tagInputEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const tagsIn = (name: string) =>
  within(screen.getByRole('list', { name }))
    .getAllByRole('listitem')
    .map((li) => li.textContent)

it('is an input findable as a chip input or tags', () => {
  expect(tagInputEntry).toMatchObject({ id: 'tag-input', name: 'Tag Input', category: 'input' })
  expect(tagInputEntry.aliases).toEqual(expect.arrayContaining(['Chip input', 'Tags', '태그 입력']))
  expect(tagInputEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery', () => {
  expect(tagInputEntry.examples[0].title).toBe('상태 모음')
  const States = tagInputEntry.examples[0].Demo
  render(<States />)
  const cells = [...screen.getByRole('list', { name: '상태 모음' }).querySelectorAll<HTMLElement>(':scope > li')]
  expect(cells.map((li) => li.lastElementChild?.textContent)).toEqual([
    '빈칸', '태그 있음', '포커스', '최대 개수', '오류 (중복)', '비활성',
  ])
  const field = (name: string) => screen.getByRole('textbox', { name })
  const box = (name: string) => field(name).closest('[data-slot="tag-input"]')

  expect(field('빈칸')).toHaveValue('')
  expect(field('빈칸')).toHaveAttribute('placeholder', '태그 입력')
  expect(screen.queryByRole('list', { name: '빈칸 태그' })).toBeNull()
  expect(tagsIn('태그 있음 태그')).toEqual(['디자인', '개발'])
  expect(box('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(cells[3]).toHaveTextContent('3 / 3')
  expect(field('최대 개수')).toHaveAttribute('placeholder', '최대 3개')
  expect(field('오류')).toHaveValue('디자인')
  expect(field('오류')).toHaveAttribute('aria-invalid', 'true')
  expect(box('오류')).toHaveAttribute('data-invalid')
  expect(cells[4]).toHaveTextContent('이미 있습니다')
  expect(field('비활성')).toBeDisabled()
  expect(within(cells[5]).queryAllByRole('button')).toHaveLength(0)
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(tagInputEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(tagInputEntry.examples.map((x) => x.title)).size).toBe(tagInputEntry.examples.length)
  for (const x of tagInputEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = tagInputEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [tagInputEntry.Preview, tagInputEntry.anatomy.Specimen, ...tagInputEntry.examples.map((x) => x.Demo)]
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

it('add and remove: Enter and comma add, Backspace on empty and × remove', async () => {
  const u = user()
  const AddAndRemove = demo('추가와 삭제')
  render(<AddAndRemove />)
  const input = screen.getByRole('textbox', { name: '여행 태그' })
  expect(tagsIn('여행 태그')).toEqual(['여행', '맛집'])

  await u.type(input, '제주{Enter}')
  expect(tagsIn('여행 태그')).toEqual(['여행', '맛집', '제주'])
  expect(input).toHaveValue('')
  expect(status()).toHaveTextContent('방금 ‘제주’ 추가')

  await u.type(input, ' 부산 ,')
  expect(tagsIn('여행 태그')).toEqual(['여행', '맛집', '제주', '부산'])
  expect(input).toHaveValue('')

  // pasted text with commas becomes several tags; the part after the last comma stays typed
  await u.paste('강릉, 속초')
  expect(tagsIn('여행 태그')).toEqual(['여행', '맛집', '제주', '부산', '강릉'])
  expect(input).toHaveValue('속초')
  await u.keyboard('{Enter}')
  expect(tagsIn('여행 태그')).toHaveLength(6)

  await u.keyboard('{Backspace}')
  expect(tagsIn('여행 태그')).toEqual(['여행', '맛집', '제주', '부산', '강릉'])
  expect(status()).toHaveTextContent('방금 ‘속초’ 삭제')

  await u.click(screen.getByRole('button', { name: '여행 삭제' }))
  expect(tagsIn('여행 태그')).toEqual(['맛집', '제주', '부산', '강릉'])
  expect(input).toHaveFocus()
  expect(status()).toHaveTextContent('태그 4개: 맛집, 제주, 부산, 강릉')
})

it('limit and duplicates: a repeated tag and a sixth tag are refused with a reason', async () => {
  const u = user()
  const Limits = demo('개수 제한과 중복 막기')
  render(<Limits />)
  const input = screen.getByRole('textbox', { name: '가 보고 싶은 도시' })
  expect(screen.getByText('3 / 5')).toBeInTheDocument()

  await u.type(input, '부산{Enter}')
  expect(screen.getByRole('alert')).toHaveTextContent('‘부산’ 태그는 이미 있습니다.')
  expect(input).toHaveValue('부산') // kept, so it can be fixed
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription(/이미 있습니다/)
  expect(tagsIn('가 보고 싶은 도시')).toEqual(['서울', '부산', '제주'])

  await u.clear(input)
  expect(screen.queryByRole('alert')).toBeNull()
  await u.type(input, '대구{Enter}광주{Enter}')
  expect(screen.getByText('5 / 5')).toBeInTheDocument()
  expect(status()).toHaveTextContent('가득 찼습니다 (5개)')

  await u.type(input, '인천{Enter}')
  expect(screen.getByRole('alert')).toHaveTextContent('태그는 5개까지 넣을 수 있습니다.')
  expect(tagsIn('가 보고 싶은 도시')).toHaveLength(5)
})

it('suggestions: arrow keys and Enter, or a click, pick from the list; other names still go in', async () => {
  const u = user()
  const Suggestions = demo('추천 목록에서 고르기')
  render(<Suggestions />)
  const input = screen.getByRole('combobox', { name: '기술 스택' })
  expect(input).toHaveAttribute('aria-expanded', 'false')

  await u.type(input, 'type')
  expect(input).toHaveAttribute('aria-expanded', 'true')
  const listbox = screen.getByRole('listbox', { name: '추천 기술' })
  expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['TypeScript'])

  await u.keyboard('{ArrowDown}')
  const option = within(listbox).getByRole('option', { name: 'TypeScript' })
  expect(option).toHaveAttribute('aria-selected', 'true')
  expect(input).toHaveAttribute('aria-activedescendant', option.id)
  await u.keyboard('{Enter}')
  expect(tagsIn('기술 스택')).toEqual(['React', 'TypeScript'])
  expect(input).toHaveValue('')

  await u.type(input, '디자')
  await u.click(screen.getByRole('option', { name: '디자인 시스템' }))
  expect(tagsIn('기술 스택')).toEqual(['React', 'TypeScript', '디자인 시스템'])
  expect(input).toHaveFocus()

  // React is already a tag, so it is not suggested again
  await u.type(input, 're')
  expect(screen.queryByRole('option', { name: 'React' })).toBeNull()
  await u.keyboard('{Escape}')
  expect(input).toHaveAttribute('aria-expanded', 'false')

  await u.clear(input)
  await u.type(input, 'Rust{Enter}')
  expect(tagsIn('기술 스택')).toEqual(['React', 'TypeScript', '디자인 시스템', 'Rust'])
  expect(status()).toHaveTextContent('태그 4개')
})

it('colour labels: a new label takes the colour chosen before adding it', async () => {
  const u = user()
  const Labels = demo('색 있는 태그 (라벨)')
  render(<Labels />)
  expect(status()).toHaveTextContent('라벨 2개: 버그(빨강), 문서(초록)')

  await u.click(screen.getByRole('radio', { name: '보라' }))
  const input = screen.getByRole('textbox', { name: '라벨' })
  expect(input).toHaveAttribute('placeholder', '보라 라벨 이름')
  await u.type(input, '디자인{Enter}')
  expect(status()).toHaveTextContent('디자인(보라)')
  const chip = within(screen.getByRole('list', { name: '라벨' })).getByText('디자인')
  expect(chip).toHaveClass('bg-violet-100')

  // changing the colour later leaves existing labels alone
  await u.click(screen.getByRole('radio', { name: '노랑' }))
  await u.type(input, '급함{Enter}')
  expect(status()).toHaveTextContent('라벨 4개: 버그(빨강), 문서(초록), 디자인(보라), 급함(노랑)')
})
