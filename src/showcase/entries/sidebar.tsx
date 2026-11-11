import type { CSSProperties } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import type { ShowcaseEntry } from '../types'

function SidebarPreview() {
  return (
    // collapsible="none" renders a plain div instead of the page-fixed panel,
    // and the narrow width keeps it inside the card on mobile.
    <SidebarProvider
      className="min-h-0 w-full overflow-hidden rounded-md border"
      style={{ '--sidebar-width': '8rem' } as CSSProperties}
    >
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
    </SidebarProvider>
  )
}

export const sidebarEntry: ShowcaseEntry = {
  id: 'sidebar',
  name: 'Sidebar',
  aliases: ['Side navigation', 'Side nav', '사이드바'],
  description: '화면 한쪽에 세로로 붙어 있는 내비게이션 영역. 메뉴나 섹션 이동에 쓴다.',
  Preview: SidebarPreview,
}
