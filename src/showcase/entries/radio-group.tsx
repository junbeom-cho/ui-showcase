import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { LayoutGridIcon, ListIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const won = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`

/** One radio in its own group, so each cell shows exactly one state. */
function OneRadio({
  label,
  checked = false,
  disabled = false,
  ...item
}: { label: string; checked?: boolean; disabled?: boolean } & Omit<ComponentProps<typeof RadioGroupItem>, 'value'>) {
  return (
    <RadioGroup aria-label={label} defaultValue={checked ? 'on' : undefined} disabled={disabled} className="w-auto">
      <RadioGroupItem value="on" aria-label={label} {...item} />
    </RadioGroup>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '선택 안 됨', node: <OneRadio label="선택 안 됨" /> },
        { label: '선택됨', node: <OneRadio label="선택됨" checked /> },
        { label: '포커스', node: <OneRadio label="포커스" checked data-demo-state="focus" /> },
        { label: '비활성', node: <OneRadio label="비활성" disabled /> },
        { label: '비활성 (선택됨)', node: <OneRadio label="비활성 선택됨" checked disabled /> },
        { label: '오류', node: <OneRadio label="오류" aria-invalid /> },
      ]}
    />
  )
}

const alerts = [
  { value: 'instant', label: '바로 알림' },
  { value: 'daily', label: '하루 한 번 모아서' },
  { value: 'off', label: '받지 않음' },
]

function RadioGroupPreview() {
  const id = useId()
  return (
    <RadioGroup defaultValue="instant" aria-label="알림 받기" className="w-auto">
      {alerts.map((a) => (
        <div key={a.value} className="flex items-center gap-2">
          <RadioGroupItem id={`${id}-${a.value}`} value={a.value} />
          <Label htmlFor={`${id}-${a.value}`}>{a.label}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}

const payments = [
  { value: 'card', label: '신용카드' },
  { value: 'transfer', label: '계좌이체' },
  { value: 'phone', label: '휴대폰 결제' },
]

function RadioGroupSpecimen() {
  const id = useId()
  return (
    <RadioGroup defaultValue="card" aria-label="결제 수단" className="w-auto gap-3">
      {payments.map((p) => (
        <div key={p.value} className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-${p.value}`} value={p.value} className="size-5" />
          <Label htmlFor={`${id}-${p.value}`} className="text-base">
            {p.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

const ITEM_PRICE = 24_000

const shipping = [
  { value: 'standard', label: '일반 배송', note: '2~3일 뒤 도착', fee: 3_000 },
  { value: 'express', label: '빠른 배송', note: '내일 오전 7시 전 도착', fee: 5_000 },
  { value: 'pickup', label: '매장 픽업', note: '오늘 오후 4시부터 성수점에서', fee: 0 },
]

function ShippingOptions() {
  const id = useId()
  const [method, setMethod] = useState('standard')
  const fee = shipping.find((s) => s.value === method)!.fee
  const feeText = (amount: number) => (amount === 0 ? '무료' : won(amount))

  return (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <RadioGroup
        value={method}
        onValueChange={setMethod}
        aria-label="배송 방법"
        className="gap-0 divide-y rounded-lg border bg-background"
      >
        {shipping.map((s) => (
          <div key={s.value} className="flex items-start gap-3 p-3">
            <RadioGroupItem
              id={`${id}-${s.value}`}
              value={s.value}
              aria-describedby={`${id}-${s.value}-note`}
              className="mt-0.5"
            />
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`${id}-${s.value}`}>{s.label}</Label>
              <p id={`${id}-${s.value}-note`} className="text-xs text-muted-foreground">
                {s.note}
              </p>
            </div>
            <span className="text-sm tabular-nums">{feeText(s.fee)}</span>
          </div>
        ))}
      </RadioGroup>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">상품 금액</dt>
        <dd className="text-right tabular-nums">{won(ITEM_PRICE)}</dd>
        <dt className="text-muted-foreground">배송비</dt>
        <dd className="text-right tabular-nums">{feeText(fee)}</dd>
      </dl>
      <p role="status" className="flex justify-between border-t pt-2 text-sm font-semibold">
        <span>합계</span>
        <span className="tabular-nums">{won(ITEM_PRICE + fee)}</span>
      </p>
    </div>
  )
}

