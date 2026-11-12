import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  Loader2Icon,
  PresentationIcon,
  RotateCwIcon,
  UploadIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Spinner } from './spinners'

type SavePhase = 'idle' | 'saving' | 'saved'

const SAVE_LABEL: Record<SavePhase, string> = { idle: '저장', saving: '저장 중…', saved: '저장됨' }
const SAVE_MS = 1500
const SAVED_MS = 2000

/** 5. The pressed button itself shows the wait, and cannot be pressed twice meanwhile. */
export function ButtonLoadingFormat() {
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [name, setName] = useState('김하늘')
  const [saves, setSaves] = useState(0)
  const inputId = useId()

  // saving → saved → back to the plain button
  useEffect(() => {
    if (phase === 'idle') return
    const timer = window.setTimeout(
      () => {
        if (phase === 'saving') setSaves((n) => n + 1)
        setPhase(phase === 'saving' ? 'saved' : 'idle')
      },
      phase === 'saving' ? SAVE_MS : SAVED_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    // a second press while saving does nothing, so nothing is saved twice
    if (phase !== 'saving') setPhase('saving')
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
      <Label htmlFor={inputId}>표시 이름</Label>
      <div className="flex gap-2">
        <Input id={inputId} value={name} disabled={phase === 'saving'} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={phase === 'saving'} className="shrink-0">
          {/* all three labels share one grid cell, so the button is always as wide as the widest */}
          <span className="grid">
            {(Object.keys(SAVE_LABEL) as SavePhase[]).map((p) => (
              <span
                key={p}
                aria-hidden={p !== phase || undefined}
                className={cn(
                  'col-start-1 row-start-1 flex items-center justify-center gap-1.5',
                  p !== phase && 'invisible',
                )}
              >
                {p === 'saving' && <Loader2Icon aria-hidden className="motion-safe:animate-spin" />}
                {p === 'saved' && <CheckIcon aria-hidden />}
                {SAVE_LABEL[p]}
              </span>
            ))}
          </span>
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {phase === 'idle' && `저장을 눌러 보세요. ${SAVE_MS / 1000}초 동안 저장합니다.`}
        {phase === 'saving' && '저장 중… 끝날 때까지 버튼을 다시 누를 수 없습니다.'}
        {phase === 'saved' && '저장했습니다.'} <span className="tabular-nums">· 저장한 횟수 {saves}번</span>
      </p>
    </form>
  )
}

type UploadStatus = 'waiting' | 'uploading' | 'done' | 'failed'

type UploadFile = {
  id: number
  name: string
  size: string
  icon: LucideIcon
  /** percent per tick */
  speed: number
  /** the first try stops here with an error */
  failAt?: number
  progress: number
  status: UploadStatus
  attempt: number
}

const FILES: UploadFile[] = [
  { id: 1, name: '제주-노을.jpg', size: '2.4MB', icon: FileImageIcon, speed: 9 },
  { id: 2, name: '회의록-11월.pdf', size: '860KB', icon: FileTextIcon, speed: 16 },
  { id: 3, name: '발표자료.pptx', size: '12MB', icon: PresentationIcon, speed: 5 },
  { id: 4, name: '여행-영상.mov', size: '48MB', icon: FileVideoIcon, speed: 4, failAt: 44 },
].map((f) => ({ ...f, progress: 0, status: 'waiting' as const, attempt: 0 }))

const UPLOAD_TICK = 150

function advance(file: UploadFile): UploadFile {
  if (file.status !== 'uploading') return file
  const progress = Math.min(100, file.progress + file.speed)
  if (file.failAt !== undefined && file.attempt === 1 && progress >= file.failAt) {
    return { ...file, progress: file.failAt, status: 'failed' }
  }
  return { ...file, progress, status: progress === 100 ? 'done' : 'uploading' }
}

/** 6. Each file with its own bar, finishing or failing on its own; only failures are retried. */
export function UploadFormat() {
  const [files, setFiles] = useState(FILES)
  const uploading = files.some((f) => f.status === 'uploading')
  const started = files.some((f) => f.status !== 'waiting')

  useEffect(() => {
    if (!uploading) return
    const timer = window.setInterval(() => setFiles((prev) => prev.map(advance)), UPLOAD_TICK)
    return () => window.clearInterval(timer)
  }, [uploading])

  const start = () => setFiles(FILES.map((f) => ({ ...f, status: 'uploading', attempt: 1 })))
  const retry = (id: number) =>
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress: 0, status: 'uploading', attempt: f.attempt + 1 } : f)),
    )

  const done = files.filter((f) => f.status === 'done').length
  const failed = files.filter((f) => f.status === 'failed').length
  const overall = Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={uploading} onClick={start}>
          <UploadIcon data-icon="inline-start" />
          {started ? '처음부터 다시 올리기' : '올리기 시작'}
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">전체 {overall}%</span>
      </div>
      <ul aria-label="올릴 파일" className="flex flex-col divide-y rounded-lg border bg-background">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
            <f.icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{f.size}</span>
              </div>
              <Progress
                value={f.progress}
                aria-label={`${f.name} 올리기`}
                className={cn(
                  'h-1.5',
                  f.status === 'done' && '[&_[data-slot=progress-indicator]]:bg-emerald-500',
                  f.status === 'failed' && '[&_[data-slot=progress-indicator]]:bg-destructive',
                )}
              />
            </div>
            <div className="flex w-24 shrink-0 justify-end text-xs tabular-nums">
              {f.status === 'waiting' && <span className="text-muted-foreground">대기</span>}
              {f.status === 'uploading' && <span className="text-muted-foreground">{f.progress}%</span>}
              {f.status === 'done' && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2Icon aria-hidden className="size-3.5" />
                  완료
                </span>
              )}
              {f.status === 'failed' && (
                <Button
                  variant="outline"
                  size="xs"
                  aria-label={`${f.name} 다시 시도`}
                  className="text-destructive"
                  onClick={() => retry(f.id)}
                >
                  <RotateCwIcon data-icon="inline-start" />
                  다시 시도
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {failed > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircleIcon aria-hidden className="size-3.5 shrink-0" />
          {files
            .filter((f) => f.status === 'failed')
            .map((f) => f.name)
            .join(', ')}
          : 연결이 끊겨 멈췄습니다.
        </p>
      )}
      <p role="status" className="text-sm text-muted-foreground tabular-nums">
        {started ? `${files.length}개 중 ${done}개 완료${failed ? ` · ${failed}개 실패` : ''}` : '올리기 시작을 누르면 네 파일이 함께 올라갑니다.'}
      </p>
    </div>
  )
}

