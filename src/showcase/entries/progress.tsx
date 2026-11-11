import { useEffect, useState } from 'react'
import { UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ShowcaseEntry } from '../types'

function ProgressPreview() {
  return <Progress value={60} className="w-full max-w-56" aria-label="진행률 60%" />
}

function ProgressSpecimen() {
  return (
    <div className="flex w-full max-w-72 flex-col gap-2">
      <div data-slot="progress-label" className="flex justify-between text-sm">
        <span>사진 올리는 중</span>
        <span className="text-muted-foreground tabular-nums">65%</span>
      </div>
      <Progress value={65} className="h-2" aria-label="사진 올리는 중 65%" />
    </div>
  )
}

function Upload() {
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    if (value === null || value >= 100) return
    const timer = window.setTimeout(() => setValue((v) => Math.min(100, (v ?? 0) + 7)), 120)
    return () => window.clearTimeout(timer)
  }, [value])

  const done = value === 100
  return (
    <div className="flex w-full max-w-72 flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        disabled={value !== null && !done}
        onClick={() => setValue(0)}
      >
        <UploadIcon data-icon="inline-start" />
        {done ? '다시 올리기' : '파일 올리기'}
      </Button>
      <Progress value={value ?? 0} aria-label="업로드 진행률" />
      <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {value === null ? '버튼을 누르면 시작합니다.' : done ? '올리기를 마쳤습니다.' : `${value}% 올렸습니다.`}
      </p>
    </div>
  )
}

const steps = ['장바구니', '배송 정보', '결제', '완료']

function Steps() {
  const [step, setStep] = useState(1)
  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <p className="text-sm">
        {steps.length}단계 중 {step + 1}단계: <span className="font-medium">{steps[step]}</span>
      </p>
      <Progress value={((step + 1) / steps.length) * 100} aria-label="주문 단계" />
      <ol className="grid grid-cols-4 text-center text-[11px] text-muted-foreground">
        {steps.map((s, i) => (
          <li key={s} className={cn(i <= step && 'font-medium text-foreground')}>
            {s}
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button size="xs" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          이전 단계
        </Button>
        <Button size="xs" disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>
          다음 단계
        </Button>
      </div>
    </div>
  )
}

const storage = [
  { label: '사진', used: 42, color: '[&_[data-slot=progress-indicator]]:bg-blue-500' },
  { label: '동영상', used: 28, color: '[&_[data-slot=progress-indicator]]:bg-violet-500' },
  { label: '문서', used: 9, color: '[&_[data-slot=progress-indicator]]:bg-emerald-500' },
]

function StorageBars() {
  return (
    <div className="flex w-full max-w-72 flex-col gap-3">
      {storage.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span>{s.label}</span>
            <span className="text-muted-foreground tabular-nums">{s.used} GB</span>
          </div>
          <Progress value={s.used} className={s.color} aria-label={`${s.label} ${s.used}GB`} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">100 GB 중 79 GB 사용</p>
    </div>
  )
}

export const progressEntry: ShowcaseEntry = {
  id: 'progress',
  name: 'Progress',
  aliases: ['Progress bar', '진행 표시줄'],
  description: '작업이 얼마나 진행됐는지 막대 길이로 보여준다.',
  category: 'feedback',
  Preview: ProgressPreview,
  anatomy: {
    Specimen: ProgressSpecimen,
    parts: [
      { slot: 'progress-label', name: 'label', description: '무엇이 얼마나 됐는지 글로 보충' },
      { slot: 'progress', name: 'Progress', description: '전체 길이를 나타내는 바탕 막대' },
      { slot: 'progress-indicator', name: 'ProgressIndicator', description: '진행된 만큼 채워지는 막대' },
    ],
  },
  examples: [
    {
      title: '업로드 진행',
      description: '시간이 걸리는 작업이 지금 어디까지 왔는지 실시간으로 보여줍니다. 버튼을 눌러 보세요.',
      Demo: Upload,
    },
    {
      title: '단계 진행',
      description: '주문처럼 정해진 단계가 있을 때 몇 번째 단계인지 막대로 보여줍니다.',
      Demo: Steps,
    },
    {
      title: '사용량 막대',
      description: '진행이 아니라 용량처럼 "얼마나 찼는지"를 보여줄 때도 씁니다.',
      Demo: StorageBars,
    },
  ],
}
