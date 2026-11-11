import { Fragment, useState } from 'react'
import { SlashIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ShowcaseEntry } from '../types'

function BreadcrumbPreview() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">문서</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>컴포넌트</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function BreadcrumbSpecimen() {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-base">
        <BreadcrumbItem>
          <BreadcrumbLink href="#">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">가방</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>백팩</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const hidden = ['패션', '잡화']

function CollapsedBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-sm" aria-label="숨긴 경로 보기">
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {hidden.map((label) => (
                <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">가방</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>백팩</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function CustomSeparator() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">회사</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">디자인팀</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>2026 리뉴얼</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const fullPath = ['내 드라이브', '업무', '2026', '디자인', '시안']

function ClickablePath() {
  const [depth, setDepth] = useState(fullPath.length)
  const path = fullPath.slice(0, depth)
  return (
    <div className="flex flex-col items-center gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          {path.map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === path.length - 1 ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href="#" onClick={() => setDepth(i + 1)}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {depth < fullPath.length ? (
        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setDepth(fullPath.length)}>
          처음 경로로 되돌리기
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">상위 폴더를 눌러 이동해 보세요.</p>
      )}
    </div>
  )
}

export const breadcrumbEntry: ShowcaseEntry = {
  id: 'breadcrumb',
  name: 'Breadcrumb',
  aliases: ['경로 표시', '브레드크럼'],
  description: '현재 페이지가 사이트 구조에서 어디에 있는지 상위 경로를 이어서 보여준다.',
  category: 'navigation',
  Preview: BreadcrumbPreview,
  anatomy: {
    Specimen: BreadcrumbSpecimen,
    parts: [
      { slot: 'breadcrumb-link', name: 'BreadcrumbLink', description: '눌러서 이동하는 상위 경로' },
      { slot: 'breadcrumb-separator', name: 'BreadcrumbSeparator', description: '경로 사이의 구분 기호' },
      { slot: 'breadcrumb-ellipsis', name: 'BreadcrumbEllipsis', description: '중간 경로를 줄인 자리' },
      { slot: 'breadcrumb-page', name: 'BreadcrumbPage', description: '지금 있는 페이지. 링크가 아님' },
    ],
  },
  examples: [
    {
      title: '상위 경로로 이동',
      description: '폴더 경로에서 상위 항목을 누르면 그 위치로 올라갑니다.',
      Demo: ClickablePath,
    },
    {
      title: '긴 경로 줄이기',
      description: '경로가 길면 가운데를 말줄임표로 줄이고, 누르면 숨긴 단계를 메뉴로 보여줍니다.',
      Demo: CollapsedBreadcrumb,
    },
    {
      title: '구분 기호 바꾸기',
      description: '기본 꺾쇠 대신 빗금 같은 다른 기호를 넣을 수 있습니다.',
      Demo: CustomSeparator,
    },
  ],
}
