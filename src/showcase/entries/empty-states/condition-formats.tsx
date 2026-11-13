import { useEffect, useId, useRef, useState } from 'react'
import { BellIcon, CheckCircle2Icon, FileIcon, GiftIcon, LockIcon, PlusIcon, RotateCcwIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { PhoneFrame } from '../navigation-patterns/frames'
import { BellArt, LockArt, SearchArt, TrashArt } from './art'
import { EmptyState } from './parts'
import { useTimers } from './use-timers'

type Trip = { id: number; name: string; city: string; oneWay: boolean; breakfast: boolean; price: string }

const TRIPS: Trip[] = [
  { id: 1, name: '서울 시티 호텔 1박 + 항공', city: '서울', oneWay: true, breakfast: false, price: '129,000원' },
  { id: 2, name: '서울 한옥 스테이 2박 + 항공', city: '서울', oneWay: false, breakfast: true, price: '248,000원' },
  { id: 3, name: '부산 해운대 1박 + 항공', city: '부산', oneWay: true, breakfast: true, price: '154,000원' },
  { id: 4, name: '제주 바다 호텔 2박 + 항공', city: '제주', oneWay: false, breakfast: true, price: '312,000원' },
  { id: 5, name: '부산 광안리 1박 + 항공', city: '부산', oneWay: false, breakfast: false, price: '176,000원' },
]

const FILTERS = [
  { id: 'seoul', label: '서울', test: (t: Trip) => t.city === '서울' },
  { id: 'oneWay', label: '편도', test: (t: Trip) => t.oneWay },
  { id: 'breakfast', label: '조식 포함', test: (t: Trip) => t.breakfast },
] as const
type FilterId = (typeof FILTERS)[number]['id']

const ALL_FILTERS: FilterId[] = FILTERS.map((f) => f.id)
const matching = (on: FilterId[]) => TRIPS.filter((t) => FILTERS.every((f) => !on.includes(f.id) || f.test(t)))

/** 2b. Filters, not a search word, emptied the list: name the chips and offer to loosen them. */
export function FilterNoResultsFormat() {
  const [on, setOn] = useState<FilterId[]>(ALL_FILTERS)
  const focusList = useRef(false)
  const list = useRef<HTMLUListElement>(null)
  const shown = matching(on)
  const active = FILTERS.filter((f) => on.includes(f.id))

  // the empty state that had the focus is gone; land on the results it led to
  useEffect(() => {
    if (!focusList.current) return
    list.current?.focus()
    focusList.current = false
  })

  const setFilters = (next: FilterId[], moveFocus = false) => {
    setOn(next)
    focusList.current = moveFocus
  }

  // the trip that misses the fewest filters, and which ones it misses
  const closest = TRIPS.map((t) => ({ trip: t, missed: active.filter((f) => !f.test(t)) })).sort(
    (a, b) => a.missed.length - b.missed.length,
  )[0]

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <div className="flex shrink-0 flex-col gap-2 border-b px-3 pt-1 pb-2.5">
          <p className="px-1 text-base font-semibold">여행 상품</p>
          <div role="group" aria-label="필터" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Toggle
                key={f.id}
                size="sm"
                variant="outline"
                className="rounded-full"
                pressed={on.includes(f.id)}
                onPressedChange={(p) => setFilters(p ? [...on, f.id] : on.filter((x) => x !== f.id))}
              >
                {f.label}
              </Toggle>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <EmptyState
              compact
              art={<SearchArt className="h-20 w-[6.25rem]" />}
              title="조건에 맞는 상품이 없어요"
              description={`고른 조건(${active.map((f) => f.label).join(' · ')})을 모두 만족하는 상품은 없어요. 조건을 하나 빼 보세요.`}
              footer={
                closest && (
                  <p className="text-xs text-muted-foreground">
                    가장 가까운 상품: <span className="font-medium text-foreground">{closest.trip.name}</span> (
                    {closest.missed.map((f) => `${f.label} 아님`).join(', ')})
                  </p>
                )
              }
            >
              {active.map((f) => {
                const rest = on.filter((x) => x !== f.id)
                return (
                  <Button key={f.id} size="sm" variant="outline" onClick={() => setFilters(rest, true)}>
                    <XIcon data-icon="inline-start" />‘{f.label}’ 빼기 · {matching(rest).length}개
                  </Button>
                )
              })}
              <Button size="sm" onClick={() => setFilters([], true)}>
                필터 초기화
              </Button>
            </EmptyState>
          ) : (
            <div className="flex flex-col">
              <ul ref={list} tabIndex={-1} aria-label="상품" className="divide-y outline-none">
                {shown.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.oneWay ? '편도' : '왕복'} · {t.breakfast ? '조식 포함' : '조식 없음'}
                      </span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums">{t.price}</span>
                  </li>
                ))}
              </ul>
              <Button variant="link" size="sm" className="self-start" onClick={() => setFilters(ALL_FILTERS)}>
                예시 처음으로
              </Button>
            </div>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        상품 {TRIPS.length}개 중 {shown.length}개 표시 · 필터: {active.map((f) => f.label).join(', ') || '없음'}
      </p>
    </div>
  )
}

