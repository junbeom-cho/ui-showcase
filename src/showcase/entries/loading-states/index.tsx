import { AlertCircleIcon, InboxIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
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
import { Spinner } from './spinners'

type CardState = 'idle' | 'loading' | 'done' | 'failed' | 'retrying' | 'empty'

const ORDERS = [
  { name: '원두 1kg', price: '18,000원' },
  { name: '머그컵 2개', price: '9,500원' },
]

/** One small card, drawn in each state it passes through while its data loads. */
function OrdersCard({ state }: { state: CardState }) {
  const busy = state === 'loading' || state === 'retrying'
  return (
    <div
      aria-busy={busy || undefined}
      className="flex h-36 w-full max-w-64 flex-col rounded-lg border bg-background text-left text-sm"
    >
      <div className="flex h-9 items-center justify-between border-b px-3">
        <span className="font-medium">최근 주문</span>
        {state === 'loading' && <Spinner size="sm" label="불러오는 중" className="text-muted-foreground" />}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 px-3 py-2">
        {state === 'idle' && (
          <>
            <p className="text-xs text-muted-foreground">아직 불러오지 않았어요</p>
            <Button size="xs" variant="outline" tabIndex={-1} className="self-start">
              불러오기
            </Button>
          </>
        )}
        {state === 'loading' &&
          [0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1">
              <Skeleton className="h-3.5 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-3.5 w-14 motion-reduce:animate-none" />
            </div>
          ))}
        {state === 'done' &&
          ORDERS.map((o) => (
            <div key={o.name} className="flex items-center justify-between gap-3 py-0.5">
              <span>{o.name}</span>
              <span className="text-muted-foreground tabular-nums">{o.price}</span>
            </div>
          ))}
        {(state === 'failed' || state === 'retrying') && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircleIcon aria-hidden className="size-3.5" />
              불러오지 못했어요
            </p>
            <Button size="xs" variant="outline" tabIndex={-1} disabled={state === 'retrying'}>
              {state === 'retrying' && <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" />}
              {state === 'retrying' ? '다시 시도 중…' : '다시 시도'}
            </Button>
          </div>
        )}
        {state === 'empty' && (
          <div className="flex flex-col items-center gap-1 text-center">
            <InboxIcon aria-hidden className="size-5 text-muted-foreground" />
            <p className="text-xs font-medium">주문 내역이 없어요</p>
            <p className="text-xs text-muted-foreground">첫 주문을 해 보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '대기', node: <OrdersCard state="idle" /> },
        { label: '불러오는 중', node: <OrdersCard state="loading" /> },
        { label: '완료', node: <OrdersCard state="done" /> },
        { label: '실패', node: <OrdersCard state="failed" /> },
        { label: '다시 시도 중', node: <OrdersCard state="retrying" /> },
        { label: '빈 결과', node: <OrdersCard state="empty" /> },
      ]}
    />
  )
}

