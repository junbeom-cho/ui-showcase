import { useId, useState, type KeyboardEvent } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  BookmarkIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  EqualIcon,
  FileTextIcon,
  HouseIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BrowserFrame, ContentSketch, PhoneFrame } from '../navigation-patterns/frames'
import { stay } from '../navigation-patterns/parts'
import { IconDemo, MenuIconButton } from './parts'

const SCREENS = [
  { label: '홈', icon: HouseIcon },
  { label: '검색', icon: SearchIcon },
  { label: '저장함', icon: BookmarkIcon },
  { label: '설정', icon: SettingsIcon },
]

/** 01. ☰ slides a navigation drawer in from the side, inside the phone. */
export function HamburgerFormat() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('홈')
  // the drawer is portalled into the phone screen so it never covers the page
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null)

  return (
    <IconDemo id="hamburger" status={`현재 화면: ${current} · 서랍 ${open ? '열림' : '닫힘'}`}>
      <PhoneFrame className="h-80 self-center">
        <div ref={setScreenEl} className="relative flex min-h-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
              <DialogPrimitive.Trigger asChild>
                <MenuIconButton icon={MenuIcon} label="메뉴 열기" />
              </DialogPrimitive.Trigger>
              <DialogPrimitive.Portal container={screenEl}>
                <DialogPrimitive.Overlay className="absolute inset-0 z-10 bg-black/40 motion-safe:animate-in motion-safe:fade-in-0" />
                <DialogPrimitive.Content
                  aria-describedby={undefined}
                  className="absolute inset-y-0 left-0 z-20 flex w-3/4 flex-col bg-background shadow-xl outline-none motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
                >
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <DialogPrimitive.Title className="text-sm font-semibold">메뉴</DialogPrimitive.Title>
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="메뉴 닫기">
                        <XIcon />
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                  <nav aria-label="앱 메뉴" className="p-2">
                    <ul className="flex flex-col gap-0.5">
                      {SCREENS.map(({ label, icon: Icon }) => (
                        <li key={label}>
                          <a
                            href="#"
                            aria-current={label === current ? 'page' : undefined}
                            onClick={(event) => {
                              stay(event)
                              setCurrent(label)
                              setOpen(false)
                            }}
                            className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                          >
                            <Icon aria-hidden className="size-4" />
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
            <p className="text-sm font-semibold">{current}</p>
          </header>
          <div key={current} className="p-4 motion-safe:animate-in motion-safe:fade-in-0">
            <ContentSketch rows={4} />
          </div>
        </div>
      </PhoneFrame>
    </IconDemo>
  )
}

const FILES = ['기획서.pdf', '회의록.docx', '예산표.xlsx']

/** 02. ⋮ on each row opens that row's own actions. */
export function KebabFormat() {
  const [files, setFiles] = useState(FILES)
  const [starred, setStarred] = useState<string[]>([])
  const [note, setNote] = useState('파일 줄 끝의 ⋮를 눌러 보세요.')

  return (
    <IconDemo id="kebab" status={`${note} · 파일 ${files.length}개`}>
      <BrowserFrame url="drive.example/내 파일" className="h-56">
        {files.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            파일이 없습니다
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles(FILES)
                setNote('파일을 다시 채웠습니다')
              }}
            >
              다시 채우기
            </Button>
          </div>
        ) : (
          <ul aria-label="파일" className="divide-y">
            {files.map((name) => (
              <li key={name} className="flex h-11 items-center gap-2 px-3 text-sm">
                <FileTextIcon aria-hidden className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{name}</span>
                {starred.includes(name) && <StarIcon aria-label="즐겨찾기" className="size-3.5 fill-amber-400 text-amber-400" />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <MenuIconButton icon={EllipsisVerticalIcon} label={`${name} 더보기`} size="icon-sm" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuCheckboxItem
                      checked={starred.includes(name)}
                      onCheckedChange={(on) => {
                        setStarred((s) => (on ? [...s, name] : s.filter((n) => n !== name)))
                        setNote(`‘${name}’ 즐겨찾기 ${on ? '추가' : '해제'}`)
                      }}
                    >
                      즐겨찾기
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuItem onSelect={() => setNote(`‘${name}’ 공유 링크를 만들었습니다`)}>공유</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        setFiles((f) => f.filter((n) => n !== name))
                        setNote(`‘${name}’ 삭제`)
                      }}
                    >
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </BrowserFrame>
    </IconDemo>
  )
}

/** 03. ⋯ in a card's corner opens what can be done to that post. */
export function MeatballsFormat() {
  const [saved, setSaved] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [note, setNote] = useState('카드 오른쪽 위의 ⋯를 눌러 보세요.')

  return (
    <IconDemo id="meatballs" status={note}>
      <BrowserFrame url="feed.example" bodyClassName="p-4">
        {hidden ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            이 글을 숨겼습니다
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHidden(false)
                setNote('숨기기를 되돌렸습니다')
              }}
            >
              되돌리기
            </Button>
          </div>
        ) : (
          <article aria-label="김하늘의 글" className="flex flex-col gap-3 rounded-xl border p-4">
            <header className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                하
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">김하늘</p>
                <p className="text-xs text-muted-foreground">2시간 전{saved && ' · 저장됨'}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <MenuIconButton icon={EllipsisIcon} label="게시물 옵션" size="icon-sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuCheckboxItem
                    checked={saved}
                    onCheckedChange={(on) => {
                      setSaved(on)
                      setNote(on ? '글을 저장했습니다' : '저장을 취소했습니다')
                    }}
                  >
                    저장
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuItem onSelect={() => setNote('링크를 복사했습니다')}>링크 복사</DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setHidden(true)
                      setNote('글을 숨겼습니다')
                    }}
                  >
                    이 글 숨기기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setNote('신고를 접수했습니다')}>
                    신고
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <p className="text-sm">주말에 다녀온 바닷가 사진 몇 장 올려요.</p>
            <div aria-hidden className="h-20 rounded-lg bg-muted" />
          </article>
        )}
      </BrowserFrame>
    </IconDemo>
  )
}

