import { useEffect, useId, useRef, useState } from 'react'
import { FolderIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { BrowserFrame, PhoneFrame } from '../navigation-patterns/frames'
import { DoneArt, FolderArt, SearchArt } from './art'
import { EmptyState } from './parts'

type Project = { id: number; name: string; sample: boolean }

/** 1. Nothing yet: the empty screen is a welcome that leads to the first item. */
export function FirstUseFormat() {
  const [projects, setProjects] = useState<Project[]>([])
  const [focusId, setFocusId] = useState<number | null>(null)
  const list = useRef<HTMLUListElement>(null)
  const last = projects[projects.length - 1]

  // a keyboard user who pressed the button lands on what it made
  useEffect(() => {
    if (focusId !== null) list.current?.querySelector<HTMLElement>(`[data-project-id="${focusId}"]`)?.focus()
  }, [focusId])

  const add = (name: string, sample = false) => {
    const id = projects.length + 1
    setProjects((prev) => [...prev, { id, name, sample }])
    setFocusId(id)
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url="work.example/projects" className="h-[24rem]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <p className="text-sm font-semibold">내 프로젝트</p>
          {projects.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => add(`새 프로젝트 ${projects.length + 1}`)}>
              <PlusIcon data-icon="inline-start" />
              새 프로젝트
            </Button>
          )}
        </header>
        {projects.length === 0 ? (
          <EmptyState
            className="my-auto"
            art={<FolderArt />}
            title="아직 프로젝트가 없어요"
            description="프로젝트를 만들면 할 일·파일·대화를 한곳에 모을 수 있어요."
          >
            <Button onClick={() => add('첫 프로젝트')}>
              <PlusIcon data-icon="inline-start" />첫 프로젝트 만들기
            </Button>
            <Button variant="ghost" onClick={() => add('예시: 웹사이트 새 단장', true)}>
              예시로 시작하기
            </Button>
          </EmptyState>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            <ul ref={list} aria-label="프로젝트" className="flex flex-col gap-1.5">
              {projects.map((p) => (
                <li key={p.id}>
                  <a
                    href="#"
                    data-project-id={p.id}
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
                  >
                    <FolderIcon aria-hidden className="size-5 shrink-0 text-blue-500" />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    {p.sample && <Badge variant="secondary">예시</Badge>}
                    <span className="text-xs text-muted-foreground">방금</span>
                  </a>
                </li>
              ))}
            </ul>
            {projects.length === 1 && (
              <p className="px-1 text-xs text-muted-foreground">다음으로 팀원을 초대하거나 할 일을 적어 보세요.</p>
            )}
            <Button variant="link" size="sm" className="self-start px-1" onClick={() => setProjects([])}>
              예시 처음으로
            </Button>
          </div>
        )}
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {projects.length === 0
          ? '프로젝트 0개 · 빈 화면이 첫걸음을 안내합니다.'
          : `프로젝트 ${projects.length}개 · 방금 만든 프로젝트: ${last.name}`}
      </p>
    </div>
  )
}

const MAILS = [
  { id: 1, from: '김하늘', subject: '11월 회의록 공유드려요' },
  { id: 2, from: '모아 쇼핑', subject: '주문하신 상품이 출발했어요' },
  { id: 3, from: '박지민', subject: '주말 등산 일정 정해요' },
  { id: 4, from: '하나카드', subject: '10월 이용 내역 안내' },
  { id: 5, from: '이준호', subject: '디자인 시안 2차 보내드립니다' },
  { id: 6, from: '고객센터', subject: '문의하신 내용 답변드려요' },
]

