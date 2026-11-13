import { useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import {
  ArchiveIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardPasteIcon,
  CopyIcon,
  EllipsisIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderOpenIcon,
  MousePointer2Icon,
  PencilIcon,
  PinIcon,
  ScissorsIcon,
  Share2Icon,
  TextSelectIcon,
  TrashIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

// A dashed area that takes right-clicks. It has no hover look; focus draws a ring
// (Shift+F10 then opens the menu), and it stays marked while its menu is open.
const areaClass =
  'flex items-start justify-start rounded-lg border border-dashed border-foreground/25 bg-background p-3 text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-ring data-[state=open]:bg-muted/60'

/** A live right-click area with a page menu; area props (pinned state) go to the trigger element. */
function AreaMenu({ className, ...area }: ComponentProps<'div'>) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0} className={cn(areaClass, 'h-20 w-40', className)} {...area}>
          여기를 우클릭
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem>
          뒤로
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          새로고침
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          다른 이름으로 저장
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/*
 * Drawings of an open menu copy the look of the shadcn parts. A live menu
 * would portal to <body>, where the gallery and the anatomy could not show it.
 */
const drawnMenu = 'flex flex-col rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'
const drawnSubMenu = 'flex flex-col rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg'
const drawnItem = 'relative flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm [&_svg]:size-4 [&_svg]:shrink-0'
const drawnHighlight = 'bg-accent text-accent-foreground'
const drawnShortcut = 'ml-auto text-xs tracking-widest text-muted-foreground'
const drawnSeparator = '-mx-1 my-1 h-px bg-border'

function MiniMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className={cn(drawnMenu, 'w-40')}>
      {children}
    </div>
  )
}

