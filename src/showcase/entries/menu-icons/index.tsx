import { useState } from 'react'
import { MenuIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  BentoFormat,
  DonerFormat,
  HamburgerFormat,
  KebabFormat,
  MeatballsFormat,
  SlidersFormat,
  StairsFormat,
  VeggieBurgerFormat,
  WaffleFormat,
} from './formats'
import { MENU_ICONS, MenuIconButton } from './parts'

// pictures of a button, kept out of the tab order
const drawing = { icon: MenuIcon, label: '메뉴 열기', tabIndex: -1 } as const

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <MenuIconButton {...drawing} /> },
        { label: '호버', node: <MenuIconButton {...drawing} data-demo-state="hover" /> },
        { label: '눌림', node: <MenuIconButton {...drawing} data-demo-state="hover active" /> },
        { label: '포커스', node: <MenuIconButton {...drawing} data-demo-state="focus" /> },
        { label: '열림', node: <MenuIconButton {...drawing} aria-haspopup="dialog" aria-expanded /> },
        { label: '알림 점', node: <MenuIconButton {...drawing} badge="새 소식 있음" /> },
      ]}
    />
  )
}

/** 10. All nine next to each other; pick one to read what it opens. */
function CompareFormat() {
  const [picked, setPicked] = useState('')
  const icon = MENU_ICONS.find((i) => i.id === picked)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <ul aria-label="메뉴 아이콘 9가지" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MENU_ICONS.map(({ id, no, ko, en, Glyph, opens }) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={id === picked}
              onClick={() => setPicked(id === picked ? '' : id)}
              className={cn(
                'flex h-full w-full items-start gap-3 rounded-lg border bg-background p-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                'aria-pressed:border-foreground aria-pressed:bg-muted',
              )}
            >
              <Glyph aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  <span className="text-muted-foreground tabular-nums">{no}</span> {ko}
                </span>
                <span className="text-xs text-muted-foreground">{en}</span>
                <span className="text-xs">{opens}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="text-sm text-muted-foreground">
        {icon
          ? `고른 아이콘: ${icon.no} ${icon.ko}(${icon.en}) — 누르면 ${icon.opens}, 버튼 이름은 “${icon.label}”`
          : '아이콘을 하나 골라 보세요.'}
      </p>
    </div>
  )
}

function MenuIconsSpecimen() {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* the label drawn as an always-open tooltip */}
      <span data-slot="menu-icon-label" className="rounded-md bg-foreground px-2 py-1 text-xs text-background">
        메뉴 열기
      </span>
      <MenuIconButton slots icon={MenuIcon} label="메뉴 열기" badge="새 소식 있음" variant="outline" size="icon-lg" tabIndex={-1} />
    </div>
  )
}

function MenuIconsPreview() {
  return (
    <div aria-hidden className="grid grid-cols-3 gap-1.5">
      {MENU_ICONS.map(({ id, Glyph }) => (
        <span key={id} className="grid size-8 place-items-center rounded-md border bg-background">
          <Glyph className="size-4" />
        </span>
      ))}
    </div>
  )
}