const plans = [
  { value: 'free', name: '무료', price: '₩0', note: '프로젝트 3개까지' },
  { value: 'pro', name: '프로', price: '월 ₩9,900', note: '프로젝트 무제한, 버전 기록' },
  { value: 'team', name: '팀', price: '월 ₩29,000', note: '5명까지 함께 편집' },
]

function PlanCards() {
  const id = useId()
  const [plan, setPlan] = useState('pro')
  const chosen = plans.find((p) => p.value === plan)!

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <RadioGroup value={plan} onValueChange={setPlan} aria-label="요금제" className="gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          // the whole card is the radio's label, so a click anywhere on it picks the plan
          <label
            key={p.value}
            htmlFor={`${id}-${p.value}`}
            className="relative flex cursor-pointer flex-col gap-1 rounded-lg border bg-background p-4 hover:bg-muted/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 motion-safe:transition-colors"
          >
            <RadioGroupItem
              id={`${id}-${p.value}`}
              value={p.value}
              aria-labelledby={`${id}-${p.value}-name`}
              aria-describedby={`${id}-${p.value}-note`}
              className="absolute top-4 right-4"
            />
            <span id={`${id}-${p.value}-name`} className="text-sm font-medium">
              {p.name}
            </span>
            <span className="text-lg font-semibold tabular-nums">{p.price}</span>
            <span id={`${id}-${p.value}-note`} className="text-xs text-muted-foreground">
              {p.note}
            </span>
          </label>
        ))}
      </RadioGroup>
      <p role="status" className="text-xs text-muted-foreground">
        {chosen.name} 요금제를 골랐습니다. ({chosen.price})
      </p>
    </div>
  )
}

const textSizes = [
  { value: 'sm', label: '작게', className: 'text-sm' },
  { value: 'md', label: '보통', className: 'text-base' },
  { value: 'lg', label: '크게', className: 'text-xl' },
]

