import { useRef, useState } from 'react'
import {
  BellIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HouseIcon,
  LockIcon,
  MicIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  WifiIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '../navigation-patterns/frames'
import { useScrollDirection } from '../navigation-patterns/parts'

const MEMOS = [
  '장보기 목록',
  '회의 메모',
  '읽을 책',
  '여행 준비물',
  '운동 기록',
  '선물 아이디어',
  '레시피',
  '영화 추천',
  '이사 체크리스트',
  '공부 계획',
  '전화번호',
  '가계부',
  '꿈 일기',
  '할 일',
]

const DIAL = [
  { label: '사진 메모', icon: CameraIcon },
  { label: '음성 메모', icon: MicIcon },
  { label: '글 메모', icon: PencilIcon },
]

/** A round button floating over a list; it steps aside while you read and opens a speed dial. */
export function FabFormat() {
  const [scroll, onScroll] = useScrollDirection()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const fab = useRef<HTMLButtonElement>(null)
  const hidden = !open && scroll.down && scroll.top > 40
  const compact = scroll.top > 8
  const look = open ? '펼친 메뉴' : hidden ? '숨김 (내리는 중)' : compact ? '작게 (아이콘만)' : '이름과 함께 (맨 위)'

  const close = (message: string) => {
    setOpen(false)
    setNote(message)
    fab.current?.focus()
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <div
          className="contents"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && open) close('Esc로 닫음')
          }}
        >
          <header className="flex h-11 shrink-0 items-center border-b px-4">
            <p className="text-sm font-semibold">메모</p>
          </header>
          <ul data-testid="memo-list" onScroll={onScroll} className="min-h-0 flex-1 divide-y overflow-y-auto">
            {MEMOS.map((m, i) => (
              <li key={m} className="px-4 py-3">
                <p className="text-sm font-medium">{m}</p>
                <p className="text-xs text-muted-foreground">11월 {14 - i}일</p>
              </li>
            ))}
          </ul>
          {open && (
            <div
              aria-hidden
              data-testid="scrim"
              className="absolute inset-0 z-10 bg-black/40 motion-safe:animate-in motion-safe:fade-in-0"
              onClick={() => close('바깥을 눌러 닫음')}
            />
          )}
          <div
            inert={hidden}
            className={cn(
              'absolute right-4 bottom-4 z-20 flex flex-col items-end gap-3 transition-[translate,opacity] duration-200 motion-reduce:transition-none',
              hidden && 'translate-y-24 opacity-0',
            )}
          >
            <button
              ref={fab}
              type="button"
              aria-label={open ? '새 메모 메뉴 닫기' : '새 메모'}
              aria-expanded={open}
              onClick={() => {
                if (open) close('× 버튼으로 닫음')
                else {
                  setOpen(true)
                  setNote('')
                }
              }}
              className="order-last flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3.5 text-primary-foreground shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-95"
            >
              <PlusIcon aria-hidden className={cn('size-5 shrink-0 transition-transform', open && 'rotate-45')} />
              <span
                className={cn(
                  'overflow-hidden text-sm font-medium whitespace-nowrap transition-[max-width] duration-200 motion-reduce:transition-none',
                  compact || open ? 'max-w-0' : 'max-w-24',
                )}
              >
                새 메모
              </span>
            </button>
            {open && (
              <ul aria-label="새 메모 종류" className="flex flex-col items-end gap-3">
                {DIAL.map((d) => (
                  <li key={d.label} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
                    <button
                      type="button"
                      onClick={() => close(`${d.label}를 골랐어요`)}
                      className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                    >
                      <span className="rounded-md bg-background px-2 py-1 text-xs font-medium shadow">{d.label}</span>
                      <span className="grid size-10 place-items-center rounded-full bg-background shadow-md">
                        <d.icon aria-hidden className="size-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        버튼: {look}
        {note && ` · ${note}`}
      </p>
    </div>
  )
}

type ScreenId = 'list' | 'detail' | 'reviews'

const TITLES: Record<ScreenId, string> = { list: '목록', detail: '상품 상세', reviews: '리뷰' }

const PRODUCTS = ['드립 포트', '핸드밀', '머그컵']

function StackScreen({ id, product, onOpen }: { id: ScreenId; product: string; onOpen: (id: ScreenId, product?: string) => void }) {
  if (id === 'list') {
    return (
      <ul className="divide-y">
        {PRODUCTS.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onOpen('detail', p)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:bg-muted active:bg-muted"
            >
              <span aria-hidden className="size-10 shrink-0 rounded-md bg-muted" />
              <span className="flex-1 text-sm font-medium">{p}</span>
              <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    )
  }
  if (id === 'detail') {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div aria-hidden className="aspect-[4/3] rounded-lg bg-muted" />
        <p className="text-base font-semibold">{product}</p>
        <p className="text-sm">39,000원</p>
        <button
          type="button"
          onClick={() => onOpen('reviews')}
          className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
        >
          리뷰 128개 보기
          <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
        </button>
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-3 p-4">
      {['물줄기가 가늘어 좋아요', '손잡이가 안 뜨거워요', '배송이 빨랐어요'].map((r) => (
        <li key={r} className="rounded-lg border p-3">
          <p aria-label="별 5개" className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} aria-hidden className="size-3 fill-amber-400 text-amber-400" />
            ))}
          </p>
          <p className="mt-1 text-sm">{r}</p>
        </li>
      ))}
    </ul>
  )
}

