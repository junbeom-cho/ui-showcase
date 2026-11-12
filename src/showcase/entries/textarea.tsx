import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

// Fields sit on graph paper, so give them a solid surface. shadcn's Textarea has
// no hover look of its own; a slightly darker border makes that state visible.
const field = 'bg-background hover:border-foreground/30'

/** Characters as people count them: an emoji counts once, not as two code units. */
const countChars = (text: string) => [...text].length

/** One state cell: the field, then an optional line of text. */
function Cell({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="grid w-full max-w-48 gap-1.5">
      {children}
      {note}
    </div>
  )
}

const SHORT_LIMIT = 20
const tooLong = '오늘 회의는 세 시로 옮겼어요. 자료는 미리 읽어 오세요!'
const delivery = '택배는 문 앞에 두고 벨을 눌러 주세요.'

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Cell><Textarea aria-label="기본" placeholder="메모를 남겨 주세요" className={field} /></Cell> },
        {
          label: '호버',
          node: (
            <Cell>
              <Textarea aria-label="호버" placeholder="메모를 남겨 주세요" data-demo-state="hover" className={field} />
            </Cell>
          ),
        },
        {
          label: '포커스',
          node: (
            <Cell>
              <Textarea aria-label="포커스" placeholder="메모를 남겨 주세요" data-demo-state="focus" className={field} />
            </Cell>
          ),
        },
        { label: '입력됨', node: <Cell><Textarea aria-label="입력됨" defaultValue={delivery} className={field} /></Cell> },
        { label: '비활성', node: <Cell><Textarea aria-label="비활성" defaultValue={delivery} disabled className={field} /></Cell> },
        {
          label: '읽기 전용',
          node: (
            <Cell>
              <Textarea
                aria-label="읽기 전용"
                defaultValue={'주문 A-1029\n결제 완료'}
                readOnly
                className={cn(field, 'bg-muted/60 hover:border-input')}
              />
            </Cell>
          ),
        },
        {
          label: '오류',
          node: (
            <Cell note={<p className="text-xs text-destructive">10자 이상 적어 주세요</p>}>
              <Textarea aria-label="오류" defaultValue="좋아요" aria-invalid className={field} />
            </Cell>
          ),
        },
        {
          label: '글자 수 초과',
          node: (
            <Cell
              note={
                <p className="text-right text-xs font-medium text-destructive tabular-nums">
                  {countChars(tooLong)} / {SHORT_LIMIT}
                </p>
              }
            >
              <Textarea aria-label="글자 수 초과" defaultValue={tooLong} aria-invalid className={field} />
            </Cell>
          ),
        },
      ]}
    />
  )
}

const PREVIEW_LIMIT = 100
const previewNote = '택배는 문 앞에 두고\n벨을 눌러 주세요.'

function TextareaPreview() {
  const id = useId()
  return (
    <div className="grid w-full max-w-64 gap-1.5">
      <Label htmlFor={id}>배송 메모</Label>
      <Textarea id={id} defaultValue={previewNote} className={field} />
      <p className="text-right text-xs text-muted-foreground tabular-nums">
        {countChars(previewNote)} / {PREVIEW_LIMIT}
      </p>
    </div>
  )
}

const INQUIRY_LIMIT = 500

function TextareaSpecimen() {
  const id = useId()
  const [text, setText] = useState('')
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>문의 내용</Label>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="어떤 점이 궁금하신가요?"
        aria-describedby={`${id}-help ${id}-count`}
        className={cn(field, 'min-h-24')}
      />
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <p id={`${id}-help`} data-slot="textarea-description">
          답변은 이메일로 보내 드립니다.
        </p>
        <span id={`${id}-count`} data-slot="textarea-counter" className="shrink-0 tabular-nums">
          {countChars(text)} / {INQUIRY_LIMIT}
        </span>
      </div>
    </div>
  )
}

const BIO_LIMIT = 100
const NEAR_LIMIT = 10

