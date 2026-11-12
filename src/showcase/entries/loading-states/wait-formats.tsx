import { useEffect, useId, useState } from 'react'
import { CloudSunIcon, RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ShimmerBlock, Spinner, type SpinnerKind, type SpinnerSize } from './spinners'

const KINDS: { value: SpinnerKind; label: string }[] = [
  { value: 'ring', label: '링' },
  { value: 'dots', label: '점' },
  { value: 'bars', label: '막대' },
]

const SIZES: { size: SpinnerSize; px: number; where: string }[] = [
  { size: 'sm', px: 16, where: '버튼·입력칸 안' },
  { size: 'md', px: 24, where: '카드·목록 안' },
  { size: 'lg', px: 40, where: '화면 전체' },
]

const SPIN_MS = 1600

/** 1. A spinning mark that only says "wait", for short waits of unknown length. */
export function SpinnerFormat() {
  const [kind, setKind] = useState<SpinnerKind>('ring')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const loading = phase === 'loading'

  useEffect(() => {
    if (phase !== 'loading') return
    const timer = window.setTimeout(() => setPhase('done'), SPIN_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ToggleGroup
        type="single"
        aria-label="스피너 모양"
        variant="outline"
        size="sm"
        value={kind}
        onValueChange={(v) => v && setKind(v as SpinnerKind)}
      >
        {KINDS.map((k) => (
          <ToggleGroupItem key={k.value} value={k.value} className="px-3">
            {k.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <section
        aria-label="오늘의 날씨"
        aria-busy={loading}
        className="flex h-36 flex-col items-center justify-center gap-3 rounded-lg border bg-background p-4 text-center"
      >
        {phase === 'idle' && <p className="text-sm text-muted-foreground">불러오기를 누르면 날씨를 가져옵니다</p>}
        {loading && (
          <>
            <Spinner kind={kind} size="md" className="text-foreground" />
            <p className="text-sm text-muted-foreground">날씨를 불러오는 중…</p>
          </>
        )}
        {phase === 'done' && (
          <div className="flex items-center gap-3 text-left motion-safe:animate-in motion-safe:fade-in-0">
            <CloudSunIcon aria-hidden className="size-10 text-amber-500" />
            <div>
              <p className="text-lg font-semibold">서울 · 맑음 18°</p>
              <p className="text-sm text-muted-foreground">오후에 구름 조금, 바람 약함</p>
            </div>
          </div>
        )}
      </section>

      <Button variant="outline" className="self-start" disabled={loading} onClick={() => setPhase('loading')}>
        <RotateCwIcon data-icon="inline-start" />
        {phase === 'idle' ? '불러오기' : '다시 불러오기'}
      </Button>

      <ul aria-label="크기" className="grid grid-cols-3 gap-2 rounded-lg border border-dashed p-3">
        {SIZES.map((s) => (
          <li key={s.size} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-10 items-center">
              <Spinner kind={kind} size={s.size} className="text-muted-foreground" />
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{s.px}px</span> {s.where}
            </span>
          </li>
        ))}
      </ul>

      <p role="status" className="text-sm text-muted-foreground">
        {phase === 'idle' && '스피너 모양을 고르고 불러와 보세요.'}
        {loading && '불러오는 중…'}
        {phase === 'done' && `불러왔습니다 (${SPIN_MS / 1000}초 걸림).`}
      </p>
    </div>
  )
}

const STEP = 4
const TICK = 200

/** 2. A bar that fills as work gets done, next to one that only says "busy". */
export function ProgressFormat() {
  const [percent, setPercent] = useState<number | null>(null)
  const running = percent !== null && percent < 100
  const done = percent === 100

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setPercent((p) => Math.min(100, (p ?? 0) + STEP)), TICK)
    return () => window.clearTimeout(timer)
  }, [running, percent])

  const value = percent ?? 0
  const secondsLeft = Math.ceil((((100 - value) / STEP) * TICK) / 1000)

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium">동영상 내보내기</span>
          <span className="tabular-nums text-muted-foreground">{value}%</span>
        </div>
        <Progress value={value} aria-label="동영상 내보내기" className="h-2" />
        <p className="text-xs text-muted-foreground tabular-nums">
          {percent === null ? '시작 전' : done ? '완료' : `약 ${secondsLeft}초 남음`}
          <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px]">확정: 얼마나 남았는지 앎</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium">서버와 맞추는 중</span>
          <span className="text-muted-foreground">{done ? '완료' : ''}</span>
        </div>
        <div
          role="progressbar"
          aria-label="서버와 맞추는 중"
          // no value while running: that is what makes it indeterminate
          aria-valuemin={done ? 0 : undefined}
          aria-valuemax={done ? 100 : undefined}
          aria-valuenow={done ? 100 : undefined}
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          {running && (
            <div className="absolute inset-y-0 w-2/5 rounded-full bg-primary motion-safe:animate-indeterminate motion-reduce:w-full motion-reduce:opacity-40" />
          )}
          {done && <div className="absolute inset-0 rounded-full bg-primary" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {percent === null ? '시작 전' : done ? '완료' : '얼마나 걸릴지 모름'}
          <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px]">불확정: 진행만 알림</span>
        </p>
      </div>

      <Button variant="outline" className="self-start" disabled={running} onClick={() => setPercent(0)}>
        {percent === null ? '시작' : '다시 시작'}
      </Button>

      <p role="status" className="text-sm text-muted-foreground tabular-nums">
        {percent === null && '시작을 누르면 두 막대가 함께 움직입니다.'}
        {running && `${value}% · 약 ${secondsLeft}초 남음`}
        {done && '두 작업을 모두 마쳤습니다.'}
      </p>
    </div>
  )
}

const COMMENTS = [
  { name: '김하늘', hue: 210, time: '2분 전', text: '노을 색이 정말 좋네요. 어디서 찍었어요?' },
  { name: '박지민', hue: 150, time: '15분 전', text: '저도 다음 달에 가 보려고요!' },
  { name: '이준호', hue: 25, time: '1시간 전', text: '두 번째 사진이 제일 마음에 들어요.' },
]

const SKELETON_MS = 1500

/** 3. Grey blocks in the shape of the coming content, swapped for it when it arrives. */
export function SkeletonFormat() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), SKELETON_MS)
    return () => window.clearTimeout(timer)
  }, [loading])

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <section aria-label="댓글" aria-busy={loading} className="rounded-lg border bg-background">
        <p className="border-b px-4 py-2.5 text-sm font-semibold">
          댓글 {!loading && <span className="font-normal text-muted-foreground">{COMMENTS.length}</span>}
        </p>
        <ul className="divide-y">
          {COMMENTS.map((c) => (
            // the same height either way, so nothing jumps when the content arrives
            <li key={c.name} className="flex h-[4.75rem] items-start gap-3 px-4 py-3">
              {loading ? (
                <>
                  <Skeleton className="size-8 shrink-0 rounded-full motion-reduce:animate-none" />
                  <div className="flex flex-1 flex-col gap-2 pt-0.5">
                    <Skeleton className="h-3.5 w-24 motion-reduce:animate-none" />
                    <Skeleton className="h-3 w-full motion-reduce:animate-none" />
                    <Skeleton className="h-3 w-2/3 motion-reduce:animate-none" />
                  </div>
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ background: `hsl(${c.hue} 55% 50%)` }}
                  >
                    {c.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{c.name}</span>{' '}
                      <span className="text-xs text-muted-foreground">{c.time}</span>
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.text}</p>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
      <Button variant="outline" className="self-start" disabled={loading} onClick={() => setLoading(true)}>
        <RotateCwIcon data-icon="inline-start" />
        다시 불러오기
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {loading ? '불러오는 중…' : `댓글 ${COMMENTS.length}개를 불러왔습니다.`}
      </p>
    </div>
  )
}

const PRODUCTS = [
  { name: '리넨 셔츠', price: '39,000원', from: '#c9d6df', to: '#52616b' },
  { name: '캔버스 토트백', price: '24,000원', from: '#f3d9b1', to: '#b07d48' },
]

const SHIMMER_MS = 2200

/** 4. A skeleton with light sweeping over it, so it reads as "working", not "stuck". */
export function ShimmerFormat() {
  const [loading, setLoading] = useState(true)
  const [still, setStill] = useState(false)
  const switchId = useId()

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), SHIMMER_MS)
    return () => window.clearTimeout(timer)
  }, [loading])

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul aria-label="상품" aria-busy={loading} className="grid grid-cols-2 gap-3">
        {PRODUCTS.map((p) => (
          <li key={p.name} className="flex flex-col gap-2 rounded-lg border bg-background p-2.5">
            {loading ? (
              <>
                <ShimmerBlock still={still} className="aspect-[4/3] w-full" />
                <ShimmerBlock still={still} className="mt-0.5 h-3.5 w-3/4" />
                <ShimmerBlock still={still} className="h-3.5 w-1/3" />
              </>
            ) : (
              <>
                <div
                  aria-hidden
                  className="aspect-[4/3] w-full rounded-md"
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                />
                <p className="text-sm leading-5 font-medium">{p.name}</p>
                <p className="text-sm leading-5 tabular-nums text-muted-foreground">{p.price}</p>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="outline" disabled={loading} onClick={() => setLoading(true)}>
          <RotateCwIcon data-icon="inline-start" />
          다시 불러오기
        </Button>
        <div className="flex items-center gap-2">
          <Switch id={switchId} checked={still} onCheckedChange={setStill} />
          <Label htmlFor={switchId}>움직임 줄이기로 보기</Label>
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {loading ? (still ? '불러오는 중… (빛 없이 회색 덩어리만)' : '불러오는 중…') : `상품 ${PRODUCTS.length}개를 불러왔습니다.`}
      </p>
    </div>
  )
}
