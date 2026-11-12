import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { notificationsEntry } from '.'
import {
  BadgeCountFormat,
  BannerFormat,
  ConfirmDialogFormat,
  InlineMessageFormat,
  NotificationCenterFormat,
  SnackbarFormat,
  ToastFormat,
} from './formats'

const status = () => screen.getByRole('status')
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
    expect(notificationsEntry.category).toBe('feedback')
    expect(notificationsEntry.description).toMatch(/\.$/)
    for (const query of ['Toast', 'Snackbar', 'Banner', 'Inline message', 'Notification center', '토스트', '스낵바', '알림']) {
      expect(filterEntries([notificationsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order', () => {
    expect(notificationsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '토스트',
      '스낵바',
      '배너',
      '인라인 메시지',
      '배지 숫자',
      '알림 센터',
      '확인 대화상자',
    ])
  })

  it('opens with the four tones of one message and the extras', () => {
    const States = notificationsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '정보',
      '성공',
      '주의',
      '오류',
      '닫을 수 있음',
      '동작 버튼 포함',
      '사라지기까지 남은 시간',
      '읽지 않음 표시',
    ])
  })

  it('renders its preview and every example', () => {
    const { Preview, examples } = notificationsEntry
    expect(() => render(<Preview />)).not.toThrow()
    for (const { Demo } of examples) expect(() => render(<Demo />)).not.toThrow()
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = notificationsEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

it('toast: appears in the corner of the example and leaves by itself', async () => {
  const u = timedUser()
  render(<ToastFormat />)
  const region = screen.getByRole('region', { name: '알림' })
  await u.click(screen.getByRole('button', { name: '성공 알림' }))
  expect(within(region).getByText('사진을 올렸습니다')).toBeInTheDocument()
  expect(status()).toHaveTextContent('화면에 1개 · 보낸 알림 1개')

  later(3900)
  expect(within(region).getByText('사진을 올렸습니다')).toBeInTheDocument()
  later(200)
  expect(within(region).queryByText('사진을 올렸습니다')).toBeNull()
  expect(status()).toHaveTextContent('화면에 0개 · 보낸 알림 1개')
})

it('toast: keeps three at most and waits while the pointer is on them', async () => {
  const u = timedUser()
  render(<ToastFormat />)
  for (const tone of ['정보', '성공', '주의', '오류']) {
    await u.click(screen.getByRole('button', { name: `${tone} 알림` }))
  }
  const stack = within(screen.getByRole('region', { name: '알림' })).getByRole('list')
  expect(within(stack).getAllByRole('listitem')).toHaveLength(3)
  // the oldest gave way to the newest
  expect(within(stack).queryByText('링크를 복사했습니다')).toBeNull()

  await u.hover(within(stack).getByText('연결이 느립니다'))
  expect(status()).toHaveTextContent('멈춤')
  later(10_000)
  expect(within(stack).getAllByRole('listitem')).toHaveLength(3)

  await u.unhover(stack)
  later(4100)
  expect(within(stack).queryAllByRole('listitem')).toHaveLength(0)
})

it('toast: closes at once with its close button, and an error toast offers a retry', async () => {
  const u = timedUser()
  render(<ToastFormat />)
  const stack = within(screen.getByRole('region', { name: '알림' })).getByRole('list')
  await u.click(screen.getByRole('button', { name: '오류 알림' }))
  await u.click(within(stack).getByRole('button', { name: '다시 시도' }))
  expect(within(stack).queryByText('올리지 못했습니다')).toBeNull()
  expect(within(stack).getByText('사진을 올렸습니다')).toBeInTheDocument()
  await u.click(within(stack).getByRole('button', { name: '알림 닫기' }))
  expect(within(stack).queryAllByRole('listitem')).toHaveLength(0)
})

it('snackbar: a delete can be undone for five seconds, then it is final', async () => {
  const u = timedUser()
  render(<SnackbarFormat />)
  const notes = () => screen.getByRole('list', { name: '메모 목록' })

  await u.click(screen.getByRole('button', { name: '장보기 목록 지우기' }))
  expect(within(notes()).queryByText('장보기 목록')).toBeNull()
  await u.click(screen.getByRole('button', { name: '실행 취소' }))
  expect(within(notes()).getAllByRole('listitem')[0]).toHaveTextContent('장보기 목록')
  expect(status()).toHaveTextContent('‘장보기 목록’을 되돌렸습니다')

  await u.click(screen.getByRole('button', { name: '읽을 책 지우기' }))
  later(4900)
  expect(screen.getByRole('button', { name: '실행 취소' })).toBeInTheDocument()
  later(100)
  expect(screen.queryByRole('button', { name: '실행 취소' })).toBeNull()
  expect(within(notes()).queryByText('읽을 책')).toBeNull()
  expect(status()).toHaveTextContent('‘읽을 책’을 완전히 지웠습니다')
})

it('banner: the offline strip follows the connection; a closed notice stays closed after a reload', async () => {
  const u = userEvent.setup()
  render(<BannerFormat />)
  expect(screen.queryByRole('alert')).toBeNull()
  await u.click(screen.getByRole('switch', { name: '인터넷 연결' }))
  expect(screen.getByRole('alert')).toHaveTextContent('인터넷에 연결되어 있지 않습니다')
  await u.click(screen.getByRole('switch', { name: '인터넷 연결' }))
  expect(screen.queryByRole('alert')).toBeNull()

  await u.click(screen.getByRole('button', { name: '점검 안내 닫기' }))
  expect(screen.queryByRole('region', { name: '점검 안내' })).toBeNull()
  await u.click(screen.getByRole('button', { name: '페이지 새로고침' }))
  expect(screen.queryByRole('region', { name: '점검 안내' })).toBeNull()
  expect(status()).toHaveTextContent('닫음 (새로고침해도 다시 뜨지 않습니다)')
  expect(status()).toHaveTextContent('새로고침 1번')

  await u.click(screen.getByRole('button', { name: '닫은 배너 다시 보기' }))
  expect(screen.getByRole('region', { name: '점검 안내' })).toBeInTheDocument()
})

it('inline message: errors sit under their fields, the verdict on top of the section', async () => {
  const u = userEvent.setup()
  render(<InlineMessageFormat />)
  const nickname = screen.getByRole('textbox', { name: '닉네임' })
  const email = screen.getByRole('textbox', { name: '이메일' })
  expect(nickname).not.toHaveAttribute('aria-invalid')

  await u.click(screen.getByRole('button', { name: '저장' }))
  expect(status()).toHaveTextContent('고칠 곳이 2개 있습니다')
  expect(nickname).toHaveAttribute('aria-invalid', 'true')
  expect(nickname).toHaveAccessibleDescription('띄어쓰기는 쓸 수 없습니다.')
  expect(email).toHaveAccessibleDescription(/이메일 형식이 아닙니다/)
  expect(nickname).toHaveFocus()

  await u.clear(nickname)
  await u.type(nickname, '하늘고래')
  expect(nickname).not.toHaveAttribute('aria-invalid')
  expect(nickname).toHaveAccessibleDescription('쓸 수 있는 닉네임입니다.')
  await u.type(email, '.com')
  await u.click(screen.getByRole('button', { name: '저장' }))
  expect(status()).toHaveTextContent('프로필을 저장했습니다')
  expect(email).not.toHaveAttribute('aria-invalid')
})

it('badge count: caps at 99+, a dot when the number does not matter, and reading clears it', async () => {
  const u = userEvent.setup()
  render(<BadgeCountFormat />)
  expect(screen.getByRole('button', { name: '채팅, 읽지 않은 메시지 3개' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '소식, 새 소식 있음' })).toBeInTheDocument()

  for (let i = 0; i < 3; i++) await u.click(screen.getByRole('button', { name: '메시지 40개 받기' }))
  expect(screen.getByRole('button', { name: '채팅, 읽지 않은 메시지 123개' })).toBeInTheDocument()
  expect(screen.getByText('99+')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: /^채팅/ }))
  expect(screen.queryByText('99+')).toBeNull()
  expect(status()).toHaveTextContent('읽지 않은 메시지 0개')
  // looking at the chat tab, new messages are read as they arrive
  await u.click(screen.getByRole('button', { name: '메시지 1개 받기' }))
  expect(status()).toHaveTextContent('읽지 않은 메시지 0개')

  await u.click(screen.getByRole('button', { name: '소식, 새 소식 있음' }))
  expect(screen.getByRole('button', { name: '소식' })).toHaveAttribute('aria-current', 'page')
  expect(status()).toHaveTextContent('새 소식 없음')
})

