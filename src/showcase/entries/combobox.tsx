import { useEffect, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { CommandLoading } from 'cmdk'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  XIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const cities = [
  '서울', '부산', '인천', '대구', '대전', '광주', '울산', '세종', '수원', '고양', '용인',
  '창원', '성남', '청주', '부천', '화성', '전주', '천안', '김해', '포항', '제주',
]

// The trigger is an outline button that reads like a field: normal weight, value on the left.
const triggerClass = 'w-full justify-between font-normal'
// The list is as wide as the trigger (or the anchor around it), never narrower than its items.
const contentClass = 'w-(--radix-popover-trigger-width) min-w-48 p-0'

type TriggerProps = Omit<ComponentProps<typeof Button>, 'value' | 'defaultValue' | 'onChange'>

/** The shadcn combobox: a Popover whose content is a Command (search field + filtered list). */
function SingleCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  searchLabel,
  className,
  ...trigger
}: {
  items: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  searchLabel: string
} & TriggerProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn(triggerClass, className)} {...trigger}>
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || placeholder}</span>
          <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={contentClass}>
        <Command label={searchLabel}>
          <CommandInput placeholder={searchLabel} />
          <CommandList label="선택지">
            <CommandEmpty>결과 없음</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  data-checked={item === value}
                  onSelect={() => {
                    // choosing the current value again clears it
                    onValueChange(item === value ? '' : item)
                    setOpen(false)
                  }}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** One closed combobox per gallery cell; trigger props (pinned state, aria-invalid) go to the trigger. */
function OneCombobox({ defaultValue = '', ...trigger }: { defaultValue?: string } & TriggerProps) {
  const [value, setValue] = useState(defaultValue)
  return (
    <SingleCombobox
      items={cities}
      value={value}
      onValueChange={setValue}
      placeholder="도시 선택"
      searchLabel="도시 검색"
      className="w-40"
      {...trigger}
    />
  )
}

/*
 * Drawings of an open combobox copy the look of the shadcn parts. A live list
 * would portal to <body>, where the gallery and the anatomy could not show it.
 */
const drawnTrigger =
  'flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-border bg-muted py-2 pr-2 pl-2.5 text-sm whitespace-nowrap'
const drawnContent =
  'flex w-full flex-col rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'
const drawnSearch = 'flex h-8 items-center gap-2 rounded-lg border border-input/30 bg-input/30 px-2 text-sm'
const drawnHeading = 'px-2 py-1.5 text-xs font-medium text-muted-foreground'

function DrawnItem({
  chosen = false,
  highlighted = false,
  className,
  children,
  ...props
}: { chosen?: boolean; highlighted?: boolean } & ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm', highlighted && 'bg-muted', className)}
      {...props}
    >
      {children}
      {chosen && <CheckIcon className="ml-auto size-4" />}
    </div>
  )
}

/** The search field as drawn: typed text with a caret, or the placeholder. */
function DrawnSearch({ query, ...props }: { query?: string } & ComponentProps<'div'>) {
  return (
    <div className={drawnSearch} {...props}>
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      {query ? (
        <span className="flex items-center">
          {query}
          <span className="ml-px h-4 w-px bg-foreground" />
        </span>
      ) : (
        <span className="text-muted-foreground">도시 검색</span>
      )}
    </div>
  )
}

type DrawnRow = { label: string; chosen?: boolean; highlighted?: boolean }

