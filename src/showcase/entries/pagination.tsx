import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

function One({ children }: { children: ReactNode }) {
  return (
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>{children}</PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '페이지 번호', node: <One><PaginationLink href="#">3</PaginationLink></One> },
        { label: '호버', node: <One><PaginationLink href="#" data-demo-state="hover">3</PaginationLink></One> },
        { label: '현재 페이지', node: <One><PaginationLink href="#" isActive>3</PaginationLink></One> },
        { label: '포커스', node: <One><PaginationLink href="#" data-demo-state="focus">3</PaginationLink></One> },
        {
          label: '비활성 (첫 페이지의 이전)',
          node: (
            <One>
              <PaginationPrevious href="#" aria-disabled className="pointer-events-none opacity-50" />
            </One>
          ),
        },
        { label: '줄임표', node: <One><PaginationEllipsis /></One> },
      ]}
    />
  )
}

function PaginationPreview() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        {[1, 2, 3].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href="#" isActive={n === 2}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function PaginationSpecimen() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" data-slot="pagination-previous" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive data-slot="pagination-link-active">
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" data-slot="pagination-next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

/** Page numbers to show around the current page, with null for an ellipsis. */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | null)[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null)
    result.push(p)
  })
  return result
}

function Pager({ total }: { total: number }) {
  const [page, setPage] = useState(1)
  const go = (p: number) => setPage(Math.min(total, Math.max(1, p)))
  const disabled = 'pointer-events-none opacity-40'

  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={() => go(page - 1)}
              aria-disabled={page === 1}
              className={cn(page === 1 && disabled)}
            />
          </PaginationItem>
          {pageWindow(page, total).map((p, i) =>
            p === null ? (
              <PaginationItem key={`gap-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink href="#" isActive={p === page} onClick={() => go(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={() => go(page + 1)}
              aria-disabled={page === total}
              className={cn(page === total && disabled)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-muted-foreground">
        전체 {total}쪽 중 {page}쪽
      </p>
    </div>
  )
}

function SimplePager() {
  const total = 10
  const [page, setPage] = useState(3)
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
        이전
      </Button>
      <span className="min-w-14 text-center text-sm tabular-nums">
        {page} / {total}
      </span>
      <Button variant="outline" size="sm" disabled={page === total} onClick={() => setPage((p) => p + 1)}>
        다음
      </Button>
    </div>
  )
}

export const paginationEntry: ShowcaseEntry = {
  id: 'pagination',
  name: 'Pagination',
  aliases: ['Pager', '페이지네이션'],
  description: '긴 목록을 여러 페이지로 나누고 번호로 이동하게 한다.',
  category: 'navigation',
  Preview: PaginationPreview,
  anatomy: {
    Specimen: PaginationSpecimen,
    parts: [
      { slot: 'pagination-previous', name: 'PaginationPrevious', description: '앞 페이지로 가는 버튼' },
      { slot: 'pagination-link', name: 'PaginationLink', description: '페이지 번호 하나' },
      { slot: 'pagination-link-active', name: 'PaginationLink isActive', description: '지금 보고 있는 페이지' },
      { slot: 'pagination-ellipsis', name: 'PaginationEllipsis', description: '중간 번호를 줄인 자리' },
      { slot: 'pagination-next', name: 'PaginationNext', description: '다음 페이지로 가는 버튼' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '번호 하나가 가질 수 있는 상태입니다. 지금 페이지는 테두리로 구분하고, 갈 수 없는 방향은 흐리게 둡니다.',
      Demo: States,
    },
    {
      title: '페이지 넘기기',
      description: '번호나 이전·다음을 눌러 보세요. 처음과 끝에서는 해당 방향 버튼이 비활성화됩니다.',
      Demo: () => <Pager total={5} />,
    },
    {
      title: '페이지가 많을 때',
      description: '20쪽처럼 많으면 처음·끝·현재 주변만 보여주고 나머지는 말줄임표로 줄입니다.',
      Demo: () => <Pager total={20} />,
    },
    {
      title: '번호 없이 간단하게',
      description: '모바일처럼 좁은 곳에서는 이전·다음과 현재 위치만 보여주기도 합니다.',
      Demo: SimplePager,
    },
  ],
}
