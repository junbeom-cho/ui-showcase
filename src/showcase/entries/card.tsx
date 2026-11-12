import { useState, type ComponentProps } from 'react'
import { CheckIcon, MoreHorizontalIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

function Mini({ className, children, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card size="sm" className={cn('w-full max-w-44 transition-shadow', className)} {...props}>
      {children ?? (
        <CardHeader>
          <CardTitle>프로젝트</CardTitle>
          <CardDescription>2일 전 수정</CardDescription>
        </CardHeader>
      )}
    </Card>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Mini /> },
        { label: '호버 (떠오름)', node: <Mini data-demo-state="hover" className="hover:shadow-lg hover:ring-foreground/20" /> },
        {
          label: '선택됨',
          node: (
            <Mini className="ring-2 ring-primary">
              <CardHeader>
                <CardTitle>프로젝트</CardTitle>
                <CardDescription>2일 전 수정</CardDescription>
                <CardAction>
                  <CheckIcon className="size-4" />
                </CardAction>
              </CardHeader>
            </Mini>
          ),
        },
        { label: '비활성', node: <Mini aria-disabled className="opacity-50" /> },
        {
          label: '불러오는 중',
          node: (
            <Mini aria-busy>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-14" />
              </CardHeader>
            </Mini>
          ),
        },
        {
          label: '오류',
          node: (
            <Mini className="ring-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">불러오지 못함</CardTitle>
                <CardDescription>새로고침해 보세요.</CardDescription>
              </CardHeader>
            </Mini>
          ),
        },
      ]}
    />
  )
}

function CardPreview() {
  return (
    <Card size="sm" className="w-full max-w-56">
      <CardHeader>
        <CardTitle>프로젝트</CardTitle>
        <CardDescription>최근 수정 2일 전</CardDescription>
      </CardHeader>
      <CardContent>컴포넌트 쇼케이스 작업 중</CardContent>
      <CardFooter>
        <Button size="sm">열기</Button>
      </CardFooter>
    </Card>
  )
}

function CardSpecimen() {
  return (
    <Card className="w-full max-w-80">
      <CardHeader>
        <CardTitle>주간 보고서</CardTitle>
        <CardDescription>디자인팀, 11월 둘째 주</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" aria-label="더 보기">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        새 컴포넌트 6개를 추가하고, 검색 화면의 여백을 정리했습니다.
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">나중에</Button>
        <Button size="sm">읽기</Button>
      </CardFooter>
    </Card>
  )
}

function LoginCard() {
  const [name, setName] = useState('')
  const [signedIn, setSignedIn] = useState<string | null>(null)

  return (
    <Card className="w-full max-w-80">
      <CardHeader>
        <CardTitle>{signedIn ? `${signedIn}님, 환영합니다` : '로그인'}</CardTitle>
        <CardDescription>
          {signedIn ? '카드 안의 내용만 바뀌었습니다.' : '이름을 넣고 로그인을 눌러 보세요.'}
        </CardDescription>
      </CardHeader>
      {signedIn ? (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => setSignedIn(null)}>
            로그아웃
          </Button>
        </CardFooter>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSignedIn(name.trim() || '손님')
          }}
          className="contents"
        >
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="card-login-name">이름</Label>
            <Input
              id="card-login-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">로그인</Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}

function CoverCard() {
  return (
    <Card className="w-full max-w-72 pt-0">
      <div className="flex h-32 items-end bg-[linear-gradient(135deg,#c7d2fe,#fbcfe8)] p-3">
        <Badge variant="secondary">새 글</Badge>
      </div>
      <CardHeader>
        <CardTitle>카드에 이미지 넣기</CardTitle>
        <CardDescription>맨 위에 이미지를 두면 위쪽 여백이 사라지고 모서리가 맞춰집니다.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="link" className="px-0">계속 읽기</Button>
      </CardFooter>
    </Card>
  )
}

const stats = [
  { label: '방문자', value: '12,480', change: 8.2 },
  { label: '가입', value: '342', change: -2.1 },
  { label: '매출', value: '₩4.2M', change: 12.5 },
]

function StatCards() {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{stat.value}</CardTitle>
            <CardAction>
              <Badge variant="outline" className={stat.change > 0 ? 'text-emerald-700' : 'text-red-700'}>
                {stat.change > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {stat.change > 0 ? '+' : ''}
                {stat.change}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

const plans = [
  { id: 'free', name: '무료', price: '₩0', note: '혼자 쓰기' },
  { id: 'team', name: '팀', price: '₩9,900', note: '5명까지' },
  { id: 'pro', name: '프로', price: '₩29,000', note: '인원 제한 없음' },
]

function SelectableCards() {
  const [selected, setSelected] = useState('team')

  return (
    <div role="radiogroup" aria-label="요금제" className="grid w-full gap-3 sm:grid-cols-3">
      {plans.map((plan) => {
        const checked = plan.id === selected
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setSelected(plan.id)}
            className="rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card size="sm" className={cn('h-full transition-shadow', checked && 'ring-2 ring-primary')}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.note}</CardDescription>
                {checked && (
                  <CardAction>
                    <CheckIcon className="size-4" />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="text-lg font-semibold">{plan.price}</CardContent>
            </Card>
          </button>
        )
      })}
    </div>
  )
}

export const cardEntry: ShowcaseEntry = {
  id: 'card',
  name: 'Card',
  aliases: ['Panel', 'Tile', '카드'],
  description: '관련 정보를 테두리가 있는 하나의 상자로 묶은 컨테이너.',
  category: 'layout',
  Preview: CardPreview,
  anatomy: {
    Specimen: CardSpecimen,
    parts: [
      { slot: 'card', name: 'Card', description: '전체를 감싸는 상자' },
      { slot: 'card-header', name: 'CardHeader', description: '제목·설명·동작이 모이는 윗부분' },
      { slot: 'card-title', name: 'CardTitle', description: '카드의 제목' },
      { slot: 'card-description', name: 'CardDescription', description: '제목을 보충하는 흐린 글' },
      { slot: 'card-action', name: 'CardAction', description: '오른쪽 위 구석의 버튼 자리' },
      { slot: 'card-content', name: 'CardContent', description: '본문 내용' },
      { slot: 'card-footer', name: 'CardFooter', description: '버튼이 놓이는 아랫부분' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '눌러서 고르는 카드라면 호버·선택됨·비활성이, 데이터를 담는 카드라면 불러오는 중·오류 상태가 생깁니다.',
      Demo: States,
    },
    {
      title: '폼을 담은 카드',
      description: '로그인처럼 짧은 입력을 카드 하나에 담습니다. 로그인을 누르면 카드 안의 내용만 바뀝니다.',
      Demo: LoginCard,
    },
    {
      title: '이미지가 있는 카드',
      description: '블로그 글이나 상품 목록에서 흔히 보는 형태입니다. 맨 위에 이미지를 둡니다.',
      Demo: CoverCard,
    },
    {
      title: '숫자 요약 카드',
      description: '대시보드에서 핵심 숫자를 나란히 보여줄 때 작은 카드 여러 개를 씁니다.',
      Demo: StatCards,
    },
    {
      title: '고를 수 있는 카드',
      description: '요금제 선택처럼 카드 자체가 선택지가 되기도 합니다. 눌러서 선택을 바꿔 보세요.',
      Demo: SelectableCards,
    },
  ],
}
