import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { CheckIcon, CopyIcon, FileTextIcon, InfoIcon, PencilIcon, Share2Icon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const shareUrl = 'https://example.com/d/2026-plan'

/*
 * Drawings of an open popover copy the look of the shadcn parts. A live one
 * would portal to <body>, where the gallery and the anatomy could not show it.
 */
const drawnContent =
  'flex w-full flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10'
// An outline button while its popover is open (shadcn darkens it through aria-expanded).
const drawnOpenTrigger = cn(buttonVariants({ variant: 'outline' }), 'bg-muted')

function ShareHeader() {
  return (
    <PopoverHeader>
      <PopoverTitle>링크 공유</PopoverTitle>
      <PopoverDescription>링크가 있는 사람은 누구나 볼 수 있습니다.</PopoverDescription>
    </PopoverHeader>
  )
}

/** One live popover per gallery cell; button props (pinned state, disabled) go to the trigger. */
function OnePopover(props: ComponentProps<typeof Button>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" {...props}>
          <Share2Icon data-icon="inline-start" />
          공유
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <ShareHeader />
      </PopoverContent>
    </Popover>
  )
}

/** Static drawing of an open popover under its trigger. */
function DrawnOpen() {
  return (
    <div role="img" aria-label="열린 팝오버: 공유 버튼 아래에 링크 공유 상자" className="flex w-52 flex-col items-start gap-1">
      <span className={drawnOpenTrigger}>
        <Share2Icon data-icon="inline-start" />
        공유
      </span>
      <div className={drawnContent}>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">링크 공유</p>
          <p className="text-muted-foreground">링크가 있는 사람은 누구나 볼 수 있습니다.</p>
        </div>
      </div>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '닫힘', node: <OnePopover /> },
        { label: '호버', node: <OnePopover data-demo-state="hover" /> },
        { label: '포커스', node: <OnePopover data-demo-state="focus" /> },
        { label: '비활성', node: <OnePopover disabled /> },
        { label: '열림', node: <DrawnOpen /> },
      ]}
    />
  )
}

function PopoverPreview() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <InfoIcon data-icon="inline-start" />
          설명 보기
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <PopoverHeader>
          <PopoverTitle>팝오버</PopoverTitle>
          <PopoverDescription>버튼 옆에 떠오른 작은 상자입니다. 바깥을 누르면 닫힙니다.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}

/** Static drawing of an open popover; a live one would portal to <body>. */
function PopoverSpecimen() {
  return (
    <div className="flex w-64 flex-col items-start gap-1">
      <Button variant="outline" data-slot="popover-trigger" tabIndex={-1} className="bg-muted">
        <Share2Icon data-icon="inline-start" />
        공유
      </Button>
      <div data-slot="popover-content" className={drawnContent}>
        <div data-slot="popover-header" className="flex flex-col gap-0.5">
          <p data-slot="popover-title" className="font-medium">
            링크 공유
          </p>
          <p data-slot="popover-description" className="text-muted-foreground">
            링크가 있는 사람은 누구나 볼 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex h-8 min-w-0 flex-1 items-center truncate rounded-lg border border-input px-2.5 text-xs">
            example.com/d/2026-plan
          </span>
          <span className={buttonVariants({ size: 'sm' })}>복사</span>
        </div>
      </div>
    </div>
  )
}

function HelpPopover() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <dl className="grid grid-cols-[1fr_auto] items-center gap-y-2 rounded-lg border bg-background p-4 text-sm">
        <dt>상품 금액</dt>
        <dd className="text-right tabular-nums">27,000원</dd>
        <dt className="flex items-center gap-1">
          배송비
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="배송비 안내" className="text-muted-foreground">
                <InfoIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64">
              <PopoverHeader>
                <PopoverTitle>배송비 안내</PopoverTitle>
                <PopoverDescription>3만 원 이상 사면 무료입니다. 제주와 섬 지역은 3,000원이 더 붙습니다.</PopoverDescription>
              </PopoverHeader>
              <p className="rounded-md bg-muted px-2 py-1.5 text-xs">3,000원어치만 더 담으면 배송비가 사라집니다.</p>
            </PopoverContent>
          </Popover>
        </dt>
        <dd className="text-right tabular-nums">3,000원</dd>
        <dt className="border-t pt-2 font-medium">합계</dt>
        <dd className="border-t pt-2 text-right font-medium tabular-nums">30,000원</dd>
      </dl>
      <p role="status" className="text-xs text-muted-foreground">
        {open ? '설명이 열렸습니다. 바깥을 누르거나 Esc를 누르면 닫힙니다.' : '배송비 옆 ⓘ 버튼을 눌러 보세요.'}
      </p>
    </div>
  )
}

