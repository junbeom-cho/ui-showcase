import type { ReactNode } from 'react'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  HamburgerFormat,
  MegaMenuFormat,
  OverflowMenuFormat,
  SideRailFormat,
  StickyHeaderFormat,
  TabNavFormat,
  TopNavFormat,
} from './formats'
import { Logo, NavBadge, NavItem } from './parts'

/** A strip of bar the same height as a real one, so the current-page line lands on its edge. */
function Bar({ children }: { children: ReactNode }) {
  return <div className="flex h-12 items-center rounded-lg border bg-background px-2">{children}</div>
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Bar><NavItem drawing>요금제</NavItem></Bar> },
        { label: '현재 페이지', node: <Bar><NavItem drawing current>요금제</NavItem></Bar> },
        { label: '호버', node: <Bar><NavItem drawing state="hover">요금제</NavItem></Bar> },
        { label: '포커스', node: <Bar><NavItem drawing state="focus">요금제</NavItem></Bar> },
        { label: '알림 점', node: <Bar><NavItem drawing dot className="pr-5">소식</NavItem></Bar> },
        { label: '비활성', node: <Bar><NavItem disabled>준비 중</NavItem></Bar> },
      ]}
    />
  )
}

function NavigationSpecimen() {
  return (
    <nav
      aria-label="해부도 메뉴"
      data-slot="nav-bar"
      className="flex h-12 w-[27rem] max-w-full items-center gap-0.5 rounded-lg border bg-background px-2 sm:gap-1 sm:px-3"
    >
      <Logo slots className="mr-1 sm:mr-2" wordClassName="sr-only sm:not-sr-only" />
      <NavItem drawing current slots>
        홈
      </NavItem>
      {/* a spare link, left out on phone-width stages so the drawing fits */}
      <span data-slot="nav-item" className="hidden sm:inline-flex">
        <NavItem drawing>요금제</NavItem>
      </span>
      <NavItem drawing className="pr-2">
        소식
        <NavBadge slots count={3} />
      </NavItem>
      <span data-slot="nav-actions" className="ml-auto inline-flex">
        <Button size="sm" tabIndex={-1}>
          시작하기
        </Button>
      </span>
      <Button data-slot="nav-menu-button" variant="ghost" size="icon-sm" aria-label="메뉴" tabIndex={-1}>
        <MenuIcon />
      </Button>
    </nav>
  )
}