const READING = ['디자인 원칙 10가지', '아이콘 이름 짓기', '좋은 툴팁 쓰기']

/** 07. Two lines: a short menu in the header — and the drag handle it is mistaken for. */
export function VeggieBurgerFormat() {
  const [items, setItems] = useState(READING)
  const hintId = useId()
  const [note, setNote] = useState('위쪽 = 은 메뉴, 목록의 = 는 순서 손잡이입니다.')

  const onHandleKey = (event: KeyboardEvent, index: number) => {
    const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1
    if (to < 0 || to >= items.length) return
    event.preventDefault()
    const next = [...items]
    ;[next[index], next[to]] = [next[to], next[index]]
    setItems(next)
    setNote(`‘${items[index]}’을 ${to + 1}번째로 옮겼습니다`)
  }

  return (
    <IconDemo id="veggie-burger" status={note}>
      <BrowserFrame url="blog.example">
        <header className="flex h-12 items-center justify-between border-b px-3">
          <span className="text-sm font-semibold">한 줄 블로그</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuIconButton icon={EqualIcon} label="메뉴" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {['소개', '글 목록', '구독'].map((label) => (
                <DropdownMenuItem key={label} onSelect={() => setNote(`메뉴에서 ‘${label}’을 골랐습니다`)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="p-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">읽을 목록</p>
          <ul aria-label="읽을 목록" className="divide-y rounded-lg border">
            {items.map((title, index) => (
              <li key={title} className="flex h-10 items-center gap-2 pr-3 pl-1 text-sm">
                <button
                  type="button"
                  aria-label={`${title} 순서 바꾸기`}
                  aria-describedby={hintId}
                  onKeyDown={(event) => onHandleKey(event, index)}
                  onClick={() => setNote('손잡이는 메뉴를 열지 않습니다. 끌거나 ↑↓ 키로 순서를 바꿉니다')}
                  className="grid size-7 cursor-grab place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <EqualIcon aria-hidden className="size-4" />
                </button>
                <span className="truncate">{title}</span>
              </li>
            ))}
          </ul>
          <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
            손잡이에 초점을 두고 ↑↓ 키로 옮겨 보세요.
          </p>
        </div>
      </BrowserFrame>
    </IconDemo>
  )
}
