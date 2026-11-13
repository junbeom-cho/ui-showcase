import { useEffect, useRef, useState, type DragEvent } from 'react'
import {
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  CopyIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  PaperclipIcon,
  PencilIcon,
  RotateCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Spinner } from '../loading-states/spinners'
import { answerFor, formatSize, isBusy, phaseStatus, useReplies } from './chat'
import { AssistantMessage, ChatPanel, Composer, DemoStatus, ReplyText, UserMessage } from './parts'

const GIFT_QUESTION = '부모님 선물 10만 원 이하로 추천해줘'
const REASONS = ['사실과 달라요', '질문과 상관없어요', '너무 길어요', '오래된 정보예요', '기타']

/** 6. Thumbs up or down on one answer; down asks why, in chips and optional words. */
export function FeedbackFormat() {
  const answer = answerFor(GIFT_QUESTION).text
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [asking, setAsking] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const choose = (next: 'up' | 'down') => {
    const v = vote === next ? null : next
    setVote(v)
    setAsking(v === 'down')
    setReasons([])
    setComment('')
    setSent(false)
    setNote('')
  }
  const copy = () => {
    navigator.clipboard
      ?.writeText(answer)
      .then(() => {
        setCopied(true)
        setNote('답변을 복사했어요')
      })
      .catch(() => setNote('복사하지 못했어요'))
  }
  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))

  const action =
    'text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground'

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel>
        <UserMessage>{GIFT_QUESTION}</UserMessage>
        <AssistantMessage
          footer={
            <>
              <div role="group" aria-label="답변 평가" className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm" className={action} aria-label={copied ? '복사됨' : '답변 복사'} onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={action}
                  aria-label="좋아요"
                  aria-pressed={vote === 'up'}
                  onClick={() => choose('up')}
                >
                  <ThumbsUpIcon className={cn(vote === 'up' && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={action}
                  aria-label="별로예요"
                  aria-pressed={vote === 'down'}
                  onClick={() => choose('down')}
                >
                  <ThumbsDownIcon className={cn(vote === 'down' && 'fill-current')} />
                </Button>
                {vote === 'up' && <span className="ml-1 text-xs text-muted-foreground">고마워요!</span>}
              </div>
              {asking && (
                <form
                  aria-label="별로인 이유"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSent(true)
                    setAsking(false)
                  }}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">어떤 점이 아쉬웠나요?</p>
                    <Button type="button" variant="ghost" size="icon-xs" aria-label="닫기" onClick={() => setAsking(false)}>
                      <XIcon />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REASONS.map((r) => (
                      <Button
                        key={r}
                        type="button"
                        variant="outline"
                        size="xs"
                        aria-pressed={reasons.includes(r)}
                        onClick={() => toggleReason(r)}
                        className="rounded-full aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    aria-label="더 알려 주세요 (선택)"
                    placeholder="더 알려 주세요 (선택)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-14 text-sm"
                  />
                  <Button type="submit" size="sm" className="self-end" disabled={reasons.length === 0 && !comment.trim()}>
                    의견 보내기
                  </Button>
                </form>
              )}
              {sent && <p className="text-xs text-muted-foreground">의견 고마워요. 더 나은 답을 만드는 데 쓸게요.</p>}
            </>
          }
        >
          <p>{answer}</p>
        </AssistantMessage>
      </ChatPanel>
      <DemoStatus>
        {note ||
          (sent
            ? `의견을 보냈어요 · 별로예요${reasons.length ? ` · 이유: ${reasons.join(', ')}` : ''}`
            : vote === 'up'
              ? '평가: 좋아요'
              : vote === 'down'
                ? '평가: 별로예요 · 이유를 골라 주세요'
                : '평가: 없음')}
      </DemoStatus>
    </div>
  )
}

const TRIP_QUESTION = '제주 2박 3일 일정 짜줘'

