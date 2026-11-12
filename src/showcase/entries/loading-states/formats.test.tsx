import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { loadingStatesEntry } from '.'
import {
  BlurUpFormat,
  ButtonLoadingFormat,
  OptimisticFormat,
  ProgressFormat,
  ShimmerFormat,
  SkeletonFormat,
  SpinnerFormat,
  UploadFormat,
} from './formats'

const status = () => screen.getByRole('status')

/**
 * Moves fake time on in small steps, each in its own act(), so a timer that is only
 * set after the previous one's re-render (saving → saved → idle) still gets its turn.
 */
const later = (ms: number, step = 50) => {
  for (let t = 0; t < ms; t += step) {
    act(() => {
      vi.advanceTimersByTime(Math.min(step, ms - t))
    })
  }
}

const timedUser = () => {
  vi.useFakeTimers()
  // Testing Library waits on a zero-length timeout after every event and only moves fake
  // time on by itself when it finds a `jest` global; lend it Vitest's clock for this test.
  vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('entry', () => {
  it('is a feedback entry that search finds by every format name', () => {
    expect(loadingStatesEntry.category).toBe('feedback')
    expect(loadingStatesEntry.description).toMatch(/\.$/)
    for (const query of ['Spinner', 'Loader', 'Progress bar', 'Skeleton screen', 'Shimmer', 'Optimistic UI', 'Lazy loading', '스피너', '로딩']) {
      expect(filterEntries([loadingStatesEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order', () => {
    expect(loadingStatesEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '스피너',
      '진행 막대',
      '스켈레톤',
      '반짝임 효과',
      '버튼 안 로딩',
      '여러 파일 업로드',
      '낙관적 업데이트',
      '흐릿하게 먼저 보이기',
    ])
  })

  it('opens with every state of one loading card', () => {
    const States = loadingStatesEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '대기',
      '불러오는 중',
      '완료',
      '실패',
      '다시 시도 중',
      '빈 결과',
    ])
    const card = (label: string) => items.find((li) => li.lastElementChild?.textContent === label)!
    expect(card('불러오는 중').querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(within(card('다시 시도 중')).getByRole('button', { name: '다시 시도 중…' })).toBeDisabled()
  })

  it('renders its preview and every example', () => {
    const { Preview, examples } = loadingStatesEntry
    expect(() => render(<Preview />)).not.toThrow()
    for (const { Demo } of examples) expect(() => render(<Demo />)).not.toThrow()
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = loadingStatesEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

it('spinner: says it is busy while loading, then shows the content', async () => {
  const u = timedUser()
  render(<SpinnerFormat />)
  await u.click(screen.getByRole('radio', { name: '점' }))
  const card = screen.getByRole('region', { name: '오늘의 날씨' })

  await u.click(screen.getByRole('button', { name: '불러오기' }))
  expect(card).toHaveAttribute('aria-busy', 'true')
  expect(within(card).getByText('날씨를 불러오는 중…')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeDisabled()

  later(1600)
  expect(card).toHaveAttribute('aria-busy', 'false')
  expect(within(card).getByText('서울 · 맑음 18°')).toBeInTheDocument()
  expect(status()).toHaveTextContent('불러왔습니다')
})

it('progress bar: one counts up with the time left, the other only says busy', async () => {
  const u = timedUser()
  render(<ProgressFormat />)
  await u.click(screen.getByRole('button', { name: '시작' }))
  later(2000)
  const known = screen.getByRole('progressbar', { name: '동영상 내보내기' })
  const unknown = screen.getByRole('progressbar', { name: '서버와 맞추는 중' })
  expect(known).toHaveAttribute('aria-valuenow', '40')
  expect(unknown).not.toHaveAttribute('aria-valuenow')
  expect(status()).toHaveTextContent('40% · 약 3초 남음')

  later(3000)
  expect(known).toHaveAttribute('aria-valuenow', '100')
  expect(unknown).toHaveAttribute('aria-valuenow', '100')
  expect(status()).toHaveTextContent('두 작업을 모두 마쳤습니다')
  expect(screen.getByRole('button', { name: '다시 시작' })).toBeEnabled()
})

it('skeleton: grey blocks in the shape of the comments, then the comments', async () => {
  const u = timedUser()
  const { container } = render(<SkeletonFormat />)
  const section = screen.getByRole('region', { name: '댓글' })
  expect(section).toHaveAttribute('aria-busy', 'true')
  expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  expect(screen.queryByText('저도 다음 달에 가 보려고요!')).toBeNull()

  later(1500)
  expect(section).toHaveAttribute('aria-busy', 'false')
  expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  expect(screen.getByText('저도 다음 달에 가 보려고요!')).toBeInTheDocument()
  expect(status()).toHaveTextContent('댓글 3개를 불러왔습니다')

  await u.click(screen.getByRole('button', { name: '다시 불러오기' }))
  expect(section).toHaveAttribute('aria-busy', 'true')
})

it('shimmer: light sweeps over the blocks unless motion is reduced', async () => {
  const u = timedUser()
  const { container } = render(<ShimmerFormat />)
  const blocks = () => [...container.querySelectorAll('[data-slot="shimmer"]')]
  expect(blocks()).toHaveLength(6)
  expect(blocks().every((b) => b.querySelector('span'))).toBe(true)

  await u.click(screen.getByRole('switch', { name: '움직임 줄이기로 보기' }))
  expect(blocks().some((b) => b.querySelector('span'))).toBe(false)

  later(2200)
  expect(blocks()).toHaveLength(0)
  expect(screen.getByText('리넨 셔츠')).toBeInTheDocument()
})

it('button loading: disabled with a spinner while saving, then a check; a double press saves once', async () => {
  const u = timedUser()
  render(<ButtonLoadingFormat />)
  const button = screen.getByRole('button', { name: '저장' })

  await u.dblClick(button)
  expect(button).toBeDisabled()
  expect(button).toHaveAccessibleName('저장 중…')
  expect(screen.getByRole('textbox', { name: '표시 이름' })).toBeDisabled()

  later(1500)
  expect(button).toBeEnabled()
  expect(button).toHaveAccessibleName('저장됨')
  expect(status()).toHaveTextContent('저장한 횟수 1번')

  later(2000)
  expect(button).toHaveAccessibleName('저장')
})

it('upload: every file has its own bar; only the failed one is retried', async () => {
  const u = timedUser()
  render(<UploadFormat />)
  await u.click(screen.getByRole('button', { name: '올리기 시작' }))
  later(4000)
  expect(status()).toHaveTextContent('4개 중 3개 완료 · 1개 실패')
  expect(screen.getByRole('progressbar', { name: '여행-영상.mov 올리기' })).toHaveAttribute('aria-valuenow', '44')
  expect(screen.getByRole('progressbar', { name: '발표자료.pptx 올리기' })).toHaveAttribute('aria-valuenow', '100')

  await u.click(screen.getByRole('button', { name: '여행-영상.mov 다시 시도' }))
  expect(status()).toHaveTextContent('4개 중 3개 완료')
  later(4000)
  expect(status()).toHaveTextContent('4개 중 4개 완료')
  expect(screen.queryByRole('button', { name: /다시 시도/ })).toBeNull()
})

it('optimistic update: changes at once, and rolls back with a message when a request fails', async () => {
  const u = timedUser()
  render(<OptimisticFormat />)
  const box = (name: string) => screen.getByRole('checkbox', { name })

  await u.click(box('우유 사기'))
  // checked before the server has answered
  expect(box('우유 사기')).toBeChecked()
  expect(status()).toHaveTextContent('저장 중: 우유 사기')
  later(900)
  expect(box('우유 사기')).toBeChecked()
  expect(status()).toHaveTextContent('저장했습니다: 우유 사기')

  await u.click(box('엄마께 전화하기'))
  later(900)
  // the third request is the one that fails
  await u.click(box('운동 30분'))
  expect(box('운동 30분')).toBeChecked()
  later(900)
  expect(box('운동 30분')).not.toBeChecked()
  expect(status()).toHaveTextContent('저장하지 못해 되돌렸습니다: 운동 30분')
  expect(within(screen.getByRole('list', { name: '서버 답' })).getAllByRole('listitem')[0]).toHaveTextContent(
    '요청 3 · 운동 30분 · 실패 → 되돌림',
  )
})

it('blur-up: starts from a blurred preview and sharpens when the original arrives', async () => {
  const u = timedUser()
  render(<BlurUpFormat />)
  const picture = screen.getByRole('img', { name: /흐린 미리보기에서 시작/ })
  expect(picture).toHaveAttribute('data-loaded', 'false')
  expect(picture).toHaveTextContent('미리보기 0.4KB')

  later(2000)
  expect(picture).toHaveAttribute('data-loaded', 'true')
  expect(picture).toHaveTextContent('원본 480KB')
  expect(status()).toHaveTextContent('선명하게 바꿨습니다')

  await u.click(screen.getByRole('button', { name: '다시 불러오기' }))
  expect(picture).toHaveAttribute('data-loaded', 'false')
})
