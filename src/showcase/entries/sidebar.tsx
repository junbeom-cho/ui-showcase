import { useState, type CSSProperties, type ReactNode } from 'react'
import {
  ChevronRightIcon,
  FileTextIcon,
  HomeIcon,
  InboxIcon,
  PanelLeftIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { ShowcaseEntry } from '../types'

/**
 * Every demo uses collapsible="none" so the sidebar renders as a plain column
 * inside its frame instead of the page-fixed panel, and stays narrow on phones.
 */
function Frame({ width, children, className }: { width: string; children: ReactNode; className?: string }) {
  return (
    <SidebarProvider
      className={cn('min-h-0 w-full max-w-md overflow-hidden rounded-lg border bg-background', className)}
      style={{ '--sidebar-width': width } as CSSProperties}
    >
      {children}
    </SidebarProvider>
  )
}

function SidebarPreview() {
  return (
    <Frame width="8rem">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {['홈', '검색', '설정'].map((label, i) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton isActive={i === 0}>{label}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-3 text-xs text-muted-foreground">본문 영역</div>
    </Frame>
  )
}

function SidebarSpecimen() {
  return (
    <Frame width="11rem" className="h-72">
      <Sidebar collapsible="none">
        <SidebarHeader className="px-4 py-3 text-sm font-semibold">메일</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>보관함</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <InboxIcon />
                  받은 편지
                </SidebarMenuButton>
                <SidebarMenuBadge>12</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FileTextIcon />
                  임시 저장
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 py-3 text-xs text-muted-foreground">me@mail.com</SidebarFooter>
      </Sidebar>
      <div className="flex-1 p-4 text-xs text-muted-foreground">본문 영역</div>
    </Frame>
  )
}

const pages = [
  { id: 'home', label: '홈', icon: HomeIcon },
  { id: 'search', label: '검색', icon: SearchIcon },
  { id: 'inbox', label: '받은 편지', icon: InboxIcon },
  { id: 'settings', label: '설정', icon: SettingsIcon },
]

function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <Frame width={collapsed ? '3rem' : '10rem'} className="h-60 [&_[data-slot=sidebar]]:motion-safe:transition-[width]">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {pages.map((page, i) => (
                <SidebarMenuItem key={page.id}>
                  <SidebarMenuButton isActive={i === 0} aria-label={page.label}>
                    <page.icon />
                    {!collapsed && page.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-3">
        <Button variant="outline" size="sm" onClick={() => setCollapsed((c) => !c)}>
          <PanelLeftIcon />
          {collapsed ? '펼치기' : '접기'}
        </Button>
      </div>
    </Frame>
  )
}

function ActiveItemSidebar() {
  const [current, setCurrent] = useState('home')
  const page = pages.find((p) => p.id === current)!
  return (
    <Frame width="9rem" className="h-56">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {pages.map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton isActive={p.id === current} onClick={() => setCurrent(p.id)}>
                    <p.icon />
                    {p.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-4">
        <p className="text-sm font-semibold">{page.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">메뉴를 누르면 이 영역이 바뀝니다.</p>
      </div>
    </Frame>
  )
}

function NestedSidebar() {
  const [open, setOpen] = useState(true)
  return (
    <Frame width="11rem" className="h-60">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>문서</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                  <FileTextIcon />
                  시작하기
                  <ChevronRightIcon className={cn('ml-auto motion-safe:transition-transform', open && 'rotate-90')} />
                </SidebarMenuButton>
                {open && (
                  <SidebarMenuSub>
                    {['설치', '첫 화면', '배포'].map((label, i) => (
                      <SidebarMenuSubItem key={label}>
                        <SidebarMenuSubButton isActive={i === 0}>{label}</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <SettingsIcon />
                  설정
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-4 text-xs text-muted-foreground">본문 영역</div>
    </Frame>
  )
}

/** One sidebar whose menu items are named after the state each one shows. */
function States() {
  return (
    <Frame width="12rem" className="h-72">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴 항목의 상태</SidebarGroupLabel>
            <SidebarMenu aria-label="상태 모음">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <HomeIcon />
                  기본
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton data-demo-state="hover">
                  <SearchIcon />
                  호버
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <InboxIcon />
                  선택됨 (지금 위치)
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton data-demo-state="focus">
                  <FileTextIcon />
                  포커스
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <SettingsIcon />
                  비활성
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <InboxIcon />
                  배지 포함
                </SidebarMenuButton>
                <SidebarMenuBadge>12</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-4 text-xs text-muted-foreground">본문 영역</div>
    </Frame>
  )
}

export const sidebarEntry: ShowcaseEntry = {
  id: 'sidebar',
  name: 'Sidebar',
  aliases: ['Side navigation', 'Side nav', '사이드바'],
  description: '화면 한쪽에 세로로 붙어 있는 내비게이션 영역. 메뉴나 섹션 이동에 쓴다.',
  category: 'layout',
  Preview: SidebarPreview,
  anatomy: {
    Specimen: SidebarSpecimen,
    parts: [
      { slot: 'sidebar', name: 'Sidebar', description: '세로 메뉴 영역 전체' },
      { slot: 'sidebar-header', name: 'SidebarHeader', description: '로고나 앱 이름이 놓이는 맨 위' },
      { slot: 'sidebar-group-label', name: 'SidebarGroupLabel', description: '메뉴 묶음의 제목' },
      { slot: 'sidebar-menu-button', name: 'SidebarMenuButton', description: '누르면 이동하는 메뉴 한 줄' },
      { slot: 'sidebar-menu-badge', name: 'SidebarMenuBadge', description: '메뉴 오른쪽의 개수 표시' },
      { slot: 'sidebar-footer', name: 'SidebarFooter', description: '계정 정보 등이 놓이는 맨 아래' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '메뉴 항목 하나가 가질 수 있는 상태입니다. 항목 이름이 곧 그 항목이 보여주는 상태입니다.',
      Demo: States,
    },
    {
      title: '현재 위치 표시',
      description: '지금 보고 있는 메뉴를 강조합니다. 메뉴를 눌러 오른쪽 내용이 바뀌는 것을 확인하세요.',
      Demo: ActiveItemSidebar,
    },
    {
      title: '아이콘만 남기고 접기',
      description: '화면을 넓게 쓰고 싶을 때 사이드바를 아이콘 너비로 줄입니다.',
      Demo: CollapsibleSidebar,
    },
    {
      title: '하위 메뉴',
      description: '메뉴 아래에 한 단계 더 들어간 항목을 펼치고 접습니다.',
      Demo: NestedSidebar,
    },
  ],
}