/** 7. Edit a question already sent; the answer under it is rewritten, the old pair kept as a branch. */
export function EditPromptFormat() {
  const { replies, busy, add, reset } = useReplies([answerFor(TRIP_QUESTION).text])
  // branch i is questions[i] answered by replies[i]
  const [questions, setQuestions] = useState([TRIP_QUESTION])
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)

  const cancel = () => {
    setDraft(null)
    // back to the button that opened the editor
    window.setTimeout(() => editButton.current?.focus())
  }
  const submit = () => {
    const q = draft?.trim()
    if (!q || busy) return
    setQuestions((prev) => [...prev, q])
    add(answerFor(q).text)
    setIndex(questions.length)
    setDraft(null)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel>
        {draft === null ? (
          <UserMessage
            footer={
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                {questions.length > 1 && (
                  <div role="group" aria-label="질문 버전" className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="이전 질문"
                      disabled={index === 0}
                      onClick={() => setIndex(index - 1)}
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <span className="min-w-9 text-center tabular-nums">
                      {index + 1} / {questions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="다음 질문"
                      disabled={index === questions.length - 1}
                      onClick={() => setIndex(index + 1)}
                    >
                      <ChevronRightIcon />
                    </Button>
                  </div>
                )}
                <Button
                  ref={editButton}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="질문 고치기"
                  disabled={busy}
                  onClick={() => setDraft(questions[index])}
                >
                  <PencilIcon />
                </Button>
              </div>
            }
          >
            {questions[index]}
          </UserMessage>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="ml-auto flex w-[85%] flex-col gap-2 rounded-2xl border bg-muted/40 p-2"
          >
            <Textarea
              aria-label="질문 고치기"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancel()
              }}
              className="min-h-14 bg-background text-sm dark:bg-background"
            />
            <div className="flex justify-end gap-1.5">
              <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                보내기
              </Button>
            </div>
          </form>
        )}
        <AssistantMessage busy={isBusy(replies[index])}>
          <ReplyText reply={replies[index]} />
        </AssistantMessage>
      </ChatPanel>
      <div className="flex items-center justify-between gap-3">
        <DemoStatus>
          {draft !== null
            ? '질문을 고치는 중 · 보내면 아래 답이 새로 써져요.'
            : busy
              ? '고친 질문으로 다시 답하는 중…'
              : questions.length > 1
                ? `질문 ${questions.length}개 중 ${index + 1}번째 · 예전 질문과 답도 그대로 남아 있어요.`
                : '연필을 눌러 보낸 질문을 고쳐 보세요.'}
        </DemoStatus>
        {questions.length > 1 && !busy && draft === null && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              reset()
              setQuestions([TRIP_QUESTION])
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

type Attachment = { id: number; name: string; size: number }

const SAMPLE_FILES = [
  { name: '여행-영수증.pdf', size: 1_258_291 },
  { name: '가방-사진.jpg', size: 2_516_582 },
  { name: '제주-일정.xlsx', size: 38_912 },
]
const MAX_FILES = 3
const MAX_BYTES = 10 * 1024 * 1024

const FILE_ANSWERS: Record<string, string> = {
  pdf: '영수증 3장을 읽었어요. 숙소 32만 원, 렌터카 9만 8천 원, 식비 6만 4천 원으로 모두 48만 2천 원이에요. 가장 큰 지출은 숙소예요.',
  jpg: '사진 속 가방은 겉감이 나일론인 25리터 백팩으로 보여요. 옆주머니에 물병이 들어가고 앞쪽 지퍼 칸이 넓어서 여행용으로 쓰기 좋아요.',
  xlsx: '일정표에 장소가 9곳 있어요. 둘째 날에 동쪽과 서쪽이 섞여 이동만 3시간이 넘으니, 협재 해변을 셋째 날로 옮기면 1시간쯤 줄어요.',
}
const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

const FILE_ICONS: Record<string, typeof FileIcon> = {
  pdf: FileTextIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  png: ImageIcon,
  xlsx: FileSpreadsheetIcon,
  csv: FileSpreadsheetIcon,
}

function fileAnswer(files: Attachment[]) {
  const [first] = files
  const known = FILE_ANSWERS[extension(first.name)]
  const text =
    known ??
    `‘${first.name}’(${formatSize(first.size)})을 받았어요. 이 예시는 파일 내용을 읽지 않지만, 실제 서비스라면 내용을 읽고 답해요.`
  return files.length > 1 ? `${text} 함께 보낸 파일 ${files.length - 1}개도 받았어요.` : text
}

function FileChip({ file, onRemove }: { file: Attachment; onRemove?: () => void }) {
  const Icon = FILE_ICONS[extension(file.name)] ?? FileIcon
  return (
    <li className="flex max-w-full min-w-0 items-center gap-2 rounded-lg border bg-muted/40 py-1 pr-1 pl-2 text-xs">
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate font-medium">{file.name}</span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{formatSize(file.size)}</span>
      {onRemove && (
        <Button type="button" variant="ghost" size="icon-xs" aria-label={`${file.name} 빼기`} onClick={onRemove}>
          <XIcon />
        </Button>
      )}
    </li>
  )
}

/** 8. Attach files by button or by dropping them on the chat, check them as chips, then ask about them. */
export function AttachmentFormat() {
  const [files, setFiles] = useState<Attachment[]>([])
  const [input, setInput] = useState('이 파일 요약해줘')
  const [sent, setSent] = useState<{ question: string; files: Attachment[] }[]>([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const nextId = useRef(1)
  const picker = useRef<HTMLInputElement>(null)
  const { replies, busy, add, reset } = useReplies()
  const last = replies[replies.length - 1]

  const attach = (incoming: { name: string; size: number }[]) => {
    let list = files
    let problem = ''
    for (const f of incoming) {
      if (list.some((x) => x.name === f.name)) continue
      if (f.size > MAX_BYTES) problem = `‘${f.name}’은 10MB가 넘어 붙일 수 없어요.`
      else if (list.length >= MAX_FILES) problem = `파일은 ${MAX_FILES}개까지 붙일 수 있어요.`
      else list = [...list, { id: nextId.current++, name: f.name, size: f.size }]
    }
    setFiles(list)
    setError(problem)
  }
  const send = () => {
    const question = input.trim() || '이 파일 봐줘'
    setSent((prev) => [...prev, { question, files }])
    add(files.length ? fileAnswer(files) : answerFor(question).text)
    setFiles([])
    setInput('')
    setError('')
  }
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          attach([...e.dataTransfer.files])
        }}
      >
        <ChatPanel
          composer={
            <Composer
              value={input}
              onChange={setInput}
              onSend={send}
              busy={busy}
              canSendEmpty={files.length > 0}
              above={
                files.length > 0 && (
                  <ul aria-label="첨부한 파일" className="flex flex-wrap gap-1.5 px-1 pt-1">
                    {files.map((f) => (
                      <FileChip key={f.id} file={f} onRemove={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))} />
                    ))}
                  </ul>
                )
              }
              leading={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="파일 첨부"
                    onClick={() => picker.current?.click()}
                  >
                    <PaperclipIcon />
                  </Button>
                  <input
                    ref={picker}
                    type="file"
                    multiple
                    tabIndex={-1}
                    aria-hidden
                    className="sr-only"
                    onChange={(e) => {
                      attach([...(e.target.files ?? [])])
                      e.target.value = ''
                    }}
                  />
                </>
              }
            />
          }
        >
          {sent.length === 0 && (
            <p className="m-auto max-w-60 text-center text-sm text-muted-foreground">
              파일을 이 창에 끌어다 놓거나 클립 버튼으로 붙인 뒤 물어보세요.
            </p>
          )}
          {sent.map((turn, i) => (
            <div key={i} className="flex flex-col gap-4">
              <UserMessage
                footer={
                  turn.files.length > 0 && (
                    <ul aria-label="보낸 파일" className="flex flex-wrap justify-end gap-1.5">
                      {turn.files.map((f) => (
                        <FileChip key={f.id} file={f} />
                      ))}
                    </ul>
                  )
                }
              >
                {turn.question}
              </UserMessage>
              <AssistantMessage busy={isBusy(replies[i])}>
                <ReplyText reply={replies[i]} />
              </AssistantMessage>
            </div>
          ))}
        </ChatPanel>
        {dragging && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed border-primary bg-background/85 text-sm font-medium">
            여기에 놓으면 첨부돼요
          </div>
        )}
      </div>
      <div role="group" aria-label="예시 파일 붙이기" className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">예시 파일:</span>
        {SAMPLE_FILES.map((f) => (
          <Button key={f.name} variant="outline" size="xs" onClick={() => attach([f])}>
            {f.name}
          </Button>
        ))}
        {sent.length > 0 && !busy && (
          <Button
            variant="link"
            size="xs"
            className="ml-auto"
            onClick={() => {
              setSent([])
              reset()
            }}
          >
            새 대화
          </Button>
        )}
      </div>
      <DemoStatus>
        {error ||
          (busy
            ? '파일을 읽고 답하는 중…'
            : files.length > 0
              ? `첨부 ${files.length}개 · 보내면 파일에 대해 답해요.`
              : phaseStatus(last, '클립 버튼, 끌어다 놓기, 예시 파일로 붙여 보세요.'))}
      </DemoStatus>
    </div>
  )
}