function CharacterCount() {
  const id = useId()
  const [bio, setBio] = useState('주말마다 동네 빵집을 찾아다니는 김하늘입니다. 소금빵을 가장 좋아해요.')
  const count = countChars(bio)
  const left = BIO_LIMIT - count
  const over = left < 0

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={`${id}-bio`}>자기소개</Label>
      {/* no maxLength: a pasted long text stays, and the counter says how much to cut */}
      <Textarea
        id={`${id}-bio`}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        aria-invalid={over ? true : undefined}
        aria-describedby={`${id}-hint ${id}-count`}
        className={field}
      />
      <div className="flex items-start justify-between gap-4 text-xs">
        {over ? (
          <p key="over" id={`${id}-hint`} role="alert" className="text-destructive">
            {-left}자를 줄여 주세요.
          </p>
        ) : (
          <p key="hint" id={`${id}-hint`} className={left <= NEAR_LIMIT ? 'text-amber-600' : 'text-muted-foreground'}>
            {left <= NEAR_LIMIT ? `${left}자 남았습니다.` : '프로필에 보이는 소개 글입니다.'}
          </p>
        )}
        <span
          id={`${id}-count`}
          className={cn('shrink-0 tabular-nums', over ? 'font-medium text-destructive' : 'text-muted-foreground')}
        >
          {count} / {BIO_LIMIT}
        </span>
      </div>
    </div>
  )
}

// field-sizing: content lets the box follow its text with CSS alone; other browsers get a JS fallback
const supportsFieldSizing =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content')

const groceries = ['우유', '달걀', '식빵', '사과', '양파', '두부', '버터', '시금치', '요거트', '커피 원두']

function AutoGrow() {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [list, setList] = useState(groceries.slice(0, 3).join('\n'))
  const [scrolling, setScrolling] = useState(false)
  const items = list.split('\n').filter((line) => line.trim()).length

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!supportsFieldSizing) {
      // shrink first so deleting lines also lowers the box; max-h still caps it
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
    }
    setScrolling(el.scrollHeight > el.clientHeight + 1)
  }, [list])

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={`${id}-list`}>장보기 목록</Label>
      <Textarea
        ref={ref}
        id={`${id}-list`}
        value={list}
        onChange={(e) => setList(e.target.value)}
        aria-describedby={`${id}-help`}
        className={cn(field, 'max-h-40 overflow-y-auto')}
      />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        한 줄에 하나씩 적으세요. 최대 높이(160px)에 닿으면 칸 안에서 스크롤됩니다.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm">
          항목 {items}개 · {scrolling ? '칸 안에서 스크롤됩니다' : '칸이 내용만큼 늘어납니다'}
        </p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setList(groceries.join('\n'))}>
            10개 채우기
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setList('')}>
            비우기
          </Button>
        </div>
      </div>
    </div>
  )
}

type Comment = { id: number; author: string; text: string }