function SharePopover() {
  const id = useId()
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')

  // the button says "복사됨" for a moment, then offers to copy again
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = () => {
    void navigator.clipboard?.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setMessage('링크를 복사했습니다. 메신저나 메일에 붙여 넣으면 됩니다.')
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
        <FileTextIcon className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-medium">2026 계획</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2Icon data-icon="inline-start" />
              공유
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <ShareHeader />
            <div className="flex gap-2">
              <Label htmlFor={`${id}-link`} className="sr-only">
                공유 링크
              </Label>
              <Input
                id={`${id}-link`}
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="h-8 min-w-0 flex-1 text-xs"
              />
              <Button size="sm" onClick={copy}>
                {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {message || '공유 버튼을 눌러 링크를 복사해 보세요.'}
      </p>
    </div>
  )
}

function RenamePopover() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('디자인 회의록')
  const [draft, setDraft] = useState(name)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const openChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      // every opening starts from the current name
      setDraft(name)
      setError('')
    }
  }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = draft.trim()
    if (!next) {
      setError('이름을 적어 주세요.')
      return
    }
    setName(next)
    setMessage(`이름을 "${next}"(으)로 바꿨습니다.`)
    setOpen(false)
  }

  return (
    <div className="flex w-full max-w-72 flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
        <FileTextIcon className="size-4 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="이름 바꾸기">
              <PencilIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            {/* noValidate: the message below replaces the browser's own bubble */}
            <form noValidate onSubmit={save} className="flex flex-col gap-2.5">
              <PopoverHeader>
                <PopoverTitle>이름 바꾸기</PopoverTitle>
              </PopoverHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-name`}>새 이름</Label>
                <Input
                  id={`${id}-name`}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setError('')
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className="h-8"
                />
                {error && (
                  <p id={`${id}-error`} className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm">
                  저장
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {message || '연필 버튼을 눌러 이름을 바꿔 보세요. Enter로도 저장됩니다.'}
      </p>
    </div>
  )
}

const sides = [
  { value: 'top', label: '위', where: '위에' },
  { value: 'right', label: '오른쪽', where: '오른쪽에' },
  { value: 'bottom', label: '아래', where: '아래에' },
  { value: 'left', label: '왼쪽', where: '왼쪽에' },
] as const
const aligns = [
  { value: 'start', label: '시작', how: '시작 쪽 가장자리를 맞춥니다' },
  { value: 'center', label: '가운데', how: '가운데를 맞춥니다' },
  { value: 'end', label: '끝', how: '끝 쪽 가장자리를 맞춥니다' },
] as const
type Side = (typeof sides)[number]['value']
type Align = (typeof aligns)[number]['value']

function Placement() {
  const controlsRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<Side>('bottom')
  const [align, setAlign] = useState<Align>('center')
  const sideInfo = sides.find((s) => s.value === side)!
  const alignInfo = aligns.find((a) => a.value === align)!

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <div ref={controlsRef} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="font-mono text-xs text-muted-foreground">
            side
          </span>
          <ToggleGroup
            type="single"
            aria-label="side (여는 쪽)"
            variant="outline"
            size="sm"
            value={side}
            onValueChange={(value) => value && setSide(value as Side)}
          >
            {sides.map((s) => (
              <ToggleGroupItem key={s.value} value={s.value} className="px-3">
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="font-mono text-xs text-muted-foreground">
            align
          </span>
          <ToggleGroup
            type="single"
            aria-label="align (맞추는 곳)"
            variant="outline"
            size="sm"
            value={align}
            onValueChange={(value) => value && setAlign(value as Align)}
          >
            {aligns.map((a) => (
              <ToggleGroupItem key={a.value} value={a.value} className="px-3">
                {a.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {/* a stage with room on every side, so the box opens where it is asked to */}
      <div className="grid h-60 w-full place-items-center rounded-lg border border-dashed border-foreground/20">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-28">
              기준 버튼
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            align={align}
            className="w-40"
            // the side and align buttons stay usable while the box is open
            onInteractOutside={(event) => {
              if (controlsRef.current?.contains(event.target as Node)) event.preventDefault()
            }}
          >
            <code className="font-mono text-xs leading-relaxed">
              side=&quot;{side}&quot;
              <br />
              align=&quot;{align}&quot;
            </code>
          </PopoverContent>
        </Popover>
      </div>
      <p role="status" className="text-center text-xs text-muted-foreground">
        {`side="${side}" align="${align}": 버튼 ${sideInfo.where} 열리고, ${alignInfo.how}.`}
      </p>
    </div>
  )
}

function ComparePanel({ title, notes, children }: { title: string; notes: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <p className="font-mono text-sm font-medium">{title}</p>
      <div>{children}</div>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function Comparison() {
  const [message, setMessage] = useState('')
  const opened = (name: string) => (open: boolean) => open && setMessage(`${name}을(를) 열었습니다.`)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <ComparePanel
          title="Tooltip"
          notes={['마우스를 올리거나 포커스하면 저절로 뜹니다.', '짧은 글만 담고, 안을 누를 수 없습니다.']}
        >
          <TooltipProvider>
            <Tooltip onOpenChange={opened('Tooltip')}>
              <TooltipTrigger asChild>
                <Button variant="outline">올려 보기</Button>
              </TooltipTrigger>
              <TooltipContent>짧은 설명 한 줄</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComparePanel>
        <ComparePanel
          title="Popover"
          notes={['눌러야 열리고, 바깥을 누르면 닫힙니다.', '버튼·입력칸을 넣을 수 있고, 열린 채로 뒤 화면도 쓸 수 있습니다.']}
        >
          <Popover onOpenChange={opened('Popover')}>
            <PopoverTrigger asChild>
              <Button variant="outline">눌러 보기</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <PopoverHeader>
                <PopoverTitle>안을 눌러도 됩니다</PopoverTitle>
                <PopoverDescription>팝오버 안의 버튼은 실제로 동작합니다.</PopoverDescription>
              </PopoverHeader>
              <Button size="sm" onClick={() => setMessage('Popover 안의 버튼을 눌렀습니다.')}>
                안의 버튼
              </Button>
            </PopoverContent>
          </Popover>
        </ComparePanel>
        <ComparePanel
          title="Dialog"
          notes={['화면 전체를 어둡게 덮어 뒤 화면을 막습니다.', '답하거나 닫아야 돌아갑니다. 꼭 확인받을 일에 씁니다.']}
        >
          <Dialog onOpenChange={opened('Dialog')}>
            <DialogTrigger asChild>
              <Button variant="outline">눌러 보기</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>정말 나갈까요?</DialogTitle>
                <DialogDescription>저장하지 않은 내용은 사라집니다. 이 창이 떠 있는 동안 뒤 화면은 누를 수 없습니다.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => setMessage('Dialog에서 "나가기"를 골랐습니다.')}>나가기</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComparePanel>
      </div>
      <p role="status" className="text-center text-xs text-muted-foreground">
        {message || '세 버튼을 차례로 열어 보세요.'}
      </p>
    </div>
  )
}

export const popoverEntry: ShowcaseEntry = {
  id: 'popover',
  name: 'Popover',
  aliases: ['Popup', 'Popover panel', 'Flyout', 'Toggletip', '팝오버', '팝업 상자'],
  description: '버튼을 누르면 그 옆에 떠올라 설명이나 작은 입력칸을 보여 주는 상자.',
  category: 'overlay',
  Preview: PopoverPreview,
  anatomy: {
    Specimen: PopoverSpecimen,
    parts: [
      { slot: 'popover-trigger', name: 'PopoverTrigger', description: '누르면 상자를 열고 닫는 버튼. 열린 동안 눌린 색으로 남음' },
      { slot: 'popover-content', name: 'PopoverContent', description: '버튼 옆에 떠오르는 상자. 글뿐 아니라 입력칸·버튼도 담음' },
      { slot: 'popover-header', name: 'PopoverHeader', description: '제목과 설명을 묶는 머리 부분' },
      { slot: 'popover-title', name: 'PopoverTitle', description: '상자의 제목' },
      { slot: 'popover-description', name: 'PopoverDescription', description: '제목 아래의 흐린 설명 글' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '여는 버튼의 상태와 열린 상자를 나란히 놓았습니다. 열림은 그림이며, 상자가 열려 있는 동안 버튼은 호버와 같은 색으로 남습니다. 호버와 포커스는 고정해 그렸습니다.',
      Demo: States,
    },
    {
      title: '도움말 설명',
      description:
        'ⓘ 버튼을 누르면 그 자리에 설명 상자가 뜹니다. Tooltip과 달리 눌러야 열리고 열린 채로 읽을 수 있어, 두세 문장짜리 설명이나 링크가 든 설명에 맞습니다. 한두 단어면 Tooltip으로 충분합니다. 열고 나서 바깥을 누르거나 Esc로 닫아 보세요.',
      Demo: HelpPopover,
    },
    {
      title: '공유하기',
      description:
        '상자 안에 입력칸과 버튼을 넣어 작은 일을 끝내게 합니다. 화면을 떠나지 않고 링크를 복사하고 바로 하던 일로 돌아옵니다. 공유를 눌러 링크를 복사해 보세요.',
      Demo: SharePopover,
    },
    {
      title: '작은 편집 폼',
      description:
        '이름 하나처럼 짧은 수정은 그 자리에서 받습니다. 저장하면 상자가 닫히고, 비워 두고 저장하면 이유를 알려 줍니다. 입력칸이 여러 개거나 꼭 확인받아야 하는 일이면 Dialog가 낫습니다.',
      Demo: RenamePopover,
    },
    {
      title: '위치',
      description:
        'side는 버튼의 어느 쪽에 열지, align은 그쪽에서 어디에 맞출지 정합니다. 시작은 위·아래로 열 때 왼쪽, 옆으로 열 때 위쪽입니다. 상자를 연 채로 버튼을 바꿔 보세요. 화면 가장자리라 자리가 모자라면 반대쪽으로 뒤집힙니다.',
      Demo: Placement,
    },
    {
      title: 'Tooltip·Dialog와 비교',
      description:
        '셋 다 화면 위에 떠오르지만 여는 방법과 뒤 화면을 막는지가 다릅니다. 저절로 뜨는 짧은 글은 Tooltip, 눌러서 여는 작은 내용은 Popover, 답을 받아야 넘어가는 일은 Dialog입니다.',
      Demo: Comparison,
    },
  ],
}