function Horizontal() {
  const id = useId()
  const [size, setSize] = useState('md')
  const current = textSizes.find((s) => s.value === size)!

  return (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span id={`${id}-title`} className="text-sm font-medium">
          글자 크기
        </span>
        <RadioGroup
          value={size}
          onValueChange={setSize}
          orientation="horizontal"
          aria-labelledby={`${id}-title`}
          className="flex w-auto gap-5"
        >
          {textSizes.map((s) => (
            <div key={s.value} className="flex items-center gap-2">
              <RadioGroupItem id={`${id}-${s.value}`} value={s.value} />
              <Label htmlFor={`${id}-${s.value}`}>{s.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <p data-size={size} className={cn('rounded-lg border bg-background p-3', current.className)}>
        다람쥐 헌 쳇바퀴에 타고파.
      </p>
    </div>
  )
}

function ComparePanel({ title, rule, children }: { title: string; rule: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      {children}
      <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{rule}</p>
    </div>
  )
}

const interests = ['여행', '요리', '운동']

function WhichControl() {
  const id = useId()
  const [payment, setPayment] = useState('card')
  const [picked, setPicked] = useState(['여행'])
  const [view, setView] = useState('list')

  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      <ComparePanel title="라디오" rule="여럿 중 꼭 하나만. 선택지를 모두 펼쳐 놓고 비교하게 할 때 씁니다.">
        <RadioGroup value={payment} onValueChange={setPayment} aria-label="결제 수단" className="w-auto">
          {payments.slice(0, 2).map((p) => (
            <div key={p.value} className="flex items-center gap-2">
              <RadioGroupItem id={`${id}-pay-${p.value}`} value={p.value} />
              <Label htmlFor={`${id}-pay-${p.value}`}>{p.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs">결제 수단: {payments.find((p) => p.value === payment)!.label}</p>
      </ComparePanel>

      <ComparePanel title="체크박스" rule="몇 개든 고를 수 있고, 하나도 안 골라도 될 때 씁니다.">
        <div className="flex flex-col gap-2">
          {interests.map((interest) => (
            <div key={interest} className="flex items-center gap-2">
              <Checkbox
                id={`${id}-interest-${interest}`}
                checked={picked.includes(interest)}
                onCheckedChange={(checked) =>
                  setPicked((prev) => (checked ? [...prev, interest] : prev.filter((x) => x !== interest)))
                }
              />
              <Label htmlFor={`${id}-interest-${interest}`}>{interest}</Label>
            </div>
          ))}
        </div>
        <p className="text-xs">관심사: {picked.length > 0 ? picked.join(', ') : '없음'}</p>
      </ComparePanel>

      <ComparePanel title="토글 그룹" rule="버튼 모양으로 하나를 고릅니다. 보기 방식처럼 누르는 즉시 화면이 바뀔 때 씁니다.">
        <ToggleGroup
          type="single"
          variant="outline"
          aria-label="보기 방식"
          value={view}
          onValueChange={(next) => next && setView(next)} // keep one view chosen
        >
          <ToggleGroupItem value="list">
            <ListIcon />
            목록
          </ToggleGroupItem>
          <ToggleGroupItem value="grid">
            <LayoutGridIcon />
            격자
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs">보기: {view === 'list' ? '목록' : '격자'}</p>
      </ComparePanel>
    </div>
  )
}

export const radioGroupEntry: ShowcaseEntry = {
  id: 'radio-group',
  name: 'Radio Group',
  aliases: ['Radio button', 'Option button', '라디오 버튼'],
  description: '여러 선택지 가운데 하나만 고르는 동그란 단추 묶음.',
  category: 'input',
  Preview: RadioGroupPreview,
  anatomy: {
    Specimen: RadioGroupSpecimen,
    parts: [
      { slot: 'radio-group', name: 'RadioGroup', description: '하나만 고를 수 있게 묶는 선택지 전체' },
      { slot: 'radio-group-item', name: 'RadioGroupItem', description: '눌러서 고르는 동그란 단추' },
      { slot: 'radio-group-indicator', name: 'RadioGroupIndicator', description: '고른 단추 가운데에 생기는 점' },
      { slot: 'label', name: 'Label', description: '선택지 이름. 눌러도 그 단추가 골라짐' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '고름·안 고름과 포커스, 비활성, 오류를 나란히 놓았습니다. 이 디자인은 호버해도 단추 모양이 바뀌지 않는 대신, 단추 둘레의 보이지 않는 넓은 영역까지 눌립니다.',
      Demo: States,
    },
    {
      title: '배송 방법',
      description: '선택지마다 설명과 가격을 붙였습니다. 다른 방법을 고르면 아래 합계가 바로 바뀝니다.',
      Demo: ShippingOptions,
    },
    {
      title: '카드형 선택',
      description: '카드 전체가 하나의 라디오 단추처럼 눌리고, 고른 카드는 테두리가 진해집니다. 요금제 고르기에 흔히 씁니다.',
      Demo: PlanCards,
    },
    {
      title: '가로 배치',
      description: '선택지가 짧고 몇 개 안 될 때는 한 줄에 놓습니다. 방향키 ←→로도 옮겨 다닙니다.',
      Demo: Horizontal,
    },
    {
      title: '라디오, 체크박스, 토글 그룹 비교',
      description: '셋 다 무언가를 고르지만 고를 수 있는 개수와 결과가 반영되는 때가 다릅니다.',
      Demo: WhichControl,
    },
  ],
}
