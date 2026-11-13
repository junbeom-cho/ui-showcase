import { useState } from 'react'
import {
  CalendarIcon,
  FileTextIcon,
  GripIcon,
  HardDriveIcon,
  ImageIcon,
  MailIcon,
  MapIcon,
  MessageCircleIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { BrowserFrame, ContentSketch } from '../navigation-patterns/frames'
import { BentoIcon, IconDemo, MenuIconButton } from './parts'

const APPS = [
  { name: '메일', icon: MailIcon },
  { name: '캘린더', icon: CalendarIcon },
  { name: '드라이브', icon: HardDriveIcon },
  { name: '문서', icon: FileTextIcon },
  { name: '사진', icon: ImageIcon },
  { name: '지도', icon: MapIcon },
  { name: '채팅', icon: MessageCircleIcon },
  { name: '회의', icon: VideoIcon },
  { name: '연락처', icon: UsersIcon },
]

const tileClass =
  'flex flex-col items-center gap-1 rounded-md p-2 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:bg-muted aria-[current=true]:font-medium'

/** 04. 3×3 dots open a launcher that jumps to the company's other apps. */
export function WaffleFormat() {
  const [open, setOpen] = useState(false)
  const [app, setApp] = useState('메일')

  return (
    <IconDemo id="waffle" status={`지금 앱: ${app} · 앱 런처 ${open ? '열림' : '닫힘'}`}>
      <BrowserFrame url={`work.example/${app}`} className="h-60">
        <header className="flex h-12 items-center justify-between border-b px-3">
          <span className="text-sm font-semibold">{app}</span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <MenuIconButton icon={GripIcon} label="앱 목록" />
            </PopoverTrigger>
            <PopoverContent align="end" aria-label="앱 목록" className="w-60">
              <ul className="grid grid-cols-3 gap-1">
                {APPS.map(({ name, icon: Icon }) => (
                  <li key={name}>
                    <button
                      type="button"
                      aria-current={name === app || undefined}
                      onClick={() => {
                        setApp(name)
                        setOpen(false)
                      }}
                      className={cn(tileClass, 'w-full')}
                    >
                      <Icon aria-hidden className="size-5" />
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </header>
        <div key={app} className="p-4 motion-safe:animate-in motion-safe:fade-in-0">
          <ContentSketch rows={4} />
        </div>
      </BrowserFrame>
    </IconDemo>
  )
}

const CATEGORIES = [
  { name: '패션', color: 'bg-rose-200 dark:bg-rose-900' },
  { name: '뷰티', color: 'bg-pink-200 dark:bg-pink-900' },
  { name: '식품', color: 'bg-amber-200 dark:bg-amber-900' },
  { name: '가전', color: 'bg-sky-200 dark:bg-sky-900' },
  { name: '가구', color: 'bg-orange-200 dark:bg-orange-900' },
  { name: '도서', color: 'bg-emerald-200 dark:bg-emerald-900' },
  { name: '스포츠', color: 'bg-lime-200 dark:bg-lime-900' },
  { name: '반려동물', color: 'bg-violet-200 dark:bg-violet-900' },
  { name: '여행', color: 'bg-cyan-200 dark:bg-cyan-900' },
]

/** 05. 3×3 squares open a tiled board of shortcuts — here, every category of a shop. */
export function BentoFormat() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')

  return (
    <IconDemo id="bento" status={`카테고리: ${category || '고르지 않음'} · 판 ${open ? '열림' : '닫힘'}`}>
      <BrowserFrame url={`shop.example/${category || 'home'}`} className="h-60">
        <header className="flex h-12 items-center gap-2 border-b px-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <MenuIconButton icon={BentoIcon} label="전체 카테고리" />
            </PopoverTrigger>
            <PopoverContent align="start" aria-label="전체 카테고리" className="w-64">
              <ul className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map(({ name, color }) => (
                  <li key={name}>
                    <button
                      type="button"
                      aria-current={name === category || undefined}
                      onClick={() => {
                        setCategory(name)
                        setOpen(false)
                      }}
                      className={cn(tileClass, 'w-full')}
                    >
                      <span aria-hidden className={cn('size-8 rounded-md', color)} />
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <span className="text-sm font-semibold">{category || '오늘의 쇼핑'}</span>
        </header>
        <div key={category} className="p-4 motion-safe:animate-in motion-safe:fade-in-0">
          <ContentSketch rows={4} />
        </div>
      </BrowserFrame>
      {/* the two shapes whose names get swapped */}
      <div className="flex gap-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <GripIcon aria-hidden className="size-5 text-foreground" />
          점 9개: 흔히 와플
        </span>
        <span className="flex items-center gap-2">
          <BentoIcon aria-hidden className="size-5 text-foreground" />
          네모 9개: 흔히 벤토
        </span>
      </div>
    </IconDemo>
  )
}
