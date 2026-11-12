import { Fragment, useId, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const fruits = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'grape', label: '포도' },
  { value: 'peach', label: '복숭아' },
]

function FruitItems() {
  return (
    <>
      {fruits.map((fruit) => (
        <SelectItem key={fruit.value} value={fruit.value}>
          {fruit.label}
        </SelectItem>
      ))}
    </>
  )
}

/*
 * Drawings of an open select copy the look of the shadcn parts. A live list
 * would portal to <body>, where the gallery and the anatomy could not show it.
 */
const drawnTrigger =
  'flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap'
const drawnContent =
  'flex w-full flex-col rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'
const drawnLabel = 'px-1.5 py-1 text-xs text-muted-foreground'

function DrawnItem({
  chosen = false,
  highlighted = false,
  className,
  children,
  ...props
}: { chosen?: boolean; highlighted?: boolean } & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex w-full items-center rounded-md py-1 pr-8 pl-1.5 text-sm',
        highlighted && 'bg-accent text-accent-foreground',
        className,
      )}
      {...props}
    >
      {children}
      {chosen && <CheckIcon className="absolute right-2 size-4" />}
    </div>
  )
}

/** One closed select per cell; trigger props (pinned state, aria-invalid) go to the trigger. */
function OneSelect({
  label,
  defaultValue,
  disabled,
  ...trigger
}: { label: string; defaultValue?: string; disabled?: boolean } & ComponentProps<typeof SelectTrigger>) {
  return (
    <Select defaultValue={defaultValue} disabled={disabled}>
      <SelectTrigger aria-label={label} className="w-32" {...trigger}>
        <SelectValue placeholder="과일 선택" />
      </SelectTrigger>
      <SelectContent>
        <FruitItems />
      </SelectContent>
    </Select>
  )
}

/** Static drawing of an open select: the chosen item is checked, the one under the pointer is highlighted. */
function DrawnOpenSelect() {
  return (
    <div role="img" aria-label="열린 목록: 사과가 골라져 있고 바나나가 강조됨" className="flex w-36 flex-col gap-1">
      <div className={drawnTrigger}>
        사과
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </div>
      <div className={drawnContent}>
        <DrawnItem chosen>사과</DrawnItem>
        <DrawnItem highlighted>바나나</DrawnItem>
        <DrawnItem>포도</DrawnItem>
        <DrawnItem>복숭아</DrawnItem>
      </div>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '닫힘', node: <OneSelect label="닫힘" /> },
        { label: '값 있음', node: <OneSelect label="값 있음" defaultValue="apple" /> },
        { label: '포커스', node: <OneSelect label="포커스" defaultValue="apple" data-demo-state="focus" /> },
        { label: '열림', node: <DrawnOpenSelect /> },
        { label: '비활성', node: <OneSelect label="비활성" defaultValue="apple" disabled /> },
        { label: '오류', node: <OneSelect label="오류" aria-invalid /> },
      ]}
    />
  )
}

function SelectPreview() {
  const id = useId()
  return (
    <div className="flex w-full max-w-44 flex-col gap-2">
      <Label htmlFor={id}>과일</Label>
      <Select defaultValue="apple">
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <FruitItems />
        </SelectContent>
      </Select>
    </div>
  )
}

/** Static drawing of an open select; a live one would portal to <body>. */
function SelectSpecimen() {
  return (
    <div className="flex w-52 flex-col gap-1.5">
      <div data-slot="select-trigger" className={drawnTrigger}>
        <span data-slot="select-value">사과</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </div>
      <div data-slot="select-content" className={drawnContent}>
        <p data-slot="select-label" className={drawnLabel}>
          과일
        </p>
        <DrawnItem data-slot="select-item" chosen>
          사과
        </DrawnItem>
        <DrawnItem highlighted>바나나</DrawnItem>
        <DrawnItem>포도</DrawnItem>
        <div data-slot="select-separator" className="-mx-1 my-1 h-px bg-border" />
        <p className={drawnLabel}>채소</p>
        <DrawnItem>당근</DrawnItem>
      </div>
    </div>
  )
}

