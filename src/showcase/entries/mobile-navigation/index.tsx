import type { ReactNode } from 'react'
import { BellIcon, ChevronLeftIcon, HouseIcon, PlusIcon, SearchIcon, TicketIcon } from 'lucide-react'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import { ContentSketch, PhoneFrame } from '../navigation-patterns/frames'
import { BackNavigationFormat, FabFormat, LargeTitleFormat } from './screen-formats'
import { BottomTabFormat, TabBarDrawing, TabBarItem, TopTabsFormat } from './tab-formats'

/** A slice of tab bar, so each state is seen where it lives. */
function Bar({ children }: { children: ReactNode }) {
  return <div className="w-20 rounded-lg border bg-background pb-1">{children}</div>
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Bar><TabBarItem drawing icon={SearchIcon} label="검색" /></Bar> },
        { label: '선택됨', node: <Bar><TabBarItem drawing selected icon={HouseIcon} label="홈" /></Bar> },
        { label: '눌림', node: <Bar><TabBarItem drawing state="active" icon={SearchIcon} label="검색" /></Bar> },
        { label: '포커스', node: <Bar><TabBarItem drawing state="focus" icon={SearchIcon} label="검색" /></Bar> },
        {
          label: '알림 배지',
          node: <Bar><TabBarItem drawing icon={BellIcon} label="알림" count={3} name="알림, 새 알림 3개" /></Bar>,
        },
        { label: '비활성', node: <Bar><TabBarItem disabled icon={TicketIcon} label="쿠폰" /></Bar> },
      ]}
    />
  )
}

function MobileNavigationSpecimen() {
  return (
    <PhoneFrame className="h-[26rem] w-[17.5rem]">
      <header data-slot="mobile-app-bar" className="relative flex h-11 shrink-0 items-center justify-center px-2">
        <span data-slot="mobile-back-button" className="absolute left-1 flex items-center text-sm text-blue-600 dark:text-blue-400">
          <ChevronLeftIcon aria-hidden className="size-5" />
          검색
        </span>
        <span data-slot="mobile-title" className="text-sm font-semibold">
          제주 바다숙소
        </span>
      </header>
      <div data-slot="mobile-top-tabs" className="relative grid shrink-0 grid-cols-3 border-b text-center text-sm">
        <span className="py-2.5 font-semibold">정보</span>
        <span className="py-2.5 text-muted-foreground">리뷰</span>
        <span className="py-2.5 text-muted-foreground">위치</span>
        <span aria-hidden className="absolute bottom-0 left-0 h-0.5 w-1/3 rounded-full bg-foreground" />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div aria-hidden className="aspect-[16/9] rounded-lg bg-muted" />
        <ContentSketch rows={4} />
        <span
          data-slot="mobile-fab"
          className="absolute right-4 bottom-4 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
        >
          <PlusIcon aria-hidden className="size-5" />
        </span>
      </div>
      <TabBarDrawing slots />
    </PhoneFrame>
  )
}

function MobileNavigationPreview() {
  return (
    <div aria-hidden className="relative flex h-28 w-16 flex-col overflow-hidden rounded-xl border-2 border-foreground/80 bg-background">
      <div className="flex h-4 items-center gap-1 px-1">
        <ChevronLeftIcon className="size-2.5" />
        <span className="h-1 w-6 rounded-full bg-foreground/70" />
      </div>
      <div className="relative grid grid-cols-3 border-b pb-0.5">
        <span className="mx-auto h-1 w-2.5 rounded-full bg-foreground/70" />
        <span className="mx-auto h-1 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="mx-auto h-1 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="absolute -bottom-px left-0 h-0.5 w-1/3 bg-foreground" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1">
        <span className="h-1.5 w-full rounded bg-muted" />
        <span className="h-1.5 w-3/4 rounded bg-muted" />
        <span className="h-1.5 w-5/6 rounded bg-muted" />
      </div>
      <span className="absolute right-1 bottom-6 size-3.5 rounded-md bg-foreground" />
      <div className="flex justify-around border-t py-1">
        <HouseIcon className="size-2.5" />
        <SearchIcon className="size-2.5 text-muted-foreground" />
        <BellIcon className="size-2.5 text-muted-foreground" />
      </div>
    </div>
  )
}

