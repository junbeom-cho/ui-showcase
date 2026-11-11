import { useState } from 'react'
import { DownloadIcon, Loader2Icon, PlusIcon, SendIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ShowcaseEntry } from '../types'

function ButtonPreview() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button>Button</Button>
      <Button variant="secondary">Button</Button>
      <Button variant="outline">Button</Button>
      <Button variant="ghost">Button</Button>
    </div>
  )
}

function ButtonSpecimen() {
  return (
    <Button size="lg">
      <DownloadIcon data-slot="button-icon" data-icon="inline-start" />
      <span data-slot="button-label">내려받기</span>
    </Button>
  )
}

const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const

function Variants() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  )
}

function Sizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button>default</Button>
      <Button size="lg">lg</Button>
      <Button size="icon" aria-label="추가">
        <PlusIcon />
      </Button>
    </div>
  )
}

function LoadingButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const send = () => {
    setStatus('sending')
    window.setTimeout(() => setStatus('sent'), 1500)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={send} disabled={status === 'sending'} className="min-w-28">
        {status === 'sending' ? (
          <Loader2Icon className="motion-safe:animate-spin" data-icon="inline-start" />
        ) : (
          <SendIcon data-icon="inline-start" />
        )}
        {status === 'sending' ? '보내는 중' : '보내기'}
      </Button>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === 'sent' ? '보냈습니다. 다시 눌러도 됩니다.' : '누르면 1.5초 동안 로딩 상태가 됩니다.'}
      </p>
    </div>
  )
}

function States() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button disabled>비활성</Button>
      <Button variant="outline" disabled>비활성</Button>
      <Button variant="destructive">
        <TrashIcon data-icon="inline-start" />
        삭제
      </Button>
    </div>
  )
}

export const buttonEntry: ShowcaseEntry = {
  id: 'button',
  name: 'Button',
  aliases: ['CTA', '버튼'],
  description: '누르면 동작을 실행하는 요소.',
  category: 'input',
  Preview: ButtonPreview,
  anatomy: {
    Specimen: ButtonSpecimen,
    parts: [
      { slot: 'button', name: 'Button', description: '눌리는 영역 전체' },
      { slot: 'button-icon', name: 'icon', description: '동작을 그림으로 알려주는 아이콘' },
      { slot: 'button-label', name: 'label', description: '무슨 일이 일어나는지 말하는 글자' },
    ],
  },
  examples: [
    {
      title: '변형 (variant)',
      description: '중요도에 따라 모양을 바꿉니다. 화면에서 가장 중요한 동작 하나에만 default를 씁니다.',
      Demo: Variants,
    },
    {
      title: '크기 (size)',
      description: '같은 버튼을 다섯 가지 크기로 씁니다. icon은 글자 없이 아이콘만 있는 정사각형입니다.',
      Demo: Sizes,
    },
    {
      title: '로딩 상태',
      description: '오래 걸리는 동작 중에는 버튼을 잠그고 진행 중임을 보여줍니다. 눌러 보세요.',
      Demo: LoadingButton,
    },
    {
      title: '비활성과 위험 동작',
      description: '지금 누를 수 없는 버튼은 흐리게, 되돌릴 수 없는 동작은 빨간색으로 구분합니다.',
      Demo: States,
    },
  ],
}