const produce = [
  {
    group: '과일',
    items: [
      { value: 'apple', label: '사과' },
      { value: 'banana', label: '바나나' },
      { value: 'grape', label: '포도' },
    ],
  },
  {
    group: '채소',
    items: [
      { value: 'carrot', label: '당근' },
      { value: 'broccoli', label: '브로콜리' },
      { value: 'spinach', label: '시금치', soldOut: true },
    ],
  },
]

function GroupedList() {
  const id = useId()
  const [value, setValue] = useState('')
  const group = produce.find((g) => g.items.some((item) => item.value === value))
  const item = group?.items.find((i) => i.value === value)

  return (
    <div className="flex w-full max-w-56 flex-col gap-2">
      <Label htmlFor={id}>재료</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="재료 선택" />
        </SelectTrigger>
        <SelectContent>
          {produce.map((g, index) => (
            <Fragment key={g.group}>
              {index > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{g.group}</SelectLabel>
                {g.items.map((i) => (
                  <SelectItem key={i.value} value={i.value} disabled={i.soldOut}>
                    {i.soldOut ? `${i.label} (품절)` : i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
        </SelectContent>
      </Select>
      <p role="status" className="text-xs text-muted-foreground">
        {group && item ? `${group.group} 중 ${item.label}을(를) 골랐습니다.` : '목록을 열어 묶음 이름과 구분선을 확인해 보세요.'}
      </p>
    </div>
  )
}

const regions = [
  { name: '서울특별시', districts: ['강남구', '마포구', '송파구', '종로구'] },
  { name: '부산광역시', districts: ['해운대구', '수영구', '부산진구'] },
  { name: '경기도', districts: ['수원시', '성남시', '고양시', '가평군'] },
  { name: '제주특별자치도', districts: ['제주시', '서귀포시'] },
]

function LinkedSelects() {
  const id = useId()
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const districts = regions.find((r) => r.name === region)?.districts ?? []

  const changeRegion = (next: string) => {
    setRegion(next)
    setDistrict('') // the old district belongs to another region
  }

  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-2">
        <Label htmlFor={`${id}-region`}>시·도</Label>
        <Select value={region} onValueChange={changeRegion}>
          <SelectTrigger id={`${id}-region`} className="w-full">
            <SelectValue placeholder="시·도 선택" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.name} value={r.name}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label htmlFor={`${id}-district`}>시·군·구</Label>
        <Select value={district} onValueChange={setDistrict} disabled={!region}>
          <SelectTrigger id={`${id}-district`} className="w-full">
            <SelectValue placeholder={region ? '시·군·구 선택' : '시·도를 먼저'} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {region && district
          ? `주소: ${region} ${district}`
          : region
            ? `${region}의 시·군·구를 고르세요.`
            : '시·도를 고르면 두 번째 목록이 열립니다.'}
      </p>
    </div>
  )
}

const topics = [
  { value: 'delivery', label: '배송' },
  { value: 'refund', label: '환불' },
  { value: 'account', label: '계정' },
  { value: 'other', label: '기타' },
]

function FormSelect() {
  const id = useId()
  const [topic, setTopic] = useState('')
  const [tried, setTried] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const invalid = tried && !topic

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTried(true)
    setSent(topic ? topics.find((t) => t.value === topic)!.label : null)
  }

  return (
    // noValidate: the message below replaces the browser's own bubble
    <form noValidate onSubmit={submit} className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-topic`}>
          문의 유형 <span className="text-destructive">*</span>
        </Label>
        <Select
          name="topic"
          required
          value={topic}
          onValueChange={(next) => {
            setTopic(next)
            setSent(null)
          }}
        >
          <SelectTrigger
            id={`${id}-topic`}
            className="w-full"
            aria-invalid={invalid || undefined}
            aria-describedby={`${id}-${invalid ? 'error' : 'hint'}`}
          >
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {invalid ? (
          <p id={`${id}-error`} className="text-xs text-destructive">
            문의 유형을 골라 주세요.
          </p>
        ) : (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            꼭 골라야 하는 항목입니다.
          </p>
        )}
      </div>
      <Button type="submit" className="self-start">
        접수하기
      </Button>
      <p role="status" className="text-xs text-muted-foreground">
        {sent ? `"${sent}" 문의를 접수했습니다.` : ''}
      </p>
    </form>
  )
}

const requests = ['문 앞', '경비실', '택배함', '직접 받기']

function ComparePanel({ notes, children }: { notes: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      {children}
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function NativeComparison() {
  const id = useId()
  const [custom, setCustom] = useState('문 앞')
  const [native, setNative] = useState('문 앞')

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm">같은 배송 요청 목록을 두 방식으로 만들었습니다.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ComparePanel
          notes={[
            '목록의 모양·아이콘·묶음을 마음대로 꾸밀 수 있습니다.',
            '휴대폰에서도 화면 위에 같은 팝업 목록이 뜹니다.',
          ]}
        >
          <Label htmlFor={`${id}-custom`}>Select 컴포넌트</Label>
          <Select value={custom} onValueChange={setCustom}>
            <SelectTrigger id={`${id}-custom`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {requests.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs">고른 값: {custom}</p>
        </ComparePanel>
        <ComparePanel
          notes={[
            '휴대폰에서는 운영체제의 선택 화면(아래에서 올라오는 휠이나 목록)이 열립니다.',
            '열린 목록은 꾸미기 어렵지만, 터치와 화면 읽기 프로그램 지원이 기본으로 들어 있습니다.',
          ]}
        >
          <Label htmlFor={`${id}-native`}>기본 &lt;select&gt;</Label>
          <select
            id={`${id}-native`}
            value={native}
            onChange={(event) => setNative(event.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {requests.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="text-xs">고른 값: {native}</p>
        </ComparePanel>
      </div>
    </div>
  )
}

export const selectEntry: ShowcaseEntry = {
  id: 'select',
  name: 'Select',
  aliases: ['Dropdown', 'Picker', '선택 상자', '드롭다운'],
  description: '눌러서 펼친 목록에서 값 하나를 고르는 입력 상자.',
  category: 'input',
  Preview: SelectPreview,
  anatomy: {
    Specimen: SelectSpecimen,
    parts: [
      { slot: 'select-trigger', name: 'SelectTrigger', description: '눌러서 목록을 여는 상자. 오른쪽 화살표가 열린다는 표시' },
      { slot: 'select-value', name: 'SelectValue', description: '지금 고른 값. 아직 없으면 흐린 안내 글(placeholder)' },
      { slot: 'select-content', name: 'SelectContent', description: '열렸을 때 떠오르는 선택지 목록' },
      { slot: 'select-label', name: 'SelectLabel', description: '선택지 묶음의 이름. 고를 수 없는 제목 글' },
      { slot: 'select-item', name: 'SelectItem', description: '고를 수 있는 선택지 한 줄. 고른 항목엔 체크 표시' },
      { slot: 'select-separator', name: 'SelectSeparator', description: '묶음 사이를 나누는 선' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '닫힌 상자의 상태와 열린 목록을 나란히 놓았습니다. 열림은 그림이며, 고른 항목에는 체크가, 마우스가 올라간 항목에는 배경이 깔립니다. 이 디자인은 밝은 화면에서 호버해도 상자 모양이 바뀌지 않습니다.',
      Demo: States,
    },
    {
      title: '묶음과 구분선',
      description: '선택지가 많으면 이름 붙은 묶음(SelectGroup·SelectLabel)으로 나누고 사이에 선을 긋습니다. 품절처럼 고를 수 없는 항목은 흐리게 둡니다.',
      Demo: GroupedList,
    },
    {
      title: '연결된 선택',
      description: '두 번째 목록이 첫 번째 값에 따라 바뀝니다. 시·도를 바꾸면 이미 고른 시·군·구는 비워집니다.',
      Demo: LinkedSelects,
    },
    {
      title: '폼 안의 선택',
      description: '꼭 골라야 하는 항목입니다. 고르지 않고 접수하기를 누르면 상자가 빨개지고 이유가 아래에 나타납니다.',
      Demo: FormSelect,
    },
    {
      title: '기본 select와 비교',
      description: 'HTML의 기본 <select>도 같은 일을 합니다. 둘의 차이는 특히 휴대폰에서 열 때 드러납니다.',
      Demo: NativeComparison,
    },
  ],
}
