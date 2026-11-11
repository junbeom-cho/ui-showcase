import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ShowcaseEntry } from '../types'

function SeparatorPreview() {
  return (
    <div className="w-full max-w-56 text-sm">
      <p>위쪽 내용</p>
      <Separator className="my-3" />
      <p>아래쪽 내용</p>
      <div className="mt-4 flex h-5 items-center gap-3">
        <span>홈</span>
        <Separator orientation="vertical" />
        <span>문서</span>
        <Separator orientation="vertical" />
        <span>설정</span>
      </div>
    </div>
  )
}

function SeparatorSpecimen() {
  return (
    <div className="w-full max-w-64 text-sm">
      <p className="font-medium">계정 설정</p>
      <p className="text-muted-foreground">이름과 이메일을 바꿉니다.</p>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4">
        <span>프로필</span>
        <Separator orientation="vertical" data-slot="separator-vertical" />
        <span>보안</span>
      </div>
    </div>
  )
}

const songs = [
  { title: '새벽 공기', artist: '하늘색 버스', time: '3:42' },
  { title: '지하철 2호선', artist: '모래성', time: '4:05' },
  { title: '여름 끝', artist: '하늘색 버스', time: '2:58' },
]

function ListSeparator() {
  return (
    <ul className="w-full max-w-72 rounded-lg border bg-background">
      {songs.map((song, i) => (
        <li key={song.title}>
          {i > 0 && <Separator />}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{song.title}</p>
              <p className="text-muted-foreground">{song.artist}</p>
            </div>
            <span className="text-muted-foreground tabular-nums">{song.time}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ToolbarSeparator() {
  return (
    <div role="toolbar" aria-label="글자 서식" className="flex h-9 items-center gap-1 rounded-lg border bg-background px-1">
      <Button variant="ghost" size="icon" aria-label="굵게"><BoldIcon /></Button>
      <Button variant="ghost" size="icon" aria-label="기울임"><ItalicIcon /></Button>
      <Button variant="ghost" size="icon" aria-label="밑줄"><UnderlineIcon /></Button>
      <Separator orientation="vertical" className="mx-1 my-2" />
      <Button variant="ghost" size="icon" aria-label="링크"><LinkIcon /></Button>
    </div>
  )
}

function LabeledSeparator() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-4">
      <Button className="w-full">이메일로 계속하기</Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        또는
        <Separator className="flex-1" />
      </div>
      <Button variant="outline" className="w-full">다른 계정으로 로그인</Button>
    </div>
  )
}

export const separatorEntry: ShowcaseEntry = {
  id: 'separator',
  name: 'Separator',
  aliases: ['Divider', 'Rule', '구분선'],
  description: '콘텐츠 사이를 나누는 가로선이나 세로선.',
  category: 'layout',
  Preview: SeparatorPreview,
  anatomy: {
    Specimen: SeparatorSpecimen,
    parts: [
      { slot: 'separator', name: 'Separator', description: '가로 구분선 (orientation="horizontal")' },
      { slot: 'separator-vertical', name: 'Separator', description: '세로 구분선 (orientation="vertical")' },
    ],
  },
  examples: [
    {
      title: '목록 사이 구분',
      description: '목록 항목 사이에 선을 넣어 한 줄씩 끊어 읽히게 합니다.',
      Demo: ListSeparator,
    },
    {
      title: '툴바 묶음 나누기',
      description: '세로 구분선으로 버튼 묶음을 나눕니다. 서식 버튼과 링크 버튼이 다른 그룹임을 보여줍니다.',
      Demo: ToolbarSeparator,
    },
    {
      title: '글자가 들어간 구분선',
      description: '로그인 화면의 "또는"처럼 선 가운데에 짧은 글을 둡니다.',
      Demo: LabeledSeparator,
    },
  ],
}
