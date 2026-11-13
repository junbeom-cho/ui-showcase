import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { aiPatternsEntry } from '.'
import { tokenize } from './chat'
import {
  AgentStepsFormat,
  AttachmentFormat,
  CitationsFormat,
  EditPromptFormat,
  FeedbackFormat,
  RegenerateFormat,
  StreamingFormat,
  SuggestionsFormat,
  ThinkingFormat,
} from './formats'

const status = () => screen.getByRole('status')
const later = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })
/** Each tick schedules the next one after a render, so walk the clock in small steps. */
const settle = (ms = 8000) => {
  for (let t = 0; t < ms; t += 100) later(100)
}
const timedUser = () => {
  vi.useFakeTimers()
  // Testing Library waits on a zero-length timeout after every event and only moves fake
  // time on by itself when it finds a `jest` global; lend it Vitest's clock for this test.
  vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}
const send = (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getByRole('button', { name: '보내기' }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('entry', () => {
  it('is a pattern entry that search finds by every format name', () => {
    expect(aiPatternsEntry.id).toBe('ai-patterns')
    expect(aiPatternsEntry.name).toBe('AI Patterns')
    expect(aiPatternsEntry.category).toBe('pattern')
    expect(aiPatternsEntry.description).toMatch(/^[^.]*[가-힣][^.]*\.$/)
    for (const query of [
      'Chat UI',
      'Conversational UI',
      'Thinking indicator',
      'Streaming',
      'Suggested prompts',
      'Regenerate',
      'Citations',
      'Feedback',
      'Edit prompt',
      'Attachments',
      'Agent steps',
      'AI 채팅',
      '챗봇',
      'AI 화면',
    ]) {
      expect(filterEntries([aiPatternsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    expect(aiPatternsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '생각 중 표시',
      '스트리밍 답변',
      '추천 질문 칩',
      '다시 생성',
      '출처 표시',
      '답변 피드백',
      '고쳐 묻기',
      '파일 첨부',
      '에이전트 단계',
    ])
    for (const x of aiPatternsEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with every state of an assistant turn, none of it focusable', () => {
    const States = aiPatternsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '보내는 중',
      '생각 중',
      '답변 중',
      '완료',
      '중단됨',
      '오류 → 다시 시도',
    ])
    for (const li of items) expect(li.querySelector('[inert]')).not.toBeNull()
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = aiPatternsEntry.anatomy
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = aiPatternsEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      expect(container.querySelector('[aria-live]')).toBeNull()
      unmount()
    }
  })
})

it('streams word by word, or a sentence at a time when motion is reduced', () => {
  expect(tokenize('가방이 좋아요. 정말 가벼워요.')).toEqual(['가방이 ', '좋아요. ', '정말 ', '가벼워요.'])
  expect(tokenize('가방이 좋아요. 정말 가벼워요.', true)).toEqual(['가방이 좋아요. ', '정말 가벼워요.'])
})

it('thinking: counts the seconds, grows the summary while it thinks, then answers', async () => {
  const u = timedUser()
  render(<ThinkingFormat />)
  expect(status()).toHaveTextContent('보내기를 누르면 4초 동안 생각한 뒤 답해요.')

  await send(u)
  expect(status()).toHaveTextContent('생각하는 중…')
  const toggle = screen.getByRole('button', { name: /생각하는 중 · 0초/ })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await u.click(toggle)
  const summary = () => within(screen.getByRole('list', { name: '생각 과정 요약' })).getAllByRole('listitem')
  expect(summary()).toHaveLength(1)
  later(1000)
  expect(summary()).toHaveLength(2)
  expect(screen.getByRole('button', { name: /생각하는 중 · 1초/ })).toBeInTheDocument()

  settle(3000)
  expect(status()).toHaveTextContent('답변하는 중…')
  settle()
  expect(status()).toHaveTextContent('답변 완료 · 4초 동안 생각함')
  expect(screen.getByRole('button', { name: '4초 동안 생각함' })).toHaveAttribute('aria-expanded', 'true')
  expect(summary()).toHaveLength(4)
  expect(screen.getByText(/성산일출봉과 우도/)).toBeInTheDocument()
})

it('streaming: shows a cursor while writing, and stop keeps what was written', async () => {
  const u = timedUser()
  const { container } = render(<StreamingFormat />)
  await send(u)
  later(1000)
  later(70 * 5)
  expect(status()).toHaveTextContent('답변하는 중… 정지를 누르면 그 자리에서 멈춰요.')
  expect(container.querySelector('[data-slot="ai-caret"]')).not.toBeNull()
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()

  await u.click(screen.getByRole('button', { name: '정지' }))
  expect(status()).toHaveTextContent(/답변을 멈췄어요 · \d+조각 중 \d+조각에서 멈춤/)
  expect(screen.getByText('답변을 멈췄어요')).toBeInTheDocument()
  expect(container.querySelector('[data-slot="ai-caret"]')).toBeNull()
  expect(screen.queryByText(/방수 커버를 함께 챙기세요/)).toBeNull()
  settle(2000)
  expect(screen.queryByText(/방수 커버를 함께 챙기세요/)).toBeNull()

  await u.click(screen.getByRole('button', { name: '처음부터' }))
  expect(status()).toHaveTextContent('보내기를 누르면')
})

it('streaming: with reduced motion the same answer arrives in sentences', async () => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: query.includes('reduce'), media: query }) as MediaQueryList,
  )
  const u = timedUser()
  render(<StreamingFormat />)
  await send(u)
  settle()
  expect(status()).toHaveTextContent('답변 완료 · 3조각')
  expect(screen.getByText(/방수 커버를 함께 챙기세요/)).toBeInTheDocument()
})