type Permission = 'ask' | 'prompt' | 'granted' | 'denied'

/** 5b. Not "you may not" but "may we?": explain the benefit first, then ask; if refused, point to settings. */
export function PermissionRequestFormat() {
  const [permission, setPermission] = useState<Permission>('ask')
  const [settings, setSettings] = useState(false)
  const allow = useRef<HTMLButtonElement>(null)
  const switchId = useId()

  // the system question takes the focus, like the real one
  useEffect(() => {
    if (permission === 'prompt') allow.current?.focus()
  }, [permission])

  const label = { ask: '묻기 전', prompt: '묻는 중', granted: '허용', denied: '거부' }[permission]

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center border-b px-4">
          <p className="text-sm font-semibold">{settings ? '설정 › 모아 여행' : '가격 알림'}</p>
        </header>
        {settings ? (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <Label htmlFor={switchId}>알림 허용</Label>
              <Switch
                id={switchId}
                checked={permission === 'granted'}
                onCheckedChange={(v) => setPermission(v ? 'granted' : 'denied')}
              />
            </div>
            <p className="text-xs text-muted-foreground">휴대폰 설정 화면을 흉내 낸 것입니다. 앱은 이 스위치를 대신 켤 수 없어요.</p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => setSettings(false)}>
              앱으로 돌아가기
            </Button>
          </div>
        ) : permission === 'granted' ? (
          <div className="flex flex-col gap-2 p-4">
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
              <CheckCircle2Icon aria-hidden className="size-4" />
              알림을 켰어요
            </p>
            <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <BellIcon aria-hidden className="size-4 shrink-0 text-amber-500" />
              <span className="flex-1 text-sm">오사카 왕복 항공권</span>
              <span className="text-xs text-muted-foreground tabular-nums">312,000원 지켜보는 중</span>
            </div>
            <Button variant="link" size="sm" className="self-start px-0" onClick={() => setPermission('ask')}>
              예시 처음으로
            </Button>
          </div>
        ) : permission === 'denied' ? (
          <EmptyState
            className="my-auto"
            art={<BellArt muted />}
            title="알림이 꺼져 있어요"
            description="앱은 한 번 거절된 알림을 다시 물을 수 없어요. 휴대폰 설정 › 모아 여행 › 알림에서 ‘알림 허용’을 켜 주세요."
          >
            <Button onClick={() => setSettings(true)}>설정 열기</Button>
            <Button variant="ghost" onClick={() => setPermission('ask')}>
              예시 처음으로
            </Button>
          </EmptyState>
        ) : (
          <EmptyState
            className="my-auto"
            art={<BellArt />}
            title="가격이 내리면 알려드릴게요"
            description="알림을 켜면 지켜보는 항공권 값이 내릴 때 바로 알려 드려요. 하루 한 번 넘게 보내지 않아요."
          >
            <Button onClick={() => setPermission('prompt')} disabled={permission === 'prompt'}>
              <BellIcon data-icon="inline-start" />
              알림 켜기
            </Button>
          </EmptyState>
        )}
        {permission === 'prompt' && (
          // stands in for the operating system's own question, drawn inside the phone
          <div className="absolute inset-0 grid place-items-center bg-black/30 p-5">
            <div role="dialog" aria-label="알림 권한 요청" className="w-full rounded-2xl bg-background p-4 text-center shadow-lg">
              <p className="text-sm font-semibold">‘모아 여행’에서 알림을 보내려고 합니다</p>
              <p className="mt-1 text-xs text-muted-foreground">알림에는 소리와 배지가 포함될 수 있어요.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setPermission('denied')}>
                  허용 안 함
                </Button>
                <Button ref={allow} size="sm" onClick={() => setPermission('granted')}>
                  허용
                </Button>
              </div>
            </div>
          </div>
        )}
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        알림 권한: {label}
        {settings && ' · 설정 화면'}
      </p>
    </div>
  )
}