it('notification center: grouped by day, unread marked, all read at once', async () => {
  const u = userEvent.setup()
  render(<NotificationCenterFormat />)
  expect(status()).toHaveTextContent('읽지 않은 알림 4개')

  await u.click(screen.getByRole('button', { name: '알림, 읽지 않음 4개' }))
  const panel = screen.getByRole('dialog')
  expect(within(panel).getByRole('list', { name: '오늘' })).toBeInTheDocument()
  expect(within(panel).getByRole('list', { name: '이전' })).toBeInTheDocument()
  expect(within(panel).getAllByText('읽지 않음')).toHaveLength(4)

  await u.click(within(panel).getByRole('button', { name: /주문하신 원두가 출발했습니다/ }))
  expect(within(panel).getAllByText('읽지 않음')).toHaveLength(3)
  await u.click(within(panel).getByRole('radio', { name: /읽지 않음/ }))
  expect(within(panel).getAllByRole('listitem')).toHaveLength(3)

  await u.click(within(panel).getByRole('button', { name: '모두 읽음' }))
  expect(within(panel).getByText('모든 알림을 읽었습니다')).toBeInTheDocument()
  await u.keyboard('{Escape}')
  expect(status()).toHaveTextContent('읽지 않은 알림 0개')
  expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument()
})

it('confirm dialog: names what goes; cancel keeps it, confirm deletes it', async () => {
  const u = userEvent.setup()
  render(<ConfirmDialogFormat />)
  const deleteButton = () => within(screen.getByRole('list', { name: '폴더' })).getAllByRole('button', { name: '삭제' })[0]

  await u.click(deleteButton())
  let dialog = screen.getByRole('alertdialog', { name: '‘제주 여행 사진’ 폴더를 삭제할까요?' })
  expect(dialog).toHaveTextContent('사진 128장도 함께 삭제되며 되돌릴 수 없습니다')
  expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus()
  await u.click(within(dialog).getByRole('button', { name: '취소' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(status()).toHaveTextContent('취소했습니다. ‘제주 여행 사진’ 폴더는 그대로입니다.')
  expect(screen.getByText('제주 여행 사진')).toBeInTheDocument()

  await u.click(deleteButton())
  dialog = screen.getByRole('alertdialog')
  await u.click(within(dialog).getByRole('button', { name: '폴더 삭제' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(status()).toHaveTextContent('‘제주 여행 사진’ 폴더를 삭제했습니다. 사진 128장도 함께 지웠습니다.')
  expect(screen.queryByText('제주 여행 사진')).toBeNull()
})