function LoadingStatesSpecimen() {
  return (
    <div className="flex w-72 flex-col gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2.5">
        <span data-slot="loading-spinner" className="inline-flex">
          <Spinner still size="md" />
        </span>
        <p data-slot="loading-label" className="text-sm">
          사진 3장 올리는 중… <span className="text-muted-foreground">약 4초 남음</span>
        </p>
      </div>
      <div data-slot="progress-track" className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div data-slot="progress-fill" className="h-full w-[65%] rounded-full bg-primary" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div data-slot="skeleton-block" className="size-12 shrink-0 rounded-md bg-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-4/5 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

function LoadingStatesPreview() {
  return (
    <div className="flex w-40 flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Spinner size="sm" className="text-muted-foreground" />
        <Skeleton className="h-2.5 flex-1 motion-reduce:animate-none" />
      </div>
      <Progress value={60} aria-label="진행률 60%" className="h-1.5" />
      <div className="flex gap-2">
        <Skeleton className="size-8 motion-reduce:animate-none" />
        <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
          <Skeleton className="h-2 w-4/5 motion-reduce:animate-none" />
          <Skeleton className="h-2 w-1/2 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  )
}

export const loadingStatesEntry: ShowcaseEntry = {
  id: 'loading-states',
  name: 'Loading States',
  aliases: [
    'Spinner',
    'Loader',
    'Progress bar',
    'Skeleton screen',
    'Shimmer',
    'Optimistic UI',
    'Lazy loading',
    'Blur-up',
    '스피너',
    '로딩',
    '로딩 표시',
  ],
  description: '기다리는 동안 무엇이 얼마나 진행되는지를 스피너·진행 막대·스켈레톤 같은 방식으로 보여 주는 형식.',
  category: 'feedback',
  Preview: LoadingStatesPreview,
  anatomy: {
    Specimen: LoadingStatesSpecimen,
    parts: [
      { slot: 'loading-spinner', name: 'Spinner', description: '기다리는 중임을 알리는 도는 표시. 얼마나 남았는지 모를 때' },
      { slot: 'loading-label', name: 'Status text', description: '무엇을 기다리는지, 얼마나 남았는지 글로. 스크린리더도 이것을 읽음' },
      { slot: 'progress-track', name: 'Track', description: '해야 할 일 전체의 길이' },
      { slot: 'progress-fill', name: 'Indicator', description: '끝난 만큼 채워지는 부분' },
      { slot: 'skeleton-block', name: 'Skeleton', description: '곧 들어올 내용의 자리를 미리 잡아 두는 회색 덩어리' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '데이터를 불러오는 카드 한 장이 거치는 상태입니다. 시작 전과 불러오는 중, 끝난 뒤의 세 갈래(내용·실패·빈 결과), 그리고 실패 후 다시 시도하는 모습까지 그렸습니다.',
      Demo: States,
    },
    {
      title: '스피너',
      description:
        '빙글 도는 표시로 "기다리는 중"만 알립니다. 얼마나 걸릴지 모르는 짧은 기다림(대략 1~4초)에 쓰고, 더 오래 걸리면 진행 막대나 스켈레톤이 낫습니다. 스피너만 두지 말고 "불러오는 중" 같은 글을 함께(눈에 안 보이게라도) 둡니다. 모양을 바꿔 가며 불러와 보세요.',
      Demo: SpinnerFormat,
    },
    {
      title: '진행 막대',
      description:
        '얼마나 됐는지 알 때는 채워지는 막대와 퍼센트·남은 시간을, 모를 때는 계속 흐르는 막대를 씁니다. 몇 초 넘게 걸리는 업로드·내보내기에 쓰고, 1초 안에 끝나는 일에는 깜빡이기만 하니 쓰지 않습니다. 시작을 눌러 두 막대를 비교해 보세요.',
      Demo: ProgressFormat,
    },
    {
      title: '스켈레톤',
      description:
        '내용이 들어올 자리를 회색 덩어리로 먼저 그려 둡니다. 화면 모양이 정해진 목록·카드에 쓰고, 모양을 미리 알 수 없는 화면에는 맞지 않습니다. 덩어리 크기를 실제 내용과 맞춰야 내용이 들어올 때 화면이 덜컥이지 않습니다. 다시 불러오기를 눌러 보세요.',
      Demo: SkeletonFormat,
    },
    {
      title: '반짝임 효과',
      description:
        '스켈레톤 위로 빛줄기가 지나가게 해 "멈춘 게 아니라 불러오는 중"임을 더 분명히 합니다. 상품 목록처럼 그림이 많은 화면에서 흔합니다. 기기에서 움직임 줄이기를 켠 사람에게는 빛을 끄고 회색 덩어리만 보여 줍니다. 스위치로 그 모습을 미리 볼 수 있습니다.',
      Demo: ShimmerFormat,
    },
    {
      title: '버튼 안 로딩',
      description:
        '누른 버튼 자리에서 바로 "저장 중…"을 보여 주고, 끝날 때까지 다시 누를 수 없게 막아 두 번 저장되는 일을 막습니다. 글자가 바뀌어도 버튼 폭이 그대로라 옆 요소가 밀리지 않습니다. 화면 전체를 기다리게 할 일이 아니라면 이쪽을 씁니다. 저장을 여러 번 눌러 보세요.',
      Demo: ButtonLoadingFormat,
    },
    {
      title: '여러 파일 업로드',
      description:
        '파일마다 자기 진행 막대를 가지고 따로 끝나거나 실패합니다. 하나가 실패해도 나머지는 계속 올라가고, 실패한 파일만 골라 다시 시도할 수 있어야 합니다. 올리기를 시작한 뒤 실패한 영상을 다시 시도해 보세요.',
      Demo: UploadFormat,
    },
    {
      title: '낙관적 업데이트',
      description:
        '서버 답을 기다리지 않고 화면을 먼저 바꾸고, 실패하면 되돌린 뒤 알립니다. 좋아요·완료 표시처럼 거의 늘 성공하고 되돌려도 괜찮은 일에 쓰고, 결제처럼 실패가 큰 일에는 쓰지 않습니다. 여기서는 세 번째 요청마다 실패하니 항목을 여러 번 눌러 보세요.',
      Demo: OptimisticFormat,
    },
    {
      title: '흐릿하게 먼저 보이기',
      description:
        '아주 작은 미리보기 그림을 흐리게 늘려 먼저 보여 주고, 원본이 오면 선명하게 바꿉니다. 큰 사진이 많은 화면에서 빈 칸이 오래 비어 있지 않게 할 때 씁니다. 다시 불러오기를 눌러 빈 칸에서 갑자기 나타나는 쪽과 비교해 보세요.',
      Demo: BlurUpFormat,
    },
  ],
}
