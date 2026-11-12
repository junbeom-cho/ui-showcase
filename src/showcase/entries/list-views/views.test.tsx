import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AccordionView,
  CardView,
  CarouselView,
  GridView,
  InfiniteScrollView,
  ListView,
  MasonryView,
  TableView,
  TimelineView,
} from './views'

const user = () => userEvent.setup()
const status = () => screen.getByRole('status')

it('list: rows with a picture, title and meta; one can be chosen', async () => {
  const u = user()
  render(<ListView />)
  const items = within(screen.getByRole('list', { name: '장소 목록' })).getAllByRole('listitem')
  expect(items).toHaveLength(12)
  await u.click(screen.getByRole('button', { name: /책방 오후/ }))
  expect(screen.getByRole('button', { name: /책방 오후/ })).toHaveAttribute('aria-current', 'true')
  expect(status()).toHaveTextContent('책방 오후')
})

it('grid: the same tiles in 2, 3 or 4 columns', async () => {
  const u = user()
  render(<GridView />)
  const grid = screen.getByRole('list', { name: '장소 격자' })
  expect(grid).toHaveAttribute('data-columns', '3')
  await u.click(screen.getByRole('radio', { name: '4열' }))
  expect(grid).toHaveAttribute('data-columns', '4')
  expect(within(grid).getAllByRole('listitem')).toHaveLength(12)
})

it('card: each card has its own actions', async () => {
  const u = user()
  render(<CardView />)
  expect(status()).toHaveTextContent('저장한 장소 0곳')
  const save = screen.getAllByRole('button', { name: '저장' })
  await u.click(save[0])
  await u.click(save[2])
  expect(status()).toHaveTextContent('저장한 장소 2곳')
  expect(save[0]).toHaveAttribute('aria-pressed', 'true')
})

it('carousel: one slide at a time with arrows and dots', async () => {
  const u = user()
  render(<CarouselView />)
  const carousel = screen.getByRole('region', { name: '추천 장소' })
  expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
  expect(status()).toHaveTextContent('1 / 12')
  expect(screen.getByRole('button', { name: '이전 장소' })).toBeDisabled()
  await u.click(screen.getByRole('button', { name: '다음 장소' }))
  expect(status()).toHaveTextContent('2 / 12')
  await u.click(screen.getByRole('button', { name: '12번째 장소로' }))
  expect(status()).toHaveTextContent('12 / 12')
  expect(screen.getByRole('button', { name: '다음 장소' })).toBeDisabled()
})

it('table: sortable columns and row selection', async () => {
  const u = user()
  render(<TableView />)
  const rating = screen.getByRole('columnheader', { name: /평점/ })
  await u.click(within(rating).getByRole('button'))
  expect(rating).toHaveAttribute('aria-sort', 'descending')
  const firstRow = () => screen.getAllByRole('row')[1]
  expect(firstRow()).toHaveTextContent('책방 오후')
  await u.click(within(rating).getByRole('button'))
  expect(rating).toHaveAttribute('aria-sort', 'ascending')
  expect(firstRow()).toHaveTextContent('종이의 시간')
  await u.click(within(firstRow()).getByRole('checkbox'))
  expect(status()).toHaveTextContent('1개 선택됨')
  await u.click(screen.getByRole('checkbox', { name: '모두 선택' }))
  expect(status()).toHaveTextContent('12개 선택됨')
})

it('timeline: newest first, grouped by month, entries open for detail', async () => {
  const u = user()
  render(<TimelineView />)
  expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([
    '2026년 11월',
    '2026년 10월',
    '2026년 9월',
    '2026년 8월',
  ])
  const entry = screen.getByRole('button', { name: /솔숲 공원/ })
  expect(entry).toHaveAttribute('aria-expanded', 'false')
  await u.click(entry)
  expect(entry).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('산책로 한 바퀴 40분.')).toBeVisible()
})

it('accordion: one section per category, opening and closing', async () => {
  const u = user()
  render(<AccordionView />)
  const cafe = screen.getByRole('button', { name: /카페 3곳/ })
  expect(cafe).toHaveAttribute('aria-expanded', 'true')
  await u.click(screen.getByRole('button', { name: /전시 3곳/ }))
  expect(screen.getByRole('button', { name: /전시 3곳/ })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('소리 박물관')).toBeInTheDocument()
})

it('masonry: columns of uneven cards', async () => {
  const u = user()
  render(<MasonryView />)
  const wall = screen.getByRole('list', { name: '장소 메모' })
  expect(within(wall).getAllByRole('listitem')).toHaveLength(12)
  await u.click(screen.getByRole('radio', { name: '2열' }))
  expect(wall).toHaveAttribute('data-columns', '2')
})

it('infinite scroll: more items arrive at the end, until there are no more', async () => {
  const u = user()
  render(<InfiniteScrollView />)
  const feed = screen.getByRole('feed', { name: '장소 피드' })
  expect(within(feed).getAllByRole('article')).toHaveLength(6)
  await u.click(screen.getByRole('button', { name: '더 불러오기' }))
  await waitFor(() => expect(within(feed).getAllByRole('article')).toHaveLength(12), { timeout: 2000 })
  expect(status()).toHaveTextContent('12개')
})
