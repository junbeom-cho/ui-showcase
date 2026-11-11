import { useState } from 'react'
import { XIcon } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ShowcaseEntry } from '../types'
import { MockScreen } from './mock-screen'

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Dialog 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>정말 삭제할까요?</DialogTitle>
          <DialogDescription>삭제한 항목은 되돌릴 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogSpecimen() {
  return (
    <MockScreen>
      <div data-slot="dialog-overlay" className="absolute inset-0 bg-black/25" />
      <div
        data-slot="dialog-content"
        className="absolute top-1/2 left-1/2 grid w-60 -translate-x-1/2 -translate-y-1/2 gap-3 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10"
      >
        <div className="flex flex-col gap-1">
          <p data-slot="dialog-title" className="font-medium">정말 삭제할까요?</p>
          <p data-slot="dialog-description" className="text-xs text-muted-foreground">
            삭제한 사진은 되돌릴 수 없습니다.
          </p>
        </div>
        <div data-slot="dialog-footer" className="flex justify-end gap-2">
          <Button size="xs" variant="outline" tabIndex={-1}>취소</Button>
          <Button size="xs" variant="destructive" tabIndex={-1}>삭제</Button>
        </div>
        <span data-slot="dialog-close" className="absolute top-2.5 right-2.5 text-muted-foreground">
          <XIcon className="size-3.5" />
        </span>
      </div>
    </MockScreen>
  )
}

function ConfirmDialog() {
  const [photos, setPhotos] = useState(3)
  return (
    <div className="flex flex-col items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={photos === 0}>
            사진 {photos}장 삭제
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>사진 {photos}장을 삭제할까요?</DialogTitle>
            <DialogDescription>삭제한 사진은 휴지통을 거치지 않고 바로 사라집니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={() => setPhotos(0)}>
                삭제
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {photos === 0 ? (
          <>
            삭제했습니다.{' '}
            <button type="button" className="underline" onClick={() => setPhotos(3)}>
              되돌리기
            </button>
          </>
        ) : (
          '취소를 누르면 아무 일도 일어나지 않습니다.'
        )}
      </p>
    </div>
  )
}

function FormDialog() {
  const [name, setName] = useState('김하늘')
  const [draft, setDraft] = useState(name)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm">
        표시 이름: <span className="font-medium">{name}</span>
      </p>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setDraft(name)
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline">이름 바꾸기</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.trim()) setName(draft.trim())
              setOpen(false)
            }}
          >
            <DialogHeader>
              <DialogTitle>이름 바꾸기</DialogTitle>
              <DialogDescription>다른 사람에게 보이는 이름입니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="dialog-name">표시 이름</Label>
              <Input id="dialog-name" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">취소</Button>
              </DialogClose>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const terms = Array.from(
  { length: 12 },
  (_, i) => `제${i + 1}조. 이 조항은 길이가 긴 내용을 보여주기 위한 예시 문장입니다. 창 안에서만 스크롤됩니다.`,
)

function ScrollDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">이용약관 보기</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80svh] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>이용약관</DialogTitle>
          <DialogDescription>내용이 길면 창 안쪽만 스크롤되고 제목과 버튼은 고정됩니다.</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 overflow-y-auto px-4 text-sm leading-relaxed text-muted-foreground">
          {terms.map((t) => (
            <p key={t} className="mb-3">
              {t}
            </p>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>동의</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const dialogEntry: ShowcaseEntry = {
  id: 'dialog',
  name: 'Dialog',
  aliases: ['Modal', 'Popup', '모달'],
  description: '화면 위에 떠서 다른 조작을 막고 응답을 기다리는 창.',
  category: 'overlay',
  Preview: DialogPreview,
  anatomy: {
    Specimen: DialogSpecimen,
    parts: [
      { slot: 'dialog-overlay', name: 'DialogOverlay', description: '뒤 화면을 어둡게 덮어 조작을 막는 막' },
      { slot: 'dialog-content', name: 'DialogContent', description: '가운데 뜨는 창' },
      { slot: 'dialog-title', name: 'DialogTitle', description: '창의 제목. 스크린리더가 먼저 읽음' },
      { slot: 'dialog-description', name: 'DialogDescription', description: '무엇을 묻는지 설명' },
      { slot: 'dialog-footer', name: 'DialogFooter', description: '확인·취소 버튼 자리' },
      { slot: 'dialog-close', name: 'DialogClose', description: '창을 닫는 X 버튼' },
    ],
  },
  examples: [
    {
      title: '확인 받기',
      description: '되돌릴 수 없는 동작 전에 한 번 더 묻습니다. 바깥을 누르거나 Esc를 눌러도 닫힙니다.',
      Demo: ConfirmDialog,
    },
    {
      title: '창 안의 입력 폼',
      description: '페이지를 떠나지 않고 짧은 입력을 받습니다. 저장하면 바뀐 이름이 위에 반영됩니다.',
      Demo: FormDialog,
    },
    {
      title: '긴 내용 스크롤',
      description: '약관처럼 긴 내용은 창 안쪽만 스크롤되게 합니다.',
      Demo: ScrollDialog,
    },
  ],
}
