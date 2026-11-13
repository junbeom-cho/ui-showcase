import { useEffect, useRef, type ReactNode, type Ref } from 'react'
import { ArrowUpIcon, CircleStopIcon, PencilLineIcon, SparklesIcon, SquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Spinner } from '../loading-states/spinners'
import { shownText, type Reply } from './chat'

/** Name a part for the anatomy drawing only. */
const slot = (on: boolean, name: string) => (on ? { 'data-slot': name } : {})

/**
 * A chat window drawn inside the example box. The message list follows new content
 * down, but it is not a live region: streamed text would be read out word by word.
 */
export function ChatPanel({
  children,
  composer,
  title = '여행 도우미',
  className,
}: {
  children: ReactNode
  composer?: ReactNode
  title?: string
  className?: string
}) {
  const log = useRef<HTMLDivElement>(null)
  const height = useRef(0)

  // only when the content grew, so hovering or opening something never yanks the scroll
  useEffect(() => {
    const el = log.current
    if (!el || el.scrollHeight === height.current) return
    height.current = el.scrollHeight
    el.scrollTop = el.scrollHeight
  })

  return (
    <section
      aria-label={title}
      className={cn('flex h-[28rem] w-full max-w-md flex-col overflow-hidden rounded-xl border bg-background shadow-sm', className)}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4 text-sm font-semibold">
        <SparklesIcon aria-hidden className="size-4" />
        {title}
      </header>
      <div ref={log} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {children}
      </div>
      {composer && <div className="shrink-0 border-t p-3">{composer}</div>}
    </section>
  )
}

export function UserMessage({
  children,
  footer,
  pending = false,
  slots = false,
  className,
}: {
  children: ReactNode
  /** under the bubble: attachments, an edit button, a version pager */
  footer?: ReactNode
  pending?: boolean
  slots?: boolean
  className?: string
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="sr-only">내 메시지</span>
      <div
        {...slot(slots, 'ai-user-message')}
        className={cn(
          'max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground',
          pending && 'opacity-60',
          className,
        )}
      >
        {children}
      </div>
      {footer}
    </div>
  )
}

export function AssistantMessage({
  children,
  footer,
  busy = false,
  slots = false,
  className,
}: {
  children: ReactNode
  /** under the answer: actions, sources, follow-up questions */
  footer?: ReactNode
  busy?: boolean
  slots?: boolean
  className?: string
}) {
  return (
    <div className="flex gap-2.5">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-muted">
        <SparklesIcon className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <span className="sr-only">도우미 답변</span>
        <div
          {...slot(slots, 'ai-assistant-message')}
          aria-busy={busy || undefined}
          className={cn('text-sm leading-relaxed', className)}
        >
          {children}
        </div>
        {footer}
      </div>
    </div>
  )
}

/** Three pulsing dots; still when the device asks for less motion. */
export function ThinkingLine({ children = '생각하는 중' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Spinner kind="dots" size="sm" />
      {children}
    </span>
  )
}

/** The block cursor at the end of text that is still arriving. */
export function Caret() {
  return (
    <span
      aria-hidden
      data-slot="ai-caret"
      className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-sm bg-foreground/70 motion-safe:animate-pulse"
    />
  )
}

export function StoppedNote() {
  return (
    <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
      <CircleStopIcon aria-hidden className="size-3.5" />
      답변을 멈췄어요
    </span>
  )
}

/** Whatever a reply is doing right now: thinking, streaming with a cursor, finished or cut off. */
export function ReplyText({ reply }: { reply: Reply }) {
  if (reply.phase === 'thinking') return <ThinkingLine />
  return (
    <>
      <p className="whitespace-pre-wrap">
        {shownText(reply)}
        {reply.phase === 'streaming' && <Caret />}
      </p>
      {reply.phase === 'stopped' && <StoppedNote />}
    </>
  )
}

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy = false,
  canSendEmpty = false,
  above,
  leading,
  inputRef,
  placeholder = '메시지를 입력하세요',
  slots = false,
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  /** shows a stop button in place of send while a reply is coming */
  onStop?: () => void
  busy?: boolean
  /** an attachment alone is enough to send */
  canSendEmpty?: boolean
  /** above the text: attachment chips */
  above?: ReactNode
  /** left of the send button: an attach button */
  leading?: ReactNode
  inputRef?: Ref<HTMLTextAreaElement>
  placeholder?: string
  slots?: boolean
}) {
  const ready = !busy && (canSendEmpty || value.trim() !== '')
  return (
    <form
      {...slot(slots, 'ai-composer')}
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onSend()
      }}
      className="flex flex-col gap-1.5 rounded-2xl border bg-background p-1.5 focus-within:ring-3 focus-within:ring-ring/50"
    >
      {above}
      <Textarea
        ref={inputRef}
        aria-label="메시지"
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter breaks the line; never while a Korean syllable is still being composed
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
        className="max-h-24 min-h-8 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="flex items-center gap-1">
        {leading}
        <span className="flex-1" />
        {busy && onStop ? (
          <Button type="button" size="icon-sm" className="rounded-full" aria-label="정지" onClick={onStop}>
            <SquareIcon className="fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon-sm" className="rounded-full" aria-label="보내기" disabled={!ready}>
            <ArrowUpIcon />
          </Button>
        )}
      </div>
    </form>
  )
}

/** A short status line under a demo; polite, and only ever changes when the phase does. */
export function DemoStatus({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}

/** Ready-made questions: the chip sends it at once, the pencil only puts it in the box to edit first. */
export function SuggestionChips({
  items,
  label,
  onAsk,
  onFill,
  slots = false,
  className,
}: {
  items: string[]
  label: string
  onAsk: (question: string) => void
  onFill?: (question: string) => void
  slots?: boolean
  className?: string
}) {
  const chip =
    'h-8 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'
  return (
    <ul aria-label={label} {...slot(slots, 'ai-suggestions')} className={cn('flex flex-wrap gap-2', className)}>
      {items.map((q) => (
        <li key={q} className="flex items-center rounded-full border bg-background">
          <button
            type="button"
            onClick={() => onAsk(q)}
            className={cn(chip, onFill ? 'rounded-l-full pr-2 pl-3' : 'rounded-full px-3')}
          >
            {q}
          </button>
          {onFill && (
            <button
              type="button"
              aria-label={`‘${q}’ 입력창에 넣기`}
              onClick={() => onFill(q)}
              className={cn(chip, 'grid w-7 place-items-center rounded-r-full border-l text-muted-foreground')}
            >
              <PencilLineIcon aria-hidden className="size-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** A numbered source marker inside an answer; hover or focus shows the source, a press pins it, Escape closes. */
export function CitationMarker({
  n,
  active = false,
  controls,
  onHover,
  onPin,
  onClose,
  slots = false,
}: {
  n: number
  active?: boolean
  controls?: string
  onHover?: (on: boolean) => void
  onPin?: () => void
  onClose?: () => void
  slots?: boolean
}) {
  return (
    <button
      type="button"
      {...slot(slots, 'ai-citation')}
      aria-label={`출처 ${n}`}
      aria-expanded={active}
      aria-controls={controls}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      onClick={onPin}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.()
      }}
      className={cn(
        'mx-0.5 inline-grid h-4 min-w-4 -translate-y-1 place-items-center rounded-full bg-muted px-1 text-[10px] font-semibold tabular-nums outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
        active && 'bg-primary text-primary-foreground',
      )}
    >
      {n}
    </button>
  )
}
