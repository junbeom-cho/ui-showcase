import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { darkPatternsEntry } from '.'
import {
  ConfirmshamingFormat,
  FakeCountdownFormat,
  FakeScarcityFormat,
  ForcedContinuityFormat,
  HiddenCostsFormat,
  NaggingFormat,
  PreCheckedFormat,
  RoachMotelFormat,
  SneakIntoBasketFormat,
} from './formats'

const status = () => screen.getByRole('status')
const user = () => userEvent.setup()
const click = (u: ReturnType<typeof user>, name: string | RegExp) => u.click(screen.getByRole('button', { name }))
const showHonest = (u: ReturnType<typeof user>) => u.click(screen.getByRole('switch', { name: '정직한 버전 보기' }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('entry', () => {
  it('is a pattern entry that search finds by every format name', () => {
    expect(darkPatternsEntry.id).toBe('dark-patterns')
    expect(darkPatternsEntry.category).toBe('pattern')
    expect(darkPatternsEntry.description).toMatch(/[가-힣].*\.$/)
    for (const query of [
      'Deceptive design',
      'Roach motel',
      'Confirmshaming',
      'Fake scarcity',
      'Hidden costs',
      'Forced continuity',
      'Nagging',
      'Sneak into basket',
      'Pre-checked consent',
      'Fake countdown',
      '다크 패턴',
      '기만적 설계',
      '숨은 해지',
      '끼워 팔기',
    ]) {
      expect(filterEntries([darkPatternsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    expect(darkPatternsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '숨은 해지',
      '미리 체크된 동의',
      '가짜 마감 시계',
      '죄책감 버튼',
      '끼워 팔기',
      '가짜 희소성',
      '숨은 비용',
      '몰래 자동 결제',
      '끝없는 권유',
    ])
    for (const x of darkPatternsEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with each trick beside its honest twin', () => {
    const States = darkPatternsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '미리 체크됨 (속임수)',
      '기본 동의 해제 (정직)',
      '작은 글씨 (속임수)',
      '분명한 고지 (정직)',
      '죄책감 문구 (속임수)',
      '동등한 선택지 (정직)',
      '가짜 마감 시계 (속임수)',
      '실제 마감일 (정직)',
    ])
    expect(within(items[0]).getByRole('checkbox')).toBeChecked()
    expect(within(items[1]).getByRole('checkbox')).not.toBeChecked()
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = darkPatternsEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = darkPatternsEntry.anatomy
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

it('roach motel: joining takes one click, cancelling only leads to a phone queue; the honest one cancels', async () => {
  const u = user()
  render(<RoachMotelFormat />)
  await click(u, '한 번에 가입하기')
  expect(status()).toHaveTextContent('속임수 버전 · 멤버십: 가입됨 · 가입 클릭 1번 · 해지 클릭 0번')
  await click(u, '해지 안내')
  await click(u, /전화 걸기/)
  expect(screen.getByText(/상담원 연결 대기 중/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('멤버십: 가입됨 · 가입 클릭 1번 · 해지 클릭 2번')

  await showHonest(u)
  await click(u, '한 번에 가입하기')
  await click(u, '멤버십 해지')
  await click(u, '해지하기')
  expect(status()).toHaveTextContent('정직한 버전 · 멤버십: 해지됨 · 가입 클릭 1번 · 해지 클릭 2번')
})

it('pre-checked consent: signing up with only the required box still agrees to the extras', async () => {
  const u = user()
  render(<PreCheckedFormat />)
  expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled()
  expect(screen.getByRole('checkbox', { name: '특가 소식 문자·메일 받기 (선택)' })).toBeChecked()
  await u.click(screen.getByRole('checkbox', { name: '이용약관과 개인정보 처리에 동의 (필수)' }))
  await click(u, '가입하기')
  expect(status()).toHaveTextContent('가입함 · 동의된 선택 항목 3개: 마케팅 수신, 제휴사 제공, 야간 광고')

  await showHonest(u)
  expect(screen.getByRole('checkbox', { name: '특가 소식 문자·메일 받기 (선택)' })).not.toBeChecked()
  await u.click(screen.getByRole('checkbox', { name: '이용약관과 개인정보 처리에 동의 (필수)' }))
  await click(u, '가입하기')
  expect(status()).toHaveTextContent('정직한 버전 · 가입함 · 동의된 선택 항목 0개')
})

it('fake countdown: the timer starts over at zero and on reload; the honest deadline stays put', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) })
  const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<FakeCountdownFormat />)
  const tick = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  expect(screen.getByRole('timer')).toHaveTextContent('00:20')
  tick(20_000)
  expect(screen.getByRole('timer')).toHaveTextContent('00:00')
  tick(1000)
  expect(screen.getByRole('timer')).toHaveTextContent('00:20')
  expect(status()).toHaveTextContent('새로고침 0번 · 시계가 0에서 다시 시작한 횟수 1번')
  tick(5000)
  await click(u, /새로고침/)
  expect(screen.getByRole('timer')).toHaveTextContent('00:20')
  expect(status()).toHaveTextContent('새로고침 1번')

  await showHonest(u)
  expect(screen.queryByRole('timer')).toBeNull()
  await click(u, /새로고침/)
  expect(status()).toHaveTextContent('정직한 버전 · 새로고침 1번 · 마감 11월 20일 23:59 그대로')
})

it('confirmshaming: the decline link scolds; the honest one offers two equal buttons', async () => {
  const u = user()
  render(<ConfirmshamingFormat />)
  expect(screen.getByRole('dialog', { name: '제주 특가 10% 쿠폰을 드려요' })).toBeInTheDocument()
  await click(u, '아니요, 할인은 필요 없어요. 비싸게 살래요')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('팝업 닫힘 · 누른 버튼: ‘아니요, 할인은 필요 없어요. 비싸게 살래요’')
  await click(u, '팝업 다시 보기')
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  await showHonest(u)
  await click(u, '괜찮아요')
  expect(status()).toHaveTextContent('정직한 버전 · 팝업 닫힘 · 누른 버튼: ‘괜찮아요’')
})

it('sneak into basket: insurance shows up uninvited and can be removed; honest asks first', async () => {
  const u = user()
  render(<SneakIntoBasketFormat />)
  await click(u, '장바구니에 담기')
  expect(within(screen.getByRole('list', { name: '장바구니' })).getAllByRole('listitem')).toHaveLength(2)
  expect(status()).toHaveTextContent('합계 201,900원 · 직접 고르지 않은 상품 1개')
  await click(u, '여행자 보험 삭제')
  await click(u, '189,000원 결제하기')
  expect(status()).toHaveTextContent('결제함 · 담긴 상품 오사카 왕복 항공권 · 합계 189,000원 · 직접 고르지 않은 상품 0개')

  await showHonest(u)
  await click(u, '장바구니에 담기')
  expect(status()).toHaveTextContent('합계 189,000원 · 직접 고르지 않은 상품 0개')
  await u.click(screen.getByRole('checkbox', { name: '여행자 보험 추가 (+12,900원)' }))
  expect(status()).toHaveTextContent('합계 201,900원 · 직접 고르지 않은 상품 0개')
})

it('fake scarcity: "2 left" never moves; the honest count goes down to sold out', async () => {
  const u = user()
  render(<FakeScarcityFormat />)
  for (let i = 0; i < 3; i++) await click(u, '예약하기')
  await click(u, /새로고침/)
  expect(screen.getByText('남은 객실 단 2개!')).toBeInTheDocument()
  expect(status()).toHaveTextContent('새로고침 1번 · 예약한 객실 3개 · 화면의 남은 객실 2개')

  await showHonest(u)
  for (let i = 0; i < 5; i++) await click(u, '예약하기')
  expect(screen.getByText('매진됐어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '예약하기' })).toBeDisabled()
  expect(status()).toHaveTextContent('화면의 남은 객실 0개')
})

it('hidden costs: fees appear only at the last step; honest shows the total up front', async () => {
  const u = user()
  render(<HiddenCostsFormat />)
  expect(status()).toHaveTextContent('1/3 단계 · 처음 본 가격 99,000원 · 지금 가격 99,000원 (+0원)')
  await click(u, '다음')
  await click(u, '다음')
  expect(within(screen.getByRole('list', { name: '요금 내역' })).getAllByRole('listitem')).toHaveLength(4)
  expect(status()).toHaveTextContent('3/3 단계 · 처음 본 가격 99,000원 · 지금 가격 127,900원 (+28,900원)')
  await click(u, '이전')
  expect(status()).toHaveTextContent('2/3 단계')

  await showHonest(u)
  expect(screen.getByText('총 127,900원')).toBeInTheDocument()
  await click(u, '다음')
  await click(u, '다음')
  await click(u, '127,900원 결제하기')
  expect(status()).toHaveTextContent('정직한 버전 · 결제함 · 처음 본 가격 127,900원 · 지금 가격 127,900원 (+0원)')
})

it('forced continuity: the trial becomes paid without warning; honest warns and lets you switch it off', async () => {
  const u = user()
  render(<ForcedContinuityFormat />)
  await click(u, '0원으로 시작하기')
  for (let i = 0; i < 3; i++) await click(u, '하루 지나기 (시연)')
  expect(status()).toHaveTextContent('체험: 끝남 · 미리 받은 알림 0번 · 결제 9,900원')
  expect(screen.getByRole('button', { name: '하루 지나기 (시연)' })).toBeDisabled()

  await showHonest(u)
  await click(u, '무료 체험 시작')
  await click(u, '하루 지나기 (시연)')
  await click(u, '하루 지나기 (시연)')
  expect(screen.getByText(/내일 체험이 끝나요/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('체험: 3일째 · 미리 받은 알림 1번 · 결제 0원')
  await click(u, '자동 결제 끄기')
  await click(u, '하루 지나기 (시연)')
  expect(status()).toHaveTextContent('정직한 버전 · 체험: 끝남 · 미리 받은 알림 1번 · 결제 0원')
})

it('nagging: "later" comes back on every screen; honest asks once', async () => {
  const u = user()
  render(<NaggingFormat />)
  for (let i = 0; i < 2; i++) {
    await click(u, '나중에')
    await click(u, '다음 특가 보기')
  }
  expect(screen.getByRole('dialog', { name: '알림을 켜시겠어요?' })).toHaveTextContent('3번째 권유')
  expect(screen.queryByRole('button', { name: '다시 묻지 않기' })).toBeNull()
  expect(status()).toHaveTextContent('도쿄 호텔 화면 · 권유 3번 · ‘나중에’ 2번 · 알림 꺼짐')

  await showHonest(u)
  await click(u, '나중에')
  await click(u, '다음 특가 보기')
  await click(u, '다음 특가 보기')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(status()).toHaveTextContent('정직한 버전 · 도쿄 호텔 화면 · 권유 1번 · ‘나중에’ 1번 · 알림 꺼짐')
})
