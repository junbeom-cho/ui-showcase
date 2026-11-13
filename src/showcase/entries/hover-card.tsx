import { useState, type ComponentProps, type ReactNode } from 'react'
import { CalendarDaysIcon, InfoIcon, LinkIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

// A link with a faint underline that darkens on hover; focus draws a ring.
const linkClass =
  'rounded-sm font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50'
// Drawn links copy the hovered look: the card only opens after a hover.
const drawnLinkClass = 'self-start text-sm font-medium underline decoration-foreground underline-offset-4'
const drawnCard = 'w-full rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10'

type User = {
  handle: string
  name: string
  initials: string
  bio: string
  followers: string
  following: string
  joined: string
}

const haneul: User = {
  handle: 'haneul',
  name: '김하늘',
  initials: '하늘',
  bio: 'UI 디자이너. 버튼 모서리를 오래 고민합니다.',
  followers: '1,284',
  following: '312',
  joined: '2021년 3월',
}
const minjun: User = {
  handle: 'minjun',
  name: '박민준',
  initials: '민준',
  bio: '프런트엔드 개발자. 키보드로도 다 되는 화면을 만듭니다.',
  followers: '856',
  following: '97',
  joined: '2019년 11월',
}

function UserCard({ user }: { user: User }) {
  return (
    <div className="flex gap-3">
      <Avatar size="lg">
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="leading-none">
          <span className="font-medium">{user.name}</span>{' '}
          <span className="text-muted-foreground">@{user.handle}</span>
        </p>
        <p className="text-muted-foreground">{user.bio}</p>
        <p className="flex gap-3 text-xs">
          <span>
            <span className="font-medium tabular-nums">{user.followers}</span> 팔로워
          </span>
          <span>
            <span className="font-medium tabular-nums">{user.following}</span> 팔로잉
          </span>
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDaysIcon className="size-3.5" />
          {user.joined} 가입
        </p>
      </div>
    </div>
  )
}

/** A @handle link that previews the profile; link props (pinned state) go to the anchor. */
function UserLink({
  user,
  onOpenChange,
  ...link
}: { user: User; onOpenChange?: (open: boolean) => void } & ComponentProps<'a'>) {
  return (
    <HoverCard openDelay={300} closeDelay={200} onOpenChange={onOpenChange}>
      <HoverCardTrigger asChild>
        <a href="#" className={linkClass} {...link}>
          @{user.handle}
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <UserCard user={user} />
      </HoverCardContent>
    </HoverCard>
  )
}

/** Static drawing of a shown card under its link. */
function DrawnOpen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="flex w-60 flex-col gap-1.5">
      <span className={drawnLinkClass}>@haneul</span>
      <div className={drawnCard}>{children}</div>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <UserLink user={haneul} /> },
        { label: '호버', node: <UserLink user={haneul} data-demo-state="hover" /> },
        { label: '포커스', node: <UserLink user={haneul} data-demo-state="focus" /> },
        {
          label: '열림',
          node: (
            <DrawnOpen label="열린 카드: 링크 아래에 프로필 미리보기">
              <UserCard user={haneul} />
            </DrawnOpen>
          ),
        },
        {
          label: '불러오는 중',
          node: (
            <DrawnOpen label="불러오는 중: 카드 자리에 회색 막대">
              <div className="flex gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </DrawnOpen>
          ),
        },
      ]}
    />
  )
}

function HoverCardPreview() {
  return (
    <p className="text-sm">
      <UserLink user={haneul} /> 님이 댓글을 남겼습니다.
    </p>
  )
}

/** Static drawing of a shown card; a live one would portal to <body>. */
function HoverCardSpecimen() {
  return (
    <div className="flex w-72 flex-col gap-1.5">
      <p className="text-sm">
        <span data-slot="hover-card-trigger" className={drawnLinkClass}>
          @haneul
        </span>{' '}
        님이 댓글을 남겼습니다.
      </p>
      <div data-slot="hover-card-content" className={drawnCard}>
        <UserCard user={haneul} />
      </div>
    </div>
  )
}

function UserPreview() {
  const [open, setOpen] = useState<User | null>(null)
  // two cards can briefly overlap while one closes; keep the one that opened last
  const follow = (user: User) => (next: boolean) =>
    setOpen((current) => (next ? user : current === user ? null : current))

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 text-sm">
        <p>
          <UserLink user={haneul} onOpenChange={follow(haneul)} /> 님이 댓글을 남겼습니다. &ldquo;버튼 색이 조금 더 진했으면
          해요.&rdquo;
        </p>
        <p>
          <UserLink user={minjun} onOpenChange={follow(minjun)} /> 님이 답글을 남겼습니다. &ldquo;대비를 4.5:1로 맞춰
          볼게요.&rdquo;
        </p>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {open ? `${open.name} 님의 카드를 보고 있습니다.` : '@이름에 마우스를 올리거나 Tab으로 포커스해 보세요.'}
      </p>
    </div>
  )
}

