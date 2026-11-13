import { ImageIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '../navigation-patterns/frames'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  DoubleTapFormat,
  DragFormat,
  EdgeSwipeFormat,
  LongPressFormat,
  PinchFormat,
  PullToRefreshFormat,
  SwipeFormat,
  SwipeToDeleteFormat,
  TapFormat,
} from './formats'
import { Finger } from './parts'

type Look = 'idle' | 'pressed' | 'holding' | 'dragging' | 'released' | 'cancelled' | 'disabled' | 'focus'

/** One touch target drawn in a given moment of a touch; the finger circle is part of the drawing. */
function Target({ look }: { look: Look }) {
  const pressed = look === 'pressed' || look === 'holding'
  return (
    <div className="relative grid h-20 w-32 place-items-center">
      {look === 'dragging' && <span aria-hidden className="absolute h-12 w-24 rounded-xl border border-dashed border-muted-foreground/50" />}
      <button
        type="button"
        tabIndex={-1}
        disabled={look === 'disabled'}
        data-demo-state={pressed ? 'active' : look === 'focus' ? 'focus' : undefined}
        className={cn(
          'relative flex h-12 w-24 items-center justify-center gap-1.5 rounded-xl border bg-background text-sm shadow-xs outline-none active:scale-95 active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-45',
          look === 'dragging' && '-translate-y-1.5 scale-105 rotate-2 shadow-lg',
        )}
      >
        <ImageIcon aria-hidden className="size-4" />
        사진
      </button>
      {look === 'released' && (
        <span aria-hidden className="pointer-events-none absolute size-20 rounded-full border-2 border-foreground/15 bg-foreground/5" />
      )}
      {(pressed || look === 'dragging') && <Finger x={64} y={look === 'dragging' ? 34 : 40} progress={look === 'holding' ? 0.65 : undefined} />}
      {look === 'cancelled' && <Finger x={120} y={72} />}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Target look="idle" /> },
        { label: '눌림', node: <Target look="pressed" /> },
        { label: '길게 누르는 중', node: <Target look="holding" /> },
        { label: '끄는 중', node: <Target look="dragging" /> },
        { label: '놓음 (실행)', node: <Target look="released" /> },
        { label: '취소 (밖으로 벗어남)', node: <Target look="cancelled" /> },
        { label: '비활성', node: <Target look="disabled" /> },
        { label: '키보드 포커스', node: <Target look="focus" /> },
      ]}
    />
  )
}

function MailRow({ from, subject }: { from: string; subject: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5">
      <span className="text-sm font-medium">{from}</span>
      <span className="truncate text-xs text-muted-foreground">{subject}</span>
    </div>
  )
}

/** A mail row caught mid-swipe, just past the point where letting go deletes it. */
function GesturesSpecimen() {
  return (
    <PhoneFrame className="h-80">
      <header className="flex h-11 shrink-0 items-center border-b px-3">
        <p className="flex-1 text-sm font-semibold">받은 편지함</p>
        <span data-slot="gesture-alternative" className="rounded-md px-2 py-1 text-sm text-sky-600 dark:text-sky-400">
          편집
        </span>
      </header>
      <ul>
        <li className="border-b">
          <MailRow from="김하늘" subject="회의 자료 공유드려요" />
        </li>
        <li className="relative overflow-hidden border-b">
          <div
            data-slot="gesture-feedback"
            className="absolute inset-0 flex items-center justify-end gap-1 bg-red-600 pr-4 text-[11px] font-medium text-white"
          >
            <Trash2Icon aria-hidden className="size-4" />
            놓으면 삭제
          </div>
          <span data-slot="gesture-threshold" className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-white/90" />
          <div data-slot="gesture-target" className="relative bg-background shadow-md" style={{ transform: 'translateX(-58%)' }}>
            <MailRow from="택배 알림" subject="오늘 도착 예정입니다" />
          </div>
          <span className="absolute top-1/2 left-[22%]">
            <Finger slot x={0} y={0} />
          </span>
        </li>
        <li className="border-b">
          <MailRow from="이도윤" subject="주말에 등산 갈래?" />
        </li>
      </ul>
    </PhoneFrame>
  )
}

function GesturesPreview() {
  return (
    <div aria-hidden className="flex h-28 w-16 flex-col overflow-hidden rounded-[0.9rem] border-2 border-foreground/80 bg-background">
      <div className="mt-3 flex flex-col gap-1.5 px-1.5">
        <span className="h-3 rounded bg-muted" />
        <span className="relative h-3 overflow-hidden rounded bg-red-500">
          <span className="absolute inset-y-0 left-0 w-3/5 rounded bg-muted" />
        </span>
        <span className="h-3 rounded bg-muted" />
      </div>
      <span className="relative mt-3 ml-7 size-5 rounded-full bg-foreground/25 ring-2 ring-background">
        <span className="absolute top-1/2 left-full h-0.5 w-4 -translate-y-1/2 rounded-full bg-foreground/20" />
      </span>
    </div>
  )
}