const TRASH = ['여행 영수증.pdf', '오사카 사진.jpg', '초안 v2.docx']
const UNDO_MS = 5000

type Deleted = { names: string[]; kind: 'emptied' | 'one' }

/** 4b. Emptied by the user a moment ago: confirm what went, and keep a short way back. */
export function AfterDeleteFormat() {
  const [files, setFiles] = useState(TRASH)
  const [deleted, setDeleted] = useState<Deleted | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  // where the focus goes after the next render: the element that had it is about to disappear
  const focus = useRef<'title' | 'list' | null>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const timers = useTimers()

  useEffect(() => {
    if (focus.current === 'title') title.current?.focus()
    if (focus.current === 'list') list.current?.focus()
    focus.current = null
  })

  const remove = (names: string[], kind: Deleted['kind']) => {
    const left = files.filter((f) => !names.includes(f))
    setFiles(left)
    setDeleted({ names, kind })
    setCanUndo(true)
    timers.clear()
    timers.later(() => setCanUndo(false), UNDO_MS)
    focus.current = left.length === 0 ? 'title' : 'list'
  }

  const undo = () => {
    timers.clear()
    setFiles(TRASH.filter((f) => files.includes(f) || deleted?.names.includes(f)))
    setDeleted(null)
    setCanUndo(false)
    focus.current = 'list'
  }

  const reset = () => {
    timers.clear()
    setFiles(TRASH)
    setDeleted(null)
    setCanUndo(false)
  }

  const undoButton = (
    <Button size="sm" variant="outline" onClick={undo}>
      <RotateCcwIcon data-icon="inline-start" />
      되돌리기
    </Button>
  )

  let note = ''
  if (deleted) note = ` · 방금 지움: ${deleted.names.join(', ')} · ${canUndo ? '되돌리기 가능' : '되돌리기 끝남'}`

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
          <p className="text-sm font-semibold">휴지통</p>
          {files.length > 0 && (
            <Button size="xs" variant="ghost" className="text-destructive" onClick={() => remove(files, 'emptied')}>
              휴지통 비우기
            </Button>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {files.length === 0 && deleted ? (
            <EmptyState
              className="my-auto"
              titleRef={title}
              art={<TrashArt />}
              title={deleted.kind === 'emptied' ? '휴지통을 비웠어요' : '마지막 파일을 지웠어요'}
              description={
                canUndo
                  ? `${deleted.kind === 'emptied' ? `파일 ${deleted.names.length}개` : `‘${deleted.names[0]}’`}를 지웠어요. 몇 초 안에는 되돌릴 수 있어요.`
                  : '휴지통이 비어 있어요. 앞으로 지우는 파일은 여기에 30일 동안 보관돼요.'
              }
            >
              {canUndo ? (
                undoButton
              ) : (
                <Button size="sm" variant="ghost" onClick={reset}>
                  예시 처음으로
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <ul ref={list} tabIndex={-1} aria-label="휴지통 파일" className="divide-y outline-none">
                {files.map((f) => (
                  <li key={f} className="flex items-center gap-3 px-4 py-2.5">
                    <FileIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{f}</span>
                    <Button size="icon-xs" variant="ghost" aria-label={`${f} 영구 삭제`} onClick={() => remove([f], 'one')}>
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
              {files.length === 1 && <p className="px-4 pt-2 text-xs text-muted-foreground">마지막 하나를 지우면 빈 화면이 어떻게 바뀌는지 보세요.</p>}
              {deleted && canUndo && (
                // a small snackbar while items remain; the empty state takes over when none do
                <div className="mx-3 mt-auto mb-3 flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs text-background">
                  <span className="flex-1 truncate">‘{deleted.names[0]}’를 지웠어요</span>
                  <Button size="xs" variant="secondary" onClick={undo}>
                    되돌리기
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        휴지통 파일 {files.length}개{note}
      </p>
    </div>
  )
}

const GOAL = 30000
const ADD_ONS = [
  { id: 1, name: '드립백 커피 10개', price: 10000 },
  { id: 2, name: '원두 200g', price: 10000 },
  { id: 3, name: '머그컵', price: 10000 },
]
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** 8. Not empty yet, but closed until a condition is met: say the condition and how close you are. */
export function LockedFormat() {
  const [added, setAdded] = useState<number[]>([])
  const [claimed, setClaimed] = useState(false)
  const total = 10000 + added.length * 10000
  const unlocked = total >= GOAL
  const steps = Math.min(3, total / 10000)

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
          <p className="text-sm font-semibold">장바구니</p>
          <p className="text-xs text-muted-foreground tabular-nums">{won(total)}</p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <section aria-label="추가 할인 쿠폰" className="rounded-xl border bg-muted/30">
            {unlocked ? (
              <EmptyState
                compact
                art={<GiftIcon aria-hidden className="size-12 text-emerald-500 motion-safe:animate-in motion-safe:zoom-in-75" />}
                title="쿠폰이 열렸어요"
                description="3만 원을 채웠어요. 3,000원 할인 쿠폰을 받을 수 있어요."
              >
                <Button size="sm" onClick={() => setClaimed(true)} disabled={claimed}>
                  {claimed ? '쿠폰 받음' : '쿠폰 받기'}
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                compact
                art={<LockArt className="h-16 w-20" />}
                title="3만 원 이상 담으면 열려요"
                description={`지금 ${won(total)} 담았어요. ${won(GOAL - total)} 더 담으면 3,000원 할인 쿠폰이 열려요.`}
                footer={
                  <div className="flex w-full max-w-48 flex-col gap-1">
                    <Progress value={(steps / 3) * 100} aria-label="쿠폰까지" getValueLabel={() => `${steps}/3`} />
                    <p className="text-right text-xs text-muted-foreground tabular-nums">{steps}/3</p>
                  </div>
                }
              />
            )}
          </section>
          <section aria-label="함께 사면 좋은 상품" className="flex flex-col gap-1.5">
            <h4 className="text-xs font-medium text-muted-foreground">함께 사면 좋은 상품</h4>
            <ul className="divide-y rounded-lg border">
              <li className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1">핸드드립 세트 (담음)</span>
                <span className="text-xs tabular-nums">{won(10000)}</span>
              </li>
              {ADD_ONS.map((a) => {
                const inCart = added.includes(a.id)
                return (
                  <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="flex-1">{a.name}</span>
                    <span className="text-xs tabular-nums">{won(a.price)}</span>
                    <Button
                      size="xs"
                      variant={inCart ? 'secondary' : 'outline'}
                      aria-label={`${a.name} ${inCart ? '빼기' : '담기'}`}
                      onClick={() => {
                        setAdded(inCart ? added.filter((x) => x !== a.id) : [...added, a.id])
                        setClaimed(false)
                      }}
                    >
                      {inCart ? <XIcon /> : <PlusIcon />}
                      {inCart ? '빼기' : '담기'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </PhoneFrame>
      <p role="status" className="flex items-center gap-1.5 self-start text-sm text-muted-foreground">
        {!unlocked && <LockIcon aria-hidden className="size-3.5" />}
        담은 금액 {won(total)} · 쿠폰 {unlocked ? (claimed ? '받음' : '열림') : `잠김 (${steps}/3)`}
      </p>
    </div>
  )
}