/** Static drawing of an open combobox, in the state the rows and query describe. */
function DrawnCombobox({ label, value, query, rows }: { label: string; value?: string; query?: string; rows: DrawnRow[] }) {
  return (
    <div role="img" aria-label={label} className="flex w-44 flex-col gap-1">
      <div className={drawnTrigger}>
        <span className={cn(!value && 'text-muted-foreground')}>{value ?? '도시 선택'}</span>
        <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
      </div>
      <div className={drawnContent}>
        <div className="p-1 pb-0">
          <DrawnSearch query={query} />
        </div>
        {rows.length > 0 ? (
          <div className="p-1">
            {rows.map((row) => (
              <DrawnItem key={row.label} chosen={row.chosen} highlighted={row.highlighted}>
                {row.label}
              </DrawnItem>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm">결과 없음</p>
        )}
      </div>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '닫힘', node: <OneCombobox aria-label="닫힘" /> },
        { label: '값 있음', node: <OneCombobox aria-label="값 있음" defaultValue="서울" /> },
        { label: '호버', node: <OneCombobox aria-label="호버" defaultValue="서울" data-demo-state="hover" /> },
        { label: '포커스', node: <OneCombobox aria-label="포커스" defaultValue="서울" data-demo-state="focus" /> },
        { label: '비활성', node: <OneCombobox aria-label="비활성" defaultValue="서울" disabled /> },
        { label: '오류', node: <OneCombobox aria-label="오류" aria-invalid /> },
        {
          label: '열림',
          node: (
            <DrawnCombobox
              label="열린 목록: 서울이 골라져 있고 부산이 강조됨"
              value="서울"
              rows={[
                { label: '서울', chosen: true },
                { label: '부산', highlighted: true },
                { label: '인천' },
                { label: '대구' },
              ]}
            />
          ),
        },
        {
          label: '검색 중',
          node: (
            <DrawnCombobox
              label="검색 중: '부'로 거른 목록"
              query="부"
              rows={[{ label: '부산', highlighted: true }, { label: '부천' }]}
            />
          ),
        },
        {
          label: '결과 없음',
          node: <DrawnCombobox label="결과 없음: '런던'에 맞는 도시가 없음" query="런던" rows={[]} />,
        },
      ]}
    />
  )
}

function ComboboxPreview() {
  const id = useId()
  const [value, setValue] = useState('서울')
  return (
    <div className="flex w-full max-w-44 flex-col gap-2">
      <Label htmlFor={id}>도시</Label>
      <SingleCombobox
        id={id}
        items={cities}
        value={value}
        onValueChange={setValue}
        placeholder="도시 선택"
        searchLabel="도시 검색"
      />
    </div>
  )
}

/** Static drawing of an open combobox; a live one would portal to <body>. */
function ComboboxSpecimen() {
  return (
    <div className="flex w-60 flex-col gap-1.5">
      <div data-slot="popover-trigger" className={drawnTrigger}>
        서울
        <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
      </div>
      <div data-slot="popover-content" className={drawnContent}>
        <div className="p-1 pb-0">
          <DrawnSearch data-slot="command-input" />
        </div>
        <div data-slot="command-group" className="p-1">
          <p className={drawnHeading}>수도권</p>
          <DrawnItem data-slot="command-item" chosen>
            서울
          </DrawnItem>
          <DrawnItem>인천</DrawnItem>
        </div>
        <div data-slot="command-separator" className="-mx-1 h-px bg-border" />
        <div className="p-1">
          <p className={drawnHeading}>영남</p>
          <DrawnItem highlighted>부산</DrawnItem>
          <DrawnItem>대구</DrawnItem>
        </div>
      </div>
    </div>
  )
}

function PickOne() {
  const id = useId()
  const [value, setValue] = useState('')
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <Label htmlFor={id}>도시</Label>
      <SingleCombobox
        id={id}
        items={cities}
        value={value}
        onValueChange={setValue}
        placeholder="도시 선택"
        searchLabel="도시 검색"
      />
      <p role="status" className="text-xs text-muted-foreground">
        {value ? `${value}을(를) 골랐습니다.` : `도시 ${cities.length}곳 중 하나를 찾아 고르세요.`}
      </p>
    </div>
  )
}

const topics = ['디자인', '개발', '기획', '마케팅', '데이터', '영상', '사진', '글쓰기', '음악', '교육', '운동', '요리']

