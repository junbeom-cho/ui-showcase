import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  ImagePlusIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

/*
 * A live drawer portals to <body> and covers the whole viewport, so the state
 * gallery, the preview and the anatomy draw it on a miniature phone instead.
 */

/** Placeholder app content behind a drawn drawer. */
function FeedBackdrop() {
  return (
    <div aria-hidden className="flex flex-col gap-2 p-3 pt-5">
      <div className="h-2 w-1/2 rounded bg-muted-foreground/25" />
      <div className="h-12 rounded-md bg-muted" />
      <div className="h-1.5 w-4/5 rounded bg-muted" />
      <div className="h-1.5 w-3/5 rounded bg-muted" />
      <div className="h-12 rounded-md bg-muted" />
      <div className="h-1.5 w-2/3 rounded bg-muted" />
    </div>
  )
}

/** A drawn street map, the usual backdrop for a drawer that stops half open. */
function MapBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('absolute inset-0 overflow-hidden bg-emerald-50 dark:bg-emerald-950/40', className)}>
      <div className="absolute inset-x-0 top-[30%] h-2 bg-background/90" />
      <div className="absolute inset-y-0 left-[38%] w-2 bg-background/90" />
      <div className="absolute -inset-x-4 top-[62%] h-1.5 -rotate-12 bg-background/80" />
      <div className="absolute top-[8%] right-[10%] size-8 rounded-md bg-sky-200/70 dark:bg-sky-900/50" />
      <MapPinIcon className="absolute top-[18%] left-[52%] size-5 fill-red-500 text-red-700" />
    </div>
  )
}

const phoneSize = {
  sm: 'h-56 w-32 rounded-[1.25rem] border-[3px]',
  xs: 'h-36 w-20 rounded-[0.9rem] border-2',
  lg: 'h-[25rem] w-60 rounded-[1.75rem] border-4',
} as const

/** A phone outline with app content inside; drawn overlays go in as children. */
function Phone({
  size = 'sm',
  backdrop = 'feed',
  label,
  children,
}: {
  size?: keyof typeof phoneSize
  backdrop?: 'feed' | 'map'
  /** names the drawing for screen readers; leave out where the parts are labelled instead */
  label?: string
  children?: ReactNode
}) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn('relative shrink-0 overflow-hidden border-foreground/80 bg-background shadow-sm', phoneSize[size])}
    >
      {backdrop === 'map' ? <MapBackdrop /> : <FeedBackdrop />}
      {children}
    </div>
  )
}

const drawnSheet = 'absolute inset-x-0 bottom-0 flex flex-col rounded-t-xl border-t bg-background shadow-[0_-4px_12px_rgb(0_0_0/0.08)]'
const drawnHandle = 'mx-auto mt-1.5 h-1 w-8 shrink-0 rounded-full bg-muted-foreground/40'

function DrawnShareRow() {
  return (
    <div aria-hidden className="flex justify-center gap-1.5 px-2 pt-2">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="size-5 rounded-full bg-muted" />
      ))}
    </div>
  )
}

