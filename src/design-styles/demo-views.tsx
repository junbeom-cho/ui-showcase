import { useId, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StyleIcon } from './style-icon'

export type Project = { id: number; name: string; status: string; progress: number }

export const INITIAL_PROJECTS: Project[] = [
  { id: 1, name: '웹사이트 리뉴얼', status: '진행 중', progress: 64 },
  { id: 2, name: '모바일 앱 출시', status: '검토 중', progress: 88 },
  { id: 3, name: '브랜드 가이드', status: '완료', progress: 100 },
]

export const filterProjects = (projects: Project[], query: string) =>
  projects.filter((p) => p.name.includes(query.trim()))

type Period = 'day' | 'week' | 'month'

const PERIOD_NAMES: Record<Period, string> = { day: '오늘', week: '이번 주', month: '이번 달' }

const STATS: Record<Period, { label: string; value: string; change: string }[]> = {
  day: [
    { label: '방문자', value: '1,284', change: '+3.1%' },
    { label: '가입', value: '37', change: '+0.8%' },
    { label: '매출', value: '₩420K', change: '-1.2%' },
  ],
  week: [
    { label: '방문자', value: '12,480', change: '+8.2%' },
    { label: '가입', value: '342', change: '-2.1%' },
    { label: '매출', value: '₩4.2M', change: '+12.5%' },
  ],
  month: [
    { label: '방문자', value: '48,920', change: '+15.4%' },
    { label: '가입', value: '1,310', change: '+4.6%' },
    { label: '매출', value: '₩16.8M', change: '+9.8%' },
  ],
}

function ProjectList({ projects, query }: { projects: Project[]; query: string }) {
  if (projects.length === 0) {
    return <p className="py-2 opacity-75">'{query.trim()}'와 일치하는 프로젝트가 없습니다.</p>
  }
  return (
    <ul className="flex flex-col gap-3">
      {projects.map((p) => (
        <li key={p.id} aria-label={`${p.name} 프로젝트`} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{p.name}</span>
            <Badge variant="secondary">{p.status}</Badge>
          </div>
          <Progress value={p.progress} aria-label={`${p.name} 진행률 ${p.progress}%`} />
        </li>
      ))}
    </ul>
  )
}