/** Screens pile up as you go deeper; ‹ takes the top one off. */
export function BackNavigationFormat() {
  const [stack, setStack] = useState<ScreenId[]>(['list'])
  const [product, setProduct] = useState(PRODUCTS[0])
  const [pushed, setPushed] = useState(true)
  const [note, setNote] = useState('')
  const top = stack[stack.length - 1]
  const previous = stack.length > 1 ? TITLES[stack[stack.length - 2]] : null

  const open = (id: ScreenId, p?: string) => {
    if (p) setProduct(p)
    setStack((s) => [...s, id])
    setPushed(true)
    setNote(`${TITLES[id]} 화면을 위에 쌓음`)
  }
  const back = () => {
    setStack((s) => s.slice(0, -1))
    setPushed(false)
    setNote(`뒤로: ${TITLES[top]} 화면을 닫고 ${previous} 화면으로 돌아옴`)
  }
  const home = () => {
    setStack(['list'])
    setPushed(false)
    setNote('홈으로: 쌓인 화면을 모두 닫음')
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header className="relative flex h-11 shrink-0 items-center justify-center border-b px-2">
          {previous && (
            <button
              type="button"
              aria-label={`뒤로, ${previous}`}
              onClick={back}
              className="absolute left-1 flex h-8 items-center rounded-md pr-2 text-sm text-blue-600 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-50 dark:text-blue-400"
            >
              <ChevronLeftIcon aria-hidden className="size-5" />
              {previous}
            </button>
          )}
          <p className="text-sm font-semibold">{TITLES[top]}</p>
          {stack.length > 1 && (
            <button
              type="button"
              aria-label="홈으로"
              onClick={home}
              className="absolute right-2 grid size-8 place-items-center rounded-md text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-50"
            >
              <HouseIcon aria-hidden className="size-4" />
            </button>
          )}
        </header>
        <div
          key={stack.length}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto motion-safe:animate-in motion-safe:duration-300',
            pushed ? 'motion-safe:slide-in-from-right' : 'motion-safe:slide-in-from-left-1/3',
          )}
        >
          <StackScreen id={top} product={product} onOpen={open} />
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        쌓인 화면: {stack.map((id) => TITLES[id]).join(' › ')}
        {note && ` · ${note}`}
      </p>
    </div>
  )
}

const SETTINGS = [
  { label: '알림', icon: BellIcon },
  { label: 'Wi-Fi', icon: WifiIcon },
  { label: '방해 금지', icon: MoonIcon },
  { label: '개인정보 보호', icon: LockIcon },
]

/** iOS-style big title that folds into the bar as the page scrolls. */
export function LargeTitleFormat() {
  const [scroll, onScroll] = useScrollDirection()
  const progress = Math.min(scroll.top, 48) / 48
  const collapsed = progress === 1

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <header
          className={cn(
            'flex h-11 shrink-0 items-center justify-center border-b bg-background/90 backdrop-blur transition-colors',
            collapsed ? 'border-border' : 'border-transparent',
          )}
        >
          <p aria-hidden={!collapsed} className={cn('text-sm font-semibold transition-opacity', collapsed ? 'opacity-100' : 'opacity-0')}>
            설정
          </p>
        </header>
        <div data-testid="settings-page" onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto bg-muted/50">
          <h3
            style={{ opacity: 1 - progress, transform: `scale(${1 - progress * 0.25})` }}
            className="origin-left px-4 pt-1 pb-3 text-3xl font-bold"
          >
            설정
          </h3>
          {[0, 1, 2].map((group) => (
            <ul key={group} className="mx-3 mb-5 divide-y overflow-hidden rounded-xl bg-background">
              {SETTINGS.map((s) => (
                <li key={s.label} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <s.icon aria-hidden className="size-4 text-muted-foreground" />
                  <span className="flex-1">{s.label}</span>
                  <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        제목: {collapsed ? '바 안으로 접힘' : scroll.top > 0 ? '줄어드는 중' : '크게 (맨 위)'}
      </p>
    </div>
  )
}