function DrawnLines({ count }: { count: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-1.5 px-3 pt-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-3 shrink-0 rounded-full bg-muted" />
          <span className={cn('h-1.5 rounded bg-muted', i % 2 ? 'w-3/5' : 'w-4/5')} />
        </div>
      ))}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        {
          label: '닫힘',
          node: (
            <Phone label="닫힌 드로어: 화면 아래에 공유 버튼만 보임">
              <div className="absolute inset-x-3 bottom-3 rounded-full bg-primary py-1 text-center text-[11px] font-medium text-primary-foreground">
                공유
              </div>
            </Phone>
          ),
        },
        {
          label: '열림(손잡이)',
          node: (
            <Phone label="열린 드로어: 어두운 막 위로 손잡이 달린 시트가 올라옴">
              <div className="absolute inset-0 bg-black/30" />
              <div className={cn(drawnSheet, 'h-[52%]')}>
                <div className={drawnHandle} />
                <p className="mt-1.5 text-center text-[11px] font-medium">공유하기</p>
                <DrawnShareRow />
                <DrawnLines count={2} />
              </div>
            </Phone>
          ),
        },
        {
          label: '끌어내리는 중',
          node: (
            <Phone label="끌어내리는 중: 손가락이 손잡이를 잡고 내려 시트가 아래로 밀리고 막이 옅어짐">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-x-0 bottom-0 h-[52%] rounded-t-xl border border-dashed border-foreground/30" />
              <div className={cn(drawnSheet, 'h-[52%] translate-y-[45%]')}>
                <div className={drawnHandle} />
                <p className="mt-1.5 text-center text-[11px] font-medium">공유하기</p>
                <DrawnShareRow />
                <span className="absolute -top-2 left-1/2 size-6 -translate-x-1/2 rounded-full bg-foreground/15 ring-2 ring-foreground/30" />
                <ArrowDownIcon aria-hidden className="absolute -top-8 left-1/2 size-4 -translate-x-1/2 text-foreground/70" />
              </div>
            </Phone>
          ),
        },
        {
          label: '반만 열림(스냅)',
          node: (
            <Phone backdrop="map" label="반만 열린 드로어: 지도가 보이는 채로 화면의 40%에서 멈춤">
              <div className={cn(drawnSheet, 'h-[40%]')}>
                <div className={drawnHandle} />
                <p className="mt-1.5 px-3 text-[11px] font-medium">성수 카페 거리</p>
                <p className="flex items-center gap-0.5 px-3 text-[11px] text-muted-foreground">
                  <ChevronUpIcon aria-hidden className="size-3" />
                  밀면 더 보기
                </p>
              </div>
            </Phone>
          ),
        },
        {
          label: '전체 열림',
          node: (
            <Phone label="전체 열린 드로어: 화면 거의 전체를 덮고 목록과 버튼이 보임">
              <div className="absolute inset-0 bg-black/45" />
              <div className={cn(drawnSheet, 'top-[7%]')}>
                <div className={drawnHandle} />
                <p className="mt-1.5 px-3 text-[11px] font-medium">카페 12곳</p>
                <DrawnLines count={6} />
                <div className="mx-3 mt-auto mb-3 rounded-md bg-primary py-1 text-center text-[11px] font-medium text-primary-foreground">
                  길찾기
                </div>
              </div>
            </Phone>
          ),
        },
      ]}
    />
  )
}

function DrawerPreview() {
  return (
    <Phone size="xs" label="아래에서 올라온 드로어">
      <div className="absolute inset-0 bg-black/30" />
      <div className={cn(drawnSheet, 'h-[48%] rounded-t-lg')}>
        <div className="mx-auto mt-1 h-0.5 w-5 shrink-0 rounded-full bg-muted-foreground/40" />
        <div aria-hidden className="flex flex-col gap-1 px-2 pt-2">
          <span className="mx-auto h-1 w-8 rounded bg-muted-foreground/40" />
          <span className="h-1 w-full rounded bg-muted" />
          <span className="h-1 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </Phone>
  )
}

const shareTargets = [
  { label: '메시지', Icon: MessageCircleIcon },
  { label: '메일', Icon: MailIcon },
  { label: '링크 복사', Icon: LinkIcon },
  { label: '기기에 저장', Icon: DownloadIcon },
]

