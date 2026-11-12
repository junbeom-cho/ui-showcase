import { AlertCircleIcon, ArrowUpDownIcon, ChevronRightIcon, InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import { PLACES, type Place } from './places'
import {
  AccordionView,
  CardView,
  CarouselView,
  GridView,
  InfiniteScrollView,
  ListView,
  MasonryView,
  TableView,
  Thumb,
  TimelineView,
} from './views'

/** One drawn list row; hover and focus are pinned with data-demo-state. */
function Row({
  place,
  state,
  selected = false,
  disabled = false,
  slots = false,
}: {
  place: Place
  state?: 'hover' | 'focus'
  selected?: boolean
  disabled?: boolean
  /** name the parts for the anatomy drawing */
  slots?: boolean
}) {
  return (
    <div
      data-slot={slots ? 'list-item' : undefined}
      data-demo-state={state}
      aria-current={selected || undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:bg-muted',
        selected && 'shadow-[inset_3px_0_0_var(--color-primary)]',
        disabled && 'pointer-events-none opacity-45',
      )}
    >
      <div data-slot={slots ? 'item-media' : undefined}>
        <Thumb place={place} className="size-10" />
      </div>
      <div className="min-w-0 flex-1">
        <p data-slot={slots ? 'item-title' : undefined} className="truncate text-sm font-medium">
          {place.name}
        </p>
        <p data-slot={slots ? 'item-meta' : undefined} className="text-xs text-muted-foreground">
          {place.category} · {place.area} · ★ {place.rating.toFixed(1)}
        </p>
      </div>
      <ChevronRightIcon data-slot={slots ? 'item-action' : undefined} aria-hidden className="size-4 text-muted-foreground" />
    </div>
  )
}

const box = 'w-full max-w-64 rounded-lg border bg-background p-1'

function States() {
  const [a, b, c] = PLACES
  return (
    <StateGrid
      wide
      items={[
        { label: '기본', node: <div className={box}><Row place={a} /></div> },
        { label: '호버', node: <div className={box}><Row place={a} state="hover" /></div> },
        { label: '선택됨', node: <div className={box}><Row place={b} selected /></div> },
        { label: '포커스', node: <div className={box}><Row place={a} state="focus" /></div> },
        { label: '비활성', node: <div className={box}><Row place={c} disabled /></div> },
        {
          label: '불러오는 중',
          node: (
            <div className={cn(box, 'flex items-center gap-3 px-4 py-3.5')}>
              <Skeleton className="size-10" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ),
        },
        {
          label: '비어 있음',
          node: (
            <div className={cn(box, 'flex flex-col items-center gap-1.5 py-5 text-center')}>
              <InboxIcon aria-hidden className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">아직 저장한 장소가 없어요</p>
              <p className="text-xs text-muted-foreground">마음에 드는 곳을 저장해 보세요.</p>
            </div>
          ),
        },
        {
          label: '오류',
          node: (
            <div className={cn(box, 'flex flex-col items-center gap-2 py-4 text-center')}>
              <AlertCircleIcon aria-hidden className="size-6 text-destructive" />
              <p className="text-sm font-medium">목록을 불러오지 못했어요</p>
              <Button variant="outline" size="sm" tabIndex={-1}>
                다시 시도
              </Button>
            </div>
          ),
        },
      ]}
    />
  )
}

function ListViewsSpecimen() {
  return (
    <div className="w-72 rounded-lg border bg-background p-1">
      <div data-slot="list-header" className="flex items-center justify-between px-3 py-2">
        <p className="text-sm font-semibold">
          가 본 곳 <span className="font-normal text-muted-foreground">12</span>
        </p>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpDownIcon aria-hidden className="size-3.5" />
          최근순
        </span>
      </div>
      <Row place={PLACES[0]} slots />
      <div data-slot="list-separator" className="mx-3 h-px bg-border" />
      <Row place={PLACES[1]} />
      <div className="mx-3 h-px bg-border" />
      <Row place={PLACES[2]} />
    </div>
  )
}

function ListViewsPreview() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex w-28 flex-col gap-1.5 rounded-md border bg-background p-1.5">
        {PLACES.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <Thumb place={p} className="size-5" iconClassName="size-3" />
            <span className="h-1.5 flex-1 rounded-full bg-muted-foreground/30" />
          </div>
        ))}
      </div>
      <div className="grid w-20 grid-cols-2 gap-1">
        {PLACES.slice(3, 7).map((p) => (
          <Thumb key={p.id} place={p} className="aspect-square w-full" iconClassName="size-3" />
        ))}
      </div>
    </div>
  )
}

