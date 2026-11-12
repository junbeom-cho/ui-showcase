import { useState } from 'react'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIcon,
  LogOutIcon,
  SettingsIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ShowcaseEntry } from '../types'

const itemClass = 'relative flex items-center gap-1.5 rounded-md py-1 pr-2 pl-7 text-sm'

/** Static drawing of an open menu whose items are named after the state each one shows. */
function States() {
  return (
    <div className="w-60 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">메뉴 항목의 상태</p>
      <ul aria-label="상태 모음" className="flex flex-col">
        <li className={itemClass}>기본</li>
        <li className={`${itemClass} bg-accent text-accent-foreground`}>강조 (호버·방향키)</li>
        <li className={`${itemClass} opacity-50`}>비활성</li>
        <li className={itemClass}>
          <CheckIcon className="absolute left-2 size-4" />
          체크됨
        </li>
        <li className={itemClass}>
          <CircleIcon className="absolute left-2.5 size-2 fill-current" />
          라디오 선택
        </li>
        <li className={`${itemClass} text-destructive`}>
          <TrashIcon className="absolute left-2 size-4" />
          위험한 동작
        </li>
        <li className={itemClass}>
          단축키
          <span className="ml-auto text-xs tracking-widest text-muted-foreground">⌘S</span>
        </li>
        <li className={itemClass}>
          하위 메뉴
          <ChevronRightIcon className="ml-auto size-4" />
        </li>
      </ul>
    </div>
  )
}

function DropdownMenuPreview() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">메뉴 열기</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>프로필</DropdownMenuItem>
        <DropdownMenuItem>설정</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>로그아웃</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Static drawing of an open menu; a live one would portal to <body>. */
function DropdownMenuSpecimen() {
  const item = 'flex items-center gap-2 rounded-md px-1.5 py-1'
  return (
    <div className="flex w-52 flex-col items-start gap-1.5">
      <Button variant="outline" size="sm" data-slot="dropdown-menu-trigger" tabIndex={-1}>
        내 계정
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <div
        data-slot="dropdown-menu-content"
        className="flex w-full flex-col rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
      >
        <p data-slot="dropdown-menu-label" className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
          kim@mail.com
        </p>
        <div data-slot="dropdown-menu-item" className={`${item} bg-accent`}>
          <UserIcon className="size-4" />
          프로필
          <span data-slot="dropdown-menu-shortcut" className="ml-auto text-xs tracking-widest text-muted-foreground">
            ⇧P
          </span>
        </div>
        <div className={item}>
          <SettingsIcon className="size-4" />
          설정
        </div>
        <div data-slot="dropdown-menu-separator" className="-mx-1 my-1 h-px bg-border" />
        <div className={`${item} text-destructive`}>
          <LogOutIcon className="size-4" />
          로그아웃
        </div>
      </div>
    </div>
  )
}

function AccountMenu() {
  const [last, setLast] = useState<string | null>(null)
  const pick = (label: string) => () => setLast(label)
  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            내 계정
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>kim@mail.com</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={pick('프로필')}>
              <UserIcon />
              프로필
              <DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={pick('설정')}>
              <SettingsIcon />
              설정
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={pick('로그아웃')}>
            <LogOutIcon />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last ? `"${last}"을(를) 골랐습니다.` : '항목을 고르면 메뉴가 닫힙니다. 방향키로도 움직일 수 있습니다.'}
      </p>
    </div>
  )
}

const columns = ['이름', '이메일', '가입일', '등급']

function CheckAndRadio() {
  const [visible, setVisible] = useState(['이름', '이메일'])
  const [sort, setSort] = useState('newest')
  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">보기 설정</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuLabel>보일 열</DropdownMenuLabel>
          {columns.map((col) => (
            <DropdownMenuCheckboxItem
              key={col}
              checked={visible.includes(col)}
              onCheckedChange={(checked) =>
                setVisible((v) => (checked ? [...v, col] : v.filter((x) => x !== col)))
              }
              onSelect={(event) => event.preventDefault()}
            >
              {col}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>정렬</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuRadioItem value="newest">최신순</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">이름순</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground">
        열: {visible.length > 0 ? visible.join(', ') : '없음'}, 정렬: {sort === 'newest' ? '최신순' : '이름순'}
      </p>
    </div>
  )
}

function SubMenu() {
  const [shared, setShared] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">파일</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuItem>새로 만들기</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>공유</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {['이메일', '링크 복사', '메신저'].map((way) => (
                <DropdownMenuItem key={way} onSelect={() => setShared(way)}>
                  {way}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>인쇄 (준비 중)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {shared ? `${shared}로 공유했습니다.` : '"공유"에 마우스를 올리면 하위 메뉴가 열립니다.'}
      </p>
    </div>
  )
}

export const dropdownMenuEntry: ShowcaseEntry = {
  id: 'dropdown-menu',
  name: 'Dropdown Menu',
  aliases: ['Menu', 'Popup menu', '드롭다운 메뉴'],
  description: '버튼을 누르면 아래로 펼쳐지는 동작 목록.',
  category: 'overlay',
  Preview: DropdownMenuPreview,
  anatomy: {
    Specimen: DropdownMenuSpecimen,
    parts: [
      { slot: 'dropdown-menu-trigger', name: 'DropdownMenuTrigger', description: '누르면 메뉴를 여는 버튼' },
      { slot: 'dropdown-menu-content', name: 'DropdownMenuContent', description: '펼쳐지는 메뉴 상자' },
      { slot: 'dropdown-menu-label', name: 'DropdownMenuLabel', description: '눌리지 않는 제목 글' },
      { slot: 'dropdown-menu-item', name: 'DropdownMenuItem', description: '고를 수 있는 항목 한 줄' },
      { slot: 'dropdown-menu-shortcut', name: 'DropdownMenuShortcut', description: '같은 동작의 단축키 안내' },
      { slot: 'dropdown-menu-separator', name: 'DropdownMenuSeparator', description: '항목 묶음 사이의 선' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '메뉴 항목이 가질 수 있는 상태를 열린 메뉴 하나에 모았습니다. 항목 이름이 곧 그 항목의 상태입니다.',
      Demo: States,
    },
    {
      title: '계정 메뉴',
      description: '아이콘·단축키·위험 항목을 갖춘 흔한 형태입니다. 항목을 골라 보세요.',
      Demo: AccountMenu,
    },
    {
      title: '체크와 라디오 항목',
      description: '여러 개를 켜고 끄는 항목과, 하나만 고르는 항목을 한 메뉴에 섞을 수 있습니다.',
      Demo: CheckAndRadio,
    },
    {
      title: '하위 메뉴와 비활성 항목',
      description: '항목 안에 한 단계 더 들어가는 메뉴를 두고, 지금 쓸 수 없는 항목은 흐리게 둡니다.',
      Demo: SubMenu,
    },
  ],
}