/** Static drawing of an open drawer; a live one would portal to <body>. */
function DrawerSpecimen() {
  return (
    <Phone size="lg">
      <div data-slot="drawer-overlay" className="absolute inset-0 bg-black/30" />
      <div data-slot="drawer-content" className={cn(drawnSheet, 'h-[64%] rounded-t-2xl')}>
        <div data-slot="drawer-handle" className="mx-auto mt-3 h-1 w-14 shrink-0 rounded-full bg-muted" />
        <div data-slot="drawer-header" className="flex flex-col gap-0.5 p-3 text-center">
          <p data-slot="drawer-title" className="text-sm font-medium">
            공유하기
          </p>
          <p data-slot="drawer-description" className="text-xs text-muted-foreground">
            사진 1장을 보낼 곳을 고르세요.
          </p>
        </div>
        <div aria-hidden className="grid grid-cols-4 gap-1 px-3">
          {shareTargets.map(({ label, Icon }) => (
            <span key={label} className="flex flex-col items-center gap-1 text-[11px] leading-tight text-muted-foreground">
              <span className="grid size-8 place-items-center rounded-full bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
            </span>
          ))}
        </div>
        <div data-slot="drawer-footer" className="mt-auto flex flex-col gap-2 p-3">
          <span
            data-slot="drawer-close"
            className="flex h-8 items-center justify-center rounded-lg border bg-background text-sm font-medium"
          >
            취소
          </span>
        </div>
      </div>
    </Phone>
  )
}

type CloseReason = 'drag' | 'button' | 'escape' | 'outside'

const closedBy: Record<CloseReason, string> = {
  drag: '손잡이를 끌어내려',
  button: '닫기 버튼으로',
  escape: 'Esc 키로',
  outside: '바깥을 눌러',
}

const orderItems = [
  { name: '원두 1kg', price: '18,000원' },
  { name: '드립 필터 100매', price: '4,500원' },
  { name: '머그컵', price: '9,500원' },
]

