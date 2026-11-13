import { useId, useRef, useState, type ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

type StepStatus = 'complete' | 'current' | 'upcoming' | 'error' | 'skipped'

/** Read after each step's title, since the look alone tells screen readers nothing. */
const statusText: Record<StepStatus, string> = {
  complete: '완료',
  current: '진행 중',
  upcoming: '대기',
  error: '오류',
  skipped: '건너뜀',
}

const titleTone: Record<StepStatus, string> = {
  complete: 'font-medium text-foreground',
  current: 'font-semibold text-foreground',
  upcoming: 'text-muted-foreground',
  error: 'font-medium text-destructive',
  skipped: 'text-muted-foreground',
}

type StepData = {
  title: string
  description?: string
  status: StepStatus
  /** the step the user is on (also when it shows an error) */
  current?: boolean
  /** makes the step a button, e.g. to go back to a finished step */
  onSelect?: () => void
}

function StepIndicator({ status, number }: { status: StepStatus; number: number }) {
  return (
    <span
      data-slot="step-indicator"
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full border-2 bg-background text-sm font-semibold tabular-nums transition-colors',
        status === 'complete' && 'border-primary bg-primary text-primary-foreground',
        status === 'current' && 'border-primary text-foreground ring-4 ring-primary/10',
        status === 'upcoming' && 'border-border text-muted-foreground',
        status === 'error' && 'border-destructive bg-destructive text-white',
        status === 'skipped' && 'border-dashed border-muted-foreground/50 text-muted-foreground',
      )}
    >
      {status === 'complete' ? <CheckIcon className="size-4" strokeWidth={3} /> : status === 'error' ? '!' : number}
    </span>
  )
}

function StepText({ step }: { step: StepData }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span data-slot="step-title" className={cn('text-sm leading-tight', titleTone[step.status])}>
        {step.title}
      </span>
      {step.description && (
        <span
          data-slot="step-description"
          className={cn('text-xs', step.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}
        >
          {step.description}
        </span>
      )}
      <span className="sr-only"> ({statusText[step.status]})</span>
    </span>
  )
}

/** One step laid out with its title under the circle; the line runs to the next circle. */
function HorizontalStep({
  step,
  number,
  last,
  demoFocus = false,
}: {
  step: StepData
  number: number
  last: boolean
  demoFocus?: boolean
}) {
  const body = (
    <>
      <StepIndicator status={step.status} number={number} />
      <StepText step={step} />
    </>
  )
  return (
    <li
      data-slot="step"
      data-status={step.status}
      aria-current={step.current ? 'step' : undefined}
      className="relative flex min-w-0 flex-1 flex-col items-center text-center"
    >
      {!last && (
        // from just right of this circle (centre + radius + gap) to just left of the next one
        <span
          data-slot="step-separator"
          aria-hidden
          className={cn(
            'absolute top-5 right-[calc(-50%+1.25rem)] left-[calc(50%+1.25rem)] h-0.5 -translate-y-1/2 rounded-full',
            step.status === 'complete' ? 'bg-primary' : 'bg-border',
          )}
        />
      )}
      {step.onSelect ? (
        <button
          type="button"
          onClick={step.onSelect}
          data-demo-state={demoFocus ? 'focus' : undefined}
          className="flex flex-col items-center gap-1.5 rounded-md p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:transition-colors"
        >
          {body}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-1">{body}</div>
      )}
    </li>
  )
}

function HorizontalStepper({ label, steps, className }: { label: string; steps: StepData[]; className?: string }) {
  return (
    <ol data-slot="stepper" aria-label={label} className={cn('flex w-full', className)}>
      {steps.map((step, index) => (
        <HorizontalStep key={step.title} step={step} number={index + 1} last={index === steps.length - 1} />
      ))}
    </ol>
  )
}

/** A lone step for the state gallery. */
function OneStep({ label, step, number, demoFocus }: { label: string; step: StepData; number: number; demoFocus?: boolean }) {
  return (
    <ol aria-label={label} className="flex w-32">
      <HorizontalStep step={step} number={number} last demoFocus={demoFocus} />
    </ol>
  )
}

const noop = () => {}