function NavigationPreview() {
  return (
    <div aria-hidden className="flex items-end gap-3">
      <div className="flex w-36 flex-col overflow-hidden rounded-md border bg-background">
        <div className="flex h-6 items-center gap-1.5 border-b px-1.5">
          <span className="size-2.5 rounded-sm bg-foreground" />
          <span className="relative h-1.5 w-6 rounded-full bg-foreground/70">
            <span className="absolute inset-x-0 -bottom-[7px] h-0.5 bg-foreground" />
          </span>
          <span className="h-1.5 w-6 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-6 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-col gap-1 p-1.5">
          <span className="h-1.5 w-full rounded bg-muted" />
          <span className="h-1.5 w-3/4 rounded bg-muted" />
          <span className="h-1.5 w-1/2 rounded bg-muted" />
        </div>
      </div>
      {/* a narrow window with its ☰ panel slid out */}
      <div className="relative flex h-20 w-16 flex-col overflow-hidden rounded-md border bg-background">
        <div className="flex h-5 items-center justify-end border-b px-1.5">
          <MenuIcon className="size-2.5" />
        </div>
        <div className="absolute inset-y-0 left-0 flex w-10 flex-col gap-1.5 border-r bg-muted p-1.5 pt-2 shadow-sm">
          <span className="h-1.5 w-full rounded-full bg-foreground/70" />
          <span className="h-1.5 w-5/6 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-4/6 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  )
}

export const navigationPatternsEntry: ShowcaseEntry = {
  id: 'navigation-patterns',
  name: 'Navigation Patterns',
  aliases: [
    'Navbar',
    'Top navigation',
    'Hamburger menu',
    'Navigation rail',
    'Mega menu',
    'Tab navigation',
    'Overflow menu',
    'Priority+ navigation',
    'Sticky header',
    '내비게이션',
    '내비게이션 바',
    '상단 내비게이션',
    '햄버거 메뉴',
    '사이드 레일',
    '메가 메뉴',
    '탭 내비게이션',
    '더보기 메뉴',
    '고정 헤더',
  ],
  description: '지금 어느 화면에 있는지 알려 주고 다른 화면으로 옮겨 가게 하는 메뉴를 상단 바·햄버거·사이드 레일·고정 헤더 같은 방식으로 보여 주는 형식.',
  category: 'navigation',
  Preview: NavigationPreview,
  anatomy: {
    Specimen: NavigationSpecimen,
    parts: [
      { slot: 'nav-bar', name: 'Nav container', description: '메뉴 전체를 담는 띠. 화면 위·아래·옆에 붙음. 코드에서는 <nav>' },
      { slot: 'nav-logo', name: 'Logo', description: '서비스 이름. 누르면 보통 홈으로 감' },
      { slot: 'nav-item', name: 'Nav item', description: '다른 화면으로 가는 링크 하나' },
      { slot: 'nav-current', name: 'Current indicator', description: '지금 보고 있는 화면을 알리는 밑줄·배경. 코드에서는 aria-current="page"' },
      { slot: 'nav-badge', name: 'Badge', description: '새 소식 개수나 점. 메뉴 이름과 함께 읽히게 함' },
      { slot: 'nav-actions', name: 'Actions', description: '로그인·시작하기처럼 페이지 이동이 아닌 동작 버튼' },
      { slot: 'nav-menu-button', name: 'Menu button', description: '좁은 화면에서 접힌 메뉴를 여는 ☰ 버튼' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '메뉴 항목 하나가 가질 수 있는 모습입니다. 지금 보고 있는 페이지는 밑줄과 굵은 글씨로 표시하고, 마우스와 키보드로만 보이는 호버·포커스는 고정해서 그렸습니다. 새 소식 점과 아직 갈 수 없는 비활성 항목도 있습니다.',
      Demo: States,
    },
    {
      title: '상단 내비게이션 바',
      description:
        '화면 맨 위에 로고·메뉴 링크·로그인 같은 동작 버튼을 한 줄로 놓습니다. 메뉴가 대여섯 개 이하인 웹사이트에 쓰고, 메뉴가 많거나 깊으면 메가 메뉴나 사이드바가 낫습니다. 폭이 좁아지면 링크를 ☰ 안으로 접습니다. 링크를 눌러 현재 페이지 표시가 옮겨 가는지 보고, 좁은 화면으로 바꿔 ☰을 열어 보세요.',
      Demo: TopNavFormat,
    },
    {
      title: '햄버거 메뉴',
      description:
        '☰ 버튼을 누르면 옆에서 메뉴 판이 밀려 나옵니다. 화면이 좁아 메뉴를 늘 보여 줄 수 없을 때 쓰지만, 숨겨진 메뉴는 덜 눌리므로 자주 쓰는 곳은 하단 탭 바에 두는 편이 낫습니다. 열면 초점이 메뉴 안으로 들어가고, Esc·바깥 누르기·닫기 버튼으로 닫으면 ☰로 돌아옵니다. 세 가지 방법으로 닫아 보세요.',
      Demo: HamburgerFormat,
    },
    {
      title: '사이드 레일',
      description:
        '화면 왼쪽에 아이콘만 세로로 늘어놓은 좁은 띠입니다. 메일·캘린더처럼 넓은 화면에서 본문을 넓게 쓰는 데스크톱 앱에 쓰고, 휴대폰처럼 좁은 화면에서는 하단 탭 바가 낫습니다. 아이콘만으로 뜻이 안 통할 수 있으니 이름을 펼칠 수 있어야 합니다. 접힌 상태에서 아이콘에 마우스를 올려 이름을 보고, 맨 위 버튼으로 펼쳐 보세요.',
      Demo: SideRailFormat,
    },
    {
      title: '메가 메뉴',
      description:
        '메뉴를 누르면 화면 폭만큼 넓은 판에 링크를 묶음별 열로 펼치고, 옆에 추천 상자를 둡니다. 제품·서비스가 많은 큰 사이트에 쓰고, 링크가 몇 개 안 되면 평범한 드롭다운이면 충분합니다. 마우스를 올리기만 해서 열리면 터치와 키보드로 쓸 수 없으니 누르거나 Enter·↓로 엽니다. ↓로 열어 Tab으로 움직이고 Esc로 닫아 보세요.',
      Demo: MegaMenuFormat,
    },
    {
      title: '탭 내비게이션',
      description:
        '탭처럼 생겼지만 하나하나가 주소가 다른 페이지로 가는 링크입니다. 리뷰·문의처럼 따로 공유하거나 뒤로 가기로 돌아올 만한 내용에 씁니다. 같은 페이지 안에서 내용만 바꾸는 것은 내비게이션이 아니라 탭(Tabs) 컴포넌트입니다. 위쪽 링크를 눌러 주소와 뒤로 가기가 바뀌는지, 아래쪽 탭은 그대로인지 비교해 보세요.',
      Demo: TabNavFormat,
    },
    {
      title: '더보기 메뉴',
      description:
        '한 줄에 다 들어가지 않는 메뉴를 뒤에서부터 "더보기" 안으로 옮깁니다(Priority+ 내비게이션). 섹션이 많은 뉴스·쇼핑 사이트에 쓰고, 중요한 메뉴를 앞에 둬야 끝까지 보입니다. 메뉴가 몇 개뿐이면 접지 말고 다 보여 주는 편이 낫습니다. 폭을 줄여 메뉴가 하나씩 들어가는 것을 보고, 더보기 안의 항목을 골라 현재 표시가 더보기에 붙는지 보세요.',
      Demo: OverflowMenuFormat,
    },
    {
      title: '고정 헤더',
      description:
        '페이지를 내려도 머리글과 필터 줄이 화면 위에 붙어 있습니다(position: sticky). 목록이 길어 검색·장바구니·필터를 계속 써야 하는 쇼핑·게시판 페이지에 쓰고, 짧은 페이지나 읽기에 집중할 글에서는 화면만 가리니 쓰지 않는 편이 낫습니다. 내려가면 그림자로 내용과 구분하고, 화면이 좁으면 내릴 때 숨겼다가 올릴 때 다시 보여 줍니다. 목록을 내려 그림자가 생기는지 보고, 내리면 숨기기로 바꿔 위아래로 굴려 보세요.',
      Demo: StickyHeaderFormat,
    },
  ],
}