export const menuIconsEntry: ShowcaseEntry = {
  id: 'menu-icons',
  name: 'Menu Icons',
  aliases: [
    'Hamburger menu',
    'Kebab menu',
    'Meatballs menu',
    'Waffle menu',
    'Bento menu',
    'Döner menu',
    'Doner menu',
    'Veggie burger',
    'Stairs',
    'Sliders icon',
    'App launcher',
    'More menu',
    'Three dots',
    'Icon button',
    '메뉴 아이콘',
    '햄버거 메뉴',
    '케밥 메뉴',
    '미트볼 메뉴',
    '와플 메뉴',
    '벤토 메뉴',
    '도너 메뉴',
    '베지 버거',
    '계단 아이콘',
    '슬라이더 아이콘',
    '앱 런처',
    '점 세 개',
  ],
  description: '햄버거·케밥·미트볼·와플처럼 별명으로 불리는 메뉴 아이콘이 각각 어떤 모양이고 누르면 무엇을 여는지 보여 주는 모음.',
  category: 'navigation',
  Preview: MenuIconsPreview,
  anatomy: {
    Specimen: MenuIconsSpecimen,
    parts: [
      { slot: 'menu-icon-button', name: 'Icon button', description: '그림만 있는 버튼. 그림보다 누르는 영역을 넓게(최소 32px, 터치는 44px) 잡음' },
      { slot: 'menu-icon-glyph', name: 'Glyph', description: '줄·점·네모로 그린 아이콘. 뜻은 이름이 전하므로 화면 읽기 프로그램에는 숨김(aria-hidden)' },
      {
        slot: 'menu-icon-label',
        name: 'Label',
        description: '툴팁과 aria-label로 주는 버튼 이름. 모양 별명(햄버거)이 아니라 하는 일(메뉴 열기)로 지음',
      },
      { slot: 'menu-icon-badge', name: 'Badge', description: '새 소식이 있다는 점. 이름에 “새 소식 있음”을 덧붙여 소리로도 알림' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '햄버거 버튼 하나가 가질 수 있는 모습입니다. 마우스와 키보드로만 보이는 호버·눌림·포커스는 고정해서 그렸고, 메뉴가 열려 있는 동안에는 aria-expanded로 열림을 알리며 배경이 남습니다. 새 소식 점은 이름에도 붙여 소리로 들리게 합니다.',
      Demo: States,
    },
    {
      title: '햄버거',
      description:
        '같은 길이의 줄 세 개(☰)로, 누르면 옆에서 내비게이션 서랍이 나옵니다. 화면이 좁아 메뉴를 늘 보여 줄 수 없을 때 쓰지만, 숨긴 메뉴는 덜 눌리므로 자주 가는 곳이 서너 개뿐이면 하단 탭 바가 낫습니다. ☰을 눌러 서랍을 열고, 화면을 골라 보거나 Esc·바깥 누르기·닫기 버튼으로 닫아 초점이 ☰로 돌아오는지 보세요.',
      Demo: HamburgerFormat,
    },
    {
      title: '케밥',
      description:
        '세로로 선 점 세 개(⋮)로, 그 줄이나 앱 바에만 해당하는 더보기 메뉴를 엽니다. 안드로이드 앱 바와 파일·표의 각 줄 끝에 흔하고, 자주 쓰는 동작은 숨기지 말고 밖에 버튼으로 꺼내 두는 편이 낫습니다. 줄마다 이름이 달라야 하므로 “기획서.pdf 더보기”처럼 짓습니다. 파일을 즐겨찾기하거나 삭제해 보세요.',
      Demo: KebabFormat,
    },
    {
      title: '미트볼',
      description:
        '가로로 누운 점 세 개(⋯)로, 카드나 게시물 모서리에서 저장·링크 복사·숨기기·신고 같은 동작을 엽니다. 케밥과 하는 일은 같고 놓이는 자리와 플랫폼 습관(iOS·웹)이 다를 뿐이니 한 화면에서는 한 가지만 씁니다. 저장하고, 글을 숨겼다가 되돌려 보세요.',
      Demo: MeatballsFormat,
    },
    {
      title: '와플',
      description:
        '점 9개를 3×3으로 놓은 모양으로, 같은 회사의 다른 앱으로 건너가는 앱 런처를 엽니다. 서비스가 여러 앱으로 나뉜 메일·오피스 도구에 쓰고, 한 앱 안의 화면 이동에는 쓰지 않습니다. 런처를 열어 다른 앱으로 바꾸면 주소와 제목이 바뀌는지 보세요.',
      Demo: WaffleFormat,
    },
    {
      title: '벤토',
      description:
        '네모 9개를 3×3으로 놓은 모양으로, 칸칸이 나뉜 도시락처럼 바로가기나 카테고리 판을 엽니다. 솔직히 와플과 벤토는 글마다 이름이 엇갈려서, 점 9개를 벤토라 부르거나 네모 9개를 와플이라 부르는 곳도 있습니다. 그래서 별명보다 “전체 카테고리”처럼 하는 일을 이름으로 붙여야 합니다. 판을 열어 카테고리를 골라 보세요.',
      Demo: BentoFormat,
    },
    {
      title: '도너',
      description:
        '아래로 갈수록 짧아지는 가운데 맞춘 줄 세 개로, 깔때기 모양이라 필터를 엽니다. 목록을 조건으로 좁힐 때 쓰고, 순서만 바꾸는 정렬은 계단 아이콘이 맞습니다. 필터가 걸려 있으면 점으로 알려 줘야 목록이 왜 줄었는지 압니다. 종류를 고르고 품절을 빼서 상품 수와 점이 바뀌는지 보세요.',
      Demo: DonerFormat,
    },
    {
      title: '베지 버거',
      description:
        '줄 두 개로, 항목이 몇 개 안 되는 짧은 메뉴를 여는 데 쓰는 덜 흔한 햄버거입니다. 목록 줄 앞의 끌기 손잡이도 같은 모양이라 헷갈리기 쉬우니, 메뉴라면 화면 위 구석에, 손잡이라면 줄 안에 두고 이름으로 구분합니다. 위쪽 =로 메뉴를 열고, 목록 손잡이에 초점을 둔 채 ↑↓ 키로 순서를 바꿔 보세요.',
      Demo: VeggieBurgerFormat,
    },
    {
      title: '계단',
      description:
        '왼쪽에 맞춰 계단처럼 짧아지는 줄로, 정렬 순서를 엽니다. 거르지 않고 순서만 바꿀 때 쓰고, 지금 어떤 순서인지 이름에 담아 둡니다. 화살표가 붙은 정렬 아이콘이 더 분명할 때도 많습니다. 낮은 가격순·이름순으로 바꿔 맨 위 상품이 달라지는지 보세요.',
      Demo: StairsFormat,
    },
    {
      title: '슬라이더',
      description:
        '손잡이가 달린 가로줄 세 개로, 값을 조금씩 맞추는 설정이나 세부 필터를 엽니다. 크기·밝기·가격 범위처럼 정도를 조절할 때 쓰고, 켜고 끄기만 있으면 스위치나 체크박스면 됩니다. 글자 크기와 줄 간격을 움직여 기사가 바뀌는지 보고 기본값으로 되돌려 보세요.',
      Demo: SlidersFormat,
    },
    {
      title: '한눈에 비교',
      description:
        '아홉 가지를 나란히 놓고 별명·영어 이름·누르면 여는 것을 비교합니다. 줄은 메뉴·필터·정렬, 점 세 개는 더보기, 점·네모 9개는 앱이나 바로가기 판이라는 큰 갈래만 기억하면 됩니다. 별명은 디자이너끼리 부르는 말일 뿐 사용자에게 보이는 이름은 하는 일이어야 합니다. 카드를 눌러 버튼 이름이 무엇이어야 하는지 보세요.',
      Demo: CompareFormat,
    },
  ],
}
