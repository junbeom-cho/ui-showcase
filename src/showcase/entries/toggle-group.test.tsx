import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toggleGroupEntry } from './toggle-group'

const user = () => userEvent.setup()
const demo = (title: string) => toggleGroupEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const cells = () => [...screen.getByRole('list', { name: '상태 모음' }).querySelectorAll(':scope > li')]

it('is an input findable as a segmented control or button group', () => {
  expect(toggleGroupEntry).toMatchObject({ id: 'toggle-group', name: 'Toggle Group', category: 'input' })
  expect(toggleGroupEntry.aliases).toEqual(
    expect.arrayContaining(['Segmented control', 'Button group', '토글 그룹', '세그먼트 컨트롤']),
  )
  expect(toggleGroupEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery', () => {
  expect(toggleGroupEntry.examples[0].title).toBe('상태 모음')
  const States = toggleGroupEntry.examples[0].Demo
  render(<States />)
  expect(cells().map((li) => li.lastElementChild?.textContent)).toEqual([
    '꺼짐', '켜짐', '여러 개 켜짐', '포커스', '비활성', '아이콘만', '붙인 모양',
  ])
  const group = (name: string) => screen.getByRole('radiogroup', { name })
  for (const radio of within(group('꺼짐')).getAllByRole('radio')) expect(radio).not.toBeChecked()
  expect(within(group('켜짐')).getByRole('radio', { name: '주' })).toBeChecked()

  const several = screen.getByRole('toolbar', { name: '여러 개 켜짐' })
  const pressed = within(several)
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
  expect(pressed.map((b) => b.textContent)).toEqual(['굵게', '밑줄'])

  expect(within(group('포커스')).getByRole('radio', { name: '월' })).toHaveAttribute('data-demo-state', 'focus')
  for (const radio of within(group('비활성')).getAllByRole('radio')) expect(radio).toBeDisabled()
  expect(within(group('아이콘만')).getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual([
    '왼쪽 정렬', '가운데 정렬', '오른쪽 정렬',
  ])
  expect(group('붙인 모양')).toHaveAttribute('data-spacing', '0')
  expect(group('켜짐')).toHaveAttribute('data-spacing', '2')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(toggleGroupEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(toggleGroupEntry.examples.map((x) => x.title)).size).toBe(toggleGroupEntry.examples.length)
  for (const x of toggleGroupEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = toggleGroupEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [toggleGroupEntry.Preview, toggleGroupEntry.anatomy.Specimen, ...toggleGroupEntry.examples.map((x) => x.Demo)]
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

it('alignment: one button at a time moves the paragraph and stays on when pressed again', async () => {
  const u = user()
  const Alignment = demo('정렬 고르기')
  render(<Alignment />)
  const paragraph = screen.getByText(/비가 그치고/)
  expect(screen.getByRole('radio', { name: '왼쪽 정렬' })).toBeChecked()
  expect(paragraph).toHaveAttribute('data-align', 'left')

  await u.click(screen.getByRole('radio', { name: '가운데 정렬' }))
  expect(screen.getByRole('radio', { name: '가운데 정렬' })).toBeChecked()
  expect(screen.getByRole('radio', { name: '왼쪽 정렬' })).not.toBeChecked()
  expect(paragraph).toHaveAttribute('data-align', 'center')
  expect(paragraph).toHaveClass('text-center')
  expect(status()).toHaveTextContent('정렬: 가운데')

  await u.click(screen.getByRole('radio', { name: '가운데 정렬' }))
  expect(screen.getByRole('radio', { name: '가운데 정렬' })).toBeChecked()
  expect(status()).toHaveTextContent('정렬: 가운데')
})

it('text marks: several buttons can be on together and each styles the sample', async () => {
  const u = user()
  const Marks = demo('글자 꾸미기')
  render(<Marks />)
  const sample = screen.getByText('오늘의 할 일')
  const bold = screen.getByRole('button', { name: '굵게' })
  expect(bold).toHaveAttribute('aria-pressed', 'true')
  expect(sample).toHaveClass('font-bold')

  await u.click(bold)
  expect(bold).toHaveAttribute('aria-pressed', 'false')
  expect(sample).not.toHaveClass('font-bold')
  expect(status()).toHaveTextContent('켜진 꾸밈 없음')

  await u.click(bold)
  await u.click(screen.getByRole('button', { name: '밑줄' }))
  await u.click(screen.getByRole('button', { name: '취소선' }))
  expect(status()).toHaveTextContent('켜진 꾸밈: 굵게, 밑줄, 취소선')
  expect(sample).toHaveStyle({ textDecorationLine: 'underline line-through' })
})

it('view switch: the segmented control switches the same places between list and grid', async () => {
  const u = user()
  const Views = demo('보기 바꾸기')
  render(<Views />)
  const list = screen.getByRole('list', { name: '장소' })
  expect(list).toHaveAttribute('data-view', 'list')
  expect(within(list).getAllByRole('listitem')).toHaveLength(4)

  await u.click(screen.getByRole('radio', { name: '격자' }))
  expect(list).toHaveAttribute('data-view', 'grid')
  expect(status()).toHaveTextContent('격자로 보는 중 · 장소 4곳')
  await u.click(screen.getByRole('radio', { name: '격자' }))
  expect(list).toHaveAttribute('data-view', 'grid')
})

it('comparison: the toggle changes the look at once, tabs swap panels, the radio applies on save', async () => {
  const u = user()
  const Compare = demo('토글 그룹, 탭, 라디오 비교')
  render(<Compare />)

  await u.click(within(screen.getByRole('radiogroup', { name: '온도 단위' })).getByRole('radio', { name: '°F' }))
  expect(screen.getByText('73°F')).toBeInTheDocument()
  expect(screen.getByText('단위: 화씨')).toBeInTheDocument()

  await u.click(screen.getByRole('tab', { name: '리뷰' }))
  expect(screen.getByRole('tabpanel')).toHaveTextContent('리뷰 52개')
  expect(screen.getByText('열린 탭: 리뷰')).toBeInTheDocument()

  await u.click(screen.getByRole('radio', { name: '경비실에 맡기기' }))
  expect(screen.getByText('저장된 요청: 문 앞에 두기')).toBeInTheDocument()
  await u.click(screen.getByRole('button', { name: '저장' }))
  expect(screen.getByText('저장된 요청: 경비실에 맡기기')).toBeInTheDocument()
})
