import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { PageSketch, TimerBar, ToastCard } from './parts'
import { SNACKBAR_DURATION, TOAST_DURATION, TONES, type Tone } from './tones'

type LiveToast = { id: number; tone: Tone; title: string; description: string; action?: string }

const TOAST_PRESETS: Record<Tone, Omit<LiveToast, 'id'>> = {
  info: { tone: 'info', title: '링크를 복사했습니다', description: '붙여 넣어 친구에게 보내 보세요.' },
  success: { tone: 'success', title: '사진을 올렸습니다', description: '앨범 ‘제주 여행’에 3장이 들어갔어요.' },
  warning: { tone: 'warning', title: '연결이 느립니다', description: '원본 사진은 나중에 올라갑니다.' },
  error: { tone: 'error', title: '올리지 못했습니다', description: '파일이 20MB보다 큽니다.', action: '다시 시도' },
}

const MAX_TOASTS = 3

type Place = 'bottom-right' | 'top-center'

/** One live toast: closes itself after TOAST_DURATION, counting only the time it was not paused. */
function ToastItem({
  toast,
  paused,
  place,
  onDismiss,
  onClose,
  onAction,
}: {
  toast: LiveToast
  paused: boolean
  place: Place
  /** stable: the timer effect depends on it */
  onDismiss: (id: number) => void
  onClose: (toast: LiveToast) => void
  onAction: (toast: LiveToast) => void
}) {
  const remaining = useRef(TOAST_DURATION)

  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, toast.id, onDismiss])

  return (
    <li
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0',
        place === 'bottom-right' ? 'motion-safe:slide-in-from-bottom-4' : 'motion-safe:slide-in-from-top-4',
      )}
    >
      <ToastCard
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        action={toast.action}
        onAction={() => onAction(toast)}
        onClose={() => onClose(toast)}
        timer={<TimerBar tone={toast.tone} duration={TOAST_DURATION} paused={paused} />}
      />
    </li>
  )
}

/** 1. Short messages that pile up in a corner and leave by themselves. */
export function ToastFormat() {
  const [toasts, setToasts] = useState<LiveToast[]>([])
  const [sent, setSent] = useState(0)
  const [place, setPlace] = useState<Place>('bottom-right')
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const nextId = useRef(1)
  const paused = (hovered || focused) && toasts.length > 0

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const push = (tone: Tone) => {
    // an emptied stack can leave the pointer "inside" without a mouseleave; start fresh
    if (toasts.length === 0) {
      setHovered(false)
      setFocused(false)
    }
    const toast = { ...TOAST_PRESETS[tone], id: nextId.current++ }
    // only the newest few stay; the oldest gives way
    setToasts((prev) => [...prev, toast].slice(-MAX_TOASTS))
    setSent((n) => n + 1)
  }

  // the focused button goes away with its toast, often without a blur event
  const close = (toast: LiveToast) => {
    setFocused(false)
    dismiss(toast.id)
  }

  const retry = (toast: LiveToast) => {
    close(toast)
    push('success')
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TOAST_PRESETS) as Tone[]).map((tone) => {
            const { icon: Icon, label } = TONES[tone]
            return (
              <Button key={tone} variant="outline" size="sm" onClick={() => push(tone)}>
                <Icon data-icon="inline-start" />
                {label} 알림
              </Button>
            )
          })}
        </div>
        <ToggleGroup
          type="single"
          aria-label="위치"
          variant="outline"
          size="sm"
          value={place}
          onValueChange={(v) => v && setPlace(v as Place)}
        >
          <ToggleGroupItem value="bottom-right" className="px-2.5">
            오른쪽 아래
          </ToggleGroupItem>
          <ToggleGroupItem value="top-center" className="px-2.5">
            위 가운데
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* the toasts sit in a corner of this frame, not of the real window */}
      <div className="relative h-80 overflow-hidden rounded-lg border bg-background">
        <PageSketch />
        <section aria-label="알림" aria-live="polite">
          <ol
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
            }}
            className={cn(
              'absolute z-10 flex w-72 max-w-[calc(100%-1.5rem)] gap-2',
              place === 'bottom-right' ? 'right-3 bottom-3 flex-col' : 'top-3 left-1/2 -translate-x-1/2 flex-col-reverse',
            )}
          >
            {toasts.map((toast) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                paused={paused}
                place={place}
                onDismiss={dismiss}
                onClose={close}
                onAction={retry}
              />
            ))}
          </ol>
        </section>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        화면에 {toasts.length}개 · 보낸 알림 {sent}개{paused ? ' · 멈춤 (마우스나 포커스가 알림 위에 있음)' : ''}
      </p>
    </div>
  )
}