it('suggestions: a chip sends at once, follow-ups appear after the answer, the pencil only fills', async () => {
  const u = timedUser()
  render(<SuggestionsFormat />)
  const starters = within(screen.getByRole('list', { name: '추천 질문' }))
  expect(starters.getAllByRole('listitem')).toHaveLength(4)

  await u.click(starters.getByRole('button', { name: '이 가방 어때?' }))
  expect(screen.queryByRole('list', { name: '추천 질문' })).toBeNull()
  expect(status()).toHaveTextContent('생각하는 중…')
  settle()
  const followUps = within(screen.getByRole('list', { name: '이어서 물어보기' }))
  expect(followUps.getAllByRole('button')).toHaveLength(2)
  expect(status()).toHaveTextContent('답변 완료 · 이어서 물어볼 질문 2개')

  await u.click(followUps.getByRole('button', { name: '방수 커버도 추천해줘' }))
  settle()
  expect(screen.getByText('방수 커버도 추천해줘')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '새 대화' }))
  await u.click(screen.getByRole('button', { name: '‘제주 2박 3일 일정 짜줘’ 입력창에 넣기' }))
  const box = screen.getByRole('textbox', { name: '메시지' })
  expect(box).toHaveValue('제주 2박 3일 일정 짜줘')
  expect(box).toHaveFocus()
  expect(status()).toHaveTextContent('입력창에 넣었어요: 제주 2박 3일 일정 짜줘')
  expect(screen.getByRole('list', { name: '추천 질문' })).toBeInTheDocument()
})

it('regenerate: every new version is kept and the pager moves between them', async () => {
  const u = timedUser()
  render(<RegenerateFormat />)
  expect(status()).toHaveTextContent('답변 1개 중 1번째를 보는 중')
  expect(screen.queryByRole('group', { name: '답변 버전' })).toBeNull()

  await u.click(screen.getByRole('button', { name: '다시 생성' }))
  expect(status()).toHaveTextContent('새 답변을 만드는 중… (2번째)')
  expect(screen.getByRole('button', { name: '다시 생성' })).toBeDisabled()
  settle()
  expect(status()).toHaveTextContent('답변 2개 중 2번째를 보는 중')
  expect(screen.getByText(/짧게 말하면/)).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '이전 답변' }))
  expect(status()).toHaveTextContent('답변 2개 중 1번째를 보는 중')
  expect(screen.getByText(/수납칸이 다섯 개/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '이전 답변' })).toBeDisabled()
})