const STEPS = [
  {
    title: '명세서 읽기',
    running: '명세서 읽는 중',
    tool: 'read_file("10월_카드명세서.pdf")',
    result: '거래 48건, 합계 87만 4천 원을 찾았어요.',
  },
  {
    title: '지난달과 비교하기',
    running: '지난달과 비교하는 중',
    tool: 'compare("9월", "10월")',
    result: '식비가 12% 늘고 교통비가 8% 줄었어요.',
  },
  {
    title: '정리하기',
    running: '정리하는 중',
    tool: 'summarize(by: "항목")',
    result: '항목 5개로 묶어 표를 만들었어요.',
  },
  {
    title: '정리해서 보내기',
    running: '보내는 중',
    tool: 'send_mail(to: "나")',
    result: '내 메일함으로 보냈어요.',
  },
]
const STEP_MS = 1500
const AGENT_REQUEST = '지난달 카드 명세서 정리해서 보내줘'

/** 9. A request that takes several tool calls, shown as a checklist that ticks itself off. */
export function AgentStepsFormat() {
  const [input, setInput] = useState(AGENT_REQUEST)
  const [question, setQuestion] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState<number[]>([])
  const running = question !== null && progress < STEPS.length

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setProgress((p) => p + 1), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [running, progress])

  const run = (q: string) => {
    setQuestion(q)
    setProgress(0)
    setOpen([])
    setInput('')
  }
  const toggle = (i: number) => setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatPanel
        composer={<Composer value={input} onChange={setInput} onSend={() => run(input.trim())} busy={running} />}
      >
        {question !== null && (
          <>
            <UserMessage>{question}</UserMessage>
            <AssistantMessage
              busy={running}
              footer={
                !running && (
                  <Button variant="outline" size="xs" className="self-start" onClick={() => run(question)}>
                    <RotateCcwIcon data-icon="inline-start" />
                    다시 실행
                  </Button>
                )
              }
            >
              <ol aria-label="작업 단계" className="flex flex-col gap-1.5 rounded-lg border p-2.5">
                {STEPS.map((s, i) => {
                  const state = i < progress ? 'done' : i === progress && running ? 'running' : 'waiting'
                  const expanded = open.includes(i)
                  return (
                    <li key={s.title} data-step-state={state} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {state === 'done' && (
                          <CheckCircle2Icon aria-hidden className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {state === 'running' && <Spinner size="sm" />}
                        {state === 'waiting' && <CircleIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/50" />}
                        <span className={cn('flex-1', state === 'waiting' && 'text-muted-foreground')}>
                          {state === 'running' ? `${s.running}…` : s.title}
                          <span className="sr-only">{state === 'done' ? ' (완료)' : state === 'running' ? ' (진행 중)' : ' (대기)'}</span>
                        </span>
                        {state !== 'waiting' && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`${s.title} 자세히`}
                            aria-expanded={expanded}
                            onClick={() => toggle(i)}
                          >
                            <ChevronDownIcon
                              className={cn('transition-transform motion-reduce:transition-none', expanded && 'rotate-180')}
                            />
                          </Button>
                        )}
                      </div>
                      {expanded && state !== 'waiting' && (
                        <div className="ml-6 flex flex-col gap-1 rounded-md bg-muted/60 px-2 py-1.5 text-xs">
                          <code className="font-mono break-all text-muted-foreground">{s.tool}</code>
                          <span>{state === 'done' ? s.result : '실행하는 중…'}</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
              {!running && (
                <p className="mt-2">
                  10월 카드 명세서를 정리해 내 메일로 보냈어요. 합계는 87만 4천 원으로 9월보다 5% 늘었고, 식비가 가장 많이 늘었어요.
                </p>
              )}
            </AssistantMessage>
          </>
        )}
      </ChatPanel>
      <DemoStatus>
        {question === null
          ? '보내기를 누르면 도우미가 네 단계를 차례로 실행해요.'
          : running
            ? `단계 ${progress}/${STEPS.length} 완료 · 지금: ${STEPS[progress].running}`
            : `모든 단계 완료 · ${STEPS.length}/${STEPS.length}`}
      </DemoStatus>
    </div>
  )
}
