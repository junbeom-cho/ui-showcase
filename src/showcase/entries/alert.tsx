import { useState } from 'react'
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XIcon } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const toneClass = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 *:data-[slot=alert-description]:text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 *:data-[slot=alert-description]:text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 *:data-[slot=alert-description]:text-amber-800',
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        {
          label: '정보',
          node: (
            <Alert className={toneClass.info}>
              <InfoIcon />
              <AlertTitle>점검 안내</AlertTitle>
              <AlertDescription>오늘 밤 2시부터 30분간 점검합니다.</AlertDescription>
            </Alert>
          ),
        },
        {
          label: '성공',
          node: (
            <Alert className={toneClass.success}>
              <CheckCircle2Icon />
              <AlertTitle>저장했습니다</AlertTitle>
              <AlertDescription>1분 안에 반영됩니다.</AlertDescription>
            </Alert>
          ),
        },
        {
          label: '주의',
          node: (
            <Alert className={toneClass.warning}>
              <AlertTriangleIcon />
              <AlertTitle>공간이 부족합니다</AlertTitle>
              <AlertDescription>저장 공간이 10% 남았습니다.</AlertDescription>
            </Alert>
          ),
        },
        {
          label: '오류',
          node: (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>결제하지 못했습니다</AlertTitle>
              <AlertDescription>카드 정보를 확인하세요.</AlertDescription>
            </Alert>
          ),
        },
        {
          label: '동작 버튼 포함',
          node: (
            <Alert>
              <InfoIcon />
              <AlertTitle>새 버전이 나왔습니다</AlertTitle>
              <AlertDescription>새로고침하면 적용됩니다.</AlertDescription>
              <AlertAction>
                <Button size="xs" variant="outline">새로고침</Button>
              </AlertAction>
            </Alert>
          ),
        },
        {
          label: '닫기 버튼 포함',
          node: (
            <Alert>
              <CheckCircle2Icon />
              <AlertTitle>업로드했습니다</AlertTitle>
              <AlertDescription>파일 3개를 올렸습니다.</AlertDescription>
              <AlertAction>
                <Button size="icon" variant="ghost" className="size-6" aria-label="알림 닫기">
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          ),
        },
      ]}
    />
  )
}

function AlertPreview() {
  return (
    <Alert className="w-full">
      <AlertTitle>저장되지 않았습니다</AlertTitle>
      <AlertDescription>변경 사항을 저장하려면 저장 버튼을 누르세요.</AlertDescription>
    </Alert>
  )
}

function AlertSpecimen() {
  return (
    <Alert className="w-full max-w-96">
      <InfoIcon data-slot="alert-icon" />
      <AlertTitle>새 버전이 나왔습니다</AlertTitle>
      <AlertDescription>새로고침하면 바뀐 기능을 바로 쓸 수 있습니다.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">새로고침</Button>
      </AlertAction>
    </Alert>
  )
}

function DefaultAndDestructive() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>점검 안내</AlertTitle>
        <AlertDescription>오늘 밤 2시부터 30분 동안 서비스를 점검합니다.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>결제하지 못했습니다</AlertTitle>
        <AlertDescription>카드 유효기간이 지났습니다. 결제 수단을 바꾼 뒤 다시 시도하세요.</AlertDescription>
      </Alert>
    </div>
  )
}

function Dismissible() {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-3">
      {open ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>프로필을 저장했습니다</AlertTitle>
          <AlertDescription>다른 사람에게는 1분 안에 반영됩니다.</AlertDescription>
          <AlertAction>
            <Button size="icon" variant="ghost" className="size-6" aria-label="알림 닫기" onClick={() => setOpen(false)}>
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          알림 다시 보기
        </Button>
      )}
    </div>
  )
}

const tones = [
  { icon: InfoIcon, title: '정보', body: '새 기능을 써 보세요.', className: 'border-blue-200 bg-blue-50 text-blue-900 *:data-[slot=alert-description]:text-blue-800' },
  { icon: CheckCircle2Icon, title: '성공', body: '파일 3개를 올렸습니다.', className: 'border-emerald-200 bg-emerald-50 text-emerald-900 *:data-[slot=alert-description]:text-emerald-800' },
  { icon: AlertTriangleIcon, title: '주의', body: '저장 공간이 10% 남았습니다.', className: 'border-amber-200 bg-amber-50 text-amber-900 *:data-[slot=alert-description]:text-amber-800' },
]

function Tones() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-3">
      {tones.map((tone) => (
        <Alert key={tone.title} className={tone.className}>
          <tone.icon />
          <AlertTitle>{tone.title}</AlertTitle>
          <AlertDescription>{tone.body}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

export const alertEntry: ShowcaseEntry = {
  id: 'alert',
  name: 'Alert',
  aliases: ['Callout', 'Banner', 'Notice', '알림'],
  description: '주의가 필요한 메시지를 페이지 안에서 눈에 띄게 보여주는 상자.',
  category: 'feedback',
  Preview: AlertPreview,
  anatomy: {
    Specimen: AlertSpecimen,
    parts: [
      { slot: 'alert', name: 'Alert', description: '메시지를 감싸는 상자' },
      { slot: 'alert-icon', name: 'icon', description: '메시지 종류를 알려주는 아이콘' },
      { slot: 'alert-title', name: 'AlertTitle', description: '한 줄 요약' },
      { slot: 'alert-description', name: 'AlertDescription', description: '자세한 설명과 해야 할 일' },
      { slot: 'alert-action', name: 'AlertAction', description: '오른쪽 위의 버튼 자리' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '알릴 내용의 성격(정보·성공·주의·오류)과, 버튼을 함께 두는 경우입니다.',
      Demo: States,
    },
    {
      title: '기본과 위험',
      description: '일반 안내는 default, 오류처럼 꼭 봐야 하는 메시지는 destructive로 씁니다.',
      Demo: DefaultAndDestructive,
    },
    {
      title: '닫을 수 있는 알림',
      description: '읽고 나면 닫을 수 있게 X 버튼을 둡니다. 닫은 뒤 다시 열어 보세요.',
      Demo: Dismissible,
    },
    {
      title: '종류별 색',
      description: '정보·성공·주의처럼 성격에 따라 색을 입혀 한눈에 구분되게 합니다.',
      Demo: Tones,
    },
  ],
}
