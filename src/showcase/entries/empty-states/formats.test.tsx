import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { emptyStatesEntry } from '.'
import {
  AfterDeleteFormat,
  AllDoneFormat,
  FilterNoResultsFormat,
  FirstUseFormat,
  LockedFormat,
  NoAccessFormat,
  NoMatchFormat,
  NotFoundFormat,
  OfflineFormat,
  PermissionRequestFormat,
  ServerErrorFormat,
} from './formats'

const status = () => screen.getByRole('status')
const user = () => userEvent.setup()
const later = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })
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
    expect(emptyStatesEntry.id).toBe('empty-states')
    expect(emptyStatesEntry.category).toBe('feedback')
    expect(emptyStatesEntry.description).toMatch(/\.$/)
    for (const query of ['Empty state', 'Zero state', 'Blank slate', '404', 'Not found', 'Offline', '빈 화면', '첫 사용', '권한 없음', '서버 오류', 'No filter results', 'Permission request', 'After delete', 'Locked state', '필터 결과 없음', '권한 요청', '삭제 직후', '잠김']) {
      expect(filterEntries([emptyStatesEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    expect(emptyStatesEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '첫 사용',
      '검색 결과 없음',
      '필터 결과 없음',
      '모두 완료',
      '삭제 직후',
      '404 페이지 없음',
      '권한 없음',
      '권한 요청',
      '오프라인',
      '서버 오류',
      '잠김',
    ])
    for (const x of emptyStatesEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with a small card for every kind of empty screen', () => {
    const States = emptyStatesEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '처음 (아직 없음)',
      '검색 결과 없음',
      '모두 완료',
      '페이지 없음 (404)',
      '권한 없음 (403)',
      '오프라인',
      '서버 오류 (500)',
    ])
    for (const li of items) {
      expect(within(li).getByRole('heading')).toBeInTheDocument()
      expect(within(li).getByRole('button')).toHaveAttribute('tabindex', '-1')
      // drawings only: nothing for a screen reader to trip over
      expect(li.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = emptyStatesEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = emptyStatesEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

it('first use: the empty list invites the first project and turns into a list of one', async () => {
  const u = user()
  render(<FirstUseFormat />)
  expect(screen.getByRole('heading', { name: '아직 프로젝트가 없어요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('프로젝트 0개')

  await u.click(screen.getByRole('button', { name: '첫 프로젝트 만들기' }))
  expect(screen.queryByRole('heading', { name: '아직 프로젝트가 없어요' })).toBeNull()
  const projects = within(screen.getByRole('list', { name: '프로젝트' }))
  expect(projects.getAllByRole('listitem')).toHaveLength(1)
  expect(projects.getByRole('link', { name: /첫 프로젝트/ })).toHaveFocus()
  expect(status()).toHaveTextContent('프로젝트 1개 · 방금 만든 프로젝트: 첫 프로젝트')

  await u.click(screen.getByRole('button', { name: '새 프로젝트' }))
  expect(projects.getAllByRole('listitem')).toHaveLength(2)
  await u.click(screen.getByRole('button', { name: '예시 처음으로' }))
  expect(screen.getByRole('heading', { name: '아직 프로젝트가 없어요' })).toBeInTheDocument()
})

it('no match: names the search that found nothing and clears it back to the full list', async () => {
  const u = user()
  render(<NoMatchFormat />)
  expect(screen.getByRole('heading', { name: '‘영수증’ 검색 결과가 없어요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('메일 6개 중 0개 표시 · 검색어: 영수증')

  await u.click(screen.getByRole('button', { name: '검색어 지우기' }))
  const field = screen.getByRole('searchbox', { name: '메일 검색' })
  expect(field).toHaveValue('')
  expect(field).toHaveFocus()
  expect(within(screen.getByRole('list', { name: '메일' })).getAllByRole('listitem')).toHaveLength(6)
  expect(status()).toHaveTextContent('메일 6개 중 6개 표시')

  await u.type(field, '김하늘')
  expect(status()).toHaveTextContent('메일 6개 중 1개 표시 · 검색어: 김하늘')
})

it('all done: ticking the last task shows the celebration and moves the focus to it', async () => {
  const u = user()
  render(<AllDoneFormat />)
  expect(status()).toHaveTextContent('남은 할 일 2개 · 끝낸 일 1개')

  await u.click(screen.getByRole('checkbox', { name: '세탁소에서 옷 찾기' }))
  expect(screen.getByRole('checkbox', { name: '엄마께 전화하기' })).toHaveFocus()
  expect(screen.queryByRole('heading', { name: '할 일을 모두 끝냈어요' })).toBeNull()

  await u.click(screen.getByRole('checkbox', { name: '엄마께 전화하기' }))
  const done = screen.getByRole('heading', { name: '할 일을 모두 끝냈어요' })
  expect(done).toHaveFocus()
  expect(status()).toHaveTextContent('남은 할 일 0개 · 끝낸 일 3개 · 모두 끝냄')
  expect(within(screen.getByRole('region', { name: '끝낸 일' })).getAllByRole('checkbox')).toHaveLength(3)

  await u.click(screen.getByRole('button', { name: '할 일 추가' }))
  expect(screen.getByRole('checkbox', { name: '새 할 일' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: '새 할 일' })).toHaveFocus()
  expect(screen.queryByRole('heading', { name: '할 일을 모두 끝냈어요' })).toBeNull()

  await u.click(screen.getByRole('checkbox', { name: '우유 사기' }))
  expect(within(screen.getByRole('list', { name: '남은 할 일' })).getAllByRole('checkbox')).toHaveLength(2)
})

it('404: offers home, a site search and the likely page, and the back button returns', async () => {
  const u = user()
  render(<NotFoundFormat />)
  const back = screen.getByRole('button', { name: '뒤로' })
  expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('주소: shop.example/evnets/winter-sale · 404 페이지 없음')
  expect(back).toBeDisabled()

  await u.click(screen.getByRole('button', { name: '홈으로' }))
  expect(screen.getByText('모아 쇼핑 홈')).toBeInTheDocument()
  expect(status()).toHaveTextContent('주소: shop.example · 정상 페이지')
  await u.click(back)
  expect(status()).toHaveTextContent('404 페이지 없음')

  await u.type(screen.getByRole('textbox', { name: '사이트에서 검색' }), '이벤트')
  await u.click(screen.getByRole('button', { name: '검색' }))
  expect(screen.getByText(/검색 결과/)).toHaveTextContent('‘이벤트’ 검색 결과 2개')
  expect(status()).toHaveTextContent('주소: shop.example/search?q=이벤트')
  await u.click(back)

  await u.click(screen.getByRole('link', { name: '겨울 세일 이벤트' }))
  expect(status()).toHaveTextContent('주소: shop.example/events/winter-sale · 정상 페이지')
})

it('no access: asks the owner, shows the request as sent, then opens once approved', async () => {
  const u = timedUser()
  render(<NoAccessFormat />)
  expect(screen.getByRole('heading', { name: '이 문서를 볼 권한이 없어요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('권한: 없음 · 요청: 안 보냄')

  await u.type(screen.getByRole('textbox', { name: '요청 메시지 (선택)' }), '회의 준비용이에요')
  await u.click(screen.getByRole('button', { name: '권한 요청' }))
  expect(screen.getByRole('button', { name: '요청 보내는 중…' })).toBeDisabled()
  expect(status()).toHaveTextContent('요청: 보내는 중')

  later(800)
  expect(screen.getByRole('heading', { name: '권한을 요청했어요' })).toBeInTheDocument()
  expect(screen.getByText(/요청 보냄/)).toHaveTextContent('요청 보냄 · “회의 준비용이에요”')
  expect(status()).toHaveTextContent('권한: 없음 · 요청: 보냄')

  await u.click(screen.getByRole('button', { name: '(시연) 문서 주인이 승인하기' }))
  expect(screen.getByText('2026 예산안')).toBeInTheDocument()
  expect(status()).toHaveTextContent('권한: 보기 가능 · 요청: 승인됨')
})

it('offline: says it is the connection, retries in vain while offline, and reloads when it returns', async () => {
  const u = timedUser()
  render(<OfflineFormat />)
  const network = screen.getByRole('switch', { name: '인터넷 연결' })
  expect(screen.getByRole('list', { name: '소식' })).toBeInTheDocument()

  await u.click(network)
  expect(screen.getByRole('heading', { name: '인터넷에 연결되어 있지 않아요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('연결: 오프라인 · 화면: 오프라인 안내 · 연결이 끊겼어요')

  await u.click(screen.getByRole('button', { name: '다시 시도' }))
  expect(screen.getByText('아직 연결되지 않았어요 · 1번 시도')).toBeInTheDocument()
  expect(status()).toHaveTextContent('아직 연결되지 않았어요 (1번 시도)')

  await u.click(screen.getByRole('button', { name: '저장한 글 보기' }))
  expect(within(screen.getByRole('list', { name: '저장한 글' })).getAllByRole('listitem')).toHaveLength(2)

  await u.click(network)
  expect(status()).toHaveTextContent('연결: 온라인 · 화면: 불러오는 중')
  later(700)
  expect(screen.getByRole('list', { name: '소식' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('화면: 새 소식 · 연결이 돌아와 저절로 다시 불러왔어요')
})

it('server error: shows a code to report, fails the first retry, then succeeds', async () => {
  const u = timedUser()
  render(<ServerErrorFormat />)
  expect(screen.getByRole('heading', { name: '주문 내역을 불러오지 못했어요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('불러오기 실패 · 오류 코드 E500-7F3A · 시도 1번')

  // user-event puts a stand-in clipboard on navigator; watch what is written to it
  const write = vi.spyOn(navigator.clipboard, 'writeText')
  await u.click(screen.getByRole('button', { name: '오류 코드 복사' }))
  // let the clipboard promise settle
  await act(async () => {})
  expect(write).toHaveBeenCalledWith('E500-7F3A')
  expect(status()).toHaveTextContent('코드 복사함')

  await u.click(screen.getByRole('button', { name: '다시 시도' }))
  expect(screen.getByRole('button', { name: '다시 시도 중…' })).toBeDisabled()
  expect(status()).toHaveTextContent('다시 시도하는 중… (2번째)')
  later(900)
  expect(status()).toHaveTextContent('불러오기 실패 · 오류 코드 E503-21C9 · 시도 2번')
  expect(screen.getByText(/또 실패했어요/)).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '다시 시도' }))
  later(900)
  expect(within(screen.getByRole('list', { name: '주문' })).getAllByRole('listitem')).toHaveLength(3)
  expect(status()).toHaveTextContent('불러옴 · 3번째 시도에서 성공')

  await u.click(screen.getByRole('button', { name: '예시 처음으로' }))
  expect(status()).toHaveTextContent('불러오기 실패 · 오류 코드 E500-7F3A · 시도 1번')
})

it('no filter results: names the chips, offers to drop one or reset, and points at the closest match', async () => {
  const u = user()
  render(<FilterNoResultsFormat />)
  expect(screen.getByRole('heading', { name: '조건에 맞는 상품이 없어요' })).toBeInTheDocument()
  expect(screen.getByText(/고른 조건/)).toHaveTextContent('고른 조건(서울 · 편도 · 조식 포함)')
  expect(screen.getByText(/가장 가까운 상품/)).toHaveTextContent('서울 시티 호텔 1박 + 항공 (조식 포함 아님)')
  expect(status()).toHaveTextContent('상품 5개 중 0개 표시 · 필터: 서울, 편도, 조식 포함')

  await u.click(screen.getByRole('button', { name: /‘편도’ 빼기 · 1개/ }))
  const list = screen.getByRole('list', { name: '상품' })
  expect(list).toHaveFocus()
  expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  expect(screen.getByRole('button', { name: '편도', pressed: false })).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '편도' }))
  await u.click(screen.getByRole('button', { name: '필터 초기화' }))
  expect(status()).toHaveTextContent('상품 5개 중 5개 표시 · 필터: 없음')
})

it('permission request: explains, asks, and after a refusal sends people to settings', async () => {
  const u = user()
  render(<PermissionRequestFormat />)
  expect(screen.getByRole('heading', { name: '가격이 내리면 알려드릴게요' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('알림 권한: 묻기 전')

  await u.click(screen.getByRole('button', { name: '알림 켜기' }))
  const ask = screen.getByRole('dialog', { name: '알림 권한 요청' })
  expect(within(ask).getByRole('button', { name: '허용' })).toHaveFocus()
  await u.click(within(ask).getByRole('button', { name: '허용 안 함' }))
  expect(screen.getByRole('heading', { name: '알림이 꺼져 있어요' })).toBeInTheDocument()
  expect(screen.getByText(/설정 › 모아 여행 › 알림/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('알림 권한: 거부')

  await u.click(screen.getByRole('button', { name: '설정 열기' }))
  await u.click(screen.getByRole('switch', { name: '알림 허용' }))
  expect(status()).toHaveTextContent('알림 권한: 허용 · 설정 화면')
  await u.click(screen.getByRole('button', { name: '앱으로 돌아가기' }))
  expect(screen.getByText('알림을 켰어요')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '예시 처음으로' }))
  await u.click(screen.getByRole('button', { name: '알림 켜기' }))
  await u.click(screen.getByRole('button', { name: '허용' }))
  expect(status()).toHaveTextContent('알림 권한: 허용')
})

it('after delete: confirms the emptied bin, offers a short undo, and tells the last-item case apart', async () => {
  const u = timedUser()
  render(<AfterDeleteFormat />)
  await u.click(screen.getByRole('button', { name: '휴지통 비우기' }))
  expect(screen.getByRole('heading', { name: '휴지통을 비웠어요' })).toHaveFocus()
  expect(status()).toHaveTextContent('휴지통 파일 0개 · 방금 지움: 여행 영수증.pdf, 오사카 사진.jpg, 초안 v2.docx · 되돌리기 가능')

  await u.click(screen.getByRole('button', { name: '되돌리기' }))
  expect(within(screen.getByRole('list', { name: '휴지통 파일' })).getAllByRole('listitem')).toHaveLength(3)

  for (const name of ['여행 영수증.pdf', '오사카 사진.jpg', '초안 v2.docx']) {
    await u.click(screen.getByRole('button', { name: `${name} 영구 삭제` }))
  }
  expect(screen.getByRole('heading', { name: '마지막 파일을 지웠어요' })).toBeInTheDocument()
  later(5000)
  expect(screen.queryByRole('button', { name: '되돌리기' })).toBeNull()
  expect(screen.getByText(/30일 동안 보관/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('되돌리기 끝남')

  await u.click(screen.getByRole('button', { name: '예시 처음으로' }))
  expect(status()).toHaveTextContent('휴지통 파일 3개')
})

it('locked: says what opens it and how close you are, and opens once the cart reaches the goal', async () => {
  const u = user()
  render(<LockedFormat />)
  expect(screen.getByRole('heading', { name: '3만 원 이상 담으면 열려요' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: '쿠폰까지' })).toHaveAttribute('aria-valuetext', '1/3')
  expect(status()).toHaveTextContent('담은 금액 10,000원 · 쿠폰 잠김 (1/3)')

  await u.click(screen.getByRole('button', { name: '드립백 커피 10개 담기' }))
  expect(status()).toHaveTextContent('쿠폰 잠김 (2/3)')
  await u.click(screen.getByRole('button', { name: '원두 200g 담기' }))
  expect(screen.getByRole('heading', { name: '쿠폰이 열렸어요' })).toBeInTheDocument()
  await u.click(screen.getByRole('button', { name: '쿠폰 받기' }))
  expect(status()).toHaveTextContent('담은 금액 30,000원 · 쿠폰 받음')

  await u.click(screen.getByRole('button', { name: '원두 200g 빼기' }))
  expect(screen.getByRole('heading', { name: '3만 원 이상 담으면 열려요' })).toBeInTheDocument()
})
