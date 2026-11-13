import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const sameTag = (a: string, b: string) => a.toLocaleLowerCase('ko-KR') === b.toLocaleLowerCase('ko-KR')

type TagOptions = {
  initial?: string[]
  max?: number
  /** text already typed in the field */
  draft?: string
  error?: string
  onAdded?: (added: string[]) => void
}

/** The list of tags plus the text being typed, with the rules for adding and removing. */
function useTags({ initial = [], max = Infinity, draft: firstDraft = '', error: firstError, onAdded }: TagOptions = {}) {
  const [tags, setTags] = useState(initial)
  const [draft, setDraft] = useState(firstDraft)
  const [error, setError] = useState<string | null>(firstError ?? null)
  const [last, setLast] = useState('')

  /** Adds what it can and returns false when something was refused. */
  const add = (texts: string[]) => {
    const next = [...tags]
    const added: string[] = []
    let problem: string | null = null
    for (const raw of texts) {
      const text = raw.trim()
      if (!text) continue
      if (next.some((tag) => sameTag(tag, text))) {
        problem = `‘${text}’ 태그는 이미 있습니다.`
        continue
      }
      if (next.length >= max) {
        problem = `태그는 ${max}개까지 넣을 수 있습니다.`
        break
      }
      next.push(text)
      added.push(text)
    }
    if (added.length > 0) {
      setTags(next)
      setLast(`‘${added.join('’, ‘')}’ 추가`)
      onAdded?.(added)
    }
    setError(problem)
    return problem === null
  }

  const remove = (index: number) => {
    setLast(`‘${tags[index]}’ 삭제`)
    setTags(tags.filter((_, i) => i !== index))
    setError(null)
  }

  /** Typing; a comma (also inside pasted text) turns everything before it into tags. */
  const type = (value: string) => {
    if (!value.includes(',')) {
      setDraft(value)
      setError(null)
      return
    }
    const parts = value.split(',')
    const rest = parts.pop() ?? ''
    add(parts)
    setDraft(rest.trimStart())
  }

  /** Enter: the typed text becomes a tag, or stays put with an error. */
  const commit = () => {
    if (draft.trim() && add([draft])) setDraft('')
  }

  return { tags, draft, setDraft, error, last, max, full: tags.length >= max, add, remove, type, commit }
}

type TagsState = ReturnType<typeof useTags>

type TagFieldProps = {
  state: TagsState
  /** name of the list of tags */
  listLabel: string
  inputId?: string
  placeholder?: string
  disabled?: boolean
  describedBy?: string
  /** pins the focus look for the state gallery */
  demoFocus?: boolean
  tagClassName?: (tag: string) => string
  /** extra props for the text field; its onKeyDown runs first and may preventDefault */
  inputProps?: ComponentProps<'input'>
}

function TagField({
  state,
  listLabel,
  inputId,
  placeholder,
  disabled = false,
  describedBy,
  demoFocus = false,
  tagClassName,
  inputProps,
}: TagFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { tags, draft, error } = state

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Korean IME: Enter while a syllable is still being composed only finishes the syllable
    if (e.nativeEvent.isComposing) return
    inputProps?.onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === 'Enter') {
      e.preventDefault()
      state.commit()
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      e.preventDefault()
      state.remove(tags.length - 1)
    }
  }

  return (
    <div
      data-slot="tag-input"
      data-invalid={error ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-demo-state={demoFocus ? 'focus' : undefined}
      // clicking the empty part of the box puts the caret in the field, as in a normal input
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus()
      }}
      className={cn(
        'flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-1.5 py-1 text-sm transition-colors',
        !disabled && 'hover:border-foreground/30',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        // the box itself never takes focus; this draws the pinned focus look (data-demo-state)
        'focus:border-ring focus:ring-3 focus:ring-ring/50',
        'data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
      )}
    >
      {tags.length > 0 && (
        <ul aria-label={listLabel} className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge
              asChild
              key={tag}
              variant="secondary"
              className={cn('h-6 gap-0.5 rounded-md text-xs', !disabled && 'pr-0.5', tagClassName?.(tag))}
            >
              <li data-slot="tag">
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    data-slot="tag-remove"
                    aria-label={`${tag} 삭제`}
                    onClick={() => {
                      state.remove(index)
                      inputRef.current?.focus() // the button is gone, so keep the caret nearby
                    }}
                    className="grid size-5 place-items-center rounded-sm opacity-60 outline-none hover:bg-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </li>
            </Badge>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        id={inputId}
        data-slot="tag-input-field"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
        value={draft}
        onChange={(e) => {
          inputProps?.onChange?.(e)
          state.type(e.target.value)
        }}
        onKeyDown={onKeyDown}
        className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  )
}

