import { Fragment, useId, useRef, useState } from 'react'
import { BrainIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Spinner } from '../loading-states/spinners'
import { answerFor, isBusy, phaseStatus, useChat, useReplies, type Reply } from './chat'
import {
  AssistantMessage,
  ChatPanel,
  CitationMarker,
  Composer,
  DemoStatus,
  ReplyText,
  SuggestionChips,
  UserMessage,
} from './parts'

const REASONING = [
  '2박 3일, 렌터카 여행으로 가정했어요',
  '공항에서 가까운 곳부터 동선을 묶었어요',
  '우도 배 시간을 생각해 둘째 날 오전에 동쪽으로 가요',
  '마지막 날은 공항 가는 길에 쉬어 가요',
]
const THINK_SECONDS = 4

/** The collapsible "thinking" line: live seconds while it thinks, a short summary afterwards. */
function Reasoning({ reply }: { reply: Reply }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const thinking = reply.phase === 'thinking'
  return (
    <div className="mb-2 flex flex-col gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {thinking ? <Spinner kind="dots" size="sm" /> : <BrainIcon aria-hidden className="size-3.5" />}
        {thinking ? (
          <span>
            생각하는 중 · <span className="tabular-nums">{reply.seconds}초</span>
          </span>
        ) : (
          <span>{reply.seconds}초 동안 생각함</span>
        )}
        <ChevronDownIcon
          aria-hidden
          className={cn('size-3.5 transition-transform motion-reduce:transition-none', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ol id={id} aria-label="생각 과정 요약" className="ml-1.5 flex flex-col gap-1 border-l-2 pl-3 text-xs text-muted-foreground">
          {REASONING.slice(0, reply.seconds + 1).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** 1. While nothing has been written yet, show that it is working and for how long. */
export function ThinkingFormat() {
  const [input, setInput] = useState('제주 2박 3일 일정 짜줘')
  const chat = useChat(THINK_SECONDS)
  const send = () => {
    chat.ask(input)
    setInput('')
  }
  const { last } = chat

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel
        composer={<Composer value={input} onChange={setInput} onSend={send} busy={chat.busy} onStop={chat.stop} />}
      >
        {chat.turns.map(({ question, reply }, i) => (
          <Fragment key={i}>
            <UserMessage>{question}</UserMessage>
            <AssistantMessage busy={isBusy(reply)}>
              <Reasoning reply={reply} />
              {reply.phase !== 'thinking' && <ReplyText reply={reply} />}
            </AssistantMessage>
          </Fragment>
        ))}
      </ChatPanel>
      <DemoStatus>
        {last?.phase === 'done'
          ? `답변 완료 · ${last.seconds}초 동안 생각함`
          : phaseStatus(last, `보내기를 누르면 ${THINK_SECONDS}초 동안 생각한 뒤 답해요.`)}
      </DemoStatus>
    </div>
  )
}

/** 2. Text arrives piece by piece with a cursor; stop keeps what was written so far. */
export function StreamingFormat() {
  const [input, setInput] = useState('이 가방 어때?')
  const chat = useChat()
  const { last } = chat
  const send = () => {
    chat.ask(input)
    setInput('')
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel
        composer={<Composer value={input} onChange={setInput} onSend={send} busy={chat.busy} onStop={chat.stop} />}
      >
        {chat.turns.map(({ question, reply }, i) => (
          <Fragment key={i}>
            <UserMessage>{question}</UserMessage>
            <AssistantMessage busy={isBusy(reply)}>
              <ReplyText reply={reply} />
            </AssistantMessage>
          </Fragment>
        ))}
      </ChatPanel>
      <div className="flex items-center justify-between gap-3">
        <DemoStatus>
          {last?.phase === 'streaming'
            ? '답변하는 중… 정지를 누르면 그 자리에서 멈춰요.'
            : last?.phase === 'done'
              ? `답변 완료 · ${last.tokens.length}조각`
              : last?.phase === 'stopped'
                ? `답변을 멈췄어요 · ${last.tokens.length}조각 중 ${last.count}조각에서 멈춤`
                : phaseStatus(last, '보내기를 누르면 답이 낱말 단위로 흘러나와요.')}
        </DemoStatus>
        {last && !chat.busy && (
          <Button variant="link" size="sm" onClick={chat.reset}>
            처음부터
          </Button>
        )}
      </div>
    </div>
  )
}

const STARTERS = ['이 가방 어때?', '제주 2박 3일 일정 짜줘', '비 오는 날 서울 실내 코스', '부모님 선물 10만 원 이하']

/** 3. An empty chat offers questions to start from, and follow-ups after each answer. */
export function SuggestionsFormat() {
  const [input, setInput] = useState('')
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chat = useChat()
  const lastTurn = chat.turns[chat.turns.length - 1]
  const followUps = lastTurn?.reply.phase === 'done' ? answerFor(lastTurn.question).followUps : []

  const ask = (q: string) => {
    if (chat.busy) return
    chat.ask(q)
    setInput('')
    setNote('')
  }
  const fill = (q: string) => {
    setInput(q)
    inputRef.current?.focus()
    setNote(`입력창에 넣었어요: ${q} · 고친 뒤 보내 보세요.`)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel
        composer={
          <Composer inputRef={inputRef} value={input} onChange={setInput} onSend={() => ask(input)} busy={chat.busy} />
        }
      >
        {chat.turns.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-3 text-center">
            <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted">
              <SparklesIcon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">무엇을 도와드릴까요?</p>
              <p className="text-sm text-muted-foreground">여행과 쇼핑 이야기라면 무엇이든 물어보세요.</p>
            </div>
            <SuggestionChips items={STARTERS} label="추천 질문" onAsk={ask} onFill={fill} className="justify-center" />
          </div>
        ) : (
          chat.turns.map(({ question, reply }, i) => (
            <Fragment key={i}>
              <UserMessage>{question}</UserMessage>
              <AssistantMessage
                busy={isBusy(reply)}
                footer={
                  i === chat.turns.length - 1 &&
                  followUps.length > 0 && <SuggestionChips items={followUps} label="이어서 물어보기" onAsk={ask} />
                }
              >
                <ReplyText reply={reply} />
              </AssistantMessage>
            </Fragment>
          ))
        )}
      </ChatPanel>
      <div className="flex items-center justify-between gap-3">
        <DemoStatus>
          {note ||
            (lastTurn?.reply.phase === 'done'
              ? `답변 완료 · 이어서 물어볼 질문 ${followUps.length}개`
              : phaseStatus(lastTurn?.reply, `추천 질문 ${STARTERS.length}개 · 누르면 바로 보내고, 연필은 입력창에 넣어요.`))}
        </DemoStatus>
        {lastTurn && !chat.busy && (
          <Button variant="link" size="sm" onClick={chat.reset}>
            새 대화
          </Button>
        )}
      </div>
    </div>
  )
}

const BAG_QUESTION = '이 가방 어때?'
const BAG_VERSIONS = [
  answerFor('가방').text,
  '짧게 말하면 여행용으로 추천해요. 가볍고 수납칸이 많아 짐 정리가 쉬워요. 비 오는 날만 방수 커버를 챙기세요.',
  '장단점으로 나눠 볼게요. 좋은 점은 600g 남짓한 무게와 노트북 칸이에요. 아쉬운 점은 지퍼 방수가 약하고 어깨끈 쿠션이 얇다는 거예요. 하루 종일 메고 다닐 계획이라면 어깨끈이 두꺼운 모델도 함께 보세요.',
]

/** 4. Ask the same question again for another version; every version stays one click away. */
export function RegenerateFormat() {
  const { replies, busy, add, reset } = useReplies([BAG_VERSIONS[0]])
  const [index, setIndex] = useState(0)
  const reply = replies[index]

  const regenerate = () => {
    add(BAG_VERSIONS[replies.length % BAG_VERSIONS.length])
    setIndex(replies.length)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel>
        <UserMessage>{BAG_QUESTION}</UserMessage>
        <AssistantMessage
          busy={isBusy(reply)}
          footer={
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {replies.length > 1 && (
                <div role="group" aria-label="답변 버전" className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="이전 답변"
                    disabled={index === 0}
                    onClick={() => setIndex(index - 1)}
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <span className="min-w-9 text-center tabular-nums">
                    {index + 1} / {replies.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="다음 답변"
                    disabled={index === replies.length - 1}
                    onClick={() => setIndex(index + 1)}
                  >
                    <ChevronRightIcon />
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="xs" disabled={busy} onClick={regenerate}>
                <RefreshCwIcon data-icon="inline-start" />
                다시 생성
              </Button>
            </div>
          }
        >
          <ReplyText reply={reply} />
        </AssistantMessage>
      </ChatPanel>
      <div className="flex items-center justify-between gap-3">
        <DemoStatus>
          {busy
            ? `새 답변을 만드는 중… (${replies.length}번째)`
            : `답변 ${replies.length}개 중 ${index + 1}번째를 보는 중`}
        </DemoStatus>
        {replies.length > 1 && !busy && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              reset()
              setIndex(0)
            }}
          >
            예시 처음으로
          </Button>
        )}
      </div>
    </div>
  )
}

const SOURCES = [
  {
    n: 1,
    title: '제주 버스 노선 안내',
    site: 'bus.jeju.example',
    quote: '읍면 지역 노선은 배차 간격이 30분에서 1시간입니다.',
  },
  {
    n: 2,
    title: '성산·우도 급행버스 시간표',
    site: 'visitjeju.example',
    quote: '공항에서 성산항까지 급행버스가 20분마다 다닙니다.',
  },
  {
    n: 3,
    title: '렌터카 성수기 예약 가이드',
    site: 'travel-news.example',
    quote: '7~8월에는 한 달 전에 예약한 요금이 평균 20% 쌌습니다.',
  },
]
const CITED: (string | number)[] = [
  '제주는 읍면 지역 버스 배차가 길어 하루에 여러 곳을 돌려면 렌터카가 편해요',
  1,
  '. 다만 성산일출봉·우도처럼 동쪽에 몰린 일정이라면 급행버스만으로도 충분해요',
  2,
  '. 렌터카를 빌린다면 성수기에는 한 달 전에 예약하는 게 20% 정도 싸요',
  3,
  '.',
]

/** 5. Numbered markers tie each claim to where it came from. */
export function CitationsFormat() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const active = hovered ?? pinned
  const source = SOURCES.find((s) => s.n === active)
  const cardId = useId()

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel>
        <UserMessage>제주 여행에 렌터카 꼭 필요해?</UserMessage>
        <AssistantMessage
          footer={
            <div id={cardId} className="rounded-lg border bg-muted/40 p-3 text-xs">
              {source ? (
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">
                    [{source.n}] {source.title}
                  </p>
                  <p className="text-muted-foreground">{source.site}</p>
                  <blockquote className="border-l-2 pl-2 leading-relaxed">“{source.quote}”</blockquote>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex w-fit items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    원문 열기
                    <ExternalLinkIcon aria-hidden className="size-3" />
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">출처 {SOURCES.length}개 · 숫자를 가리키거나 누르면 여기에 나와요.</p>
              )}
            </div>
          }
        >
          <p>
            {CITED.map((part) =>
              typeof part === 'string' ? (
                part
              ) : (
                <CitationMarker
                  key={part}
                  n={part}
                  active={active === part}
                  controls={cardId}
                  onHover={(on) => setHovered(on ? part : null)}
                  onPin={() => setPinned((p) => (p === part ? null : part))}
                  onClose={() => {
                    setPinned(null)
                    setHovered(null)
                  }}
                />
              ),
            )}
          </p>
        </AssistantMessage>
      </ChatPanel>
      <DemoStatus>
        {source
          ? `출처 ${source.n}: ${source.title}${pinned === source.n ? ' (고정됨)' : ''}`
          : '숫자를 가리키거나 눌러 출처를 확인하세요.'}
      </DemoStatus>
    </div>
  )
}