it('citations: hover or focus shows the source, a press pins it, Escape closes', async () => {
  const u = timedUser()
  render(<CitationsFormat />)
  const marker = (n: number) => screen.getByRole('button', { name: `출처 ${n}` })
  expect(status()).toHaveTextContent('숫자를 가리키거나 눌러 출처를 확인하세요.')

  await u.hover(marker(2))
  expect(status()).toHaveTextContent('출처 2: 성산·우도 급행버스 시간표')
  expect(marker(2)).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(/급행버스가 20분마다/)).toBeInTheDocument()
  await u.unhover(marker(2))
  expect(status()).toHaveTextContent('숫자를 가리키거나')

  await u.click(marker(1))
  await u.unhover(marker(1))
  expect(status()).toHaveTextContent('출처 1: 제주 버스 노선 안내 (고정됨)')
  await u.keyboard('{Escape}')
  expect(status()).toHaveTextContent('숫자를 가리키거나')

  // the focus stayed on marker 1; the keyboard moves on to the next source
  await u.tab()
  expect(marker(2)).toHaveFocus()
  expect(status()).toHaveTextContent('출처 2: 성산·우도 급행버스 시간표')
})

it('feedback: thumbs down asks why, and the reasons are sent', async () => {
  const u = timedUser()
  render(<FeedbackFormat />)
  expect(status()).toHaveTextContent('평가: 없음')

  await u.click(screen.getByRole('button', { name: '좋아요' }))
  expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'true')
  expect(status()).toHaveTextContent('평가: 좋아요')

  await u.click(screen.getByRole('button', { name: '별로예요' }))
  expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
  expect(status()).toHaveTextContent('평가: 별로예요 · 이유를 골라 주세요')
  const form = within(screen.getByRole('form', { name: '별로인 이유' }))
  expect(form.getByRole('button', { name: '의견 보내기' })).toBeDisabled()
  await u.click(form.getByRole('button', { name: '너무 길어요' }))
  expect(form.getByRole('button', { name: '너무 길어요' })).toHaveAttribute('aria-pressed', 'true')
  await u.type(form.getByRole('textbox', { name: '더 알려 주세요 (선택)' }), '세 줄이면 충분해요')
  await u.click(form.getByRole('button', { name: '의견 보내기' }))
  expect(screen.queryByRole('form', { name: '별로인 이유' })).toBeNull()
  expect(status()).toHaveTextContent('의견을 보냈어요 · 별로예요 · 이유: 너무 길어요')

  const write = vi.spyOn(navigator.clipboard, 'writeText')
  await u.click(screen.getByRole('button', { name: '답변 복사' }))
  await act(async () => {})
  expect(write).toHaveBeenCalledWith(expect.stringContaining('안마 쿠션'))
  expect(status()).toHaveTextContent('답변을 복사했어요')
  expect(screen.getByRole('button', { name: '복사됨' })).toBeInTheDocument()
  later(2000)
  expect(screen.getByRole('button', { name: '답변 복사' })).toBeInTheDocument()
})