function States() {
  return (
    <StateGrid
      items={[
        { label: '완료', node: <OneStep label="완료" number={1} step={{ title: '장바구니', status: 'complete' }} /> },
        {
          label: '현재',
          node: <OneStep label="현재" number={2} step={{ title: '배송 정보', status: 'current', current: true }} />,
        },
        { label: '대기', node: <OneStep label="대기" number={3} step={{ title: '결제', status: 'upcoming' }} /> },
        {
          label: '오류',
          node: (
            <OneStep
              label="오류"
              number={3}
              step={{ title: '결제', description: '카드 승인 실패', status: 'error', current: true }}
            />
          ),
        },
        {
          label: '건너뜀 (선택 단계)',
          node: (
            <OneStep label="건너뜀" number={2} step={{ title: '쿠폰', description: '선택 단계', status: 'skipped' }} />
          ),
        },
        {
          label: '포커스',
          node: (
            <OneStep
              label="포커스"
              number={1}
              demoFocus
              step={{ title: '장바구니', status: 'complete', onSelect: noop }}
            />
          ),
        },
      ]}
    />
  )
}

function StepperPreview() {
  return (
    <HorizontalStepper
      label="주문 단계"
      className="max-w-64"
      steps={[
        { title: '장바구니', status: 'complete' },
        { title: '배송', status: 'current', current: true },
        { title: '결제', status: 'upcoming' },
      ]}
    />
  )
}

function StepperSpecimen() {
  return (
    <HorizontalStepper
      label="주문 단계"
      className="w-80 max-w-full"
      steps={[
        { title: '장바구니', status: 'complete' },
        { title: '배송 정보', description: '주소 입력', status: 'current', current: true },
        { title: '결제', status: 'upcoming' },
      ]}
    />
  )
}

/** Status of each step when everything before `current` is done. */
const linear = (count: number, current: number, finished = false): StepStatus[] =>
  Array.from({ length: count }, (_, i) =>
    finished || i < current ? 'complete' : i === current ? 'current' : 'upcoming',
  )

const orderSteps = [
  { title: '장바구니', body: '담은 상품 2개, 합계 ₩48,000을 확인합니다.' },
  { title: '배송 정보', body: '받는 분 이름과 주소, 연락처를 적습니다.' },
  { title: '결제', body: '카드나 계좌이체로 결제합니다.' },
  { title: '주문 완료', body: '주문이 접수되었습니다. 내일 도착할 예정입니다.' },
]

function OrderSteps() {
  const [current, setCurrent] = useState(0)
  const last = orderSteps.length - 1
  const finished = current === last
  const statuses = linear(orderSteps.length, current, finished)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <HorizontalStepper
        label="주문 단계"
        steps={orderSteps.map((s, i) => ({ title: s.title, status: statuses[i], current: !finished && i === current }))}
      />
      <div className="rounded-lg border bg-background p-3 text-sm">{orderSteps[current].body}</div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={current === 0 || finished} onClick={() => setCurrent(current - 1)}>
          이전
        </Button>
        {finished ? (
          <Button variant="outline" onClick={() => setCurrent(0)}>
            처음부터
          </Button>
        ) : (
          <Button onClick={() => setCurrent(current + 1)}>{current === last - 1 ? '결제하기' : '다음'}</Button>
        )}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {finished
          ? `주문을 마쳤습니다. ${orderSteps.length}단계 모두 완료`
          : `${current + 1} / ${orderSteps.length}단계: ${orderSteps[current].title}`}
      </p>
    </div>
  )
}

function VerticalStep({
  step,
  number,
  last,
  children,
}: {
  step: StepData
  number: number
  last: boolean
  children?: ReactNode
}) {
  return (
    <li
      data-slot="step"
      data-status={step.status}
      aria-current={step.current ? 'step' : undefined}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      {!last && (
        <span
          data-slot="step-separator"
          aria-hidden
          className={cn(
            'absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 rounded-full',
            step.status === 'complete' ? 'bg-primary' : 'bg-border',
          )}
        />
      )}
      <StepIndicator status={step.status} number={number} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <StepText step={step} />
        {children}
      </div>
    </li>
  )
}

const setupSteps = [
  { title: '계정 만들기', description: '이메일로 가입', body: '이메일과 비밀번호로 계정을 만듭니다. 1분이면 끝납니다.' },
  { title: '기기 연결', description: '블루투스 켜기', body: '휴대폰 블루투스를 켜고 시계 옆 버튼을 3초 동안 누릅니다.' },
  { title: '알림 설정', description: '언제든 바꿀 수 있음', body: '하루 걸음 목표를 채웠을 때 알림을 받을지 고릅니다.' },
]