export const gesturesEntry: ShowcaseEntry = {
  id: 'gestures',
  name: 'Gestures',
  aliases: [
    'Touch gestures',
    'Tap',
    'Long press',
    'Swipe',
    'Swipe to delete',
    'Drag',
    'Pinch to zoom',
    'Double tap',
    'Pull to refresh',
    'Edge swipe',
    '제스처',
    '터치 제스처',
    '탭',
    '길게 누르기',
    '스와이프',
    '밀어서 삭제',
    '드래그',
    '핀치',
    '두 번 탭',
    '당겨서 새로고침',
    '가장자리 스와이프',
  ],
  description: '탭·길게 누르기·스와이프·핀치처럼 손가락을 화면에 대고 움직이는 동작과, 화면이 그 동작에 어떻게 반응하는지 보여 주는 형식.',
  category: 'mobile',
  Preview: GesturesPreview,
  anatomy: {
    Specimen: GesturesSpecimen,
    parts: [
      { slot: 'gesture-target', name: 'Target', description: '손가락이 닿아 움직이는 대상. 여기서는 왼쪽으로 밀리는 메일 한 줄' },
      { slot: 'gesture-touch-point', name: 'Touch point', description: '손가락이 닿은 자리. 대상은 손가락을 그대로 따라와야 잡고 있는 느낌이 남' },
      { slot: 'gesture-threshold', name: 'Threshold', description: '이 선을 넘긴 채 놓아야 동작이 실행됨. 못 넘기면 제자리로 돌아가 취소됨' },
      { slot: 'gesture-feedback', name: 'Feedback', description: '끄는 동안 드러나는 결과 미리보기. 기준선을 넘으면 문구와 색이 바뀜' },
      { slot: 'gesture-alternative', name: 'Alternative', description: '제스처 없이 같은 일을 하는 버튼·키. 숨은 제스처만 있으면 키보드·화면 낭독기 사용자는 쓸 수 없음' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '손가락이 닿는 대상 하나가 거치는 모습입니다. 눌리면 바로 어두워지거나 작아져 눌렸다는 것을 알리고, 길게 누르면 링이 차오르며, 끄는 중에는 떠오르듯 그림자가 생깁니다. 손가락이 대상 밖으로 벗어난 채 놓으면 아무 일도 없어야(취소) 잘못 누른 것을 되돌릴 수 있습니다. 키보드 포커스는 제스처를 쓰지 못하는 사람이 같은 일을 하는 길입니다.',
      Demo: States,
    },
    {
      title: '탭',
      description:
        '누르고 같은 자리에서 떼는 가장 기본 제스처입니다. 버튼·링크·목록 항목처럼 하나를 고를 때 쓰고, 누르는 순간 물결이나 색으로 바로 반응해야 눌렸는지 압니다. 손가락은 마우스보다 굵어서 터치 영역이 44×44pt(안드로이드 48dp)보다 작으면 자주 빗나가므로, 아이콘이 작아도 보이지 않는 여백으로 영역을 넓힙니다. 작은 저장 버튼 옆을 눌러 빗나감이 느는지 보고, 아래 스위치로 영역을 넓혀 다시 눌러 보세요.',
      Demo: TapFormat,
    },
    {
      title: '길게 누르기',
      description:
        '0.5초쯤 누른 채로 있으면 복사·고정·삭제 같은 추가 메뉴가 뜹니다. 자주 쓰지 않는 보조 동작에 쓰고, 꼭 필요한 기능을 여기에만 두면 아무도 찾지 못합니다. 누르는 동안 링이 차오르고, 손가락이 움직이면 스크롤하려는 것으로 보고 취소합니다. 같은 메뉴를 ⋯ 버튼·오른쪽 클릭·Shift+F10으로도 열 수 있어야 키보드와 화면 낭독기 사용자도 씁니다. 길게 눌러 메뉴를 열어 보고, 누르는 중에 손가락을 움직여 취소되는지도 보세요.',
      Demo: LongPressFormat,
    },
    {
      title: '스와이프',
      description:
        '손가락을 옆으로 쓸어 다음 카드로 넘깁니다. 사진·배너처럼 같은 종류를 하나씩 넘겨 볼 때 쓰고, 꼭 봐야 할 내용을 넘겨야 보이는 곳에 숨기지는 않습니다. 절반 넘게 끌거나, 짧아도 빠르게 튕기면(0.5px/ms 이상) 넘어가고 아니면 제자리로 돌아옵니다. 끝 카드에서는 고무줄처럼 조금만 끌립니다. 천천히 조금 끌었을 때와 짧게 튕겼을 때를 비교하고, ‹ › 버튼·점·←→ 키로도 넘겨 보세요.',
      Demo: SwipeFormat,
    },
    {
      title: '밀어서 삭제',
      description:
        '목록 한 줄을 왼쪽으로 밀면 뒤에 숨은 삭제가 드러납니다. 메일·알림처럼 하나씩 빠르게 정리하는 목록에 쓰고, 되돌릴 수 없는 중요한 삭제라면 확인을 받는 편이 낫습니다. 조금 밀면 삭제 버튼이 열린 채 멈추고, 절반을 넘기면 "놓으면 삭제"로 바뀌어 놓는 순간 지워집니다. 실수하기 쉬우니 되돌리기를 꼭 주고, 보이지 않는 동작이라 Delete 키 같은 다른 방법도 둡니다. 절반 넘게 밀어 지운 뒤 되돌리기를 눌러 보세요.',
      Demo: SwipeToDeleteFormat,
    },
    {
      title: '드래그',
      description:
        '손잡이(⋮⋮)를 눌러 줄을 들어 올리고 원하는 자리에 놓아 순서를 바꿉니다. 할 일·재생 목록처럼 사용자가 순서를 정하는 목록에 쓰고, 날짜순처럼 정렬 기준이 있는 목록에는 쓰지 않습니다. 줄 전체가 아니라 손잡이만 끌리게 해야(touch-action: none) 나머지 부분으로 화면을 스크롤할 수 있습니다. 끌기가 어려운 사람을 위해 손잡이에 초점을 두고 ↑↓ 키로도 옮깁니다. 끌어서 한 번, 키보드로 한 번 순위를 바꿔 보세요.',
      Demo: DragFormat,
    },
    {
      title: '핀치',
      description:
        '두 손가락을 벌리면 확대, 오므리면 축소합니다. 사진·지도처럼 작은 부분을 자세히 볼 때 쓰고, 일반 페이지에서 브라우저 확대를 막는 데 쓰면 글씨를 키워 읽는 사람이 곤란해집니다. 확대한 뒤에는 한 손가락으로 옮겨 봅니다. 마우스로는 Shift를 누른 채 끌면 사진 가운데를 사이에 두고 반대편에 가짜 손가락이 생기고, Ctrl(⌘)+휠·트랙패드 핀치·+/− 버튼과 키로도 확대합니다. 표지판의 작은 글씨를 확대해서 읽어 보세요.',
      Demo: PinchFormat,
    },
    {
      title: '두 번 탭',
      description:
        '같은 자리를 빠르게 두 번 탭하면 좋아요가 눌리며 하트가 터집니다. 사진에 좋아요를 누르거나 확대하는 지름길로 쓰지만, 두 번 탭이 있으면 한 번 탭은 두 번째 탭이 오는지 300ms쯤 기다린 뒤에야 반응해 느리게 느껴집니다. 그래서 한 번 탭이 중요한 곳에는 쓰지 않고, 같은 일을 하는 ♥ 버튼을 늘 함께 둡니다. 한 번 탭했을 때 기다리는 표시를 보고, 아래 스위치로 두 번 탭을 꺼서 한 번 탭이 바로 반응하는지 비교해 보세요.',
      Demo: DoubleTapFormat,
    },
    {
      title: '당겨서 새로고침',
      description:
        '목록 맨 위에서 아래로 당겼다 놓으면 새 내용을 불러옵니다. 피드·알림처럼 새 항목이 위에 쌓이는 목록에 쓰고, 내용이 저절로 바뀌지 않는 설정 화면 같은 곳에는 필요 없습니다. 당긴 거리가 기준을 넘으면 화살표가 뒤집히며 "놓으면 새로고침"으로 바뀌고, 덜 당기면 취소됩니다. 같은 일을 하는 새로고침 버튼도 둡니다. 조금만 당겼다 놓아 보고, 끝까지 당겨 새 특가 3개가 위에 생기는지 보세요.',
      Demo: PullToRefreshFormat,
    },
    {
      title: '가장자리 스와이프',
      description:
        '화면 왼쪽 끝에서 오른쪽으로 끌면 지금 화면이 밀려나고 아래에 있던 이전 화면이 드러나며 뒤로 갑니다. 여러 단계로 들어가는 앱 화면에 쓰고, 왼쪽 끝에 가로로 끄는 다른 요소(캐러셀 등)를 두면 서로 부딪칩니다. 가장자리(파란 띠)가 아닌 곳에서 끌면 아무 일도 없어야 본문의 가로 끌기와 섞이지 않습니다. 휴대폰 브라우저도 같은 제스처로 뒤로 가므로 화면 안에는 늘 뒤로 버튼을 둡니다. 가운데서 끌어 보고, 가장자리에서 반쯤 끌다 멈춰 이전 화면이 엿보이는지 보세요.',
      Demo: EdgeSwipeFormat,
    },
  ],
}
