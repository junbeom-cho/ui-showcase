import { useState } from 'react'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShowcaseEntry } from '../types'

const avatarSrc = `${import.meta.env.BASE_URL}avatar.svg`

function AvatarPreview() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-12">
        <AvatarImage src={avatarSrc} alt="프로필 이미지" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
    </div>
  )
}

function AvatarSpecimen() {
  return (
    <div className="flex items-center gap-10">
      <Avatar className="size-16">
        <AvatarFallback className="text-lg">김</AvatarFallback>
        <AvatarBadge className="size-4 bg-emerald-500" />
      </Avatar>
      <AvatarGroup>
        {['이', '박', '최'].map((name) => (
          <Avatar key={name} size="lg">
            <AvatarFallback>{name}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount className="size-10">+4</AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}

function ImageAndFallback() {
  return (
    <div className="flex items-end gap-6 text-center text-xs text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg" className="size-14">
          <AvatarImage src={avatarSrc} alt="정상 이미지" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        이미지 있음
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg" className="size-14">
          <AvatarImage src="/does-not-exist.png" alt="깨진 이미지" />
          <AvatarFallback>CD</AvatarFallback>
        </Avatar>
        이미지 깨짐
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg" className="size-14">
          <AvatarFallback className="bg-indigo-100 text-indigo-700">EF</AvatarFallback>
        </Avatar>
        이니셜만
      </div>
    </div>
  )
}

function Sizes() {
  return (
    <div className="flex items-end gap-5">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <Avatar size={size}>
            <AvatarImage src={avatarSrc} alt="" />
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          {size}
        </div>
      ))}
    </div>
  )
}

const statuses = {
  online: { label: '온라인', className: 'bg-emerald-500' },
  away: { label: '자리 비움', className: 'bg-amber-400' },
  offline: { label: '오프라인', className: 'bg-neutral-400' },
} as const

function StatusBadge() {
  const [status, setStatus] = useState<keyof typeof statuses>('online')
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-12">
          <AvatarImage src={avatarSrc} alt="" />
          <AvatarFallback>AB</AvatarFallback>
          <AvatarBadge className={cn('size-3.5', statuses[status].className)} />
        </Avatar>
        <div>
          <p className="text-sm font-medium">김하늘</p>
          <p className="text-xs text-muted-foreground">{statuses[status].label}</p>
        </div>
      </div>
      <div role="group" aria-label="상태 바꾸기" className="flex gap-1.5">
        {(Object.keys(statuses) as (keyof typeof statuses)[]).map((key) => (
          <Button
            key={key}
            size="xs"
            variant={key === status ? 'default' : 'outline'}
            aria-pressed={key === status}
            onClick={() => setStatus(key)}
          >
            {statuses[key].label}
          </Button>
        ))}
      </div>
    </div>
  )
}

const members = ['가', '나', '다', '라', '마', '바', '사']

function Group() {
  const [shown, setShown] = useState(3)
  return (
    <div className="flex flex-col items-center gap-4">
      <AvatarGroup>
        {members.slice(0, shown).map((m) => (
          <Avatar key={m}>
            <AvatarFallback>{m}</AvatarFallback>
          </Avatar>
        ))}
        {shown < members.length && <AvatarGroupCount>+{members.length - shown}</AvatarGroupCount>}
      </AvatarGroup>
      <Button size="xs" variant="outline" onClick={() => setShown((s) => (s < members.length ? members.length : 3))}>
        {shown < members.length ? '모두 보기' : '줄이기'}
      </Button>
    </div>
  )
}

export const avatarEntry: ShowcaseEntry = {
  id: 'avatar',
  name: 'Avatar',
  aliases: ['Profile image', '프로필 이미지'],
  description: '사용자를 나타내는 작은 원형 이미지. 이미지가 없으면 이니셜을 보여준다.',
  category: 'display',
  Preview: AvatarPreview,
  anatomy: {
    Specimen: AvatarSpecimen,
    parts: [
      { slot: 'avatar', name: 'Avatar', description: '동그란 틀' },
      { slot: 'avatar-fallback', name: 'AvatarFallback', description: '이미지가 없을 때 보이는 이니셜' },
      { slot: 'avatar-badge', name: 'AvatarBadge', description: '접속 상태 같은 작은 점' },
      { slot: 'avatar-group', name: 'AvatarGroup', description: '여러 명을 겹쳐 보여주는 묶음' },
      { slot: 'avatar-group-count', name: 'AvatarGroupCount', description: '보이지 않는 나머지 인원 수' },
    ],
  },
  examples: [
    {
      title: '이미지와 대체 글자',
      description: '이미지를 불러오지 못하면 자동으로 이니셜을 보여줍니다. 가운데는 일부러 깨진 주소를 넣었습니다.',
      Demo: ImageAndFallback,
    },
    {
      title: '크기',
      description: '목록에는 sm, 프로필 머리에는 lg처럼 자리에 맞춰 크기를 고릅니다.',
      Demo: Sizes,
    },
    {
      title: '상태 표시',
      description: '오른쪽 아래 점으로 접속 상태를 알려줍니다. 버튼을 눌러 상태를 바꿔 보세요.',
      Demo: StatusBadge,
    },
    {
      title: '여러 명 겹치기',
      description: '참여자가 많으면 몇 명만 겹쳐 보여주고 나머지는 숫자로 줄입니다.',
      Demo: Group,
    },
  ],
}