type Article = { url: string; host: string; title: string; summary: string }

const articles: Article[] = [
  {
    url: 'example.com/blog/combobox',
    host: 'example.com',
    title: '검색이 되는 선택 상자 만들기',
    summary: 'Popover와 Command를 합쳐 Combobox를 만드는 과정을 단계별로 정리했습니다.',
  },
  {
    url: 'example.org/guide/contrast',
    host: 'example.org',
    title: '글자 대비 맞추기 안내',
    summary: '배경과 글자 색의 대비를 재는 방법과 4.5:1 기준을 설명합니다.',
  },
]

/** A drawn thumbnail: the page's layout in grey blocks, not a real image. */
function Thumbnail() {
  return (
    <div aria-hidden className="flex h-24 flex-col gap-1.5 rounded-md bg-muted p-3">
      <div className="h-2 w-1/3 rounded-full bg-foreground/20" />
      <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
      <div className="mt-auto flex gap-1.5">
        <div className="h-6 flex-1 rounded-sm border border-foreground/15 bg-background" />
        <div className="h-6 w-10 rounded-sm bg-foreground/20" />
      </div>
    </div>
  )
}

function LinkPreview() {
  const [open, setOpen] = useState<Article | null>(null)
  const follow = (article: Article) => (next: boolean) =>
    setOpen((current) => (next ? article : current === article ? null : current))

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul className="flex flex-col gap-2 rounded-lg border bg-background p-4 text-sm">
        {articles.map((article) => (
          <li key={article.url} className="flex items-center gap-2">
            <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <HoverCard openDelay={300} closeDelay={200} onOpenChange={follow(article)}>
              <HoverCardTrigger asChild>
                <a href="#" className={cn(linkClass, 'font-normal')}>
                  {article.url}
                </a>
              </HoverCardTrigger>
              <HoverCardContent className="flex w-72 flex-col gap-2">
                <Thumbnail />
                <p className="font-medium">{article.title}</p>
                <p className="text-muted-foreground">{article.summary}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LinkIcon className="size-3" />
                  {article.host}
                </p>
              </HoverCardContent>
            </HoverCard>
          </li>
        ))}
      </ul>
      <p role="status" className="text-xs text-muted-foreground">
        {open ? `"${open.title}" 미리보기를 보고 있습니다.` : '주소에 마우스를 올리면 누르기 전에 무슨 글인지 보입니다.'}
      </p>
    </div>
  )
}

const delays = [
  { open: 0, close: 0, note: '지나가기만 해도 번쩍' },
  { open: 300, close: 300, note: '잠깐 머물면' },
  { open: 700, close: 300, note: 'Radix 기본값' },
]

function Delays() {
  const [last, setLast] = useState<number | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="grid w-full grid-cols-3 gap-2">
        {delays.map((d) => (
          <div key={d.open} className="flex flex-col items-center gap-1 rounded-lg border bg-background p-3 text-center">
            <HoverCard openDelay={d.open} closeDelay={d.close} onOpenChange={(open) => open && setLast(d.open)}>
              <HoverCardTrigger asChild>
                <a href="#" className={cn(linkClass, 'text-sm')}>
                  {d.open}ms
                </a>
              </HoverCardTrigger>
              <HoverCardContent className="w-52">
                <code className="font-mono text-xs leading-relaxed">
                  openDelay={d.open}
                  <br />
                  closeDelay={d.close}
                </code>
              </HoverCardContent>
            </HoverCard>
            <span className="text-xs text-muted-foreground">{d.note}</span>
          </div>
        ))}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {last === null ? '세 링크 위로 마우스를 쓱 지나가 보세요.' : `${last}ms 기다린 카드가 열렸습니다.`}
      </p>
    </div>
  )
}

