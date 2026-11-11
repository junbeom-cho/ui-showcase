import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ShowcaseEntry } from '../types'

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

export const tabsEntry: ShowcaseEntry = {
  id: 'tabs',
  name: 'Tabs',
  aliases: ['Tab bar', 'Segmented control', '탭'],
  description: '같은 영역 안에서 여러 패널 중 하나를 골라 보여준다.',
  Preview: TabsPreview,
}
