import { useId, type ReactNode } from 'react'
import { CheckCircle2Icon, HeartIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ICON_NAMES, StyleIcon, iconLabel } from './style-icon'

function Sample({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className ? `gap-4 px-5 ${className}` : 'gap-4 px-5'}>
      <h3 className="font-semibold">{title}</h3>
      {children}
    </Card>
  )
}

/**
 * Everyday components drawn in the current style (D-018). They are the same
 * shadcn parts as the UI component pages; the style page's scope dresses them.
 */
export function StyleSamples({ styleId }: { styleId: string }) {
  const uid = useId()

  return (
    <section aria-labelledby={`${uid}-title`} className="flex flex-col gap-4">
      <h2 id={`${uid}-title`} className="text-2xl font-semibold tracking-tight text-ink">
        이 스타일로 그린 컴포넌트
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Sample title="버튼">
          <div className="flex flex-wrap gap-2">
            <Button>저장</Button>
            <Button variant="outline">취소</Button>
            <Button variant="secondary">미리보기</Button>
            <Button variant="ghost">더 보기</Button>
            <Button variant="destructive">삭제</Button>
            <Button size="icon" variant="outline" aria-label="좋아요">
              <HeartIcon />
            </Button>
          </div>
        </Sample>

        <Sample title="아이콘" className="md:col-span-2 xl:col-span-2">
          <ul aria-label="아이콘 모음" className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6">
            {ICON_NAMES.map((name) => (
              <li key={name} className="flex flex-col items-center gap-2 text-xs">
                <StyleIcon name={name} styleId={styleId} decorative />
                {iconLabel(name)}
              </li>
            ))}
          </ul>
        </Sample>

        <Sample title="배지와 아바타">
          <div className="flex flex-wrap gap-2">
            <Badge>새 글</Badge>
            <Badge variant="secondary">진행 중</Badge>
            <Badge variant="outline">초안</Badge>
            <Badge variant="destructive">오류</Badge>
          </div>
          <AvatarGroup>
            {['가', '나', '다'].map((n) => (
              <Avatar key={n} size="lg">
                <AvatarFallback>{n}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount className="size-10">+5</AvatarGroupCount>
          </AvatarGroup>
        </Sample>

        <Sample title="입력">
          <Input aria-label="이메일" placeholder="이메일" />
          <div className="flex items-center gap-2">
            <Checkbox id={`${uid}-agree`} defaultChecked />
            <Label htmlFor={`${uid}-agree`}>약관에 동의합니다</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id={`${uid}-alerts`} defaultChecked />
            <Label htmlFor={`${uid}-alerts`}>알림 받기</Label>
          </div>
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">계정</TabsTrigger>
              <TabsTrigger value="alerts">알림</TabsTrigger>
              <TabsTrigger value="security">보안</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="pt-1 opacity-80">계정 정보를 바꿉니다.</TabsContent>
            <TabsContent value="alerts" className="pt-1 opacity-80">알림 방식을 고릅니다.</TabsContent>
            <TabsContent value="security" className="pt-1 opacity-80">비밀번호를 바꿉니다.</TabsContent>
          </Tabs>
        </Sample>

        <Sample title="알림과 진행">
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>저장했습니다</AlertTitle>
            <AlertDescription>다른 사람에게는 1분 안에 반영됩니다.</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span>업로드</span>
              <span className="tabular-nums">45%</span>
            </div>
            <Progress value={45} aria-label="업로드 45%" />
          </div>
        </Sample>
      </div>
    </section>
  )
}