/** A live tag input for one cell of the state gallery. */
function StateCell({ label, note, disabled, demoFocus, ...options }: TagOptions & {
  label: string
  note?: (state: TagsState) => string
  disabled?: boolean
  demoFocus?: boolean
}) {
  const state = useTags(options)
  return (
    <div className="grid w-full max-w-64 gap-1.5">
      <TagField
        state={state}
        listLabel={`${label} 태그`}
        disabled={disabled}
        demoFocus={demoFocus}
        placeholder={state.full ? `최대 ${state.max}개` : '태그 입력'}
        inputProps={{ 'aria-label': label }}
      />
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : (
        note && <p className="text-xs text-muted-foreground tabular-nums">{note(state)}</p>
      )}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '빈칸', node: <StateCell label="빈칸" /> },
        { label: '태그 있음', node: <StateCell label="태그 있음" initial={['디자인', '개발']} /> },
        { label: '포커스', node: <StateCell label="포커스" initial={['디자인']} demoFocus /> },
        {
          label: '최대 개수',
          node: (
            <StateCell
              label="최대 개수"
              initial={['디자인', '개발', '기획']}
              max={3}
              note={(s) => `${s.tags.length} / ${s.max}`}
            />
          ),
        },
        {
          label: '오류 (중복)',
          node: (
            <StateCell
              label="오류"
              initial={['디자인', '개발']}
              draft="디자인"
              error="‘디자인’ 태그는 이미 있습니다."
            />
          ),
        },
        { label: '비활성', node: <StateCell label="비활성" initial={['디자인', '개발']} disabled /> },
      ]}
    />
  )
}

function TagInputPreview() {
  const state = useTags({ initial: ['React', 'TypeScript', 'Vite'] })
  return (
    <div className="w-full max-w-60">
      <TagField state={state} listLabel="기술" placeholder="추가" inputProps={{ 'aria-label': '기술' }} />
    </div>
  )
}

function TagInputSpecimen() {
  const id = useId()
  const state = useTags({ initial: ['디자인', '개발', '기획'] })
  return (
    <div className="grid w-80 max-w-full gap-2">
      <Label htmlFor={id}>관심 분야</Label>
      <TagField state={state} listLabel="관심 분야" inputId={id} placeholder="입력 후 엔터" describedBy={`${id}-help`} />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        엔터나 쉼표로 하나씩 넣습니다.
      </p>
    </div>
  )
}

const kbd = 'rounded border bg-muted px-1 font-mono text-[11px]'

function AddAndRemove() {
  const id = useId()
  const state = useTags({ initial: ['여행', '맛집'] })
  const { tags } = state

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>여행 태그</Label>
      <TagField state={state} listLabel="여행 태그" inputId={id} placeholder="예: 제주" describedBy={`${id}-help`} />
      <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">
        <kbd className={kbd}>Enter</kbd> 나 <kbd className={kbd}>,</kbd> 로 추가 · 빈칸에서 <kbd className={kbd}>Backspace</kbd>{' '}
        로 마지막 태그 삭제 · ×로 하나씩 삭제
      </p>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      <p role="status" className="text-xs">
        태그 {tags.length}개{tags.length > 0 && `: ${tags.join(', ')}`}
        {state.last && <span className="text-muted-foreground"> · 방금 {state.last}</span>}
      </p>
    </div>
  )
}

const skills = [
  'React',
  'TypeScript',
  'JavaScript',
  'Tailwind CSS',
  'Vite',
  'Vitest',
  'Next.js',
  'Node.js',
  'Figma',
  '디자인 시스템',
  '접근성',
  '애니메이션',
]