type Note = { id: number; title: string; meta: string }

// every title ends in a final consonant, so ‘…’을 always reads right
const NOTES: Note[] = [
  { id: 1, title: '장보기 목록', meta: '우유, 달걀, 사과' },
  { id: 2, title: '11월 회의록', meta: '다음 회의는 목요일' },
  { id: 3, title: '읽을 책', meta: '3권 남음' },
  { id: 4, title: '여행 준비물', meta: '충전기, 우산' },
]

type Removed = { note: Note; index: number; key: number }

/** 2. One line at the bottom with a single action, here the undo for a delete. */
export function SnackbarFormat() {
  const [notes, setNotes] = useState(NOTES)
  const [removed, setRemoved] = useState<Removed | null>(null)
  const [message, setMessage] = useState('휴지통을 누르면 메모가 지워지고, 5초 동안 되돌릴 수 있습니다.')
  const nextKey = useRef(1)

  // the undo is offered for a while; after that the delete is final
  useEffect(() => {
    if (!removed) return
    const timer = window.setTimeout(() => {
      setRemoved(null)
      setMessage(`‘${removed.note.title}’을 완전히 지웠습니다.`)
    }, SNACKBAR_DURATION)
    return () => window.clearTimeout(timer)
  }, [removed])

  const remove = (note: Note) => {
    const index = notes.findIndex((n) => n.id === note.id)
    setNotes(notes.filter((n) => n.id !== note.id))
    // a newer delete replaces the snackbar; the older one becomes final
    setRemoved({ note, index, key: nextKey.current++ })
    setMessage(`‘${note.title}’을 지웠습니다. 5초 안에 실행 취소할 수 있습니다.`)
  }

  const undo = () => {
    if (!removed) return
    const next = [...notes]
    next.splice(removed.index, 0, removed.note)
    setNotes(next)
    setRemoved(null)
    setMessage(`‘${removed.note.title}’을 되돌렸습니다.`)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="relative h-80 overflow-hidden rounded-lg border bg-background">
        <p className="border-b px-4 py-3 text-sm font-semibold">
          메모 <span className="font-normal text-muted-foreground tabular-nums">{notes.length}</span>
        </p>
        {notes.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">메모가 없습니다</p>
        ) : (
          <ul aria-label="메모 목록" className="divide-y">
            {notes.map((note) => (
              <li key={note.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{note.meta}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${note.title} 지우기`}
                  className="text-muted-foreground"
                  onClick={() => remove(note)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div aria-live="polite" className="absolute inset-x-3 bottom-3">
          {removed && (
            <div
              key={removed.key}
              className="flex items-center gap-2 rounded-lg bg-foreground py-1.5 pr-1.5 pl-4 text-sm text-background shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4"
            >
              <p className="min-w-0 flex-1 truncate">‘{removed.note.title}’을 지웠습니다</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={undo}
                className="font-semibold text-sky-300 hover:bg-background/15 hover:text-sky-200 dark:text-sky-700 dark:hover:bg-background/15 dark:hover:text-sky-800"
              >
                실행 취소
              </Button>
            </div>
          )}
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