function ComparePanel({ title, notes, children }: { title: string; notes: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <p className="font-mono text-sm font-medium">{title}</p>
      <div className="flex min-h-8 items-center">{children}</div>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function Comparison() {
  const [message, setMessage] = useState('')
  const opened = (name: string) => (open: boolean) => open && setMessage(`${name}이(가) 열렸습니다.`)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <ComparePanel title="Tooltip" notes={['버튼 이름 같은 짧은 글 한 줄', '안을 누를 수 없음', '포커스로도 뜸']}>
          <TooltipProvider>
            <Tooltip onOpenChange={opened('Tooltip')}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="정보">
                  <InfoIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>정보</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComparePanel>
        <ComparePanel
          title="Hover Card"
          notes={['링크 너머를 미리 보여 주는 카드', '사진·숫자 같은 풍부한 내용', '터치 화면에서는 열리지 않음']}
        >
          <p className="text-sm">
            <UserLink user={minjun} onOpenChange={opened('Hover Card')} />
          </p>
        </ComparePanel>
        <ComparePanel title="Popover" notes={['눌러야 열림', '버튼·입력칸을 넣어 조작', '터치 화면에서도 그대로']}>
          <Popover onOpenChange={opened('Popover')}>
            <PopoverTrigger asChild>
              <Button variant="outline">눌러 보기</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <PopoverHeader>
                <PopoverTitle>눌러서 연 상자</PopoverTitle>
                <PopoverDescription>바깥을 누르면 닫힙니다.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </ComparePanel>
      </div>
      <p className="rounded-md bg-muted px-3 py-2 text-xs">
        휴대폰과 태블릿에는 마우스 호버가 없어 Hover Card가 열리지 않습니다. 카드에 담은 내용은 링크를 눌러 들어간 페이지처럼
        다른 길로도 볼 수 있어야 합니다.
      </p>
      <p role="status" className="text-center text-xs text-muted-foreground">
        {message || '세 가지를 차례로 열어 보세요.'}
      </p>
    </div>
  )
}

export const hoverCardEntry: ShowcaseEntry = {
  id: 'hover-card',
  name: 'Hover Card',
  aliases: ['Preview card', 'Link preview', 'Profile card', 'Peek', '호버 카드', '미리보기 카드'],
  description: '링크나 이름에 마우스를 잠시 올려 두면 그 너머의 내용을 미리 보여 주는 카드.',
  category: 'overlay',
  Preview: HoverCardPreview,
  anatomy: {
    Specimen: HoverCardSpecimen,
    parts: [
      {
        slot: 'hover-card-trigger',
        name: 'HoverCardTrigger',
        description: '마우스를 올리거나 포커스하면 카드를 띄우는 링크. 누르면 원래 링크대로 이동',
      },
      { slot: 'hover-card-content', name: 'HoverCardContent', description: '잠깐 기다린 뒤 떠오르는 미리보기 카드' },
      { slot: 'avatar', name: 'Avatar', description: '카드에 흔히 넣는 프로필 사진. 사진이 없으면 이름 글자' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '링크의 상태와 떠오른 카드를 나란히 놓았습니다. 열림과 불러오는 중은 그림이며, 내용을 받아 오는 동안에는 카드 자리에 회색 막대를 먼저 보여 줍니다. 호버와 포커스는 고정해 그렸습니다.',
      Demo: States,
    },
    {
      title: '사용자 미리보기',
      description:
        '댓글 속 @이름에 마우스를 올리면 프로필 카드가 뜹니다. 페이지를 옮기지 않고 누구인지 확인할 때 씁니다. 카드에만 있는 버튼이나 꼭 필요한 정보는 넣지 않습니다. Tab으로 링크에 포커스해도 열립니다.',
      Demo: UserPreview,
    },
    {
      title: '링크 미리보기',
      description:
        '주소만 보고는 무슨 글인지 알기 어려운 링크에, 누르기 전에 제목·요약·썸네일을 보여 줍니다. 위의 회색 상자는 썸네일 자리를 그린 것입니다.',
      Demo: LinkPreview,
    },
    {
      title: '나타나는 지연',
      description:
        '마우스가 지나가기만 해도 카드가 뜨면 화면이 번쩍거려 거슬립니다. 그래서 잠시 머물렀을 때만 열고(openDelay), 링크에서 카드로 마우스를 옮기는 사이 닫히지 않도록 조금 기다렸다 닫습니다(closeDelay). 세 링크를 비교해 보세요.',
      Demo: Delays,
    },
    {
      title: 'Tooltip·Popover와 차이',
      description:
        '셋 다 무언가 위에 떠오르지만 쓰임이 다릅니다. 짧은 이름표는 Tooltip, 링크 너머 미리보기는 Hover Card, 눌러서 조작하는 상자는 Popover입니다. 터치 화면에서는 Hover Card가 열리지 않는다는 점이 가장 큰 차이입니다.',
      Demo: Comparison,
    },
  ],
}
