import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ratingEntry } from './rating'

const user = () => userEvent.setup()
const demo = (title: string) => ratingEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const fills = (group: HTMLElement) =>
  [...group.querySelectorAll('[data-slot="rating-item"]')].map((el) => el.getAttribute('data-fill'))

it('is an input findable as star rating or review stars', () => {
  expect(ratingEntry).toMatchObject({ id: 'rating', name: 'Rating', category: 'input' })
  expect(ratingEntry.aliases).toEqual(expect.arrayContaining(['Star rating', 'Review stars', '별점']))
  expect(ratingEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery', () => {
  expect(ratingEntry.examples[0].title).toBe('상태 모음')
  const States = ratingEntry.examples[0].Demo
  render(<States />)
  const cells = [...screen.getByRole('list', { name: '상태 모음' }).querySelectorAll<HTMLElement>(':scope > li')]
  expect(cells.map((li) => li.lastElementChild?.textContent)).toEqual([
    '빈 별', '일부', '가득', '마우스 올림 미리보기', '포커스', '읽기 전용', '비활성',
  ])
  const group = (name: string) => screen.getByRole('radiogroup', { name })
  expect(within(group('빈 별')).queryAllByRole('radio', { checked: true })).toHaveLength(0)
  expect(fills(group('빈 별'))).toEqual(['off', 'off', 'off', 'off', 'off'])
  expect(within(group('일부')).getByRole('radio', { name: '3점' })).toBeChecked()
  expect(fills(group('가득'))).toEqual(['on', 'on', 'on', 'on', 'on'])

  const hovered = group('마우스 올림 미리보기')
  expect(fills(hovered)).toEqual(['on', 'on', 'preview', 'preview', 'off'])
  expect(within(hovered).getByRole('radio', { name: '4점' }).closest('label')).toHaveAttribute('data-demo-state', 'hover')
  expect(within(group('포커스')).getByRole('radio', { name: '3점' }).closest('label')).toHaveAttribute(
    'data-demo-state',
    'focus',
  )
  expect(within(cells[5]).getByRole('img', { name: '5점 만점에 4.5점' })).toHaveAttribute('data-value', '4.5')
  for (const radio of within(group('비활성')).getAllByRole('radio')) expect(radio).toBeDisabled()
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(ratingEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(ratingEntry.examples.map((x) => x.title)).size).toBe(ratingEntry.examples.length)
  for (const x of ratingEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = ratingEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [ratingEntry.Preview, ratingEntry.anatomy.Specimen, ...ratingEntry.examples.map((x) => x.Demo)]
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
  // every rating is its own radio group
  const names = [...container.querySelectorAll<HTMLInputElement>('[data-slot="rating"] input')].map((r) => r.name)
  expect(new Set(names).size).toBe(names.length / 5)
})

it('leave a rating: hover previews, a click sets it, arrow keys move it, clear empties it', async () => {
  const u = user()
  const Leave = demo('별점 남기기')
  render(<Leave />)
  const group = screen.getByRole('radiogroup', { name: '배송은 만족스러우셨나요?' })
  const star = (n: number) => within(group).getByRole('radio', { name: `${n}점` })
  expect(status()).toHaveTextContent('아직 고르지 않았습니다.')

  await u.hover(star(2).closest('label')!)
  expect(fills(group)).toEqual(['preview', 'preview', 'off', 'off', 'off'])
  expect(screen.getByText('그저 그래요')).toBeInTheDocument()
  expect(status()).toHaveTextContent('아직 고르지 않았습니다.') // only a preview
  await u.unhover(group)
  expect(fills(group)).toEqual(['off', 'off', 'off', 'off', 'off'])

  await u.click(star(4).closest('label')!)
  expect(star(4)).toBeChecked()
  expect(status()).toHaveTextContent('고른 별점: 4점 (좋아요)')
  expect(star(4)).toHaveFocus()

  await u.keyboard('{ArrowRight}')
  expect(star(5)).toBeChecked()
  expect(status()).toHaveTextContent('고른 별점: 5점 (최고예요)')
  await u.keyboard('{ArrowLeft}{ArrowLeft}')
  expect(star(3)).toBeChecked()
  expect(status()).toHaveTextContent('고른 별점: 3점')

  await u.click(screen.getByRole('button', { name: '지우기' }))
  expect(within(group).queryAllByRole('radio', { checked: true })).toHaveLength(0)
  expect(status()).toHaveTextContent('아직 고르지 않았습니다.')
  expect(screen.getByRole('button', { name: '지우기' })).toBeDisabled()
})

it('half stars: an average is drawn to the nearest half star', async () => {
  const u = user()
  const Half = demo('반 별 (0.5 단위)')
  render(<Half />)
  expect(screen.getByRole('img', { name: '5점 만점에 4.5점' })).toHaveAttribute('data-value', '4.5')
  expect(screen.getByText('(리뷰 1,284개)')).toBeInTheDocument()

  await u.click(screen.getByRole('radio', { name: '텀블러' }))
  expect(screen.getByRole('img', { name: '5점 만점에 3.7점' })).toHaveAttribute('data-value', '3.5')
  expect(status()).toHaveTextContent('평균 3.7점 → 별 3.5개로 그립니다')
  await u.click(screen.getByRole('radio', { name: '등산 가방' }))
  expect(status()).toHaveTextContent('평균 4.2점 → 별 4개로 그립니다')
  // read-only: nothing to pick
  expect(screen.queryByRole('radiogroup', { name: /별점/ })).toBeNull()
})

it('distribution: a bar filters the reviews to its score and toggles back', async () => {
  const u = user()
  const Dist = demo('평점 분포')
  render(<Dist />)
  expect(screen.getByText('4.5')).toBeInTheDocument()
  expect(screen.getByText('리뷰 128개')).toBeInTheDocument()
  const reviews = () => within(screen.getByRole('list', { name: '리뷰' })).getAllByRole('listitem')
  expect(reviews()).toHaveLength(6)

  const five = screen.getByRole('button', { name: '5점 82개' })
  await u.click(five)
  expect(five).toHaveAttribute('aria-pressed', 'true')
  expect(reviews()).toHaveLength(2)
  expect(status()).toHaveTextContent('5점 리뷰만 보는 중 (82개 중 예시 2개)')

  await u.click(screen.getByRole('button', { name: '2점 3개' }))
  expect(five).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('이 점수의 예시 리뷰가 없습니다.')).toBeInTheDocument()
  await u.click(screen.getByRole('button', { name: '2점 3개' }))
  expect(reviews()).toHaveLength(6)
  expect(status()).toHaveTextContent('모든 리뷰 보는 중')
})

it('other shapes: hearts fill up, faces pick one, thumbs toggle', async () => {
  const u = user()
  const Shapes = demo('다른 모양')
  render(<Shapes />)

  await u.click(screen.getByRole('radio', { name: '하트 5개' }))
  expect(screen.getByText('하트 5개')).toBeInTheDocument()
  expect(fills(screen.getByRole('radiogroup', { name: '마음에 든 정도' }))).toEqual(['on', 'on', 'on', 'on', 'on'])

  await u.click(screen.getByRole('radio', { name: '만족' }))
  expect(screen.getByRole('radio', { name: '만족' })).toBeChecked()
  expect(screen.getByText('만족도: 만족')).toBeInTheDocument()

  const up = screen.getByRole('button', { name: /좋아요/ })
  const down = screen.getByRole('button', { name: /싫어요/ })
  await u.click(up)
  expect(up).toHaveAttribute('aria-pressed', 'true')
  expect(up).toHaveTextContent('좋아요 25')
  await u.click(down)
  expect(up).toHaveAttribute('aria-pressed', 'false')
  expect(up).toHaveTextContent('좋아요 24')
  expect(down).toHaveTextContent('싫어요 4')
  await u.click(down)
  expect(screen.getByText('아직 누르지 않았습니다')).toBeInTheDocument()
})
