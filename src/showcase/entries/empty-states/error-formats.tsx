import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  HouseIcon,
  Loader2Icon,
  PackageIcon,
  RotateCwIcon,
  SearchIcon,
  SendIcon,
  WifiOffIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BrowserFrame, ContentSketch, PhoneFrame } from '../navigation-patterns/frames'
import { LockArt, NotFoundArt, OfflineArt, ServerArt } from './art'
import { EmptyState } from './parts'

/** Timers that are all cleared when the demo goes away. */
function useTimers() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((t) => window.clearTimeout(t)), [])
  return {
    later: (fn: () => void, ms: number) => {
      ids.current.push(window.setTimeout(fn, ms))
    },
    clear: () => {
      ids.current.forEach((t) => window.clearTimeout(t))
      ids.current = []
    },
  }
}

type Page = { kind: 'missing' | 'home' | 'search' | 'event'; url: string; query?: string }

const MISSING: Page = { kind: 'missing', url: 'shop.example/evnets/winter-sale' }
const SITE_PAGES = ['겨울 세일 이벤트', '이벤트 모음', '쿠폰함', '배송 안내', '자주 묻는 질문']

/** 4. The address leads nowhere: say so, and offer home, search and the likely page. */
export function NotFoundFormat() {
  const [history, setHistory] = useState<Page[]>([MISSING])
  const [query, setQuery] = useState('')
  const page = history[history.length - 1]
  const go = (next: Page) => setHistory((h) => [...h, next])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q) go({ kind: 'search', url: `shop.example/search?q=${q}`, query: q })
  }

  const found = page.query ? SITE_PAGES.filter((p) => p.includes(page.query!)) : []

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame
        url={page.url}
        onBack={() => setHistory((h) => h.slice(0, -1))}
        canGoBack={history.length > 1}
        className="h-[27rem]"
      >
        {page.kind === 'missing' && (
          <EmptyState
            className="my-auto"
            art={<NotFoundArt />}
            title="페이지를 찾을 수 없어요"
            description="주소가 바뀌었거나 없어진 페이지예요. 주소에 틀린 글자가 없는지 확인해 주세요."
            footer={
              <div className="flex w-full max-w-xs flex-col gap-2">
                <form role="search" aria-label="사이트 검색" onSubmit={submit} className="flex gap-2">
                  <InputGroup className="h-8">
                    <InputGroupInput
                      aria-label="사이트에서 검색"
                      placeholder="찾으시는 것을 검색해 보세요"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <InputGroupAddon>
                      <SearchIcon aria-hidden />
                    </InputGroupAddon>
                  </InputGroup>
                  <Button type="submit" variant="outline">
                    검색
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  혹시 이 페이지인가요?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      go({ kind: 'event', url: 'shop.example/events/winter-sale' })
                    }}
                    className="font-medium text-foreground underline underline-offset-3"
                  >
                    겨울 세일 이벤트
                  </a>
                </p>
              </div>
            }
          >
            <Button onClick={() => go({ kind: 'home', url: 'shop.example' })}>
              <HouseIcon data-icon="inline-start" />
              홈으로
            </Button>
          </EmptyState>
        )}
        {page.kind === 'home' && (
          <div className="flex flex-col gap-3 p-5">
            <p className="text-lg font-semibold">모아 쇼핑 홈</p>
            <div aria-hidden className="h-24 rounded-lg bg-muted" />
            <ContentSketch rows={3} />
          </div>
        )}
        {page.kind === 'event' && (
          <div className="flex flex-col gap-3 p-5">
            <p className="text-lg font-semibold">겨울 세일 이벤트</p>
            <div aria-hidden className="h-24 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-200 dark:from-sky-500/20 dark:to-indigo-500/25" />
            <ContentSketch rows={3} />
          </div>
        )}
        {page.kind === 'search' && (
          <div className="flex flex-col gap-2 p-5">
            <p className="text-sm">
              ‘{page.query}’ 검색 결과 <span className="font-semibold">{found.length}개</span>
            </p>
            <ul aria-label="검색 결과" className="divide-y rounded-lg border">
              {(found.length > 0 ? found : SITE_PAGES.slice(0, 3)).map((p) => (
                <li key={p} className="px-3 py-2 text-sm">
                  {p}
                </li>
              ))}
            </ul>
            {found.length === 0 && <p className="text-xs text-muted-foreground">맞는 페이지가 없어 많이 찾는 페이지를 보여 드려요.</p>}
          </div>
        )}
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        주소: {page.url} · {page.kind === 'missing' ? '404 페이지 없음' : '정상 페이지'}
      </p>
    </div>
  )
}

type Access = 'none' | 'sending' | 'sent' | 'granted'