/** 2. Looked, found nothing: say what was searched and offer to undo the search. */
export function NoMatchFormat() {
  const [query, setQuery] = useState('영수증')
  const input = useRef<HTMLInputElement>(null)
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = MAILS.filter((m) => words.every((w) => `${m.from} ${m.subject}`.toLowerCase().includes(w)))

  const clear = () => {
    setQuery('')
    input.current?.focus()
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <div className="flex shrink-0 flex-col gap-2 border-b px-3 pt-1 pb-2.5">
          <p className="px-1 text-base font-semibold">받은편지함</p>
          <InputGroup className="h-9 rounded-full bg-muted/60">
            <InputGroupInput
              ref={input}
              type="search"
              aria-label="메일 검색"
              placeholder="메일 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="[&::-webkit-search-cancel-button]:appearance-none"
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="지우기" className="rounded-full" onClick={clear}>
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <EmptyState
              art={<SearchArt />}
              title={`‘${query.trim()}’ 검색 결과가 없어요`}
              description="받은편지함 전체를 찾아봤어요. 철자를 확인하거나 보낸 사람 이름으로 찾아보세요."
            >
              <Button variant="outline" onClick={clear}>
                검색어 지우기
              </Button>
            </EmptyState>
          ) : (
            <ul aria-label="메일" className="divide-y">
              {shown.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {m.from.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{m.from}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.subject}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        메일 {MAILS.length}개 중 {shown.length}개 표시{query.trim() && ` · 검색어: ${query.trim()}`}
      </p>
    </div>
  )
}

type Todo = { id: number; text: string; done: boolean }

const TODOS: Todo[] = [
  { id: 1, text: '우유 사기', done: true },
  { id: 2, text: '세탁소에서 옷 찾기', done: false },
  { id: 3, text: '엄마께 전화하기', done: false },
]

/** 3. Everything done: the empty list is a reward, not a dead end. */
export function AllDoneFormat() {
  const [todos, setTodos] = useState(TODOS)
  const [focusTarget, setFocusTarget] = useState<number | 'title' | null>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const nextId = useRef(TODOS.length + 1)
  const id = useId()
  const remaining = todos.filter((t) => !t.done)
  const finished = todos.filter((t) => t.done)

  // a ticked box moves to the other list; send the focus somewhere that still exists
  useEffect(() => {
    if (focusTarget === null) return
    if (focusTarget === 'title') title.current?.focus()
    else document.getElementById(`${id}-${focusTarget}`)?.focus()
    setFocusTarget(null)
  }, [focusTarget, id])

  const setDone = (todo: Todo, done: boolean) => {
    const next = todos.map((t) => (t.id === todo.id ? { ...t, done } : t))
    setTodos(next)
    const left = next.filter((t) => !t.done)
    if (done) setFocusTarget(left.length === 0 ? 'title' : left[0].id)
    else setFocusTarget(todo.id)
  }

  const add = () => {
    const todo = { id: nextId.current++, text: '새 할 일', done: false }
    setTodos((prev) => [...prev, todo])
    setFocusTarget(todo.id)
  }

  const row = (t: Todo) => (
    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
      <Checkbox id={`${id}-${t.id}`} checked={t.done} onCheckedChange={(v) => setDone(t, v === true)} />
      <Label htmlFor={`${id}-${t.id}`} className={cn('flex-1 text-sm font-normal', t.done && 'text-muted-foreground line-through')}>
        {t.text}
      </Label>
    </li>
  )

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex shrink-0 items-baseline justify-between border-b px-4 pt-1 pb-2.5">
          <p className="text-base font-semibold">오늘 할 일</p>
          <p className="text-xs text-muted-foreground tabular-nums">남은 일 {remaining.length}개</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {remaining.length === 0 ? (
            <EmptyState
              titleRef={title}
              art={<DoneArt celebrate />}
              title="할 일을 모두 끝냈어요"
              description="오늘은 여기까지! 내일 할 일을 미리 적어 둘 수도 있어요."
            >
              <Button variant="outline" size="sm" onClick={add}>
                <PlusIcon data-icon="inline-start" />할 일 추가
              </Button>
            </EmptyState>
          ) : (
            <ul aria-label="남은 할 일" className="divide-y">
              {remaining.map(row)}
            </ul>
          )}
          {finished.length > 0 && (
            <section aria-label="끝낸 일" className="border-t">
              <h4 className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">끝낸 일 {finished.length}개</h4>
              <ul>{finished.map(row)}</ul>
            </section>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        남은 할 일 {remaining.length}개 · 끝낸 일 {finished.length}개{remaining.length === 0 && ' · 모두 끝냄'}
      </p>
    </div>
  )
}
