import { BellIcon } from 'lucide-react'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  BadgeCountFormat,
  BannerFormat,
  ConfirmDialogFormat,
  InlineMessageFormat,
  NotificationCenterFormat,
  SnackbarFormat,
  ToastFormat,
} from './formats'
import { CountBadge, TimerBar, ToastCard } from './parts'

function States() {
  return (
    <StateGrid
      wide
      items={[
        // one piece of news (an upload) told in each of the four tones
        {
          label: '정보',
          node: <ToastCard drawing tone="info" title="업로드를 시작했습니다" description="사진 3장을 올리는 중이에요." />,
        },
        {
          label: '성공',
          node: <ToastCard drawing tone="success" title="업로드했습니다" description="사진 3장을 앨범에 넣었어요." />,
        },
        {
          label: '주의',
          node: <ToastCard drawing tone="warning" title="일부만 올렸습니다" description="1장은 너무 커서 건너뛰었어요." />,
        },
        {
          label: '오류',
          node: <ToastCard drawing tone="error" title="업로드하지 못했습니다" description="인터넷 연결을 확인하세요." />,
        },
        {
          label: '닫을 수 있음',
          node: <ToastCard drawing closable tone="success" title="업로드했습니다" description="사진 3장을 앨범에 넣었어요." />,
        },
        {
          label: '동작 버튼 포함',
          node: (
            <ToastCard
              drawing
              tone="error"
              title="업로드하지 못했습니다"
              description="인터넷 연결을 확인하세요."
              action="다시 시도"
            />
          ),
        },
        {
          label: '사라지기까지 남은 시간',
          node: (
            <ToastCard
              drawing
              tone="success"
              title="업로드했습니다"
              description="4초 뒤에 저절로 닫힙니다."
              timer={<TimerBar tone="success" fraction={0.6} />}
            />
          ),
        },
        {
          label: '읽지 않음 표시',
          node: (
            <div className="flex w-full max-w-80 flex-col gap-0.5 rounded-lg border bg-background p-1 text-left text-sm">
              <div className="flex items-start gap-2.5 rounded-md bg-blue-50/70 px-2.5 py-2 dark:bg-blue-500/10">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">김하늘님이 댓글을 남겼습니다</p>
                  <p className="text-xs text-muted-foreground">10분 전</p>
                </div>
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500">
                  <span className="sr-only">읽지 않음</span>
                </span>
              </div>
              <div className="flex items-start gap-2.5 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground">11월 정기 점검을 마쳤습니다</p>
                  <p className="text-xs text-muted-foreground">어제</p>
                </div>
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}

function NotificationsSpecimen() {
  return (
    <ToastCard
      slots
      drawing
      tone="success"
      title="사진을 올렸습니다"
      description="앨범 ‘제주 여행’에 3장이 들어갔어요."
      action="앨범 보기"
      closable
      timer={<TimerBar slots tone="success" fraction={0.62} />}
    />
  )
}

function NotificationsPreview() {
  return (
    <div className="flex flex-col items-end gap-2.5">
      <span className="relative grid size-8 place-items-center rounded-lg border bg-background">
        <BellIcon aria-hidden className="size-4" />
        <CountBadge count={3} className="absolute -top-1.5 -right-1.5" />
      </span>
      <div className="relative flex w-44 items-center gap-2 overflow-hidden rounded-lg border bg-popover p-2 shadow-md">
        <span className="size-5 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/20" />
        <span className="flex flex-1 flex-col gap-1">
          <span className="h-1.5 w-3/4 rounded-full bg-foreground/60" />
          <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="absolute inset-x-0 bottom-0 h-0.5 w-3/5 bg-emerald-500" />
      </div>
    </div>
  )
}

export const notificationsEntry: ShowcaseEntry = {
  id: 'notifications',
  name: 'Notifications',
  aliases: [
    'Toast',
    'Snackbar',
    'Banner',
    'Inline message',
    'Notification badge',
    'Notification center',
    'Confirm dialog',
    '토스트',
    '스낵바',
    '알림',
    '배너',
    '알림 센터',
  ],
  description: '일이 끝났거나, 잘못됐거나, 확인이 필요할 때 토스트·배너·배지·대화상자 같은 방식으로 사용자에게 알리는 형식.',
  category: 'feedback',
  Preview: NotificationsPreview,
  anatomy: {
    Specimen: NotificationsSpecimen,
    parts: [
      { slot: 'toast', name: 'Toast', description: '잠깐 떴다가 저절로 사라지는 알림 상자. 화면 모서리에 쌓임' },
      { slot: 'toast-icon', name: 'Icon', description: '정보·성공·주의·오류 중 무엇인지 색과 모양으로 알려줌' },
      { slot: 'toast-title', name: 'Title', description: '무슨 일이 있었는지 한 줄로' },
      { slot: 'toast-description', name: 'Description', description: '덧붙이는 설명. 없어도 됨' },
      { slot: 'toast-action', name: 'Action', description: '보기·다시 시도처럼 바로 할 수 있는 동작 하나' },
      { slot: 'toast-close', name: 'Close', description: '기다리지 않고 바로 닫는 버튼' },
      { slot: 'toast-timer', name: 'Timer', description: '사라지기까지 남은 시간. 마우스를 올리면 멈춤' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '알림 하나가 가질 수 있는 모습입니다. 같은 업로드 소식을 정보·성공·주의·오류 네 가지 성격으로 그렸고, 닫기 버튼·동작 버튼·남은 시간·읽지 않음 표시를 더한 모습도 있습니다.',
      Demo: States,
    },
    {
      title: '토스트',
      description:
        '화면 모서리에 잠깐 떴다가 몇 초 뒤 저절로 사라지는 알림입니다. "저장했습니다"처럼 놓쳐도 큰일 나지 않는 결과를 알릴 때 쓰고, 꼭 읽어야 하거나 답이 필요한 내용에는 쓰지 않습니다. 버튼을 여러 번 눌러 쌓아 보고, 마우스를 올려 시간이 멈추는지 보세요. 세 개를 넘으면 가장 오래된 것부터 닫힙니다.',
      Demo: ToastFormat,
    },
    {
      title: '스낵바',
      description:
        '화면 아래에 한 줄로 뜨고 동작 버튼을 하나 가진 알림입니다. 방금 한 일을 되돌릴 기회를 줄 때 씁니다. 지우기 전에 묻는 대화상자보다 덜 번거롭지만, 정말 되돌릴 수 없는 일에는 쓸 수 없습니다. 메모를 지운 뒤 5초 안에 실행 취소를 눌러 보세요.',
      Demo: SnackbarFormat,
    },
    {
      title: '배너',
      description:
        '페이지 맨 위에 가로로 길게 붙어, 닫거나 상황이 바뀔 때까지 남아 있는 알림입니다. 점검 예정·오프라인처럼 페이지 전체에 해당하는 소식에 쓰고, 한 번 닫은 배너는 기억해 두었다가 다시 띄우지 않습니다. 인터넷 연결을 끊어 보고, 점검 안내를 닫은 뒤 새로고침해 보세요.',
      Demo: BannerFormat,
    },
    {
      title: '인라인 메시지',
      description:
        '문제가 생긴 바로 그 자리, 입력칸 아래나 영역 맨 위에 붙는 메시지입니다. 무엇을 어디서 고쳐야 하는지 알려 줄 때 씁니다. 토스트로 알리면 사라진 뒤에 어디가 틀렸는지 알 수 없습니다. 그대로 저장을 눌러 보고, 칸을 고쳐 다시 저장해 보세요.',
      Demo: InlineMessageFormat,
    },
    {
      title: '배지 숫자',
      description:
        '아이콘 귀퉁이에 읽지 않은 개수를 숫자나 점으로 붙입니다. 내용은 보여 주지 않고 "새것이 있다"만 알릴 때 씁니다. 개수가 중요하지 않으면 점만 찍고, 99를 넘으면 99+로 줄입니다. 메시지를 받은 뒤 채팅 탭을 눌러 읽어 보세요.',
      Demo: BadgeCountFormat,
    },
    {
      title: '알림 센터',
      description:
        '종 모양 버튼을 누르면 지난 알림을 모아 보는 목록이 열립니다. 놓친 토스트나 배지 숫자의 내용을 나중에 확인하는 곳입니다. 오늘·이전으로 나뉘고 읽지 않은 알림에는 점이 찍힙니다. 알림을 하나씩 눌러 보거나 모두 읽음을 눌러 보세요.',
      Demo: NotificationCenterFormat,
    },
    {
      title: '확인 대화상자',
      description:
        '되돌릴 수 없는 일을 하기 전에 화면을 막고 한 번 더 묻습니다. 무엇이 지워지는지 이름까지 적고, 버튼에도 "폴더 삭제"처럼 할 일을 씁니다. 자주 하는 일이나 되돌릴 수 있는 일에 쓰면 습관처럼 누르게 되니 그때는 스낵바의 실행 취소가 낫습니다. 취소와 삭제를 각각 눌러 보세요.',
      Demo: ConfirmDialogFormat,
    },
  ],
}