it('edit prompt: the edited question rewrites the answer and the first branch stays reachable', async () => {
  const u = timedUser()
  render(<EditPromptFormat />)
  await u.click(screen.getByRole('button', { name: '질문 고치기' }))
  const box = screen.getByRole('textbox', { name: '질문 고치기' })
  expect(box).toHaveFocus()
  expect(status()).toHaveTextContent('질문을 고치는 중')

  await u.type(box, ', 아이랑')
  await u.click(screen.getByRole('button', { name: '보내기' }))
  expect(screen.getByText('제주 2박 3일 일정 짜줘, 아이랑')).toBeInTheDocument()
  expect(status()).toHaveTextContent('고친 질문으로 다시 답하는 중…')
  settle()
  expect(screen.getByText(/에코랜드/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('질문 2개 중 2번째')

  await u.click(screen.getByRole('button', { name: '이전 질문' }))
  expect(screen.getByText('제주 2박 3일 일정 짜줘')).toBeInTheDocument()
  expect(screen.getByText(/성산일출봉과 우도/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('질문 2개 중 1번째')

  await u.click(screen.getByRole('button', { name: '질문 고치기' }))
  await u.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: '질문 고치기' })).toBeInTheDocument()
})

it('attachment: files come in as removable chips, limits are told at once, then asked about', async () => {
  const u = timedUser()
  const { container } = render(<AttachmentFormat />)
  const samples = within(screen.getByRole('group', { name: '예시 파일 붙이기' }))
  const chips = () => within(screen.getByRole('list', { name: '첨부한 파일' })).getAllByRole('listitem')

  await u.click(samples.getByRole('button', { name: '여행-영수증.pdf' }))
  expect(chips()).toHaveLength(1)
  expect(chips()[0]).toHaveTextContent('여행-영수증.pdf1.2MB')
  await u.click(screen.getByRole('button', { name: '여행-영수증.pdf 빼기' }))
  expect(screen.queryByRole('list', { name: '첨부한 파일' })).toBeNull()
  // the remove button sits inside the composer form and must not send it
  expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue('이 파일 요약해줘')

  await u.click(samples.getByRole('button', { name: '여행-영수증.pdf' }))
  const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!
  await u.upload(picker, new File(['메모'], '메모.txt', { type: 'text/plain' }))
  expect(chips()).toHaveLength(2)
  const huge = new File(['x'], '영상.mov')
  Object.defineProperty(huge, 'size', { value: 11 * 1024 * 1024 })
  await u.upload(picker, huge)
  expect(status()).toHaveTextContent('‘영상.mov’은 10MB가 넘어 붙일 수 없어요.')
  expect(chips()).toHaveLength(2)

  // dropping on the chat attaches too
  const drop = screen.getByRole('region', { name: '여행 도우미' }).parentElement!
  fireEvent.dragOver(drop)
  expect(screen.getByText('여기에 놓으면 첨부돼요')).toBeInTheDocument()
  fireEvent.drop(drop, { dataTransfer: { files: [new File(['a'], '가방-사진.jpg')] } })
  expect(screen.queryByText('여기에 놓으면 첨부돼요')).toBeNull()
  expect(chips()).toHaveLength(3)
  await u.click(samples.getByRole('button', { name: '제주-일정.xlsx' }))
  expect(status()).toHaveTextContent('파일은 3개까지 붙일 수 있어요.')

  await send(u)
  expect(screen.queryByRole('list', { name: '첨부한 파일' })).toBeNull()
  expect(within(screen.getByRole('list', { name: '보낸 파일' })).getAllByRole('listitem')).toHaveLength(3)
  settle()
  expect(screen.getByText(/48만 2천 원.*함께 보낸 파일 2개/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('답변 완료')
})

it('agent steps: ticks off each tool step, shows what ran, and replays', async () => {
  const u = timedUser()
  render(<AgentStepsFormat />)
  await send(u)
  expect(status()).toHaveTextContent('단계 0/4 완료 · 지금: 명세서 읽는 중')
  later(1500)
  later(1500)
  expect(status()).toHaveTextContent('단계 2/4 완료 · 지금: 정리하는 중')
  const steps = within(screen.getByRole('list', { name: '작업 단계' })).getAllByRole('listitem')
  expect(steps.map((s) => s.dataset.stepState)).toEqual(['done', 'done', 'running', 'waiting'])
  expect(screen.queryByRole('button', { name: '정리해서 보내기 자세히' })).toBeNull()

  await u.click(screen.getByRole('button', { name: '명세서 읽기 자세히' }))
  expect(screen.getByText('read_file("10월_카드명세서.pdf")')).toBeInTheDocument()
  expect(screen.getByText('거래 48건, 합계 87만 4천 원을 찾았어요.')).toBeInTheDocument()

  later(1500)
  later(1500)
  expect(status()).toHaveTextContent('모든 단계 완료 · 4/4')
  expect(screen.getByText(/내 메일로 보냈어요/)).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '다시 실행' }))
  expect(status()).toHaveTextContent('단계 0/4 완료')
})
