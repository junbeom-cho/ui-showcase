import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { BellIcon, ChevronRightIcon, PlusIcon, RotateCcwIcon, WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '../navigation-patterns/frames'

type Target = 'fab' | 'balance' | 'bell'

const STEPS: { target: Target; title: string; body: string; place: 'above' | 'below' }[] = [
  { target: 'fab', title: '여기서 계좌를 연결해요', body: '+ 버튼을 누르면 다른 은행 계좌도 불러올 수 있어요.', place: 'above' },
  { target: 'balance', title: '잔액을 한곳에서 봐요', body: '연결한 모든 계좌의 잔액이 여기에 합쳐져 보여요.', place: 'below' },
  { target: 'bell', title: '입출금 알림은 여기에', body: '돈이 들어오고 나갈 때마다 종에 숫자가 붙어요.', place: 'below' },
]

/** the hole around the target, measured against the phone screen */
type Spot = { top: number; left: number; width: number; height: number; screenHeight: number }
const PAD = 6

/** 8. An onboarding overlay that dims the app and cuts a hole around the thing it explains. */
export function CoachMarkFormat() {
  const id = useId()
  const [step, setStep] = useState<number | null>(0)
  const [result, setResult] = useState('처음 앱을 연 사람에게 보이는 안내입니다. 다음을 눌러 보세요.')
  const [spot, setSpot] = useState<Spot>({ top: 0, left: 0, width: 0, height: 0, screenHeight: 0 })
  const screenRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const replayRef = useRef<HTMLButtonElement>(null)
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({})
  const target = (name: Target) => (el: HTMLElement | null) => {
    targets.current[name] = el
  }
  // the tour is already open when the page loads; only take focus once someone uses it
  const engaged = useRef(false)

  const current = step === null ? null : STEPS[step]

  // measure the target against the phone screen, again whenever the window changes size
  useLayoutEffect(() => {
    if (!current) return
    const measure = () => {
      const screen = screenRef.current
      const box = targets.current[current.target]?.getBoundingClientRect()
      if (!screen || !box) return
      const origin = screen.getBoundingClientRect()
      setSpot({
        top: box.top - origin.top - PAD,
        left: box.left - origin.left - PAD,
        width: box.width + PAD * 2,
        height: box.height + PAD * 2,
        screenHeight: screen.clientHeight,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [current])

  // focus follows the tour: into the bubble at each step, back to the replay button when it ends
  useEffect(() => {
    if (engaged.current) (step === null ? replayRef : bubbleRef).current?.focus()
  }, [step])

  const go = (next: number) => {
    engaged.current = true
    setStep(next)
    setResult(`안내 ${next + 1}/${STEPS.length}: ${STEPS[next].title}`)
  }
  const close = (how: 'skip' | 'done') => {
    const at = step ?? 0
    setStep(null)
    setResult(
      how === 'done'
        ? '안내를 모두 봤습니다. 다시 보기로 처음부터 볼 수 있습니다.'
        : `${at + 1}/${STEPS.length}단계에서 건너뛰었습니다. 다시 보기로 처음부터 볼 수 있습니다.`,
    )
  }
  const next = () => (step === STEPS.length - 1 ? close('done') : go((step ?? 0) + 1))
  const prev = () => step && go(step - 1)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') next()
    else if (event.key === 'ArrowLeft') prev()
    else if (event.key === 'Escape') close('skip')
    else return
    event.preventDefault()
  }

  const arrowLeft = spot.left + spot.width / 2

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PhoneFrame>
        <div ref={screenRef} className="relative flex flex-1 flex-col">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm font-semibold">내 자산</span>
            <button
              ref={target('bell')}
              type="button"
              aria-label="알림"
              className="grid size-8 place-items-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BellIcon aria-hidden className="size-4" />
            </button>
          </div>
          <div
            ref={target('balance')}
            className="mx-4 flex flex-col gap-1 rounded-2xl bg-primary p-4 text-primary-foreground"
          >
            <span className="flex items-center gap-1.5 text-xs opacity-80">
              <WalletIcon aria-hidden className="size-3.5" />
              연결한 계좌 2개
            </span>
            <span className="text-xl font-semibold tabular-nums">1,284,500원</span>
          </div>
          <ul aria-hidden className="mt-4 flex flex-col gap-3 px-4">
            {['급여 통장', '비상금', '적금'].map((name) => (
              <li key={name} className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-muted" />
                <span className="flex-1 text-sm">{name}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
          <button
            ref={target('fab')}
            type="button"
            aria-label="계좌 연결"
            onClick={() => setResult('계좌 연결을 눌렀습니다. (예시라 여기서 멈춥니다)')}
            className="absolute right-4 bottom-4 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PlusIcon aria-hidden className="size-5" />
          </button>

          {current && step !== null && (
            <div className="absolute inset-0 z-20">
              {/* the hole: a clear box whose enormous shadow is the dimmed screen */}
              <div
                aria-hidden
                data-slot="coach-spotlight"
                className="pointer-events-none absolute rounded-2xl shadow-[0_0_0_9999px_rgb(0_0_0/0.6)] motion-safe:transition-all motion-safe:duration-300"
                style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
              />
              <div
                ref={bubbleRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
                aria-describedby={`${id}-body`}
                tabIndex={-1}
                onKeyDown={onKeyDown}
                className="absolute inset-x-3 flex flex-col gap-2 rounded-xl bg-popover p-3 text-popover-foreground shadow-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                style={
                  current.place === 'below'
                    ? { top: spot.top + spot.height + 12 }
                    : { bottom: spot.screenHeight - spot.top + 12 }
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute size-3 rotate-45 bg-popover',
                    current.place === 'below' ? '-top-1.5' : '-bottom-1.5',
                  )}
                  // the bubble is inset 12px from the screen edge
                  style={{ left: Math.min(Math.max(arrowLeft - 12 - 6, 12), 220) }}
                />
                <p id={`${id}-title`} className="text-sm font-semibold">
                  {current.title}
                </p>
                <p id={`${id}-body`} className="text-xs leading-relaxed text-muted-foreground">
                  {current.body}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span aria-hidden className="flex gap-1">
                    {STEPS.map((s, i) => (
                      <span
                        key={s.target}
                        className={cn('h-1.5 rounded-full bg-muted-foreground/30', i === step ? 'w-4 bg-primary' : 'w-1.5')}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {step + 1}/{STEPS.length}
                  </span>
                  <Button size="xs" variant="ghost" className="ml-auto" onClick={() => close('skip')}>
                    건너뛰기
                  </Button>
                  <Button size="xs" onClick={next}>
                    {step === STEPS.length - 1 ? '시작하기' : '다음'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <Button ref={replayRef} variant="outline" size="sm" disabled={step !== null} onClick={() => go(0)}>
        <RotateCcwIcon data-icon="inline-start" />
        코치마크 다시 보기
      </Button>
      <p className="text-xs text-muted-foreground">안내 말풍선 안에서 ←→로 넘기고 Esc로 닫을 수 있습니다.</p>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  )
}