/** 5. The page exists but is not for this account: explain whose it is and ask for access. */
export function NoAccessFormat() {
  const [access, setAccess] = useState<Access>('none')
  const [message, setMessage] = useState('')
  const timers = useTimers()

  const request = () => {
    setAccess('sending')
    timers.later(() => setAccess('sent'), 800)
  }

  const requestLabel = { none: '안 보냄', sending: '보내는 중', sent: '보냄', granted: '승인됨' }[access]

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url="docs.example/d/2026-budget" className="h-[27rem]">
        {access === 'granted' ? (
          <div className="flex flex-col gap-3 p-5">
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
              <CheckCircle2Icon aria-hidden className="size-4" />
              김하늘님이 보기 권한을 줬어요.
            </p>
            <p className="text-lg font-semibold">2026 예산안</p>
            <div aria-hidden className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className={i < 4 ? 'h-5 rounded bg-muted-foreground/20' : 'h-5 rounded bg-muted'} />
              ))}
            </div>
          </div>
        ) : access === 'sent' ? (
          <EmptyState
            className="my-auto"
            art={<LockArt />}
            title="권한을 요청했어요"
            description="김하늘님이 승인하면 메일로 알려 드려요. 이 창은 닫아도 괜찮아요."
            footer={
              <Button variant="link" size="sm" onClick={() => setAccess('granted')}>
                (시연) 문서 주인이 승인하기
              </Button>
            }
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
              <CheckIcon aria-hidden className="size-3.5" />
              요청 보냄{message.trim() && ` · “${message.trim()}”`}
            </span>
          </EmptyState>
        ) : (
          <EmptyState
            className="my-auto"
            art={<LockArt />}
            title="이 문서를 볼 권한이 없어요"
            description="‘2026 예산안’은 공유받은 사람만 볼 수 있어요. 문서 주인 김하늘님에게 보기 권한을 요청해 보세요."
            footer={
              <div className="flex w-full max-w-xs flex-col gap-2">
                <Input
                  aria-label="요청 메시지 (선택)"
                  placeholder="요청 메시지 (선택)"
                  value={message}
                  disabled={access === 'sending'}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button onClick={request} disabled={access === 'sending'}>
                  {access === 'sending' ? (
                    <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" />
                  ) : (
                    <SendIcon data-icon="inline-start" />
                  )}
                  {access === 'sending' ? '요청 보내는 중…' : '권한 요청'}
                </Button>
                <p className="text-xs text-muted-foreground">sky@example.com 계정으로 로그인함</p>
              </div>
            }
          />
        )}
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        권한: {access === 'granted' ? '보기 가능' : '없음'} · 요청: {requestLabel}
      </p>
    </div>
  )
}

type NewsScreen = 'content' | 'loading' | 'offline' | 'saved'

const NEWS = ['첫눈 소식, 주말엔 영하로', '지하철 2호선 운행 시간 늘어나', '동네 도서관 야간 개관 시작']
const SAVED = ['겨울철 보일러 아끼는 법', '주말 근교 나들이 5곳']