function PickMany() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState(['디자인', '개발'])
  const toggle = (topic: string) =>
    setChosen((list) => (list.includes(topic) ? list.filter((t) => t !== topic) : [...list, topic]))

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Label htmlFor={id}>관심 분야</Label>
      <Popover open={open} onOpenChange={setOpen}>
        {/* the list lines up with the whole box of badges, not just the button inside it */}
        <PopoverAnchor asChild>
          <div className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 pl-1.5">
            {chosen.map((topic) => (
              <Badge key={topic} variant="secondary" className="h-6 gap-0.5 pr-0.5 pl-2">
                {topic}
                <button
                  type="button"
                  aria-label={`${topic} 빼기`}
                  onClick={() => toggle(topic)}
                  className="grid size-5 place-items-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
            <PopoverTrigger asChild>
              <Button id={id} variant="ghost" size="sm" role="combobox" className="ml-auto font-normal text-muted-foreground">
                {chosen.length > 0 ? '더 고르기' : '분야 고르기'}
                <ChevronsUpDownIcon data-icon="inline-end" />
              </Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className={contentClass}>
          <Command label="분야 검색">
            <CommandInput placeholder="분야 검색" />
            <CommandList label="분야">
              <CommandEmpty>결과 없음</CommandEmpty>
              <CommandGroup>
                {topics.map((topic) => (
                  // no setOpen(false): the list stays open while several are picked
                  <CommandItem key={topic} value={topic} data-checked={chosen.includes(topic)} onSelect={() => toggle(topic)}>
                    {topic}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-xs text-muted-foreground">
        {chosen.length > 0 ? `${chosen.length}개 고름: ${chosen.join(', ')}` : '하나도 고르지 않았습니다.'}
      </p>
    </div>
  )
}

const lines = [
  { region: '수도권', stations: ['서울', '용산', '광명', '수원'] },
  { region: '충청', stations: ['천안아산', '오송', '대전'] },
  { region: '영남', stations: ['동대구', '신경주', '울산', '부산'] },
  { region: '호남', stations: ['익산', '광주송정', '목포'] },
]

function GroupsAndRecent() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [value, setValue] = useState('')
  const [recent, setRecent] = useState(['부산', '대전'])

  const openChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery('')
  }
  const pick = (station: string) => {
    setValue(station)
    setRecent((list) => [station, ...list.filter((s) => s !== station)].slice(0, 3))
    openChange(false)
  }

  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <Label htmlFor={id}>도착역</Label>
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" role="combobox" className={triggerClass}>
            <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || '역 선택'}</span>
            <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={contentClass}>
          <Command label="역 이름 검색">
            <CommandInput placeholder="역 이름 검색" value={query} onValueChange={setQuery} />
            <CommandList label="역">
              <CommandEmpty>결과 없음</CommandEmpty>
              {/* recent picks only help before typing; a search shows each station once */}
              {!query && (
                <>
                  <CommandGroup heading="최근 고른 역">
                    {recent.map((station) => (
                      <CommandItem
                        key={station}
                        value={`최근 ${station}`}
                        data-checked={station === value}
                        onSelect={() => pick(station)}
                      >
                        <HistoryIcon className="text-muted-foreground" />
                        {station}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {lines.map((line) => (
                <CommandGroup key={line.region} heading={line.region}>
                  {line.stations.map((station) => (
                    <CommandItem key={station} value={station} data-checked={station === value} onSelect={() => pick(station)}>
                      {station}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-xs text-muted-foreground">
        {value ? `도착역: ${value}` : '도착역을 골라 주세요.'}
      </p>
    </div>
  )
}

function CreateNew() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [labels, setLabels] = useState(['버그', '기능 요청', '문서', '질문'])
  const [value, setValue] = useState('')
  const [created, setCreated] = useState('')
  const [query, setQuery] = useState('')
  const name = query.trim()
  const canCreate = name !== '' && !labels.includes(name)

  const openChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery('')
  }
  const choose = (label: string) => {
    setValue(label)
    setCreated('')
    openChange(false)
  }
  const create = () => {
    setLabels((list) => [...list, name])
    setValue(name)
    setCreated(name)
    openChange(false)
  }

  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <Label htmlFor={id}>라벨</Label>
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" role="combobox" className={triggerClass}>
            <span className={cn('flex items-center gap-1.5 truncate', !value && 'text-muted-foreground')}>
              {value && <TagIcon className="text-muted-foreground" />}
              {value || '라벨 선택'}
            </span>
            <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={contentClass}>
          <Command label="라벨 검색">
            <CommandInput placeholder="찾거나 새 이름 쓰기" value={query} onValueChange={setQuery} />
            <CommandList label="라벨">
              <CommandGroup>
                {labels.map((label) => (
                  <CommandItem key={label} value={label} data-checked={label === value} onSelect={() => choose(label)}>
                    <TagIcon className="text-muted-foreground" />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {/* forceMount: the filter would hide this row, but it must show whatever was typed */}
              {canCreate && (
                <CommandGroup forceMount>
                  <CommandItem value={`새 라벨 ${name}`} onSelect={create}>
                    <PlusIcon />
                    &apos;{name}&apos; 추가
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-xs text-muted-foreground">
        {created
          ? `'${created}' 라벨을 새로 만들어 골랐습니다. 이제 목록에도 있습니다.`
          : value
            ? `라벨: ${value}`
            : '목록에 없는 이름을 쳐 보세요.'}
      </p>
    </div>
  )
}

type Person = { id: string; name: string; team: string }

const people: Person[] = [
  { id: 'p01', name: '김하늘', team: '디자인팀' },
  { id: 'p02', name: '김민준', team: '개발팀' },
  { id: 'p03', name: '이서연', team: '기획팀' },
  { id: 'p04', name: '박지훈', team: '개발팀' },
  { id: 'p05', name: '최유진', team: '마케팅팀' },
  { id: 'p06', name: '정다은', team: '디자인팀' },
  { id: 'p07', name: '강도윤', team: '데이터팀' },
  { id: 'p08', name: '조서준', team: '개발팀' },
  { id: 'p09', name: '윤하린', team: '인사팀' },
  { id: 'p10', name: '장민서', team: '기획팀' },
  { id: 'p11', name: '임지아', team: '영업팀' },
  { id: 'p12', name: '오수아', team: '개발팀' },
  { id: 'p13', name: '서지호', team: '데이터팀' },
  { id: 'p14', name: '신채원', team: '마케팅팀' },
]

// The search waits until typing pauses, then the pretend server takes a moment to answer.
const DEBOUNCE_MS = 300
const LATENCY_MS = 600

const findPeople = (query: string) => people.filter((p) => p.name.includes(query) || p.team.includes(query))

type Phase = 'idle' | 'typing' | 'loading' | 'done'

function ServerSearch() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<Person[]>([])
  const [requests, setRequests] = useState(0)
  const [chosen, setChosen] = useState<Person | null>(null)

  const changeQuery = (next: string) => {
    setQuery(next)
    setPhase(next.trim() ? 'typing' : 'idle')
  }
  const openChange = (next: boolean) => {
    setOpen(next)
    if (!next) changeQuery('')
  }

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let reply: ReturnType<typeof setTimeout> | undefined
    // each keystroke cancels the previous wait, so fast typing sends one request
    const wait = setTimeout(() => {
      setRequests((n) => n + 1)
      setPhase('loading')
      reply = setTimeout(() => {
        setResults(findPeople(q))
        setPhase('done')
      }, LATENCY_MS)
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(wait)
      clearTimeout(reply)
    }
  }, [query])

  const row = 'flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'

  return (
    <div className="flex w-full max-w-64 flex-col gap-2">
      <Label htmlFor={id}>담당자</Label>
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" role="combobox" className={triggerClass}>
            <span className={cn('truncate', !chosen && 'text-muted-foreground')}>
              {chosen ? `${chosen.name} · ${chosen.team}` : '사람 찾기'}
            </span>
            <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={contentClass}>
          {/* shouldFilter={false}: the server already filtered, the list shows what came back */}
          <Command label="이름이나 팀 검색" shouldFilter={false}>
            <CommandInput placeholder="이름이나 팀 검색" value={query} onValueChange={changeQuery} />
            <CommandList label="검색 결과">
              {phase === 'idle' && <p className={row}>이름이나 팀을 쳐 보세요</p>}
              {phase === 'typing' && <p className={row}>입력이 멈추길 기다리는 중…</p>}
              {phase === 'loading' && (
                <CommandLoading label="찾는 중" className={row}>
                  <span className="flex items-center gap-2">
                    <Loader2Icon className="size-4 motion-safe:animate-spin" />
                    찾는 중…
                  </span>
                </CommandLoading>
              )}
              {phase === 'done' && <CommandEmpty>결과 없음</CommandEmpty>}
              {phase === 'done' && results.length > 0 && (
                <CommandGroup heading={`결과 ${results.length}명`}>
                  {results.map((person) => (
                    <CommandItem
                      key={person.id}
                      value={person.id}
                      data-checked={person.id === chosen?.id}
                      onSelect={() => {
                        setChosen(person)
                        openChange(false)
                      }}
                    >
                      {person.name}
                      <span className="text-xs text-muted-foreground">{person.team}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-xs text-muted-foreground">
        {chosen ? `담당자: ${chosen.name} (${chosen.team})` : '이름이나 팀으로 찾아 고르세요. 예: 개발'}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">서버 요청 {requests}번</p>
    </div>
  )
}

const sortOrders = ['최신순', '인기순', '낮은 가격순', '높은 가격순']
const countries = [
  '대한민국', '일본', '중국', '대만', '미국', '캐나다', '멕시코', '브라질', '아르헨티나', '영국', '프랑스',
  '독일', '이탈리아', '스페인', '포르투갈', '네덜란드', '벨기에', '스위스', '오스트리아', '스웨덴', '노르웨이',
  '핀란드', '덴마크', '폴란드', '체코', '그리스', '튀르키예', '이집트', '남아프리카공화국', '인도', '태국',
  '베트남', '인도네시아', '필리핀', '말레이시아', '싱가포르', '호주', '뉴질랜드',
]

function ComparePanel({ notes, children }: { notes: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      {children}
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function SelectComparison() {
  const id = useId()
  const [sort, setSort] = useState(sortOrders[0])
  const [country, setCountry] = useState('')
  return (
    <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
      <ComparePanel notes={['선택지 4개가 한눈에 다 보여 검색칸이 오히려 거추장스럽습니다.', '정렬·크기·상태처럼 짧고 늘 같은 목록에 맞습니다.']}>
        <Label htmlFor={`${id}-sort`}>Select · 정렬</Label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger id={`${id}-sort`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOrders.map((order) => (
              <SelectItem key={order} value={order}>
                {order}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs">고른 값: {sort}</p>
      </ComparePanel>
      <ComparePanel
        notes={[`나라가 ${countries.length}개라 스크롤보다 이름 몇 글자를 치는 쪽이 빠릅니다.`, '사용자가 답을 이미 알고 찾아가는 긴 목록에 맞습니다.']}
      >
        <Label htmlFor={`${id}-country`}>Combobox · 나라</Label>
        <SingleCombobox
          id={`${id}-country`}
          items={countries}
          value={country}
          onValueChange={setCountry}
          placeholder="나라 선택"
          searchLabel="나라 검색"
        />
        <p className="text-xs">고른 값: {country || '없음'}</p>
      </ComparePanel>
    </div>
  )
}

export const comboboxEntry: ShowcaseEntry = {
  id: 'combobox',
  name: 'Combobox',
  aliases: ['Autocomplete', 'Searchable select', 'Autosuggest', 'Typeahead', '콤보박스', '자동완성 선택', '검색 선택 상자'],
  description: '글자를 쳐서 긴 목록을 거른 뒤 값을 고르는, 검색칸이 달린 선택 상자.',
  category: 'input',
  Preview: ComboboxPreview,
  anatomy: {
    Specimen: ComboboxSpecimen,
    parts: [
      { slot: 'popover-trigger', name: 'PopoverTrigger', description: '고른 값을 보여 주는 버튼. 누르면 아래 상자가 열림' },
      { slot: 'popover-content', name: 'PopoverContent', description: '떠오르는 상자. 안에 Command(검색칸과 목록)를 담음' },
      { slot: 'command-input', name: 'CommandInput', description: '치는 대로 아래 목록을 바로 거르는 검색칸' },
      { slot: 'command-group', name: 'CommandGroup', description: '제목(heading)이 붙은 항목 묶음' },
      { slot: 'command-item', name: 'CommandItem', description: '고를 수 있는 한 줄. 고른 항목엔 체크, 가리킨 항목엔 배경' },
      { slot: 'command-separator', name: 'CommandSeparator', description: '묶음 사이의 선. 검색하는 동안에는 숨음' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '닫힌 상자의 상태와 열린 목록을 나란히 놓았습니다. 열림·검색 중·결과 없음은 그림이며, 고른 항목엔 체크가, 마우스나 방향키로 가리킨 항목엔 배경이 깔립니다. 호버와 포커스는 고정해 그렸습니다.',
      Demo: States,
    },
    {
      title: '검색해서 하나 고르기',
      description:
        'Popover 안에 Command(검색칸과 목록)를 넣은 shadcn의 기본 Combobox입니다. 목록이 길어 스크롤로 찾기 힘들 때 씁니다. "부"를 쳐서 목록이 줄어드는 것을 보고, 방향키와 Enter로도 골라 보세요. 고른 도시를 다시 고르면 선택이 풀립니다.',
      Demo: PickOne,
    },
    {
      title: '여러 개 고르기',
      description:
        '항목을 골라도 목록이 닫히지 않고, 고른 것은 상자 안에 배지로 쌓입니다. 배지의 ×로 하나씩 뺄 수 있습니다. 선택지가 몇 개뿐이라면 체크박스를 늘어놓는 편이 더 빠릅니다.',
      Demo: PickMany,
    },
    {
      title: '묶음과 최근 항목',
      description:
        '항목이 많으면 제목 붙은 묶음(CommandGroup)으로 나누고, 자주 고르는 것은 "최근" 묶음으로 맨 위에 올립니다. 검색을 시작하면 최근 묶음과 구분선은 숨고 맞는 역만 남습니다. 역을 하나 고른 뒤 다시 열어 최근 목록을 확인해 보세요.',
      Demo: GroupsAndRecent,
    },
    {
      title: '없으면 새로 만들기',
      description:
        '찾는 값이 목록에 없을 때 그 자리에서 새로 만들게 합니다. 목록에 없는 이름을 치면 맨 아래에 "추가" 줄이 생깁니다. 태그·라벨·카테고리처럼 쓰는 사람이 늘려 가는 목록에 쓰고, 정해진 값만 받아야 하는 곳에는 쓰지 않습니다.',
      Demo: CreateNew,
    },
    {
      title: '서버에서 찾기',
      description:
        '목록이 너무 커서 미리 받아 둘 수 없으면 칠 때마다 서버에 묻습니다. 글자마다 묻지 않도록 입력이 0.3초 멈춘 뒤에 한 번만 요청하고(디바운스), 답을 기다리는 동안 "찾는 중" 줄을 보여 줍니다. 빠르게 쳐 보고 아래 요청 횟수를 확인해 보세요.',
      Demo: ServerSearch,
    },
    {
      title: 'Select와 비교',
      description:
        '둘 다 목록에서 하나를 고릅니다. 선택지가 몇 개뿐이고 늘 같으면 Select, 수십 개가 넘거나 이름을 알고 찾아가는 목록이면 Combobox가 맞습니다. 두 상자로 각각 골라 보세요.',
      Demo: SelectComparison,
    },
  ],
}
