import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

/** wait before a held button starts repeating, then the gap between repeats */
const HOLD_DELAY = 400
const repeatGap = (tick: number) => Math.max(40, Math.round(200 * 0.8 ** tick))

type QuantityStepperProps = {
  value: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** names the number field and both buttons */
  label: string
  unit?: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  /** a typed number outside min..max, and what it became */
  onClamp?: (typed: number, clamped: number) => void
  /** a typed field left empty or not a number, put back to the value */
  onRevert?: () => void
  /** at min the − becomes a trash button that calls this */
  onRemove?: () => void
  /** the repeat count while a button is held, 0 when it is let go */
  onHold?: (tick: number) => void
  /** pin the pointer over a button, or keyboard focus in the field, for the state gallery */
  demoHover?: 'decrement' | 'increment'
  demoFocus?: boolean
  className?: string
}

/**
 * A number between − and +. The number itself is a text field with role="spinbutton":
 * type into it, or use ↑↓ (one step), PageUp/PageDown (ten steps), Home/End (min/max).
 * Holding a button repeats, faster the longer it is held.
 */
function QuantityStepper({
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  unit,
  disabled = false,
  invalid = false,
  describedBy,
  onClamp,
  onRevert,
  onRemove,
  onHold,
  demoHover,
  demoFocus,
  className,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const set = (n: number) => {
    setDraft(null)
    if (n !== value) onValueChange?.(n)
  }

  // the hold timer reads the newest value, not the one from when the press began
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])
  const timer = useRef<number | undefined>(undefined)
  const ticks = useRef(0)
  // a hold already moved the value, so the click that ends it must not add one more
  const held = useRef(false)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const stopHold = () => {
    window.clearTimeout(timer.current)
    if (ticks.current > 0) onHold?.(0)
    ticks.current = 0
  }
  const startHold = (delta: number) => {
    stopHold()
    held.current = false
    const schedule = (tick: number) => {
      timer.current = window.setTimeout(
        () => {
          const next = clamp(latest.current + delta)
          if (next === latest.current) return stopHold()
          held.current = true
          ticks.current = tick
          latest.current = next
          onValueChange?.(next)
          onHold?.(tick)
          schedule(tick + 1)
        },
        tick === 1 ? HOLD_DELAY : repeatGap(tick),
      )
    }
    schedule(1)
  }
  const holdProps = (delta: number) => ({
    onPointerDown: () => startHold(delta),
    onPointerUp: stopHold,
    onPointerLeave: () => {
      stopHold()
      held.current = false // no click follows a release outside the button
    },
    onPointerCancel: stopHold,
    onClick: () => {
      if (held.current) held.current = false
      else set(clamp(value + delta))
    },
  })

  const commit = () => {
    if (draft === null) return
    const typed = Number.parseInt(draft, 10)
    if (Number.isNaN(typed)) {
      setDraft(null)
      onRevert?.()
      return
    }
    const clamped = clamp(typed)
    set(clamped)
    // after the change, so a caller's message about the clamp is the one that stays
    if (clamped !== typed) onClamp?.(typed, clamped)
  }

  const keys: Record<string, number> = {
    ArrowUp: value + step,
    ArrowDown: value - step,
    PageUp: value + step * 10,
    PageDown: value - step * 10,
    Home: min,
    End: max,
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key in keys) {
      event.preventDefault()
      set(clamp(keys[event.key]))
    } else if (event.key === 'Enter') {
      commit()
    } else if (event.key === 'Escape') {
      setDraft(null)
    }
  }

  const removing = onRemove !== undefined && value <= min
  const DecrementIcon = removing ? Trash2Icon : MinusIcon

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="quantity-stepper"
      data-demo-state={demoFocus ? 'focus' : undefined}
      className={cn(
        'inline-flex h-9 w-fit shrink-0 items-center gap-0.5 rounded-lg border bg-background p-0.5 transition-colors',
        'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        invalid && 'border-destructive ring-3 ring-destructive/20',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-slot="stepper-decrement"
        data-demo-state={demoHover === 'decrement' ? 'hover' : undefined}
        aria-label={removing ? `${label} 빼기` : `${label} 줄이기`}
        disabled={disabled || (!removing && value <= min)}
        className={cn(removing && 'text-destructive hover:text-destructive')}
        {...(removing ? { onClick: onRemove } : holdProps(-step))}
      >
        <DecrementIcon />
      </Button>
      <span className={cn('flex items-baseline justify-center gap-0.5', className)}>
        <input
          type="text"
          inputMode="numeric"
          role="spinbutton"
          data-slot="stepper-value"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={unit ? `${value}${unit}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={onKeyDown}
          onFocus={(e) => e.target.select()}
          className="min-w-0 bg-transparent text-center text-sm font-medium tabular-nums outline-none disabled:cursor-not-allowed"
          style={{ width: `${Math.max(2, String(max).length) + 1}ch` }}
        />
        {unit && (
          <span data-slot="stepper-unit" aria-hidden className="pr-1 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-slot="stepper-increment"
        data-demo-state={demoHover === 'increment' ? 'hover' : undefined}
        aria-label={`${label} 늘리기`}
        disabled={disabled || value >= max}
        {...holdProps(step)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

/** A stepper that keeps its own value, for the state gallery. */
function LiveStepper({ initial, ...props }: Omit<QuantityStepperProps, 'value' | 'onValueChange'> & { initial: number }) {
  const [value, setValue] = useState(initial)
  return <QuantityStepper value={value} onValueChange={setValue} {...props} />
}

function States() {
  const id = useId()
  return (
    <StateGrid
      items={[
        { label: '기본', node: <LiveStepper label="기본" initial={2} min={1} max={10} /> },
        { label: '호버', node: <LiveStepper label="호버" initial={2} min={1} max={10} demoHover="increment" /> },
        { label: '포커스', node: <LiveStepper label="포커스" initial={2} min={1} max={10} demoFocus /> },
        { label: '최솟값', node: <LiveStepper label="최솟값" initial={1} min={1} max={10} /> },
        { label: '최댓값', node: <LiveStepper label="최댓값" initial={10} min={1} max={10} /> },
        { label: '비활성', node: <LiveStepper label="비활성" initial={2} min={1} max={10} disabled /> },
        {
          label: '오류',
          node: (
            <span className="flex flex-col items-center gap-1">
              <LiveStepper label="오류" initial={5} min={1} max={10} invalid describedBy={`${id}-error`} />
              <span id={`${id}-error`} className="text-xs text-destructive">
                재고가 3개 남았어요
              </span>
            </span>
          ),
        },
        { label: '1개면 삭제', node: <LiveStepper label="1개면 삭제" initial={1} min={1} max={10} onRemove={() => {}} /> },
      ]}
    />
  )
}

function QuantityStepperPreview() {
  const [value, setValue] = useState(2)
  return <QuantityStepper label="수량" value={value} onValueChange={setValue} min={1} max={9} />
}

function QuantityStepperSpecimen() {
  const [value, setValue] = useState(3)
  return <QuantityStepper label="수량" unit="개" value={value} onValueChange={setValue} min={1} max={10} />
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const CART_LIMIT = 10
const CART = [
  { id: 'beans', name: '원두 500g', price: 14000, qty: 2 },
  { id: 'filter', name: '종이 필터 100매', price: 3500, qty: 1 },
  { id: 'mug', name: '머그컵', price: 9000, qty: 1 },
]

function CartQuantity() {
  const [items, setItems] = useState(CART)
  const [message, setMessage] = useState('수량을 바꾸면 줄 합계와 총액이 함께 바뀝니다.')
  const setQty = (id: string, qty: number) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
  const remove = (id: string, name: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setMessage(`‘${name}’을(를) 장바구니에서 뺐습니다.`)
  }
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul aria-label="장바구니" className="flex flex-col divide-y rounded-lg border bg-background">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{won(item.price)}</p>
            </div>
            <QuantityStepper
              label={item.name}
              value={item.qty}
              min={1}
              max={CART_LIMIT}
              onValueChange={(qty) => setQty(item.id, qty)}
              onRemove={() => remove(item.id, item.name)}
            />
            <span
              data-testid={`line-${item.id}`}
              className="w-20 shrink-0 text-right text-sm font-medium tabular-nums"
            >
              {won(item.price * item.qty)}
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">장바구니가 비었습니다</li>}
      </ul>
      <div className="flex items-baseline justify-between px-1 text-sm">
        <span className="text-muted-foreground">상품 {count}개 · 1인당 상품별 {CART_LIMIT}개까지</span>
        <span className="text-base font-semibold tabular-nums">합계 {won(total)}</span>
      </div>
      {items.length < CART.length && (
        <Button variant="link" size="sm" className="self-start px-0" onClick={() => setItems(CART)}>
          예시 처음으로
        </Button>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

const PRINT_MIN = 1
const PRINT_MAX = 100

function TypeAndRange() {
  const id = useId()
  const [copies, setCopies] = useState(1)
  const [message, setMessage] = useState(`${PRINT_MIN}~${PRINT_MAX}장 사이로 정할 수 있습니다.`)

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <span id={`${id}-label`} className="text-sm font-medium">
          인쇄 매수
        </span>
        <QuantityStepper
          label="인쇄 매수"
          unit="장"
          value={copies}
          min={PRINT_MIN}
          max={PRINT_MAX}
          describedBy={`${id}-hint`}
          onValueChange={(n) => {
            setCopies(n)
            setMessage(`${n}장 인쇄합니다.`)
          }}
          onClamp={(typed, clamped) =>
            setMessage(
              typed > PRINT_MAX
                ? `${typed}장은 너무 많아 최대 ${clamped}장으로 맞췄습니다.`
                : `${typed}장은 너무 적어 최소 ${clamped}장으로 맞췄습니다.`,
            )
          }
          onRevert={() => setMessage(`숫자가 없어 ${copies}장으로 되돌렸습니다.`)}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
        숫자를 지우고 직접 써 넣은 뒤 Enter나 바깥을 누르면 정해집니다. ↑↓는 1장씩, PageUp·PageDown은 10장씩,
        Home·End는 최소·최대로 옮깁니다.
      </p>
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  )
}

const POINT_MAX = 5000
const POINT_STEP = 10

function HoldToRepeat() {
  const [points, setPoints] = useState(0)
  const [tick, setTick] = useState(0)

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div>
          <p className="text-sm font-medium">포인트 사용</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            보유 {POINT_MAX.toLocaleString('ko-KR')}P · {POINT_STEP}P 단위
          </p>
        </div>
        <QuantityStepper
          label="사용할 포인트"
          unit="P"
          value={points}
          min={0}
          max={POINT_MAX}
          step={POINT_STEP}
          onValueChange={setPoints}
          onHold={setTick}
        />
      </div>
      <div aria-hidden className="flex h-2 items-end gap-0.5">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={cn('h-full flex-1 rounded-full bg-muted transition-colors', tick > i * 2 && 'bg-primary')}
          />
        ))}
      </div>
      <p role="status" className="text-sm tabular-nums">
        {tick > 0
          ? `길게 누르는 중 · ${tick}번째 반복 · 다음까지 ${repeatGap(tick + 1)}ms`
          : `${points.toLocaleString('ko-KR')}P 사용 · 한 번 누르면 ${POINT_STEP}P, 길게 누르면 점점 빨라집니다.`}
      </p>
    </div>
  )
}

const GUEST_MAX = 8
type Guests = { adults: number; children: number; infants: number }

function GuestPicker() {
  const id = useId()
  const [guests, setGuests] = useState<Guests>({ adults: 2, children: 0, infants: 0 })
  const { adults, children, infants } = guests
  const change = (key: keyof Guests) => (n: number) => setGuests((g) => ({ ...g, [key]: n }))

  const rows = [
    {
      key: 'adults' as const,
      label: '성인',
      note: '만 13세 이상',
      // an infant sits on an adult's lap, so adults cannot drop below the infants
      min: Math.max(1, infants),
      max: GUEST_MAX - children,
    },
    { key: 'children' as const, label: '아동', note: '만 2~12세', min: 0, max: GUEST_MAX - adults },
    { key: 'infants' as const, label: '유아', note: '만 2세 미만 · 성인 1명당 1명', min: 0, max: adults },
  ]
  const seats = adults + children
  const summary = [`성인 ${adults}명`, children && `아동 ${children}명`, infants && `유아 ${infants}명`]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul aria-label="인원" className="flex flex-col divide-y rounded-lg border bg-background">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p id={`${id}-${row.key}`} className="text-xs text-muted-foreground">
                {row.note}
              </p>
            </div>
            <QuantityStepper
              label={row.label}
              value={guests[row.key]}
              min={row.min}
              max={row.max}
              describedBy={`${id}-${row.key}`}
              onValueChange={change(row.key)}
            />
          </li>
        ))}
      </ul>
      <p className="px-1 text-xs text-muted-foreground tabular-nums">
        좌석 {seats}/{GUEST_MAX} · 유아는 좌석 없이 성인 무릎에 앉아 인원 한도에 넣지 않습니다.
      </p>
      <p role="status" className="text-sm font-medium">
        게스트 {seats}명{infants > 0 && `, 유아 ${infants}명`} ({summary})
      </p>
    </div>
  )
}

export const quantityStepperEntry: ShowcaseEntry = {
  id: 'quantity-stepper',
  name: 'Quantity Stepper',
  aliases: [
    'Number input',
    'Spin button',
    'Counter',
    'Number stepper',
    'Quantity selector',
    '수량 스테퍼',
    '수량 선택',
    '숫자 입력',
  ],
  description: '숫자 하나를 양옆의 − 와 + 버튼으로 한 칸씩 줄이고 늘리거나 가운데에 직접 써 넣어 정하는 입력칸.',
  category: 'input',
  Preview: QuantityStepperPreview,
  anatomy: {
    Specimen: QuantityStepperSpecimen,
    parts: [
      { slot: 'quantity-stepper', name: 'QuantityStepper', description: '− 버튼, 숫자, + 버튼을 한 테두리로 묶은 전체' },
      { slot: 'stepper-decrement', name: 'Decrement', description: '한 칸 줄이는 버튼. 최솟값에 닿으면 비활성' },
      {
        slot: 'stepper-value',
        name: 'Value',
        description: '지금 숫자. role="spinbutton"인 입력칸이라 직접 써 넣거나 ↑↓로 바꿈',
      },
      { slot: 'stepper-unit', name: 'Unit', description: '개·명·장처럼 숫자가 무엇을 세는지 알려 주는 단위' },
      { slot: 'stepper-increment', name: 'Increment', description: '한 칸 늘리는 버튼. 최댓값에 닿으면 비활성' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '수량 스테퍼가 놓이는 상태를 나란히 놓았습니다. 최솟값·최댓값에 닿으면 그쪽 버튼만 꺼지고, 장바구니처럼 1개에서 줄이면 지워지는 곳에서는 −가 휴지통으로 바뀝니다. 몇 번째 단계인지 보여 주는 Stepper(단계 표시)와는 이름만 비슷한 다른 UI입니다. 칸마다 직접 눌러 보세요.',
      Demo: States,
    },
    {
      title: '장바구니 수량',
      description:
        '쇼핑몰 장바구니에서 상품마다 수량을 바꾸면 줄 합계와 총액이 바로 바뀝니다. 0개는 의미가 없으니 1개에서 −를 누르면 휴지통으로 바뀌어 상품을 뺍니다. 수십 개 이상을 사는 도매 주문처럼 큰 수는 직접 입력이 낫습니다. 머그컵을 1개에서 한 번 더 줄여 보세요.',
      Demo: CartQuantity,
    },
    {
      title: '직접 입력과 범위',
      description:
        '가운데 숫자는 입력칸이라 써 넣을 수 있고, 범위를 벗어나면 가장 가까운 끝값으로 맞춘 뒤 왜 바뀌었는지 알립니다. 키보드로는 ↑↓, PageUp·PageDown(10씩), Home·End를 씁니다. 화면에 안 보여도 스크린리더는 지금 값과 최솟값·최댓값을 읽습니다. 150을 써 넣고 Enter를 눌러 보세요.',
      Demo: TypeAndRange,
    },
    {
      title: '길게 눌러 빠르게',
      description:
        '버튼을 누르고 있으면 잠깐 뒤부터 저절로 반복되고, 오래 누를수록 점점 빨라집니다. 단위가 작고 범위가 넓은 값(포인트 10P 단위)에 쓰며, 범위가 수천을 넘으면 슬라이더나 직접 입력이 더 빠릅니다. +를 2초쯤 꾹 눌러 보세요.',
      Demo: HoldToRepeat,
    },
    {
      title: '인원 선택',
      description:
        '숙소·항공 예약에서 성인·아동·유아를 줄마다 스테퍼로 고릅니다. 줄끼리 규칙이 얽혀 있어 유아는 성인 수를 넘을 수 없고, 좌석은 모두 합쳐 8명까지입니다. 한쪽을 바꾸면 다른 줄의 버튼이 켜지고 꺼집니다. 유아를 성인 수만큼 늘린 뒤 성인을 줄여 보세요.',
      Demo: GuestPicker,
    },
  ],
}