function BottomSheet() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('버튼을 눌러 바텀 시트를 열어 보세요.')
  // vaul closes a dragged drawer without telling why, so every other way of closing marks itself here first.
  const reason = useRef<CloseReason>('drag')

  const change = (next: boolean) => {
    setOpen(next)
    if (next) {
      reason.current = 'drag'
      setResult('열림 · 위쪽 손잡이를 잡고 아래로 끌어내리면 닫힙니다.')
    } else {
      setResult(`닫힘 · ${closedBy[reason.current]} 닫았습니다.`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Drawer open={open} onOpenChange={change}>
        <DrawerTrigger asChild>
          <Button variant="outline">주문 상세 보기</Button>
        </DrawerTrigger>
        <DrawerContent
          onEscapeKeyDown={() => (reason.current = 'escape')}
          onPointerDownOutside={() => (reason.current = 'outside')}
        >
          <div className="mx-auto flex w-full max-w-sm flex-col">
            <DrawerHeader>
              <DrawerTitle>주문 상세</DrawerTitle>
              <DrawerDescription>11월 12일 주문 · 배송 중</DrawerDescription>
            </DrawerHeader>
            <ul className="flex flex-col divide-y px-4">
              {orderItems.map((item) => (
                <li key={item.name} className="flex justify-between py-2.5 text-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground tabular-nums">{item.price}</span>
                </li>
              ))}
            </ul>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" onClick={() => (reason.current = 'button')}>
                  닫기
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  )
}

const SNAP_POINTS = [0.4, 1]

const cafes = [
  { name: '연무장 로스터리', meta: '120m · ★ 4.7' },
  { name: '창고 브루잉', meta: '210m · ★ 4.5' },
  { name: '서울숲 커피바', meta: '340m · ★ 4.6' },
  { name: '뚝섬 아침빵', meta: '410m · ★ 4.4' },
  { name: '성수 티하우스', meta: '480m · ★ 4.8' },
  { name: '골목 끝 카페', meta: '530m · ★ 4.3' },
]

function SnapPoints() {
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0])
  const full = snap === 1

  const change = (next: boolean) => {
    setOpen(next)
    if (next) {
      setOpened(true)
      setSnap(SNAP_POINTS[0])
    }
  }

  const result = open
    ? full
      ? '전체 열림 (화면의 100%) · 아래로 끌면 40%에서 다시 멈춥니다.'
      : '반만 열림 (화면의 40%) · 위로 밀면 전체가 펼쳐집니다.'
    : opened
      ? '닫힘 · 가장 낮은 지점에서 더 끌어내리면 닫힙니다.'
      : '지도 위의 장소를 눌러 드로어를 열어 보세요.'

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="relative h-44 w-full overflow-hidden rounded-lg border">
        <MapBackdrop />
        <Drawer open={open} onOpenChange={change} snapPoints={SNAP_POINTS} activeSnapPoint={snap} setActiveSnapPoint={setSnap}>
          <DrawerTrigger asChild>
            <Button size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md">
              <MapPinIcon data-icon="inline-start" />
              성수 카페 거리
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[96%]">
            <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
              <DrawerHeader>
                <DrawerTitle>성수 카페 거리</DrawerTitle>
                <DrawerDescription>카페 12곳 · 지금 영업 중 9곳</DrawerDescription>
              </DrawerHeader>
              <div className="flex justify-center px-4">
                <Button size="sm" variant="outline" onClick={() => setSnap(full ? SNAP_POINTS[0] : 1)}>
                  {full ? '반으로 줄이기' : '전체로 펼치기'}
                </Button>
              </div>
              <ul aria-label="카페 목록" className={cn('mt-3 flex flex-col divide-y px-4', full && 'overflow-y-auto')}>
                {cafes.map((cafe) => (
                  <li key={cafe.name} className="flex justify-between py-2.5 text-sm">
                    <span>{cafe.name}</span>
                    <span className="text-muted-foreground">{cafe.meta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  )
}

const sheetActions = [
  { label: '앨범에 추가', Icon: ImagePlusIcon },
  { label: '즐겨찾기', Icon: StarIcon },
  { label: '삭제', Icon: Trash2Icon, destructive: true },
]

function ActionSheet() {
  const [result, setResult] = useState('사진 공유를 눌러 동작 하나를 골라 보세요.')
  const choose = (label: string) => setResult(`"${label}"을(를) 골랐습니다. 고르자마자 시트가 닫혔습니다.`)

  return (
    <div className="flex flex-col items-center gap-3">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">사진 공유</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto flex w-full max-w-sm flex-col">
            <DrawerHeader>
              <DrawerTitle>공유하기</DrawerTitle>
              <DrawerDescription>사진 1장을 보낼 곳이나 할 일을 고르세요.</DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-4 gap-1 px-4">
              {shareTargets.map(({ label, Icon }) => (
                <DrawerClose key={label} asChild>
                  <button
                    type="button"
                    onClick={() => choose(label)}
                    className="flex flex-col items-center gap-1.5 rounded-lg py-2 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-muted">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    {label}
                  </button>
                </DrawerClose>
              ))}
            </div>
            <ul className="mx-4 mt-3 flex flex-col divide-y rounded-lg border">
              {sheetActions.map(({ label, Icon, destructive }) => (
                <li key={label}>
                  <DrawerClose asChild>
                    <button
                      type="button"
                      onClick={() => choose(label)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                        destructive && 'text-destructive',
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                      {label}
                    </button>
                  </DrawerClose>
                </li>
              ))}
            </ul>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" onClick={() => setResult('아무것도 고르지 않고 취소했습니다.')}>
                  취소
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  )
}

const moods = ['좋아요', '보통이에요', '아쉬워요']

function FormDrawer() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState('')
  const [text, setText] = useState('')
  const [tried, setTried] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const invalid = tried && text.trim() === ''

  const change = (next: boolean) => {
    setOpen(next)
    if (next) setTried(false)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTried(true)
    if (text.trim() === '') return
    setSent(`의견을 보냈습니다: ${mood || '만족도 고르지 않음'} · ${text.trim().length}자`)
    setText('')
    setMood('')
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Drawer open={open} onOpenChange={change}>
        <DrawerTrigger asChild>
          <Button variant="outline">의견 보내기</Button>
        </DrawerTrigger>
        <DrawerContent>
          {/* noValidate: the message below replaces the browser's own bubble */}
          <form noValidate onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-col">
            <DrawerHeader>
              <DrawerTitle>의견 보내기</DrawerTitle>
              <DrawerDescription>앱을 쓰면서 느낀 점을 알려 주세요.</DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2">
                <Label id={`${id}-mood`}>만족도</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  aria-labelledby={`${id}-mood`}
                  value={mood}
                  onValueChange={setMood}
                >
                  {moods.map((m) => (
                    <ToggleGroupItem key={m} value={m} className="px-3">
                      {m}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-text`}>
                  의견 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`${id}-text`}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="예: 다크 모드가 있으면 좋겠어요"
                  aria-invalid={invalid || undefined}
                  aria-describedby={`${id}-${invalid ? 'error' : 'hint'}`}
                />
                {invalid ? (
                  <p id={`${id}-error`} className="text-xs text-destructive">
                    의견을 한 글자 이상 적어 주세요.
                  </p>
                ) : (
                  <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    보내면 드로어가 닫힙니다.
                  </p>
                )}
              </div>
            </div>
            <DrawerFooter>
              <Button type="submit">보내기</Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm text-muted-foreground">
        {sent ?? '의견 보내기를 눌러 양식을 채워 보세요.'}
      </p>
    </div>
  )
}

function ComparePanel({ name, notes, children }: { name: string; notes: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{name}</p>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

function Comparison() {
  const [last, setLast] = useState<string | null>(null)
  const opened = (name: string) => (open: boolean) => open && setLast(name)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <ComparePanel
          name="Drawer"
          notes={['화면 아래에서 올라옵니다.', '손잡이를 끌어내려 닫습니다.', '휴대폰에서 엄지가 닿는 곳에 띄울 때.']}
        >
          <Drawer onOpenChange={opened('Drawer')}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full">
                Drawer 열기
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto flex w-full max-w-sm flex-col">
                <DrawerHeader>
                  <DrawerTitle>Drawer</DrawerTitle>
                  <DrawerDescription>아래에서 올라왔습니다. 손잡이를 끌어내려 닫아 보세요.</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">닫기</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </ComparePanel>
        <ComparePanel
          name="Sheet"
          notes={['화면 옆(또는 위·아래)에서 미끄러져 나옵니다.', '끌어서 닫지 않고 X나 바깥을 눌러 닫습니다.', '넓은 화면의 필터·상세 패널에.']}
        >
          <Sheet onOpenChange={opened('Sheet')}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                Sheet 열기
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Sheet</SheetTitle>
                <SheetDescription>옆에서 나왔습니다. 뒤 화면의 자리를 유지한 채 내용을 덧붙여 봅니다.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </ComparePanel>
        <ComparePanel
          name="Dialog"
          notes={['화면 가운데에 뜹니다.', '답하기 전에는 뒤 화면을 쓸 수 없습니다.', '꼭 확인받아야 하는 질문에.']}
        >
          <Dialog onOpenChange={opened('Dialog')}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Dialog 열기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog</DialogTitle>
                <DialogDescription>가운데에 떴습니다. 확인이나 취소를 고를 때까지 기다립니다.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>확인</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComparePanel>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {last ? `마지막으로 연 것: ${last}` : '세 버튼을 하나씩 눌러 나오는 곳과 닫는 법을 비교해 보세요.'}
      </p>
    </div>
  )
}

export const drawerEntry: ShowcaseEntry = {
  id: 'drawer',
  name: 'Drawer',
  aliases: ['Bottom sheet', 'Action sheet', '바텀 시트', '드로어'],
  description: '휴대폰 화면 아래에서 올라오고, 손잡이를 끌어내려 닫는 패널.',
  category: 'mobile',
  Preview: DrawerPreview,
  anatomy: {
    Specimen: DrawerSpecimen,
    parts: [
      { slot: 'drawer-overlay', name: 'DrawerOverlay', description: '뒤 화면을 덮는 반투명 막. 누르면 닫힘' },
      { slot: 'drawer-content', name: 'DrawerContent', description: '아래에서 올라오는 패널. 위쪽 모서리만 둥글다' },
      { slot: 'drawer-handle', name: 'Handle', description: '잡고 끌어내리는 손잡이. 끌어 닫을 수 있다는 표시' },
      { slot: 'drawer-header', name: 'DrawerHeader', description: '제목과 설명을 묶는 머리 부분' },
      { slot: 'drawer-title', name: 'DrawerTitle', description: '무엇을 하는 패널인지 알리는 제목' },
      { slot: 'drawer-description', name: 'DrawerDescription', description: '제목 아래 덧붙이는 설명' },
      { slot: 'drawer-footer', name: 'DrawerFooter', description: '맨 아래 버튼 자리' },
      { slot: 'drawer-close', name: 'DrawerClose', description: '고르지 않고 닫는 버튼' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '휴대폰 화면에 그린 드로어가 거치는 모습입니다. 닫혀 있다가 손잡이 달린 시트로 올라오고, 끌어내리는 동안 뒤 화면이 다시 밝아집니다. 스냅 지점이 있으면 반만 열린 채 멈추기도 합니다.',
      Demo: States,
    },
    {
      title: '바텀 시트',
      description:
        '아래에서 올라오는 기본 드로어입니다. 휴대폰에서 엄지가 닿는 곳에 내용을 띄울 때 쓰고, 넓은 화면의 긴 양식에는 Dialog나 Sheet가 낫습니다. 열고 나서 위쪽 손잡이를 잡아 아래로 끌어내려 보세요. 닫기 버튼, Esc, 바깥 누르기로 닫으면 결과 글이 달라집니다.',
      Demo: BottomSheet,
    },
    {
      title: '스냅 지점',
      description:
        '정해 둔 높이(여기서는 화면의 40%와 100%)에서 멈추는 드로어입니다. 지도 앱처럼 처음에는 요약만 살짝 보여 주고, 위로 밀면 전체를 펼칩니다. 뒤 화면을 계속 봐야 할 때 쓰고, 처음부터 끝까지 읽어야 하는 내용에는 맞지 않습니다. 손잡이를 위아래로 끌거나 안의 버튼으로 높이를 바꿔 보세요.',
      Demo: SnapPoints,
    },
    {
      title: '공유 시트·액션 시트',
      description:
        '고를 수 있는 동작을 아래에 모아 두고, 하나를 누르면 바로 닫힙니다. 휴대폰의 공유하기·더보기(⋯) 메뉴가 이 모양입니다. 위험한 동작은 빨간색으로 아래쪽에 두고, 고르지 않고 닫는 취소를 꼭 둡니다. 하나를 골라 보세요.',
      Demo: ActionSheet,
    },
    {
      title: '폼이 든 드로어',
      description:
        '짧은 양식을 드로어에 넣었습니다. 보내기를 누르면 닫히고 결과가 아래에 남습니다. 의견을 비워 두고 보내면 닫히지 않고 이유를 알려 줍니다. 칸이 많고 긴 양식은 페이지나 Dialog로 옮기는 편이 낫습니다.',
      Demo: FormDrawer,
    },
    {
      title: 'Drawer·Sheet·Dialog 비교',
      description:
        '셋 다 화면 위에 덮어 띄우는 패널입니다. Drawer는 아래에서 올라와 끌어내려 닫고, Sheet는 옆에서 나오는 패널이며, Dialog는 가운데에서 답을 받을 때까지 뒤 화면을 막습니다. 하나씩 열어 나오는 곳과 닫는 법을 비교해 보세요.',
      Demo: Comparison,
    },
  ],
}
