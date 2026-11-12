import { useState } from 'react'
import {
  BellIcon,
  CheckCheckIcon,
  FolderIcon,
  HeartIcon,
  HouseIcon,
  KeyRoundIcon,
  MessageCircleIcon,
  Trash2Icon,
  TruckIcon,
  UserIcon,
  UserPlusIcon,
  WrenchIcon,
  type LucideIcon,
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
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { CountBadge } from './parts'

type Tab = 'home' | 'chat' | 'news' | 'me'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: '홈', icon: HouseIcon },
  { id: 'chat', label: '채팅', icon: MessageCircleIcon },
  { id: 'news', label: '소식', icon: BellIcon },
  { id: 'me', label: '내 정보', icon: UserIcon },
]

/** 5. Counts and dots on icons: "something new is here", without saying what. */
export function BadgeCountFormat() {
  const [tab, setTab] = useState<Tab>('home')
  const [chat, setChat] = useState(3)
  const [news, setNews] = useState(true)
  const [note, setNote] = useState('')

  const receive = (n: number) => {
    // messages that arrive on the open chat tab are read on the spot
    if (tab === 'chat') {
      setNote(`채팅 탭을 보고 있어서 새 메시지 ${n}개를 바로 읽었습니다.`)
      return
    }
    setChat((c) => c + n)
    setNote(`새 메시지 ${n}개가 왔습니다.`)
  }

  const open = (next: Tab) => {
    setTab(next)
    if (next === 'chat' && chat > 0) {
      setNote(`메시지 ${chat}개를 읽었습니다.`)
      setChat(0)
    }
    if (next === 'news' && news) {
      setNote('새 소식을 확인했습니다.')
      setNews(false)
    }
  }

  const nameOf = (t: (typeof TABS)[number]) => {
    if (t.id === 'chat' && chat > 0) return `${t.label}, 읽지 않은 메시지 ${chat}개`
    if (t.id === 'news' && news) return `${t.label}, 새 소식 있음`
    return t.label
  }

  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => receive(1)}>
          메시지 1개 받기
        </Button>
        <Button variant="outline" size="sm" onClick={() => receive(40)}>
          메시지 40개 받기
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (tab === 'news') return setNote('소식 탭을 보고 있어서 바로 확인했습니다.')
            setNews(true)
            setNote('새 소식이 생겼습니다.')
          }}
        >
          새 소식 받기
        </Button>
      </div>

      <div className="flex h-72 flex-col overflow-hidden rounded-2xl border bg-background">
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <p className="text-base font-semibold">{current.label}</p>
          <div aria-hidden className="flex flex-col gap-2">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-4/5 rounded bg-muted" />
            <div className="h-2 w-3/5 rounded bg-muted" />
          </div>
        </div>
        <nav aria-label="아래 탭" className="grid grid-cols-4 border-t">
          {TABS.map((t) => {
            const selected = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                aria-label={nameOf(t)}
                aria-current={selected ? 'page' : undefined}
                onClick={() => open(t.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground outline-none hover:bg-muted/60 focus-visible:bg-muted',
                  selected && 'font-semibold text-foreground',
                )}
              >
                <span className="relative">
                  <t.icon aria-hidden className={cn('size-5', selected && 'stroke-[2.25]')} />
                  {t.id === 'chat' && chat > 0 && <CountBadge count={chat} className="absolute -top-1.5 left-3" />}
                  {t.id === 'news' && news && <CountBadge className="absolute -top-0.5 -right-0.5" />}
                </span>
                {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        읽지 않은 메시지 {chat}개 · 새 소식 {news ? '있음' : '없음'}
        {note && <span className="block text-xs">{note}</span>}
      </p>
    </div>
  )
}

type Notice = { id: number; group: '오늘' | '이전'; icon: LucideIcon; text: string; time: string; unread: boolean }

const NOTICES: Notice[] = [
  { id: 1, group: '오늘', icon: MessageCircleIcon, text: '김하늘님이 댓글을 남겼습니다: “노을 색이 정말 좋아요”', time: '10분 전', unread: true },
  { id: 2, group: '오늘', icon: TruckIcon, text: '주문하신 원두가 출발했습니다', time: '1시간 전', unread: true },
  { id: 3, group: '오늘', icon: UserPlusIcon, text: '박지민님이 회원님을 팔로우합니다', time: '3시간 전', unread: true },
  { id: 4, group: '이전', icon: HeartIcon, text: '이준호님 외 4명이 게시물을 좋아합니다', time: '어제', unread: true },
  { id: 5, group: '이전', icon: KeyRoundIcon, text: '비밀번호를 바꾼 지 90일이 지났습니다', time: '3일 전', unread: false },
  { id: 6, group: '이전', icon: WrenchIcon, text: '11월 정기 점검을 마쳤습니다', time: '지난주', unread: false },
]

/** 6. A bell that opens every past notification, grouped by day, with unread marks. */
export function NotificationCenterFormat() {
  const [notices, setNotices] = useState(NOTICES)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [open, setOpen] = useState(false)
  const unread = notices.filter((n) => n.unread).length
  const visible = notices.filter((n) => filter === 'all' || n.unread)

  const read = (id: number) => setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  const readAll = () => setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-2">
        <span className="text-sm font-semibold">내 앱</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={unread > 0 ? `알림, 읽지 않음 ${unread}개` : '알림'} className="relative">
              <BellIcon />
              {unread > 0 && <CountBadge count={unread} className="absolute -top-0.5 -right-0.5" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-0 p-0">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <p className="text-sm font-semibold">알림</p>
              <Button variant="ghost" size="xs" disabled={unread === 0} onClick={readAll}>
                <CheckCheckIcon data-icon="inline-start" />
                모두 읽음
              </Button>
            </div>
            <div className="px-3 pt-2">
              <ToggleGroup
                type="single"
                aria-label="보기"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={(v) => v && setFilter(v as 'all' | 'unread')}
              >
                <ToggleGroupItem value="all" className="px-2.5">
                  전체
                </ToggleGroupItem>
                <ToggleGroupItem value="unread" className="px-2.5">
                  읽지 않음 {unread}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {visible.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">모든 알림을 읽었습니다</p>
              )}
              {(['오늘', '이전'] as const).map((group) => {
                const items = visible.filter((n) => n.group === group)
                if (items.length === 0) return null
                return (
                  <section key={group} className="flex flex-col">
                    <h4 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{group}</h4>
                    <ul aria-label={group} className="flex flex-col">
                      {items.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => read(n.id)}
                            className={cn(
                              'flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted',
                              n.unread && 'bg-blue-50/70 dark:bg-blue-500/10',
                            )}
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                              <n.icon aria-hidden className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className={cn('text-sm leading-snug', n.unread ? 'font-medium' : 'text-muted-foreground')}>
                                {n.text}
                              </span>
                              <span className="text-xs text-muted-foreground">{n.time}</span>
                            </span>
                            {n.unread && (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500">
                                <span className="sr-only">읽지 않음</span>
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        읽지 않은 알림 {unread}개
      </p>
    </div>
  )
}

type Folder = { id: number; name: string; contents: string }

const FOLDERS: Folder[] = [
  { id: 1, name: '제주 여행 사진', contents: '사진 128장' },
  { id: 2, name: '2026 세금 서류', contents: '문서 12개' },
  { id: 3, name: '졸업 앨범', contents: '사진 46장' },
]

/** 7. Stops the screen before something that cannot be undone and names exactly what goes. */
export function ConfirmDialogFormat() {
  const [folders, setFolders] = useState(FOLDERS)
  const [open, setOpen] = useState(false)
  // kept after closing, so the text does not go blank while the dialog fades out
  const [target, setTarget] = useState<Folder>(FOLDERS[0])
  const [result, setResult] = useState('삭제를 누르면 무엇이 지워지는지 먼저 묻습니다.')

  const ask = (folder: Folder) => {
    setTarget(folder)
    setOpen(true)
  }

  // Esc and the cancel button both close without deleting
  const cancel = () => {
    setResult(`취소했습니다. ‘${target.name}’ 폴더는 그대로입니다.`)
    setOpen(false)
  }

  const confirm = () => {
    setFolders((prev) => prev.filter((f) => f.id !== target.id))
    setResult(`‘${target.name}’ 폴더를 삭제했습니다. ${target.contents}도 함께 지웠습니다.`)
    setOpen(false)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul aria-label="폴더" className="divide-y rounded-lg border bg-background">
        {folders.map((folder) => (
          <li key={folder.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
            <FolderIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{folder.name}</p>
              <p className="text-xs text-muted-foreground">{folder.contents}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => ask(folder)}>
              <Trash2Icon data-icon="inline-start" />
              삭제
            </Button>
          </li>
        ))}
        {folders.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">폴더가 없습니다</li>}
      </ul>
      {folders.length < FOLDERS.length && (
        <Button variant="link" size="sm" className="self-start px-0" onClick={() => setFolders(FOLDERS)}>
          예시 처음으로
        </Button>
      )}

      <Dialog open={open} onOpenChange={(next) => !next && cancel()}>
        <DialogContent
          role="alertdialog"
          showCloseButton={false}
          // like an alert dialog: a stray click outside must not count as an answer
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>‘{target.name}’ 폴더를 삭제할까요?</DialogTitle>
            <DialogDescription>안에 있는 {target.contents}도 함께 삭제되며 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* first in order, so it gets the focus: the safe answer is the easy one */}
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirm}>
              폴더 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  )
}