export const listViewsEntry: ShowcaseEntry = {
  id: 'list-views',
  name: 'List Views',
  aliases: [
    '목록 보기',
    'Collection view',
    'Data list',
    'Carousel',
    'Table',
    'Timeline',
    'Masonry',
    'Infinite scroll',
    '캐러셀',
    '메이슨리',
  ],
  description: '여러 항목을 줄, 격자, 카드, 표, 타임라인 같은 방식으로 늘어놓아 보여주는 목록 형식.',
  category: 'display',
  Preview: ListViewsPreview,
  anatomy: {
    Specimen: ListViewsSpecimen,
    parts: [
      { slot: 'list-header', name: 'Header', description: '목록 제목, 개수, 정렬 같은 목록 전체에 대한 정보' },
      { slot: 'list-item', name: 'Item', description: '항목 한 개. 누르면 고르거나 상세로 들어감' },
      { slot: 'item-media', name: 'Media', description: '항목을 알아보게 돕는 그림·사진·아이콘' },
      { slot: 'item-title', name: 'Title', description: '항목의 이름. 가장 먼저 읽힘' },
      { slot: 'item-meta', name: 'Meta', description: '분류, 위치, 평점처럼 덧붙는 작은 정보' },
      { slot: 'item-action', name: 'Action', description: '더 들어갈 수 있음을 알리는 표시나 버튼' },
      { slot: 'list-separator', name: 'Separator', description: '항목 사이를 나누는 선' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '목록의 한 줄이 가질 수 있는 상태와, 목록 전체가 비었거나 불러오는 중이거나 실패했을 때의 모습입니다.',
      Demo: States,
    },
    {
      title: '리스트',
      description: '한 줄에 항목 하나. 그림·이름·덧붙는 정보가 같은 자리에 와서 위아래로 훑어 읽기 쉽습니다. 설정 화면, 연락처, 메일함에서 씁니다.',
      Demo: ListView,
    },
    {
      title: '그리드',
      description: '같은 크기의 칸을 가로세로로 맞춰 늘어놓습니다. 그림이 중요한 사진첩, 상품 목록, 앱 아이콘 화면에서 씁니다. 열 수를 바꿔 보세요.',
      Demo: GridView,
    },
    {
      title: '카드',
      description: '항목마다 그림·설명·버튼을 갖춘 상자 하나로 만듭니다. 항목 안에서 바로 저장 같은 동작을 할 수 있습니다.',
      Demo: CardView,
    },
    {
      title: '캐러셀',
      description: '한 번에 한 장씩 옆으로 넘깁니다. 화살표, 점, 손가락으로 밀기 모두 됩니다. 배너, 추천 목록, 온보딩에서 씁니다.',
      Demo: CarouselView,
    },
    {
      title: '테이블',
      description: '항목은 줄, 속성은 열로 맞춰 여러 값을 비교합니다. 머리글을 누르면 정렬되고 체크박스로 여러 줄을 고릅니다.',
      Demo: TableView,
    },
    {
      title: '타임라인',
      description: '시간 순서대로 세로선 위에 놓고 달별로 묶습니다. 활동 기록, 배송 조회, 변경 이력에서 씁니다. 항목을 누르면 메모가 펼쳐집니다.',
      Demo: TimelineView,
    },
    {
      title: '아코디언',
      description: '묶음별로 접었다 펼칩니다. 긴 목록을 짧게 유지하면서 필요한 묶음만 열어 봅니다.',
      Demo: AccordionView,
    },
    {
      title: '메이슨리',
      description: '높이가 다른 카드를 벽돌처럼 열마다 채워 빈틈 없이 쌓습니다. 핀터레스트 같은 사진·메모 모음에서 씁니다.',
      Demo: MasonryView,
    },
    {
      title: '무한 스크롤',
      description: '끝에 가까워지면 다음 항목을 저절로 불러와 이어 붙입니다. 피드와 검색 결과에서 씁니다. 상자 안을 끝까지 내려 보세요.',
      Demo: InfiniteScrollView,
    },
  ],
}
