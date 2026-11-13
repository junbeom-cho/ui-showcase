import type { ReactNode } from 'react'
import { AlertCircleIcon, ArrowUpIcon, ClockIcon, CopyIcon, RefreshCwIcon, RotateCwIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StateGrid } from '../../state-grid'
import {
  AssistantMessage,
  Caret,
  ChatPanel,
  CitationMarker,
  Composer,
  StoppedNote,
  SuggestionChips,
  ThinkingLine,
  UserMessage,
} from './parts'

const noop = () => {}

/** A drawing of one moment in a turn; nothing in it can be focused. */
function Cell({ children }: { children: ReactNode }) {
  return (
    <div inert className="flex w-full max-w-64 flex-col gap-2 rounded-lg border bg-background p-3 text-left">
      {children}
    </div>
  )
}

/** Copy, thumbs and regenerate under a finished answer, as a drawing. */
function Actions({ slots = false }: { slots?: boolean }) {
  return (
    <div data-slot={slots ? 'ai-actions' : undefined} className="flex items-center gap-0.5 text-muted-foreground">
      <Button variant="ghost" size="icon-xs" aria-label="답변 복사">
        <CopyIcon />
      </Button>
      <Button variant="ghost" size="icon-xs" aria-label="좋아요">
        <ThumbsUpIcon />
      </Button>
      <Button variant="ghost" size="icon-xs" aria-label="별로예요">
        <ThumbsDownIcon />
      </Button>
      <Button variant="ghost" size="icon-xs" aria-label="다시 생성">
        <RefreshCwIcon />
      </Button>
    </div>
  )
}

export function States() {
  return (
    <StateGrid
      wide
      items={[
        {
          label: '보내는 중',
          node: (
            <Cell>
              <UserMessage
                pending
                footer={
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ClockIcon aria-hidden className="size-3" />
                    보내는 중
                  </span>
                }
              >
                이 가방 어때?
              </UserMessage>
            </Cell>
          ),
        },
        {
          label: '생각 중',
          node: (
            <Cell>
              <AssistantMessage busy>
                <ThinkingLine />
              </AssistantMessage>
            </Cell>
          ),
        },
        {
          label: '답변 중',
          node: (
            <Cell>
              <AssistantMessage busy>
                <p>
                  이 가방은 가벼운 나일론이라 여행용으로
                  <Caret />
                </p>
              </AssistantMessage>
            </Cell>
          ),
        },
        {
          label: '완료',
          node: (
            <Cell>
              <AssistantMessage footer={<Actions />}>
                <p>이 가방은 가벼운 나일론이라 여행용으로 좋아요.</p>
              </AssistantMessage>
            </Cell>
          ),
        },
        {
          label: '중단됨',
          node: (
            <Cell>
              <AssistantMessage>
                <p>이 가방은 가벼운</p>
                <StoppedNote />
              </AssistantMessage>
            </Cell>
          ),
        },
        {
          label: '오류 → 다시 시도',
          node: (
            <Cell>
              <AssistantMessage
                footer={
                  <Button variant="outline" size="xs" className="self-start">
                    <RotateCwIcon data-icon="inline-start" />
                    다시 시도
                  </Button>
                }
              >
                <p className="flex items-center gap-1.5 text-destructive">
                  <AlertCircleIcon aria-hidden className="size-4 shrink-0" />
                  답변을 만들지 못했어요
                </p>
              </AssistantMessage>
            </Cell>
          ),
        },
      ]}
    />
  )
}

export function AiPatternsSpecimen() {
  return (
    <div inert className="w-[24rem] max-w-full">
      <ChatPanel
        className="h-auto"
        composer={<Composer slots value="" onChange={noop} onSend={noop} />}
      >
        <UserMessage slots>제주 여행에 렌터카 꼭 필요해?</UserMessage>
        <AssistantMessage
          slots
          footer={
            <>
              <Actions slots />
              <SuggestionChips slots items={['급행버스 시간표 보여줘', '렌터카 싸게 빌리는 법']} label="이어서 물어보기" onAsk={noop} />
            </>
          }
        >
          <p>
            읍면 지역은 버스 배차가 길어 렌터카가 편해요
            <CitationMarker slots n={1} />. 동쪽만 돈다면 급행버스로도 충분해요
            <CitationMarker n={2} />.
          </p>
        </AssistantMessage>
      </ChatPanel>
    </div>
  )
}

export function AiPatternsPreview() {
  return (
    <div aria-hidden className="flex w-40 flex-col gap-2 rounded-lg border bg-background p-2.5">
      <span className="ml-auto h-4 w-16 rounded-full rounded-br-sm bg-primary" />
      <div className="flex gap-1.5">
        <span className="size-3.5 shrink-0 rounded-full bg-muted-foreground/30" />
        <div className="flex flex-1 flex-col gap-1 pt-0.5">
          <span className="h-1.5 w-full rounded-full bg-foreground/60" />
          <span className="h-1.5 w-4/5 rounded-full bg-foreground/60" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1/3 rounded-full bg-foreground/60" />
            <span className="h-2 w-1 rounded-sm bg-foreground/70" />
          </span>
        </div>
      </div>
      <div className="flex h-5 items-center justify-between rounded-full border pr-0.5 pl-2">
        <span className="h-1 w-12 rounded-full bg-muted-foreground/30" />
        <span className="grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <ArrowUpIcon className="size-2.5" />
        </span>
      </div>
    </div>
  )
}