/** 6. No network: say it is the connection (not the app), retry, and show what still works. */
export function OfflineFormat() {
  const [online, setOnline] = useState(true)
  const [screen, setScreen] = useState<NewsScreen>('content')
  const [attempts, setAttempts] = useState(0)
  const [note, setNote] = useState('')
  const onlineNow = useRef(true)
  const timers = useTimers()
  const switchId = useId()

  const load = () => {
    timers.clear()
    setScreen('loading')
    timers.later(() => setScreen(onlineNow.current ? 'content' : 'offline'), 700)
  }

  const toggle = (next: boolean) => {
    setOnline(next)
    onlineNow.current = next
    if (!next) {
      timers.clear()
      setScreen('offline')
      setAttempts(0)
      setNote('연결이 끊겼어요')
    } else if (screen === 'offline' || screen === 'saved') {
      // the app listens for the connection coming back and retries by itself
      setNote('연결이 돌아와 저절로 다시 불러왔어요')
      load()
    }
  }

  const retry = () => {
    if (!online) {
      setAttempts((a) => a + 1)
      setNote(`아직 연결되지 않았어요 (${attempts + 1}번 시도)`)
      return
    }
    setNote('')
    load()
  }

  const screenLabel = { content: '새 소식', loading: '불러오는 중', offline: '오프라인 안내', saved: '저장한 글' }[screen]

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="flex items-center gap-2 self-start">
        <Switch id={switchId} checked={online} onCheckedChange={toggle} />
        <Label htmlFor={switchId}>인터넷 연결</Label>
      </div>
      <PhoneFrame>
        <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
          <p className="text-sm font-semibold">오늘의 소식</p>
          {!online && <WifiOffIcon aria-label="오프라인" className="size-4 text-muted-foreground" />}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {screen === 'content' && (
            <ul aria-label="소식" className="divide-y">
              {NEWS.map((n) => (
                <li key={n} className="flex items-center gap-3 px-4 py-3">
                  <div aria-hidden className="size-10 shrink-0 rounded-md bg-muted" />
                  <span className="text-sm">{n}</span>
                </li>
              ))}
            </ul>
          )}
          {screen === 'loading' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon aria-hidden className="size-5 motion-safe:animate-spin" />
              불러오는 중…
            </div>
          )}
          {screen === 'offline' && (
            <EmptyState
              className="my-auto"
              art={<OfflineArt />}
              title="인터넷에 연결되어 있지 않아요"
              description="와이파이나 모바일 데이터를 확인해 주세요. 연결되면 저절로 다시 불러와요."
              footer={
                attempts > 0 && (
                  <p className="text-xs text-destructive">
                    아직 연결되지 않았어요 · {attempts}번 시도
                  </p>
                )
              }
            >
              <Button size="sm" onClick={retry}>
                <RotateCwIcon data-icon="inline-start" />
                다시 시도
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setScreen('saved')}>
                저장한 글 보기
              </Button>
            </EmptyState>
          )}
          {screen === 'saved' && (
            <div className="flex flex-col">
              <p className="bg-muted px-4 py-2 text-xs text-muted-foreground">오프라인이에요 · 저장해 둔 글만 볼 수 있어요</p>
              <ul aria-label="저장한 글" className="divide-y">
                {SAVED.map((n) => (
                  <li key={n} className="px-4 py-3 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
              <Button variant="link" size="sm" className="self-start" onClick={() => setScreen('offline')}>
                돌아가기
              </Button>
            </div>
          )}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        연결: {online ? '온라인' : '오프라인'} · 화면: {screenLabel}
        {note && ` · ${note}`}
      </p>
    </div>
  )
}

const ERROR_CODES = ['E500-7F3A', 'E503-21C9']
const ORDERS = [
  { id: '2611-0412', name: '원두 1kg 외 1건', state: '배송 중' },
  { id: '2610-2877', name: '드립 포트', state: '배송 완료' },
  { id: '2610-1150', name: '머그컵 2개', state: '배송 완료' },
]

type Load = 'error' | 'retrying' | 'done'

/** 7. Our fault, not theirs: apologise plainly, offer a retry and a code to report. */
export function ServerErrorFormat() {
  const [load, setLoad] = useState<Load>('error')
  // the first load (the one that showed this screen) is try number 1
  const [tries, setTries] = useState(1)
  const [code, setCode] = useState(ERROR_CODES[0])
  const [copied, setCopied] = useState(false)
  const timers = useTimers()

  const retry = () => {
    setLoad('retrying')
    setCopied(false)
    timers.later(() => {
      // this demo's server fails the first retry, then recovers
      if (tries === 1) {
        setCode(ERROR_CODES[1])
        setLoad('error')
      } else {
        setLoad('done')
      }
      setTries((t) => t + 1)
    }, 900)
  }

  const copy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }

  const reset = () => {
    setLoad('error')
    setTries(1)
    setCode(ERROR_CODES[0])
    setCopied(false)
  }

  let message = `불러오기 실패 · 오류 코드 ${code} · 시도 ${tries}번${copied ? ' · 코드 복사함' : ''}`
  if (load === 'retrying') message = `다시 시도하는 중… (${tries + 1}번째)`
  if (load === 'done') message = `불러옴 · ${tries}번째 시도에서 성공`

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url="shop.example/my/orders" className="h-[28rem]">
        <header className="flex h-11 shrink-0 items-center border-b px-4">
          <p className="text-sm font-semibold">주문 내역</p>
        </header>
        {load === 'done' ? (
          <div className="flex flex-col gap-2 p-4">
            <p className="text-xs text-muted-foreground">다시 시도해서 불러왔어요.</p>
            <ul aria-label="주문" className="divide-y rounded-lg border">
              {ORDERS.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                  <PackageIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm">{o.name}</span>
                  <span className="text-xs text-muted-foreground">{o.state}</span>
                </li>
              ))}
            </ul>
            <Button variant="link" size="sm" className="self-start px-0" onClick={reset}>
              예시 처음으로
            </Button>
          </div>
        ) : (
          <EmptyState
            className="my-auto"
            art={<ServerArt />}
            title="주문 내역을 불러오지 못했어요"
            description={
              tries > 1
                ? '다시 시도했지만 또 실패했어요. 저희 쪽 문제예요. 한 번 더 시도해 주세요.'
                : '저희 서버에 잠깐 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.'
            }
            footer={
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-3 text-xs">
                  오류 코드
                  <code className="font-mono font-semibold">{code}</code>
                  <Button variant="ghost" size="icon-xs" aria-label="오류 코드 복사" onClick={copy}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">계속 안 되면 이 코드를 고객센터에 알려 주세요.</p>
              </div>
            }
          >
            <Button onClick={retry} disabled={load === 'retrying'}>
              {load === 'retrying' ? (
                <Loader2Icon data-icon="inline-start" className="motion-safe:animate-spin" />
              ) : (
                <RotateCwIcon data-icon="inline-start" />
              )}
              {load === 'retrying' ? '다시 시도 중…' : '다시 시도'}
            </Button>
            <Button variant="ghost">고객센터 문의</Button>
          </EmptyState>
        )}
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