export const mobileNavigationEntry: ShowcaseEntry = {
  id: 'mobile-navigation',
  name: 'Mobile Navigation',
  aliases: [
    'Tab bar',
    'Bottom navigation',
    'Top tabs',
    'Floating action button',
    'FAB',
    'Speed dial',
    'Back navigation',
    'App bar',
    'Large title',
    'Navigation stack',
    '하단 탭바',
    '하단 탭 바',
    '상단 탭',
    '플로팅 버튼',
    '뒤로 가기',
    '앱 바',
    '큰 제목',
    '모바일 내비게이션',
  ],
  description: '휴대폰 앱에서 하단 탭 바·상단 탭·플로팅 버튼·뒤로 가기·큰 제목 헤더로 화면 사이를 오가게 하는 모바일 전용 내비게이션 형식.',
  category: 'mobile',
  Preview: MobileNavigationPreview,
  anatomy: {
    Specimen: MobileNavigationSpecimen,
    parts: [
      { slot: 'mobile-app-bar', name: 'App bar', description: '화면 맨 위 띠. 지금 화면 이름과 뒤로 가기, 동작 버튼을 담음' },
      { slot: 'mobile-back-button', name: 'Back button', description: '‹ 와 이전 화면 이름. 누르면 지금 화면을 닫고 한 단계 앞으로 돌아감' },
      { slot: 'mobile-title', name: 'Title', description: '지금 보고 있는 화면의 이름' },
      { slot: 'mobile-top-tabs', name: 'Top tabs', description: '같은 화면 안의 내용을 나누는 탭. 밑줄이 고른 탭을 따라가고, 옆으로 밀어도 바뀜' },
      { slot: 'mobile-fab', name: 'Floating action button', description: '내용 위에 떠 있는 가장 중요한 동작 하나(새로 만들기 등)' },
      { slot: 'mobile-tab-bar', name: 'Tab bar', description: '엄지가 닿는 화면 아래에 늘 떠 있는 3~5개의 주요 목적지' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '하단 탭 하나가 가질 수 있는 모습입니다. 고른 탭은 굵은 아이콘과 배경으로 표시하고, 손가락으로 누르는 동안의 눌림과 키보드 포커스는 고정해서 그렸습니다. 새 알림 개수 배지와 아직 쓸 수 없는 비활성 탭도 있습니다.',
      Demo: States,
    },
    {
      title: '하단 탭 바',
      description:
        '휴대폰 화면 아래에 가장 중요한 목적지 3~5개를 아이콘과 이름으로 늘 띄워 둡니다. 엄지가 닿는 자리라 앱에서 가장 흔하고, 다섯 개를 넘거나 그때그때 하는 동작(공유, 삭제)을 넣는 곳은 아닙니다. 탭을 바꿔 화면이 바뀌는지 보고, 홈에서 상품을 담아 장바구니 숫자가 오르는지 보세요.',
      Demo: BottomTabFormat,
    },
    {
      title: '상단 탭',
      description:
        '앱 바 바로 아래에서 같은 종류의 내용을 상태·분류별로 나눕니다. 예약 내역의 전체·예약 중·예약 완료처럼 나란히 오가며 비교하는 내용에 쓰고, 서로 다른 목적지로 가는 데는 하단 탭 바를 씁니다. 탭이 많으면 줄을 옆으로 굴리게 만들고 고른 탭을 가운데로 데려옵니다. 탭을 눌러 밑줄이 따라가는지 보고, 아래 내용을 좌우로 밀어 보고, 탭 8개로 바꿔 줄을 굴려 보세요.',
      Demo: TopTabsFormat,
    },
    {
      title: '플로팅 버튼',
      description:
        '목록 위에 떠 있는 둥근 버튼으로 그 화면의 가장 중요한 동작 하나(새 메모 쓰기)를 바로 하게 합니다. 화면마다 하나만 두고, 덜 중요하거나 여러 개인 동작이면 앱 바 버튼이 낫습니다. 읽는 동안 가리지 않게 내릴 때는 숨고 올릴 때는 작게 돌아오며, 누르면 종류를 고르는 메뉴(스피드 다이얼)가 어두운 막 위로 펼쳐집니다. 목록을 위아래로 굴려 보고, 버튼을 눌러 메모 종류를 고르거나 바깥을 눌러 닫아 보세요.',
      Demo: FabFormat,
    },
    {
      title: '뒤로 가기',
      description:
        '앞으로 갈 때마다 새 화면이 위에 쌓이고(목록 → 상품 상세 → 리뷰), 앱 바의 ‹ 이전 화면 이름이 맨 위 한 장을 걷어 냅니다. 홈 버튼은 쌓인 화면을 한꺼번에 닫고 처음으로 가며, 브라우저 뒤로 가기는 화면 계층이 아니라 다녀간 주소 순서를 따릅니다. 화면이 하나뿐일 때는 뒤로 버튼을 두지 않습니다. 상품과 리뷰로 들어가 아래 쌓인 화면 줄을 보고, ‹ 로 한 장씩 돌아오거나 홈 버튼으로 한 번에 돌아와 보세요.',
      Demo: BackNavigationFormat,
    },
    {
      title: '큰 제목 헤더',
      description:
        'iOS 앱처럼 화면 맨 위에 큰 제목을 두었다가, 내리면 제목이 줄어들며 앱 바 가운데의 작은 제목으로 들어갑니다(접히는 앱 바). 설정·메일함처럼 목록의 첫 화면에서 어디에 있는지 또렷이 알릴 때 쓰고, 깊이 들어간 상세 화면은 처음부터 작은 제목이 낫습니다. 목록을 천천히 내려 큰 제목이 바 안으로 접히는 것을 보고, 다시 맨 위로 올려 보세요.',
      Demo: LargeTitleFormat,
    },
  ],
}