/** The suggestion text with the typed part in bold. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const at = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase())
  if (!query || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold">{text.slice(at, at + query.length)}</strong>
      {text.slice(at + query.length)}
    </>
  )
}

function Suggestions() {
  const id = useId()
  const listId = `${id}-suggestions`
  const state = useTags({ initial: ['React'] })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const query = state.draft.trim()
  const matches = query
    ? skills
        .filter((s) => s.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
        .filter((s) => !state.tags.some((tag) => sameTag(tag, s)))
        .slice(0, 6)
    : []
  const expanded = open && matches.length > 0

  const pick = (skill: string) => {
    if (state.add([skill])) state.setDraft('')
    setActive(-1)
  }

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>기술 스택</Label>
      <TagField
        state={state}
        listLabel="기술 스택"
        inputId={id}
        placeholder="예: type"
        inputProps={{
          role: 'combobox',
          'aria-autocomplete': 'list',
          'aria-expanded': expanded,
          'aria-controls': listId,
          'aria-activedescendant': expanded && active >= 0 ? `${listId}-${active}` : undefined,
          onFocus: () => setOpen(true),
          onBlur: () => setOpen(false),
          onChange: () => {
            setOpen(true)
            setActive(-1)
          },
          onKeyDown: (e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setActive(-1)
              return
            }
            if (matches.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => (a + 1) % matches.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => (a <= 0 ? matches.length - 1 : a - 1))
            } else if (e.key === 'Enter' && expanded && active >= 0) {
              e.preventDefault()
              pick(matches[active])
            }
          },
        }}
      />
      <ul
        role="listbox"
        id={listId}
        aria-label="추천 기술"
        hidden={!expanded}
        className="flex flex-col gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
      >
        {matches.map((skill, i) => (
          <li
            key={skill}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // keep the caret in the field while clicking
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(skill)}
            onMouseEnter={() => setActive(i)}
            className={cn('cursor-pointer rounded-md px-2 py-1.5 text-sm', i === active && 'bg-muted')}
          >
            <Highlighted text={skill} query={query} />
          </li>
        ))}
      </ul>
      {query && matches.length === 0 && (
        <p className="text-xs text-muted-foreground">추천에 없는 이름입니다. 엔터를 누르면 그대로 추가합니다.</p>
      )}
      <p role="status" className="text-xs">
        태그 {state.tags.length}개{state.tags.length > 0 && `: ${state.tags.join(', ')}`}
      </p>
    </div>
  )
}

const CITY_MAX = 5

function LimitAndDuplicates() {
  const id = useId()
  const state = useTags({ initial: ['서울', '부산', '제주'], max: CITY_MAX })
  const count = state.tags.length

  return (
    <div className="grid w-full max-w-sm gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={id}>가 보고 싶은 도시</Label>
        <span id={`${id}-count`} className="text-xs text-muted-foreground tabular-nums">
          {count} / {CITY_MAX}
        </span>
      </div>
      <TagField
        state={state}
        listLabel="가 보고 싶은 도시"
        inputId={id}
        placeholder={state.full ? '더 넣으려면 하나를 지우세요' : '도시 이름'}
        describedBy={`${id}-count ${state.error ? `${id}-error` : `${id}-help`}`}
      />
      {state.error ? (
        <p key="error" id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : (
        <p key="help" id={`${id}-help`} className="text-xs text-muted-foreground">
          같은 도시는 한 번만 넣을 수 있습니다.
        </p>
      )}
      <p role="status" className="text-xs">
        {state.full ? `가득 찼습니다 (${CITY_MAX}개)` : `${CITY_MAX - count}개 더 넣을 수 있습니다`}
      </p>
    </div>
  )
}

const labelColors = [
  { value: 'red', name: '빨강', chip: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  { value: 'amber', name: '노랑', chip: 'bg-amber-100 text-amber-900', dot: 'bg-amber-400' },
  { value: 'green', name: '초록', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'blue', name: '파랑', chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  { value: 'violet', name: '보라', chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
]
const colorById = (value: string) => labelColors.find((c) => c.value === value) ?? labelColors[3]

function ColorLabels() {
  const id = useId()
  const [color, setColor] = useState('blue')
  const [colors, setColors] = useState<Record<string, string>>({ 버그: 'red', 문서: 'green' })
  const state = useTags({
    initial: ['버그', '문서'],
    // a new label takes the colour chosen at the moment it is added
    onAdded: (added) => setColors((prev) => ({ ...prev, ...Object.fromEntries(added.map((tag) => [tag, color])) })),
  })
  const colorOf = (tag: string) => colorById(colors[tag] ?? 'blue')

  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <span id={`${id}-color`} className="text-sm font-medium">
          새 라벨 색
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-labelledby={`${id}-color`}
          value={color}
          onValueChange={(next) => next && setColor(next)}
        >
          {labelColors.map((c) => (
            <ToggleGroupItem key={c.value} value={c.value} aria-label={c.name} className="bg-background">
              <span aria-hidden className={cn('size-3.5 rounded-full', c.dot)} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>라벨</Label>
        <TagField
          state={state}
          listLabel="라벨"
          inputId={id}
          placeholder={`${colorById(color).name} 라벨 이름`}
          tagClassName={(tag) => colorOf(tag).chip}
        />
        {state.error && (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <div className="rounded-lg border bg-background p-3">
        <p className="text-sm font-medium">#128 로그인 버튼이 눌리지 않아요</p>
        <p className="mt-0.5 text-xs text-muted-foreground">이슈 목록에서 보이는 모습</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {state.tags.map((tag) => (
            <span key={tag} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colorOf(tag).chip)}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <p role="status" className="text-xs">
        라벨 {state.tags.length}개
        {state.tags.length > 0 && `: ${state.tags.map((tag) => `${tag}(${colorOf(tag).name})`).join(', ')}`}
      </p>
    </div>
  )
}

export const tagInputEntry: ShowcaseEntry = {
  id: 'tag-input',
  name: 'Tag Input',
  aliases: ['Chip input', 'Tags input', 'Tags', 'Token field', 'Multi-value input', '태그 입력', '칩 입력'],
  description: '짧은 값을 적을 때마다 작은 태그로 바꿔 한 칸 안에 여러 개 모아 두는 입력칸.',
  category: 'input',
  Preview: TagInputPreview,
  anatomy: {
    Specimen: TagInputSpecimen,
    parts: [
      {
        slot: 'tag-input',
        name: 'TagInput',
        description: '태그와 글자 칸을 함께 담은 상자. 입력칸처럼 생겼고 빈 곳을 눌러도 커서가 들어감',
      },
      { slot: 'tag', name: 'Tag', description: '넣은 값 하나. 작은 배지(Badge) 모양' },
      { slot: 'tag-remove', name: 'TagRemove', description: '태그 하나를 빼는 × 버튼' },
      { slot: 'tag-input-field', name: 'TagInputField', description: '새 태그를 적는 칸. 엔터나 쉼표를 치면 태그가 됨' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '태그 입력칸이 놓이는 상태를 나란히 놓았습니다. 칸마다 직접 적고 지워 볼 수 있습니다. 오류 칸은 이미 있는 태그를 또 넣으려 한 모습입니다.',
      Demo: States,
    },
    {
      title: '추가와 삭제',
      description:
        '엔터나 쉼표로 태그를 만들고, 빈칸에서 백스페이스를 누르면 마지막 태그가 지워집니다. "강릉, 속초"처럼 쉼표가 든 글을 붙여 넣으면 한 번에 여러 개가 들어갑니다.',
      Demo: AddAndRemove,
    },
    {
      title: '추천 목록에서 고르기',
      description:
        '적는 동안 맞는 추천을 아래에 보여 줍니다(자동 완성). ↑↓로 옮기고 엔터로 고르거나 마우스로 누릅니다. 이름을 통일하고 싶을 때 쓰고, 추천에 없는 이름도 엔터로 넣을 수 있습니다.',
      Demo: Suggestions,
    },
    {
      title: '개수 제한과 중복 막기',
      description:
        '넣을 수 있는 개수를 칸 위에 "3 / 5"처럼 보여 주고, 같은 태그나 넘치는 태그는 막으면서 이유를 알려 줍니다. 부산을 또 넣거나 5개를 넘겨 보세요.',
      Demo: LimitAndDuplicates,
    },
    {
      title: '색 있는 태그 (라벨)',
      description:
        '이슈 관리 도구의 라벨처럼 태그마다 색을 붙입니다. 색을 고른 다음 이름을 적어 넣으면 아래 이슈 카드에 그 색으로 붙습니다. 색만으로 뜻을 전하지 말고 이름을 함께 보여 주세요.',
      Demo: ColorLabels,
    },
  ],
}