function VerticalSteps() {
  const [current, setCurrent] = useState(0)
  const finished = current === setupSteps.length
  const statuses = linear(setupSteps.length, current, finished)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <ol data-slot="stepper" aria-label="시계 설정 단계" className="flex flex-col">
        {setupSteps.map((s, i) => (
          <VerticalStep
            key={s.title}
            number={i + 1}
            last={i === setupSteps.length - 1}
            step={{ title: s.title, description: s.description, status: statuses[i], current: i === current }}
          >
            {i === current && (
              <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
                <p className="text-sm">{s.body}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setCurrent(i + 1)}>
                    {i === setupSteps.length - 1 ? '마치기' : '다음'}
                  </Button>
                  {i > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setCurrent(i - 1)}>
                      이전
                    </Button>
                  )}
                </div>
              </div>
            )}
          </VerticalStep>
        ))}
      </ol>
      {finished && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setCurrent(0)}>
          처음부터
        </Button>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {finished ? '설정을 모두 마쳤습니다.' : `${current + 1} / ${setupSteps.length}단계: ${setupSteps[current].title}`}
      </p>
    </div>
  )
}

type SignupValues = { email: string; password: string; nickname: string }
type FieldKey = keyof SignupValues

const signupFields: { key: FieldKey; label: string; type: string; autoComplete: string; placeholder: string }[] = [
  { key: 'email', label: '이메일', type: 'email', autoComplete: 'email', placeholder: 'name@example.com' },
  { key: 'password', label: '비밀번호', type: 'password', autoComplete: 'new-password', placeholder: '8자 이상, 숫자 포함' },
  { key: 'nickname', label: '닉네임', type: 'text', autoComplete: 'nickname', placeholder: '2~10자' },
]
const signupSteps = [...signupFields.map((f) => f.label), '확인']
const CONFIRM = signupSteps.length - 1

/** What is wrong with a step's field, or null when it may move on. */
function signupProblem(index: number, values: SignupValues): string | null {
  if (index === 0) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? null : '이메일 형식이 아닙니다. 예: name@example.com'
  if (index === 1) return values.password.length >= 8 && /\d/.test(values.password) ? null : '8자 이상, 숫자를 하나 이상 넣어 주세요.'
  if (index === 2) {
    const length = values.nickname.trim().length
    return length >= 2 && length <= 10 ? null : '닉네임은 2~10자로 적어 주세요.'
  }
  return null
}

const emptySignup: SignupValues = { email: '', password: '', nickname: '' }

function SignupWizard() {
  const id = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<SignupValues>(emptySignup)
  const [current, setCurrent] = useState(0)
  const [reached, setReached] = useState(0) // furthest step opened so far
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const validUpTo = (index: number) => signupSteps.slice(0, index).every((_, j) => signupProblem(j, values) === null)
  const open = (index: number) => {
    setError(null)
    setCurrent(index)
  }
  const next = () => {
    const problem = signupProblem(current, values)
    if (problem) {
      setError(problem)
      fieldRef.current?.focus()
      return
    }
    open(current + 1)
    setReached((r) => Math.max(r, current + 1))
  }
  const reset = () => {
    setValues(emptySignup)
    setReached(0)
    setDone(false)
    open(0)
  }

  const steps: StepData[] = signupSteps.map((title, i) => {
    if (done) return { title, status: 'complete' }
    if (i === current) return { title, status: error ? 'error' : 'current', current: true }
    const finished = i < CONFIRM && i <= reached && validUpTo(i + 1)
    // a finished step is a button back (or forward again) to it
    return finished ? { title, status: 'complete', onSelect: () => open(i) } : { title, status: 'upcoming' }
  })
  const field = signupFields[current]

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <HorizontalStepper label="회원가입 단계" steps={steps} />

      {done ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border bg-background p-3">
          <p className="text-sm">환영합니다, {values.nickname.trim()}님! 가입을 마쳤습니다.</p>
          <Button variant="outline" size="sm" onClick={reset}>
            처음부터
          </Button>
        </div>
      ) : field ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
          className="grid gap-2 rounded-lg border bg-background p-3"
        >
          <Label htmlFor={`${id}-field`}>{field.label}</Label>
          {/* one input for every step, so pressing Enter keeps the caret in the field */}
          <Input
            ref={fieldRef}
            id={`${id}-field`}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            value={values[field.key]}
            onChange={(e) => {
              const nextValues = { ...values, [field.key]: e.target.value }
              setValues(nextValues)
              // once an error shows, it goes away as soon as the value is fixed
              if (error) setError(signupProblem(current, nextValues))
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-between gap-2">
            <Button type="button" variant="outline" disabled={current === 0} onClick={() => open(current - 1)}>
              이전
            </Button>
            <Button type="submit">다음</Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-3 rounded-lg border bg-background p-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">이메일</dt>
            <dd>{values.email.trim()}</dd>
            <dt className="text-muted-foreground">닉네임</dt>
            <dd>{values.nickname.trim()}</dd>
          </dl>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => open(current - 1)}>
              이전
            </Button>
            <Button onClick={() => setDone(true)}>가입하기</Button>
          </div>
        </div>
      )}

      <p role="status" className="text-xs text-muted-foreground">
        {done ? `가입 완료: ${values.email.trim()}` : `${current + 1} / ${signupSteps.length}단계: ${signupSteps[current]}`}
      </p>
    </div>
  )
}