export function NewProjectDialog({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const id = useId()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setName('')
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />새 프로젝트
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            onCreate(name.trim())
            setOpen(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>새 프로젝트</DialogTitle>
            <DialogDescription>만들면 최근 프로젝트 맨 위에 추가됩니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-name`}>프로젝트 이름</Label>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 여름 캠페인"
            />
          </div>
          <DialogFooter>
            {/* a plain button: DialogClose asChild would replace data-slot="button", which the styles target */}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const NOTIFICATIONS = ['웹사이트 리뉴얼에 댓글 2개', '모바일 앱 출시 검토 요청', '브랜드 가이드 완료']

export function NotificationsMenu({ styleId, unread, onReadAll }: {
  styleId: string
  unread: number
  onReadAll: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={unread > 0 ? `알림 ${unread}개` : '알림'}
        className="relative ml-auto flex shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <StyleIcon name="bell" styleId={styleId} slot="demo-icon-bell" />
        {unread > 0 && (
          <Badge className="absolute -top-2 -right-2.5 h-4 min-w-4 px-1 text-[10px]">{unread}</Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>알림</DropdownMenuLabel>
        {NOTIFICATIONS.map((text, i) => (
          <DropdownMenuItem key={text} className={i < unread ? 'font-medium' : 'opacity-70'}>
            {text}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReadAll} disabled={unread === 0}>
          모두 읽음으로 표시
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type Settings = { notify: boolean; backup: boolean }

export function HomeView({
  styleId,
  projects,
  query,
  onCreate,
  settings,
  onSettingsChange,
  notice,
  onSave,
  onCancel,
}: {
  styleId: string
  projects: Project[]
  query: string
  onCreate: (name: string) => void
  settings: Settings
  onSettingsChange: (s: Settings) => void
  /** Short message after save or cancel; empty when there is nothing to say. */
  notice: string
  onSave: () => void
  onCancel: () => void
}) {
  const [period, setPeriod] = useState<Period>('week')
  const uid = useId()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">안녕하세요, 김하늘님</h3>
          <p className="opacity-75">{PERIOD_NAMES[period]} 진행 상황입니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              {(Object.keys(PERIOD_NAMES) as Period[]).map((p) => (
                <TabsTrigger key={p} value={p}>
                  {PERIOD_NAMES[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <NewProjectDialog onCreate={onCreate} />
        </div>
      </div>

      <div className="grid gap-3 @lg:grid-cols-3">
        {STATS[period].map((s) => (
          <Card key={s.label} size="sm" className="px-4">
            <div className="flex items-center justify-between">
              <span className="opacity-75">{s.label}</span>
              <Badge variant="outline">{s.change}</Badge>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 @4xl:grid-cols-[1.4fr_1fr]">
        <Card className="gap-3 px-5">
          <h4 className="font-semibold">최근 프로젝트</h4>
          <ProjectList projects={filterProjects(projects, query)} query={query} />
        </Card>

        <Card className="gap-4 px-5">
          <h4 className="font-semibold">설정</h4>
          <div className="flex items-center gap-3">
            <Label htmlFor={`${uid}-notify`} className="flex-1">
              알림 받기
            </Label>
            <Switch
              id={`${uid}-notify`}
              checked={settings.notify}
              onCheckedChange={(notify) => onSettingsChange({ ...settings, notify })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <StyleIcon name="cloud" styleId={styleId} slot="demo-icon-cloud" />
              <Label htmlFor={`${uid}-backup`} className="flex-1">
                자동 백업
              </Label>
              <Switch
                id={`${uid}-backup`}
                checked={settings.backup}
                onCheckedChange={(backup) => onSettingsChange({ ...settings, backup })}
              />
            </div>
            {settings.backup && <p className="pl-8 text-xs opacity-75">매일 새벽 3시에 백업합니다.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <StyleIcon name="storage" styleId={styleId} slot="demo-icon-storage" />
              <span className="flex-1">저장 공간</span>
              <span className="tabular-nums">70%</span>
            </div>
            <Progress value={70} aria-label="저장 공간 70%" />
          </div>
          <div data-slot="demo-actions" className="flex gap-2">
            <Button className="flex-1" onClick={onSave}>
              저장
            </Button>
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              취소
            </Button>
          </div>
          <p role="status" className="min-h-4 text-xs font-medium">
            {notice}
          </p>
        </Card>
      </div>
    </div>
  )
}

export function ProjectsView({ projects, query }: { projects: Project[]; query: string }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const visible = filterProjects(projects, query).filter((p) =>
    filter === 'all' ? true : filter === 'done' ? p.status === '완료' : p.status !== '완료',
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">모든 프로젝트</h3>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="active">진행 중</TabsTrigger>
            <TabsTrigger value="done">완료</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Card className="px-5">
        <ProjectList projects={visible} query={query} />
      </Card>
    </div>
  )
}

const MEMBERS = [
  { name: '김하늘', role: '디자이너', initial: '김', dot: 'bg-emerald-500', status: '온라인' },
  { name: '이준호', role: '개발자', initial: '이', dot: 'bg-amber-400', status: '자리 비움' },
  { name: '박서연', role: '기획자', initial: '박', dot: 'bg-neutral-400', status: '오프라인' },
]

export function TeamView() {
  const [invited, setInvited] = useState(false)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">팀원</h3>
        <Button variant="outline" onClick={() => setInvited(true)} disabled={invited}>
          {invited ? '초대를 보냈습니다' : '팀원 초대'}
        </Button>
      </div>
      <Card className="px-5">
        <ul className="flex flex-col gap-4">
          {MEMBERS.map((m) => (
            <li key={m.name} className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{m.initial}</AvatarFallback>
                <AvatarBadge className={m.dot} />
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{m.name}</p>
                <p className="text-xs opacity-75">{m.role}</p>
              </div>
              <Badge variant="outline">{m.status}</Badge>
            </li>
          ))}
          {invited && (
            <li className="flex items-center gap-3 opacity-75">
              <Avatar size="lg">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <p className="flex-1">새 팀원</p>
              <Badge variant="secondary">초대 중</Badge>
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}

export function SettingsView() {
  const [saved, setSaved] = useState(false)
  const id = useId()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <h3 className="text-lg font-semibold">계정 설정</h3>
      <Card className="gap-4 px-5">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setSaved(true)
          }}
          onChange={() => setSaved(false)}
        >
          <div className="grid gap-2">
            <Label htmlFor={`${id}-name`}>표시 이름</Label>
            <Input id={`${id}-name`} defaultValue="김하늘" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-mail`}>이메일</Label>
            <Input id={`${id}-mail`} type="email" defaultValue="haneul@studio.kr" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${id}-weekly`} defaultChecked onCheckedChange={() => setSaved(false)} />
            <Label htmlFor={`${id}-weekly`}>주간 요약 메일 받기</Label>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">변경 사항 저장</Button>
            <p role="status" className="text-xs font-medium">
              {saved ? '계정 설정을 저장했습니다' : ''}
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}