function CommentBox() {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')
  const [comments, setComments] = useState<Comment[]>([{ id: 1, author: '김하늘', text: '사진 색감이 정말 좋네요!' }])
  const canSend = draft.trim().length > 0

  const send = () => {
    if (!canSend) return
    setComments((prev) => [...prev, { id: prev.length + 1, author: '나', text: draft.trim() }])
    setDraft('')
    ref.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // the Enter that finishes a Korean syllable is not a send
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <p role="status" className="text-sm font-medium">
        댓글 {comments.length}개
      </p>
      <ul aria-label="댓글" className="flex flex-col gap-2">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <span className="mr-2 font-medium">{comment.author}</span>
            <span className="whitespace-pre-wrap">{comment.text}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-draft`} className="sr-only">
          댓글 쓰기
        </Label>
        <Textarea
          ref={ref}
          id={`${id}-draft`}
          placeholder="댓글을 남겨 보세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby={`${id}-hint`}
          className={cn(field, 'max-h-32')}
        />
        <div className="flex items-center justify-between gap-3">
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            ⌘/Ctrl + Enter로도 보낼 수 있습니다
          </p>
          <Button size="sm" onClick={send} disabled={!canSend}>
            <SendIcon data-icon="inline-start" />
            보내기
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Live height of an element, so dragging a resize handle shows a number. */
function useHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(Math.round(el.getBoundingClientRect().height)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return height
}

function ResizableField({ resize, title, note }: { resize: 'resize-y' | 'resize-none'; title: string; note: string }) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const height = useHeight(ref)
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>
        <code className="font-mono">{resize}</code>
        <span className="font-normal text-muted-foreground">{title}</span>
      </Label>
      {/* fixed sizing: the height comes from rows and the handle, not from the text */}
      <Textarea
        ref={ref}
        id={id}
        rows={4}
        defaultValue={'오른쪽 아래 모서리를\n끌어 보세요.'}
        aria-describedby={`${id}-note`}
        className={cn(field, 'field-sizing-fixed', resize)}
      />
      <p id={`${id}-note`} className="text-xs text-muted-foreground">
        {note}
        {height > 0 && <span className="tabular-nums"> 지금 높이 {height}px.</span>}
      </p>
    </div>
  )
}

function ResizeHandles() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <ResizableField resize="resize-y" title="세로로만 조절" note="모서리의 손잡이를 끌면 높이가 바뀝니다." />
      <ResizableField resize="resize-none" title="손잡이 없음" note="손잡이가 없어 높이가 그대로입니다." />
    </div>
  )
}

export const textareaEntry: ShowcaseEntry = {
  id: 'textarea',
  name: 'Textarea',
  aliases: ['Text area', 'Multiline text field', 'Multi-line input', '여러 줄 입력', '텍스트 영역', '긴 글 입력창'],
  description: '메모나 댓글처럼 긴 글을 여러 줄로 적어 넣는 칸.',
  category: 'input',
  Preview: TextareaPreview,
  anatomy: {
    Specimen: TextareaSpecimen,
    parts: [
      { slot: 'label', name: 'Label', description: '무엇을 적는 칸인지 알려주는 이름. 누르면 칸에 커서가 들어감' },
      { slot: 'textarea', name: 'Textarea', description: '여러 줄을 적는 칸. Enter를 누르면 보내지 않고 줄이 바뀜' },
      { slot: 'textarea-description', name: 'helper text', description: '칸 아래의 도움말. 잘못 적으면 같은 자리에 오류 메시지가 나옴' },
      { slot: 'textarea-counter', name: 'counter', description: '지금까지 적은 글자 수와 최대 글자 수' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '같은 칸이 놓이는 상태를 나란히 놓았습니다. 호버와 포커스는 마우스나 키보드 없이도 보이도록 고정해 그렸습니다.',
      Demo: States,
    },
    {
      title: '글자 수 세기',
      description: '적은 글자 수를 "37 / 100"처럼 보여 줍니다. 한도를 넘어도 잘라 내지 않고, 얼마나 줄여야 하는지 빨간색으로 알려 줍니다.',
      Demo: CharacterCount,
    },
    {
      title: '자동으로 늘어나는 높이',
      description: '줄이 늘면 칸도 함께 커지다가, 최대 높이에 닿으면 칸 안에서 스크롤됩니다. 줄을 더하거나 지워 보세요.',
      Demo: AutoGrow,
    },
    {
      title: '댓글 작성',
      description: '글을 적어야 보내기 버튼이 켜집니다. Enter는 줄바꿈이고, ⌘/Ctrl+Enter로 바로 보낼 수 있습니다.',
      Demo: CommentBox,
    },
    {
      title: '크기 조절 손잡이',
      description: '오른쪽 아래 모서리를 끌어 높이를 바꾸게 할 수도(resize-y), 손잡이를 없앨 수도(resize-none) 있습니다.',
      Demo: ResizeHandles,
    },
  ],
}