const checkoutSteps = ['장바구니', '배송지', '배송 방법', '결제 수단', '확인']

function CompactSteps() {
  const [current, setCurrent] = useState(1)
  const total = checkoutSteps.length
  const label = `${total}단계 중 ${current + 1}단계`

  return (
    <div className="flex w-full max-w-64 flex-col gap-5 rounded-2xl border bg-background p-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">막대형</p>
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">{checkoutSteps[current]}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
        <Progress value={((current + 1) / total) * 100} getValueLabel={() => label} aria-label="진행 막대" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">점형</p>
        <ol aria-label="점형 단계" className="flex items-center gap-1.5">
          {checkoutSteps.map((title, i) => (
            <li
              key={title}
              aria-current={i === current ? 'step' : undefined}
              className={cn(
                'relative h-2 rounded-full motion-safe:transition-all',
                i === current ? 'w-5 bg-primary' : i < current ? 'w-2 bg-primary/50' : 'w-2 bg-border',
              )}
            >
              <span className="sr-only">
                {title} ({i < current ? '완료' : i === current ? '진행 중' : '대기'})
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
          이전
        </Button>
        <Button size="sm" disabled={current === total - 1} onClick={() => setCurrent(current + 1)}>
          다음
        </Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {label}: {checkoutSteps[current]}
      </p>
    </div>
  )
}

export const stepperEntry: ShowcaseEntry = {
  id: 'stepper',
  name: 'Stepper',
  aliases: ['Steps', 'Wizard', 'Progress steps', 'Step indicator', '단계 표시', '스테퍼', '마법사'],
  description: '여러 단계로 나뉜 일에서 지금 몇 번째 단계에 있고 무엇이 남았는지 보여주는 단계 표시.',
  category: 'navigation',
  Preview: StepperPreview,
  anatomy: {
    Specimen: StepperSpecimen,
    parts: [
      { slot: 'stepper', name: 'Stepper', description: '단계 전체를 순서대로 담은 번호 목록(ol)' },
      { slot: 'step', name: 'Step', description: '단계 하나. 지금 단계에는 aria-current="step"이 붙음' },
      {
        slot: 'step-indicator',
        name: 'StepIndicator',
        description: '번호나 체크가 든 동그라미. 완료·진행 중·대기·오류를 색과 모양으로 구분',
      },
      { slot: 'step-title', name: 'StepTitle', description: '단계 이름' },
      { slot: 'step-description', name: 'StepDescription', description: '이름 아래 짧은 설명. 오류일 때는 오류 내용이 들어감' },
      { slot: 'step-separator', name: 'StepSeparator', description: '단계 사이를 잇는 선. 앞 단계를 마치면 진하게 채워짐' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '단계 하나가 거치는 상태를 나란히 놓았습니다. 완료는 체크, 현재는 진한 테두리, 오류는 빨간 느낌표, 건너뛴 선택 단계는 점선입니다. 포커스는 돌아갈 수 있는 완료 단계를 키보드로 골랐을 때의 모습입니다.',
      Demo: States,
    },
    {
      title: '가로 단계',
      description:
        '쇼핑몰 주문처럼 단계가 3~5개로 짧을 때 위쪽에 가로로 놓습니다. 다음과 이전을 눌러 동그라미와 선이 어떻게 채워지는지 보세요.',
      Demo: OrderSteps,
    },
    {
      title: '세로 단계',
      description:
        '단계마다 설명이 길거나 화면이 좁을 때는 세로로 세우고, 지금 단계 아래에 내용을 펼칩니다. 기기 설정 안내처럼 차례대로 따라 하는 일에 어울립니다.',
      Demo: VerticalSteps,
    },
    {
      title: '회원가입 마법사',
      description:
        '단계마다 칸 하나를 채우는 마법사(Wizard)입니다. 비워 두고 다음을 누르면 막히고 그 단계가 오류로 바뀝니다. 마친 단계는 눌러서 돌아갈 수 있습니다.',
      Demo: SignupWizard,
    },
    {
      title: '진행 막대형과 점형',
      description:
        '휴대폰처럼 좁은 화면에서는 단계 이름을 다 늘어놓지 않고 진행 막대나 점으로 줄입니다. 지금 단계 이름과 "2 / 5"를 꼭 함께 보여 주세요.',
      Demo: CompactSteps,
    },
  ],
}
