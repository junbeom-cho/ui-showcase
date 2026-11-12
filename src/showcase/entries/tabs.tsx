import type { ComponentProps } from 'react'
import { BellIcon, CreditCardIcon, UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

/** One tab in its own list, so each cell shows exactly one state. */
function OneTab({ selected = false, ...props }: { selected?: boolean } & ComponentProps<typeof TabsTrigger>) {
  return (
    <Tabs value={selected ? props.value : '__none'}>
      <TabsList>
        <TabsTrigger {...props}>알림</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '선택됨', node: <OneTab value="a" selected /> },
        { label: '선택 안 됨', node: <OneTab value="a" /> },
        { label: '호버', node: <OneTab value="a" data-demo-state="hover" /> },
        { label: '포커스', node: <OneTab value="a" data-demo-state="focus" /> },
        { label: '비활성', node: <OneTab value="a" disabled /> },
        {
          label: '밑줄형 선택됨',
          node: (
            <Tabs value="a">
              <TabsList variant="line">
                <TabsTrigger value="a">알림</TabsTrigger>
              </TabsList>
            </Tabs>
          ),
        },
      ]}
    />
  )
}

function TabsPreview() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-56">
      <TabsList>
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="text-sm">
        계정 정보를 수정합니다.
      </TabsContent>
      <TabsContent value="password" className="text-sm">
        비밀번호를 변경합니다.
      </TabsContent>
    </Tabs>
  )
}

function TabsSpecimen() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-72">
      <TabsList>
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="reviews">리뷰</TabsTrigger>
        <TabsTrigger value="qna">문의</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        선택된 탭의 내용만 이 자리에 보입니다.
      </TabsContent>
    </Tabs>
  )
}

function FormTabs() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-80">
      <TabsList className="w-full">
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <Label htmlFor="tabs-name">이름</Label>
        <Input id="tabs-name" defaultValue="홍길동" />
        <Button size="sm" className="self-start">저장</Button>
      </TabsContent>
      <TabsContent value="password" className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <Label htmlFor="tabs-password">새 비밀번호</Label>
        <Input id="tabs-password" type="password" />
        <Button size="sm" className="self-start">변경</Button>
      </TabsContent>
    </Tabs>
  )
}

function LineTabs() {
  const items = [
    { value: 'all', label: '전체', body: '모든 글 128개' },
    { value: 'popular', label: '인기', body: '이번 주 인기 글 12개' },
    { value: 'saved', label: '저장', body: '저장한 글 5개' },
  ]
  return (
    <Tabs defaultValue="all" className="w-full max-w-80">
      <TabsList variant="line">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="pt-2 text-sm text-muted-foreground">
          {item.body}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function VerticalTabs() {
  const items = [
    { value: 'profile', label: '프로필', icon: UserIcon, body: '사진과 소개 글을 바꿉니다.' },
    { value: 'alerts', label: '알림', icon: BellIcon, body: '어떤 알림을 받을지 고릅니다.', count: 3 },
    { value: 'billing', label: '결제', icon: CreditCardIcon, body: '카드와 영수증을 관리합니다.' },
  ]
  return (
    <Tabs defaultValue="profile" orientation="vertical" className="w-full max-w-96 flex-row">
      <TabsList>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="w-full justify-start">
            <item.icon />
            {item.label}
            {item.count && (
              <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                {item.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="rounded-lg border bg-background p-4 text-sm">
          <p className="font-medium">{item.label}</p>
          <p className="mt-1 text-muted-foreground">{item.body}</p>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export const tabsEntry: ShowcaseEntry = {
  id: 'tabs',
  name: 'Tabs',
  aliases: ['Tab bar', 'Segmented control', '탭'],
  description: '같은 영역 안에서 여러 패널 중 하나를 골라 보여준다.',
  category: 'navigation',
  Preview: TabsPreview,
  anatomy: {
    Specimen: TabsSpecimen,
    parts: [
      { slot: 'tabs-list', name: 'TabsList', description: '탭 버튼들을 담는 줄' },
      { slot: 'tabs-trigger', name: 'TabsTrigger', description: '누르면 해당 패널을 여는 탭 하나' },
      { slot: 'tabs-content', name: 'TabsContent', description: '선택된 탭의 내용 패널' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '탭 하나가 가질 수 있는 상태입니다. 선택된 탭만 바탕이 채워지고, 호버하면 글자가 진해집니다.',
      Demo: States,
    },
    {
      title: '설정 화면 나누기',
      description: '계정과 비밀번호처럼 성격이 다른 폼을 한 자리에서 탭으로 바꿔 보여줍니다.',
      Demo: FormTabs,
    },
    {
      title: '밑줄형 탭',
      description: '배경 없이 선택된 탭 아래에만 선을 그어, 목록 필터처럼 가볍게 씁니다.',
      Demo: LineTabs,
    },
    {
      title: '세로 탭',
      description: '탭이 많거나 설정 메뉴처럼 쓸 때는 왼쪽에 세로로 세웁니다. 방향키로도 옮겨 다닐 수 있습니다.',
      Demo: VerticalTabs,
    },
  ],
}