/** Static drawing of a menu opened where the pointer right-clicked. */
function DrawnOpen() {
  return (
    <div role="img" aria-label="열린 메뉴: 우클릭한 자리에 메뉴가 뜸" className="relative h-36 w-44">
      <div className={cn(areaClass, 'absolute inset-x-0 top-0 h-20 border-ring bg-muted/60')}>여기를 우클릭</div>
      <div className={cn(drawnMenu, 'absolute top-10 left-12 w-32')}>
        <div className={drawnItem}>
          뒤로<span className={drawnShortcut}>⌘[</span>
        </div>
        <div className={drawnItem}>
          새로고침<span className={drawnShortcut}>⌘R</span>
        </div>
        <div className={drawnSeparator} />
        <div className={drawnItem}>
          저장<span className={drawnShortcut}>⌘S</span>
        </div>
      </div>
      {/* the arrow's tip sits on the menu's top-left corner */}
      <MousePointer2Icon className="absolute top-[37px] left-[45px] size-4 fill-foreground" />
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '닫힘', node: <AreaMenu /> },
        { label: '포커스', node: <AreaMenu data-demo-state="focus" /> },
        { label: '열림', node: <DrawnOpen /> },
        {
          label: '항목 강조',
          node: (
            <MiniMenu label="메뉴 항목: 이름 바꾸기가 강조됨">
              <div className={drawnItem}>열기</div>
              <div className={cn(drawnItem, drawnHighlight)}>
                이름 바꾸기<span className={cn(drawnShortcut, 'text-accent-foreground')}>F2</span>
              </div>
            </MiniMenu>
          ),
        },
        {
          label: '비활성 항목',
          node: (
            <MiniMenu label="메뉴 항목: 붙여넣기가 흐림">
              <div className={drawnItem}>
                복사<span className={drawnShortcut}>⌘C</span>
              </div>
              <div className={cn(drawnItem, 'opacity-50')}>
                붙여넣기<span className={drawnShortcut}>⌘V</span>
              </div>
            </MiniMenu>
          ),
        },
        {
          label: '체크 항목',
          node: (
            <MiniMenu label="메뉴 항목: 숨긴 파일 보기가 체크됨">
              <div className={cn(drawnItem, 'pr-8')}>
                숨긴 파일 보기
                <CheckIcon className="absolute right-2" />
              </div>
              <div className={cn(drawnItem, 'pr-8')}>확장자 보기</div>
            </MiniMenu>
          ),
        },
        {
          label: '위험한 항목',
          node: (
            <MiniMenu label="메뉴 항목: 삭제가 빨간 글씨">
              <div className={drawnItem}>
                <PencilIcon />
                이름 바꾸기
              </div>
              <div className={cn(drawnItem, 'text-destructive')}>
                <TrashIcon />
                삭제
              </div>
            </MiniMenu>
          ),
        },
        {
          label: '하위 메뉴 열림',
          node: (
            <div role="img" aria-label="하위 메뉴: 공유에서 옆으로 펼쳐짐" className="flex items-start">
              <div className={cn(drawnMenu, 'w-28')}>
                <div className={drawnItem}>복제</div>
                <div className={cn(drawnItem, drawnHighlight)}>
                  공유
                  <ChevronRightIcon className="ml-auto" />
                </div>
              </div>
              <div className={cn(drawnSubMenu, 'mt-7 -ml-1 w-28')}>
                <div className={drawnItem}>링크 복사</div>
                <div className={drawnItem}>이메일</div>
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}

function ContextMenuPreview() {
  return <AreaMenu />
}

/** Static drawing of an open menu on a file; a live one would portal to <body>. */
function ContextMenuSpecimen() {
  return (
    // 256px wide so the drawing also fits a phone-width stage
    <div className="relative h-48 w-64">
      <div
        data-slot="context-menu-trigger"
        className="absolute top-0 left-0 flex w-24 flex-col items-center gap-1.5 rounded-md bg-accent p-3 text-xs text-accent-foreground"
      >
        <FileTextIcon className="size-10 stroke-[1.25] text-muted-foreground" />
        보고서.pdf
      </div>
      <div data-slot="context-menu-content" className={cn(drawnMenu, 'absolute top-[46px] left-[36px] w-36')}>
        <div data-slot="context-menu-item" className={drawnItem}>
          <FolderOpenIcon />
          열기
        </div>
        <div className={drawnItem}>
          <PencilIcon />
          이름 바꾸기
          <span data-slot="context-menu-shortcut" className={drawnShortcut}>
            F2
          </span>
        </div>
        <div data-slot="context-menu-sub-trigger" className={cn(drawnItem, drawnHighlight)}>
          <Share2Icon />
          공유
          <ChevronRightIcon className="ml-auto" />
        </div>
        <div data-slot="context-menu-separator" className={drawnSeparator} />
        <div className={cn(drawnItem, 'text-destructive')}>
          <TrashIcon />
          삭제
          <span className={drawnShortcut}>⌘⌫</span>
        </div>
      </div>
      <div data-slot="context-menu-sub-content" className={cn(drawnSubMenu, 'absolute top-[102px] left-[176px] w-20')}>
        <div className={drawnItem}>링크 복사</div>
        <div className={drawnItem}>이메일</div>
      </div>
      {/* the arrow's tip sits on the menu's top-left corner, where the file was right-clicked */}
      <MousePointer2Icon className="absolute top-[43px] left-[33px] size-4 fill-foreground" />
    </div>
  )
}

type FileKind = 'doc' | 'image' | 'sheet'
type FileEntry = { id: string; name: string; kind: FileKind }

const fileIcons = { doc: FileTextIcon, image: FileImageIcon, sheet: FileSpreadsheetIcon }
const startFiles: FileEntry[] = [
  { id: 'report', name: '보고서.pdf', kind: 'doc' },
  { id: 'photo', name: '여행 사진.png', kind: 'image' },
  { id: 'budget', name: '예산.xlsx', kind: 'sheet' },
]
const shareWays = ['링크 복사', '이메일로 보내기', '메신저로 보내기']
// "보고서.pdf" → "보고서 (사본).pdf"
const copyName = (name: string) => name.replace(/(\.[^.]+)?$/, ' (사본)$1')

const tileClass =
  'flex w-full flex-col items-center gap-1.5 rounded-md p-2 text-center text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground'

function FileMenu() {
  const [files, setFiles] = useState(startFiles)
  const [message, setMessage] = useState('')
  const copies = useRef(0)

  const duplicate = (file: FileEntry) => {
    copies.current += 1
    const copy = { ...file, id: `${file.id}-copy-${copies.current}`, name: copyName(file.name) }
    setFiles((list) => {
      const at = list.findIndex((f) => f.id === file.id) + 1
      return [...list.slice(0, at), copy, ...list.slice(at)]
    })
    setMessage(`"${file.name}"을(를) 복제했습니다.`)
  }
  const remove = (file: FileEntry) => {
    setFiles((list) => list.filter((f) => f.id !== file.id))
    setMessage(`"${file.name}"을(를) 삭제했습니다.`)
  }
  const reset = () => {
    setFiles(startFiles)
    setMessage('')
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul aria-label="파일" className="grid min-h-28 grid-cols-3 gap-2 rounded-lg border bg-background p-3">
        {files.length === 0 && (
          <li className="col-span-3 self-center text-center text-sm text-muted-foreground">빈 폴더</li>
        )}
        {files.map((file) => {
          const Icon = fileIcons[file.kind]
          return (
            <li key={file.id} className="min-w-0">
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div tabIndex={0} className={tileClass}>
                    <Icon className="size-8 stroke-[1.25] text-muted-foreground" />
                    <span className="w-full truncate">{file.name}</span>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuLabel className="truncate">{file.name}</ContextMenuLabel>
                  <ContextMenuItem onSelect={() => setMessage(`"${file.name}"을(를) 열었습니다.`)}>
                    <FolderOpenIcon />
                    열기
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => setMessage(`"${file.name}"의 이름 바꾸기를 골랐습니다.`)}>
                    <PencilIcon />
                    이름 바꾸기
                    <ContextMenuShortcut>F2</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => duplicate(file)}>
                    <CopyIcon />
                    복제
                    <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      <Share2Icon />
                      공유
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-40">
                      {shareWays.map((way) => (
                        <ContextMenuItem key={way} onSelect={() => setMessage(`"${file.name}" 공유: ${way}`)}>
                          {way}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onSelect={() => remove(file)}>
                    <TrashIcon />
                    삭제
                    <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          )
        })}
      </ul>
      <div className="flex items-start justify-between gap-2">
        <p role="status" className="text-xs text-muted-foreground">
          {message || '파일을 우클릭해 보세요.'}
        </p>
        {files !== startFiles && (
          <Button variant="ghost" size="xs" onClick={reset}>
            처음으로
          </Button>
        )}
      </div>
    </div>
  )
}

type Sort = 'name' | 'date' | 'size'

const folderFiles = [
  { name: '디자인 시안', ext: 'fig', kb: 4200, date: '2026-11-02', hidden: false },
  { name: '회의록', ext: 'docx', kb: 38, date: '2026-11-10', hidden: false },
  { name: '예산', ext: 'xlsx', kb: 120, date: '2026-10-28', hidden: false },
  { name: '.임시 저장', ext: 'tmp', kb: 2, date: '2026-11-12', hidden: true },
  { name: '사진 모음', ext: 'zip', kb: 15800, date: '2026-09-15', hidden: false },
]
const sorts: { value: Sort; label: string }[] = [
  { value: 'name', label: '이름순' },
  { value: 'date', label: '최근 수정순' },
  { value: 'size', label: '큰 파일순' },
]
const compare: Record<Sort, (a: (typeof folderFiles)[number], b: (typeof folderFiles)[number]) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, 'ko'),
  date: (a, b) => b.date.localeCompare(a.date),
  size: (a, b) => b.kb - a.kb,
}
const formatSize = (kb: number) => (kb >= 1000 ? `${(kb / 1000).toFixed(1)}MB` : `${kb}KB`)
const formatDate = (iso: string) => {
  const [, month, day] = iso.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}
// checkbox and radio items keep the menu open, so several can be changed in a row
const keepOpen = (event: Event) => event.preventDefault()

function ViewOptions() {
  const [showHidden, setShowHidden] = useState(false)
  const [showExt, setShowExt] = useState(true)
  const [sort, setSort] = useState<Sort>('name')
  const shown = folderFiles.filter((f) => showHidden || !f.hidden).sort(compare[sort])
  const sortLabel = sorts.find((s) => s.value === sort)!.label

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            tabIndex={0}
            className="flex flex-col gap-1 rounded-lg border bg-background p-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-ring"
          >
            <p className="px-2 py-1 text-xs text-muted-foreground">내 문서 · {shown.length}개</p>
            <ul aria-label="폴더 내용" className="flex flex-col">
              {shown.map((f) => (
                <li
                  key={f.name}
                  className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-sm', f.hidden && 'text-muted-foreground')}
                >
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{showExt ? `${f.name}.${f.ext}` : f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDate(f.date)} · {formatSize(f.kb)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuLabel>보기</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden} onSelect={keepOpen}>
            숨긴 파일 보기
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showExt} onCheckedChange={setShowExt} onSelect={keepOpen}>
            확장자 보기
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>정렬</ContextMenuLabel>
          <ContextMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as Sort)}>
            {sorts.map((s) => (
              <ContextMenuRadioItem key={s.value} value={s.value} onSelect={keepOpen}>
                {s.label}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-xs text-muted-foreground">
        정렬: {sortLabel} · 숨긴 파일 {showHidden ? '보임' : '숨김'} · 확장자 {showExt ? '보임' : '숨김'}
      </p>
    </div>
  )
}

const sampleText = '우클릭 메뉴는 지금 상황에 맞는 동작만 보여 줍니다. 글자를 드래그해 고른 뒤 우클릭해 보세요.'
const short = (text: string) => (text.length > 12 ? `${text.slice(0, 12)}…` : text)

function TextEditMenu() {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  // where the selection goes once the menu has closed
  const restore = useRef<[number, number] | null>(null)
  const [text, setText] = useState(sampleText)
  const [range, setRange] = useState<[number, number]>([0, 0])
  const [clipboard, setClipboard] = useState('')
  const [message, setMessage] = useState('')
  const [start, end] = range
  const selected = text.slice(start, end)

  // the menu reads the selection at the moment it opens
  const capture = () => {
    const el = ref.current
    if (el) setRange([el.selectionStart, el.selectionEnd])
  }
  const keep = (value: string) => {
    setClipboard(value)
    void navigator.clipboard?.writeText(value).catch(() => {})
  }
  const cut = () => {
    keep(selected)
    setText(text.slice(0, start) + text.slice(end))
    restore.current = [start, start]
    setMessage(`"${short(selected)}"을(를) 잘라냈습니다.`)
  }
  const copy = () => {
    keep(selected)
    restore.current = [start, end]
    setMessage(`"${short(selected)}"을(를) 복사했습니다.`)
  }
  const paste = () => {
    setText(text.slice(0, start) + clipboard + text.slice(end))
    const caret = start + clipboard.length
    restore.current = [caret, caret]
    setMessage(`"${short(clipboard)}"을(를) 붙여 넣었습니다.`)
  }
  const selectAll = () => {
    restore.current = [0, text.length]
    setMessage('글 전체를 골랐습니다.')
  }
  // give focus and the selection back to the text instead of the default target
  const backToText = (event: Event) => {
    event.preventDefault()
    const el = ref.current
    if (!el) return
    el.focus()
    if (restore.current) {
      el.setSelectionRange(...restore.current)
      restore.current = null
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor={id}>메모</Label>
      {/* select-text: the trigger turns text selection off by default, but this text must be selectable */}
      <ContextMenu>
        <ContextMenuTrigger asChild className="select-text">
          <Textarea
            ref={ref}
            id={id}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onContextMenu={capture}
            className="bg-background"
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48" onCloseAutoFocus={backToText}>
          <ContextMenuItem disabled={!selected} onSelect={cut}>
            <ScissorsIcon />
            잘라내기
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled={!selected} onSelect={copy}>
            <CopyIcon />
            복사
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled={!clipboard} onSelect={paste}>
            <ClipboardPasteIcon />
            붙여넣기
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={selectAll}>
            <TextSelectIcon />
            모두 선택
            <ContextMenuShortcut>⌘A</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-xs text-muted-foreground">
        {message || '아무것도 고르지 않고 우클릭하면 잘라내기와 복사가 흐리게 나옵니다.'}
      </p>
      <p className="text-xs text-muted-foreground">붙여 넣을 글: {clipboard ? `"${short(clipboard)}"` : '없음'}</p>
    </div>
  )
}

const cardActions = [
  { label: '편집', icon: PencilIcon },
  { label: '고정', icon: PinIcon },
  { label: '보관', icon: ArchiveIcon },
]

function BothWays() {
  const [message, setMessage] = useState('')
  const pick = (way: string, label: string) => () => setMessage(`${way}에서 "${label}"을(를) 골랐습니다.`)

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            tabIndex={0}
            className="flex items-start gap-3 rounded-lg border bg-background p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-ring"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-sm font-medium">디자인 검토</p>
              <p className="text-xs text-muted-foreground">금요일까지 · 김하늘</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="더 보기">
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {cardActions.map((action) => (
                  <DropdownMenuItem key={action.label} onSelect={pick('⋯ 버튼 메뉴', action.label)}>
                    <action.icon />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-36">
          {cardActions.map((action) => (
            <ContextMenuItem key={action.label} onSelect={pick('우클릭 메뉴', action.label)}>
              <action.icon />
              {action.label}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-xs text-muted-foreground">
        {message || '카드를 우클릭하거나 ⋯ 버튼을 눌러 보세요. 같은 동작이 들어 있습니다.'}
      </p>
    </div>
  )
}

export const contextMenuEntry: ShowcaseEntry = {
  id: 'context-menu',
  name: 'Context Menu',
  aliases: ['Right-click menu', 'Shortcut menu', '우클릭 메뉴', '컨텍스트 메뉴', '오른쪽 클릭 메뉴'],
  description: '마우스 오른쪽 버튼으로 누른 자리에 그 대상에 맞는 동작을 띄우는 메뉴.',
  category: 'overlay',
  Preview: ContextMenuPreview,
  anatomy: {
    Specimen: ContextMenuSpecimen,
    parts: [
      {
        slot: 'context-menu-trigger',
        name: 'ContextMenuTrigger',
        description: '우클릭(휴대폰은 길게 누르기)을 받는 대상. 메뉴는 누른 자리에 뜸',
      },
      { slot: 'context-menu-content', name: 'ContextMenuContent', description: '마우스 끝에 떠오르는 메뉴 상자' },
      { slot: 'context-menu-item', name: 'ContextMenuItem', description: '고르면 바로 실행되고 메뉴가 닫히는 항목 한 줄' },
      { slot: 'context-menu-shortcut', name: 'ContextMenuShortcut', description: '같은 동작의 단축키 안내. 누를 수는 없음' },
      {
        slot: 'context-menu-sub-trigger',
        name: 'ContextMenuSubTrigger',
        description: '한 단계 더 들어가는 항목. ContextMenuSub가 하위 메뉴와 함께 묶음',
      },
      { slot: 'context-menu-sub-content', name: 'ContextMenuSubContent', description: '옆으로 펼쳐지는 하위 메뉴' },
      { slot: 'context-menu-separator', name: 'ContextMenuSeparator', description: '항목 묶음 사이의 선' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '메뉴를 받는 영역과 메뉴 항목이 가질 수 있는 상태를 모았습니다. 열림부터는 그림입니다. 이 디자인의 우클릭 영역은 호버해도 모양이 바뀌지 않아 호버 칸은 두지 않았습니다. 닫힘 칸을 실제로 우클릭해 보세요.',
      Demo: States,
    },
    {
      title: '파일 우클릭 메뉴',
      description:
        '파일을 우클릭하면 그 파일에 할 수 있는 일만 모아 마우스 끝에 띄웁니다. 복제와 삭제는 실제로 목록을 바꿉니다. 키보드는 파일에 Tab으로 포커스한 뒤 Shift+F10(또는 메뉴 키), 휴대폰과 태블릿은 길게 누르면 같은 메뉴가 열립니다.',
      Demo: FileMenu,
    },
    {
      title: '보기 설정',
      description:
        '켜고 끄는 항목(ContextMenuCheckboxItem)과 하나만 고르는 항목(ContextMenuRadioGroup)도 넣을 수 있습니다. 이런 항목은 골라도 메뉴가 닫히지 않게 해 여러 개를 연달아 바꾸게 합니다. 목록을 우클릭해 숨긴 파일과 정렬을 바꿔 보세요.',
      Demo: ViewOptions,
    },
    {
      title: '텍스트 편집 메뉴',
      description:
        '지금 할 수 없는 동작은 숨기지 않고 흐리게 둡니다. 그래야 항목 자리가 매번 바뀌지 않습니다. 아무것도 고르지 않고 우클릭한 뒤, 글자를 드래그해 고르고 다시 우클릭해 보세요.',
      Demo: TextEditMenu,
    },
    {
      title: '⋯ 버튼과 함께 두기',
      description:
        '우클릭 메뉴는 눈에 보이지 않아 모르는 사람은 찾지 못합니다. 그래서 중요한 동작은 ⋯ 버튼(Dropdown Menu)처럼 보이는 길에도 똑같이 두고, 우클릭은 아는 사람을 위한 지름길로 씁니다.',
      Demo: BothWays,
    },
  ],
}