type Todo = { id: number; title: string; done: boolean }
type Answer = { n: number; title: string; ok: boolean }

const TODOS: Todo[] = [
  { id: 1, title: '우유 사기', done: false },
  { id: 2, title: '세탁소 들르기', done: true },
  { id: 3, title: '엄마께 전화하기', done: false },
  { id: 4, title: '운동 30분', done: false },
]

const LATENCY = 900
/** Every third request fails, so the rollback shows up without luck. */
const FAIL_EVERY = 3

/** 7. The screen changes at once; the server answers later and a failure is rolled back. */
export function OptimisticFormat() {
  const [todos, setTodos] = useState(TODOS)
  const [pending, setPending] = useState<number[]>([])
  const [rolledBack, setRolledBack] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [message, setMessage] = useState('항목을 눌러 보세요. 서버 답을 기다리지 않고 바로 바뀝니다.')
  const requests = useRef(0)
  const timers = useRef(new Set<number>())
  const id = useId()

  useEffect(() => {
    const live = timers.current
    return () => live.forEach((t) => window.clearTimeout(t))
  }, [])

  const toggle = (todo: Todo) => {
    if (pending.includes(todo.id)) return
    const next = !todo.done
    const n = ++requests.current

    // 1. change the screen right away, as if the server had already agreed
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: next } : t)))
    setPending((prev) => [...prev, todo.id])
    setRolledBack(null)
    setMessage(`저장 중: ${todo.title}`)

    // 2. the server answers later; on failure, put it back and say so
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      const ok = n % FAIL_EVERY !== 0
      if (!ok) {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !next } : t)))
        setRolledBack(todo.id)
      }
      setPending((prev) => prev.filter((p) => p !== todo.id))
      setAnswers((prev) => [{ n, title: todo.title, ok }, ...prev].slice(0, 4))
      setMessage(ok ? `저장했습니다: ${todo.title}` : `저장하지 못해 되돌렸습니다: ${todo.title}`)
    }, LATENCY)
    timers.current.add(timer)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul aria-label="할 일" className="flex flex-col divide-y rounded-lg border bg-background">
        {todos.map((todo) => {
          const busy = pending.includes(todo.id)
          return (
            <li
              key={todo.id}
              aria-busy={busy || undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 motion-safe:transition-colors',
                rolledBack === todo.id && 'bg-destructive/10',
              )}
            >
              <Checkbox id={`${id}-${todo.id}`} checked={todo.done} onCheckedChange={() => toggle(todo)} />
              <Label
                htmlFor={`${id}-${todo.id}`}
                className={cn('flex-1 font-normal', todo.done && 'text-muted-foreground line-through')}
              >
                {todo.title}
              </Label>
              {busy && <Spinner size="sm" label="저장 중" className="text-muted-foreground" />}
              {rolledBack === todo.id && <span className="text-xs text-destructive">되돌림</span>}
            </li>
          )
        })}
      </ul>
      {answers.length > 0 && (
        <ol aria-label="서버 답" className="flex flex-col gap-1 text-xs text-muted-foreground">
          {answers.map((a) => (
            <li key={a.n} className={cn('tabular-nums', !a.ok && 'text-destructive')}>
              요청 {a.n} · {a.title} · {a.ok ? '성공' : '실패 → 되돌림'}
            </li>
          ))}
        </ol>
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

/** A sunset drawn with gradients, standing in for a photo. */
function Sunset({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('absolute inset-0', className)}
      style={{ background: 'linear-gradient(180deg, #2b2d6e 0%, #8d4a8f 34%, #f07f63 58%, #fbc46d 70%)' }}
    >
      <div
        className="absolute top-[38%] left-[58%] aspect-square w-[18%] rounded-full"
        style={{ background: 'radial-gradient(circle, #fff7d6 0%, #ffd27a 55%, rgb(255 210 122 / 0) 72%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-[26%] h-[32%]"
        style={{
          background: '#6b3f7d',
          clipPath: 'polygon(0 72%, 12% 38%, 24% 56%, 40% 14%, 56% 52%, 70% 30%, 86% 62%, 100% 40%, 100% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-[26%] h-[20%]"
        style={{
          background: '#3c2456',
          clipPath: 'polygon(0 42%, 16% 82%, 32% 30%, 50% 76%, 66% 44%, 84% 86%, 100% 52%, 100% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[26%]"
        style={{ background: 'linear-gradient(180deg, #e9876b 0%, #7a3f7a 45%, #2b2d6e 100%)' }}
      />
      <div
        className="absolute bottom-[6%] left-[60%] h-[17%] w-[16%]"
        style={{
          background: 'repeating-linear-gradient(180deg, rgb(255 236 180 / 0.85) 0 2px, transparent 2px 7px)',
          maskImage: 'linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent)',
        }}
      />
    </div>
  )
}

const ORIGINAL_MS = 2000

/** 8. A tiny blurred preview first, sharpened when the full picture arrives. */
export function BlurUpFormat() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    const timer = window.setTimeout(() => setLoaded(true), ORIGINAL_MS)
    return () => window.clearTimeout(timer)
  }, [loaded])

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <figure className="flex flex-col gap-1.5">
          <div
            role="img"
            aria-label="노을 지는 바다 (빈 칸에서 시작)"
            data-loaded={loaded}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
          >
            {loaded && <Sunset />}
          </div>
          <figcaption className="text-xs text-muted-foreground">빈 칸 → 갑자기 나타남</figcaption>
        </figure>
        <figure className="flex flex-col gap-1.5">
          <div
            role="img"
            aria-label="노을 지는 바다 (흐린 미리보기에서 시작)"
            data-loaded={loaded}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
          >
            {/* the same picture: blurred and slightly enlarged so the soft edges stay outside the frame */}
            <Sunset
              className={
                loaded
                  ? // only sharpening is animated; a reload snaps straight back to the blur
                    'scale-100 blur-[0px] motion-safe:transition-[filter,scale] motion-safe:duration-700 motion-safe:ease-out'
                  : 'scale-110 blur-xl'
              }
            />
            <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white tabular-nums">
              {loaded ? '원본 480KB' : '미리보기 0.4KB'}
            </span>
          </div>
          <figcaption className="text-xs text-muted-foreground">흐린 미리보기 → 선명해짐</figcaption>
        </figure>
      </div>
      <Button variant="outline" className="self-start" disabled={!loaded} onClick={() => setLoaded(false)}>
        <RotateCwIcon data-icon="inline-start" />
        다시 불러오기
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {loaded ? '원본을 받아 선명하게 바꿨습니다.' : '미리보기를 먼저 보여 주고 원본(480KB)을 받는 중…'}
      </p>
    </div>
  )
}
