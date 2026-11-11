import { useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { ShowcaseEntry } from '../types'

function SwitchPreview() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-dark-mode" />
      <Label htmlFor="switch-dark-mode">다크 모드</Label>
    </div>
  )
}

function SwitchSpecimen() {
  return (
    <div className="flex items-center gap-3">
      <Switch id="switch-specimen" defaultChecked className="scale-125" />
      <Label htmlFor="switch-specimen" className="text-base">와이파이</Label>
    </div>
  )
}

const settings = [
  { id: 'push', label: '푸시 알림', note: '새 댓글과 좋아요를 알려줍니다.', on: true },
  { id: 'email', label: '이메일 요약', note: '매주 월요일에 한 번 보냅니다.', on: false },
  { id: 'sound', label: '소리', note: '알림이 올 때 소리를 냅니다.', on: true },
]

function SettingsList() {
  return (
    <div className="w-full max-w-80 divide-y rounded-lg border bg-background">
      {settings.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`setting-${s.id}`}>{s.label}</Label>
            <p className="text-xs text-muted-foreground">{s.note}</p>
          </div>
          <Switch id={`setting-${s.id}`} defaultChecked={s.on} />
        </div>
      ))}
    </div>
  )
}

function InstantEffect() {
  const [dark, setDark] = useState(false)
  return (
    <div className="flex w-full max-w-72 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="switch-theme" checked={dark} onCheckedChange={setDark} />
        <Label htmlFor="switch-theme">어두운 화면</Label>
      </div>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border p-4 motion-safe:transition-colors',
          dark ? 'border-neutral-700 bg-neutral-900 text-neutral-100' : 'bg-white text-neutral-900',
        )}
      >
        {dark ? <MoonIcon className="size-5" /> : <SunIcon className="size-5" />}
        <p className="text-sm">스위치는 누르는 즉시 적용됩니다. 저장 버튼이 필요 없습니다.</p>
      </div>
    </div>
  )
}

function SizesAndStates() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      <div className="flex items-center gap-2">
        <Switch id="switch-sm" size="sm" defaultChecked />
        <Label htmlFor="switch-sm">sm</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-default" defaultChecked />
        <Label htmlFor="switch-default">default</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled-off" disabled />
        <Label htmlFor="switch-disabled-off">꺼짐 비활성</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled-on" disabled defaultChecked />
        <Label htmlFor="switch-disabled-on">켜짐 비활성</Label>
      </div>
    </div>
  )
}

export const switchEntry: ShowcaseEntry = {
  id: 'switch',
  name: 'Switch',
  aliases: ['Toggle', 'Toggle switch', '스위치'],
  description: '설정을 바로 켜거나 끄는 좌우 슬라이드 형태의 토글.',
  category: 'input',
  Preview: SwitchPreview,
  anatomy: {
    Specimen: SwitchSpecimen,
    parts: [
      { slot: 'switch', name: 'Switch', description: '켜짐·꺼짐에 따라 색이 바뀌는 트랙' },
      { slot: 'switch-thumb', name: 'SwitchThumb', description: '좌우로 미끄러지는 동그란 손잡이' },
      { slot: 'label', name: 'Label', description: '무엇을 켜고 끄는지 알려주는 글' },
    ],
  },
  examples: [
    {
      title: '설정 목록',
      description: '앱 설정 화면처럼 설명과 스위치를 한 줄씩 나란히 둡니다.',
      Demo: SettingsList,
    },
    {
      title: '바로 반영되는 설정',
      description: '체크박스와 달리 스위치는 누르는 즉시 결과가 나타나는 설정에 씁니다.',
      Demo: InstantEffect,
    },
    {
      title: '크기와 비활성',
      description: '작은 크기(sm)와, 지금은 바꿀 수 없는 상태를 보여줍니다.',
      Demo: SizesAndStates,
    },
  ],
}
