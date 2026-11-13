import { useId, useState, type ReactNode } from 'react'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  LayoutGridIcon,
  ListIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

// Items sit on graph paper, so give them a solid surface. "On" keeps shadcn's grey fill.
const item = 'bg-background'

const aligns = [
  { value: 'left', label: '왼쪽', Icon: AlignLeftIcon, className: 'text-left' },
  { value: 'center', label: '가운데', Icon: AlignCenterIcon, className: 'text-center' },
  { value: 'right', label: '오른쪽', Icon: AlignRightIcon, className: 'text-right' },
]

const marks = [
  { value: 'bold', label: '굵게', Icon: BoldIcon },
  { value: 'italic', label: '기울임', Icon: ItalicIcon },
  { value: 'underline', label: '밑줄', Icon: UnderlineIcon },
  { value: 'strike', label: '취소선', Icon: StrikethroughIcon },
]

const periods = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '월' },
]

/** The same three-item group in most cells, so only the state differs. */
function Periods({
  label,
  value,
  focus,
  disabled = false,
  joined = false,
}: {
  label: string
  value?: string
  focus?: string
  disabled?: boolean
  joined?: boolean
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={joined ? 0 : 2}
      aria-label={label}
      defaultValue={value}
      disabled={disabled}
    >
      {periods.map((p) => (
        <ToggleGroupItem
          key={p.value}
          value={p.value}
          data-demo-state={p.value === focus ? 'focus' : undefined}
          className={cn(item, 'px-3')}
        >
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '꺼짐', node: <Periods label="꺼짐" /> },
        { label: '켜짐', node: <Periods label="켜짐" value="week" /> },
        {
          label: '여러 개 켜짐',
          node: (
            <ToggleGroup type="multiple" variant="outline" size="sm" aria-label="여러 개 켜짐" defaultValue={['bold', 'underline']}>
              {marks.slice(0, 3).map((m) => (
                <ToggleGroupItem key={m.value} value={m.value} className={item}>
                  {m.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ),
        },
        { label: '포커스', node: <Periods label="포커스" value="week" focus="month" /> },
        { label: '비활성', node: <Periods label="비활성" value="week" disabled /> },
        {
          label: '아이콘만',
          node: (
            <ToggleGroup type="single" variant="outline" size="sm" aria-label="아이콘만" defaultValue="center">
              {aligns.map(({ value, label, Icon }) => (
                <ToggleGroupItem key={value} value={value} aria-label={`${label} 정렬`} className={item}>
                  <Icon />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ),
        },
        { label: '붙인 모양', node: <Periods label="붙인 모양" value="week" joined /> },
      ]}
    />
  )
}

function ToggleGroupPreview() {
  const [view, setView] = useState('list')
  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleGroup type="multiple" variant="outline" aria-label="글자 꾸미기" defaultValue={['bold']}>
        {marks.slice(0, 3).map(({ value, label, Icon }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label} className={item}>
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        aria-label="보기 방식"
        value={view}
        onValueChange={(next) => next && setView(next)}
      >
        <ToggleGroupItem value="list" className={item}>
          <ListIcon />
          목록
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" className={item}>
          <LayoutGridIcon />
          격자
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

function ToggleGroupSpecimen() {
  const [align, setAlign] = useState('left')
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="lg"
      aria-label="문단 정렬"
      value={align}
      // a single group lets the pressed item be pressed off; keep one chosen
      onValueChange={(next) => next && setAlign(next)}
    >
      {aligns.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} className={cn(item, 'px-3')}>
          <Icon data-slot="toggle-group-icon" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function Alignment() {
  const [align, setAlign] = useState('left')
  const current = aligns.find((a) => a.value === align)!

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="문단 정렬"
        value={align}
        onValueChange={(next) => next && setAlign(next)}
      >
        {aligns.map(({ value, label, Icon }) => (
          <ToggleGroupItem key={value} value={value} aria-label={`${label} 정렬`} className={item}>
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p data-align={align} className={cn('rounded-lg border bg-background p-3 text-sm leading-relaxed', current.className)}>
        비가 그치고 하늘이 맑아졌습니다.
        <br />
        오후에는 바람이 조금 붑니다.
        <br />
        우산은 두고 나가도 됩니다.
      </p>
      <p role="status" className="text-xs text-muted-foreground">
        정렬: {current.label} (셋 중 하나만 켜짐)
      </p>
    </div>
  )
}

function TextMarks() {
  const [on, setOn] = useState<string[]>(['bold'])
  const has = (value: string) => on.includes(value)
  const names = marks.filter((m) => has(m.value)).map((m) => m.label)
  // underline and strike-through share one CSS property, so build it from both
  const lines = [has('underline') && 'underline', has('strike') && 'line-through'].filter(Boolean).join(' ')

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <ToggleGroup type="multiple" variant="outline" aria-label="글자 꾸미기" value={on} onValueChange={setOn}>
        {marks.map(({ value, label, Icon }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label} className={item}>
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p
        style={{ textDecorationLine: lines || 'none' }}
        className={cn('rounded-lg border bg-background p-3 text-lg', has('bold') && 'font-bold', has('italic') && 'italic')}
      >
        오늘의 할 일
      </p>
      <p role="status" className="text-xs text-muted-foreground">
        {names.length > 0 ? `켜진 꾸밈: ${names.join(', ')}` : '켜진 꾸밈 없음'}
      </p>
    </div>
  )
}

const places = [
  { name: '남산 타워', area: '서울 용산구' },
  { name: '해운대', area: '부산 해운대구' },
  { name: '성산 일출봉', area: '제주 서귀포시' },
  { name: '경복궁', area: '서울 종로구' },
]

function ViewSwitch() {
  const [view, setView] = useState('list')
  const grid = view === 'grid'

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        aria-label="보기 방식"
        value={view}
        onValueChange={(next) => next && setView(next)}
        className="self-end"
      >
        <ToggleGroupItem value="list" className={item}>
          <ListIcon />
          목록
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" className={item}>
          <LayoutGridIcon />
          격자
        </ToggleGroupItem>
      </ToggleGroup>
      <ul
        aria-label="장소"
        data-view={view}
        className={grid ? 'grid grid-cols-2 gap-2' : 'flex flex-col divide-y rounded-lg border bg-background'}
      >
        {places.map((place) => (
          <li
            key={place.name}
            className={cn('flex gap-3', grid ? 'flex-col rounded-lg border bg-background p-2' : 'items-center px-3 py-2')}
          >
            <span
              aria-hidden
              className={cn(
                'grid shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold text-muted-foreground',
                grid ? 'aspect-[4/3] w-full' : 'size-9',
              )}
            >
              {place.name[0]}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{place.name}</span>
              <span className="truncate text-xs text-muted-foreground">{place.area}</span>
            </span>
          </li>
        ))}
      </ul>
      <p role="status" className="text-xs text-muted-foreground">
        {grid ? '격자' : '목록'}로 보는 중 · 장소 {places.length}곳
      </p>
    </div>
  )
}

function ComparePanel({ title, rule, children }: { title: string; rule: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      {children}
      <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{rule}</p>
    </div>
  )
}

const requests = [
  { value: 'door', label: '문 앞에 두기' },
  { value: 'guard', label: '경비실에 맡기기' },
]
const requestLabel = (value: string) => requests.find((r) => r.value === value)!.label

function WhichControl() {
  const id = useId()
  const [unit, setUnit] = useState('c')
  const [tab, setTab] = useState('about')
  const [request, setRequest] = useState('door')
  const [saved, setSaved] = useState('door')

  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      <ComparePanel title="토글 그룹" rule="같은 내용을 다른 방식으로 보여 줍니다. 누르는 즉시 바뀝니다.">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="온도 단위"
          value={unit}
          onValueChange={(next) => next && setUnit(next)}
        >
          <ToggleGroupItem value="c">°C</ToggleGroupItem>
          <ToggleGroupItem value="f">°F</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-2xl font-semibold tabular-nums">{unit === 'c' ? '23°C' : '73°F'}</p>
        <p className="text-xs">단위: {unit === 'c' ? '섭씨' : '화씨'}</p>
      </ComparePanel>

      <ComparePanel title="탭" rule="서로 다른 내용 묶음 사이를 오갑니다. 탭마다 보여 줄 패널이 따로 있습니다.">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList aria-label="상품 정보">
            <TabsTrigger value="about">설명</TabsTrigger>
            <TabsTrigger value="reviews">리뷰</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="text-xs">
            가볍고 따뜻한 겨울 장갑입니다.
          </TabsContent>
          <TabsContent value="reviews" className="text-xs">
            평점 4.6 · 리뷰 52개
          </TabsContent>
        </Tabs>
        <p className="text-xs">열린 탭: {tab === 'about' ? '설명' : '리뷰'}</p>
      </ComparePanel>

      <ComparePanel title="라디오" rule="양식 안에서 값 하나를 고르고, 저장할 때 반영됩니다.">
        <RadioGroup value={request} onValueChange={setRequest} aria-label="배송 요청" className="w-auto">
          {requests.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <RadioGroupItem id={`${id}-${r.value}`} value={r.value} />
              <Label htmlFor={`${id}-${r.value}`}>{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button variant="outline" size="sm" onClick={() => setSaved(request)}>
          저장
        </Button>
        <p className="text-xs">저장된 요청: {requestLabel(saved)}</p>
      </ComparePanel>
    </div>
  )
}

export const toggleGroupEntry: ShowcaseEntry = {
  id: 'toggle-group',
  name: 'Toggle Group',
  aliases: ['Segmented control', 'Button group', 'Toggle button group', '토글 그룹', '세그먼트 컨트롤', '버튼 그룹'],
  description: '버튼 여러 개를 한 줄로 묶어 하나 또는 여러 개를 눌러 켜 두는 선택 막대.',
  category: 'input',
  Preview: ToggleGroupPreview,
  anatomy: {
    Specimen: ToggleGroupSpecimen,
    parts: [
      {
        slot: 'toggle-group',
        name: 'ToggleGroup',
        description: '버튼을 한 줄로 묶은 전체. 하나만 켜질지(single) 여러 개가 켜질지(multiple) 정함',
      },
      { slot: 'toggle-group-item', name: 'ToggleGroupItem', description: '눌러서 켜고 끄는 버튼 하나. 켜지면 회색 바탕이 깔림' },
      {
        slot: 'toggle-group-icon',
        name: 'icon',
        description: '버튼의 뜻을 보여주는 아이콘. 아이콘만 둘 때는 aria-label로 이름을 붙여야 함',
      },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '켜짐·꺼짐과 포커스, 비활성, 아이콘만 둔 모양, 버튼을 붙인 모양을 나란히 놓았습니다. 마우스를 올리면 켜짐보다 옅은 회색이 깔리고, 켜진 버튼은 한 단계 진한 회색으로 남습니다.',
      Demo: States,
    },
    {
      title: '정렬 고르기',
      description:
        '셋 중 하나만 켜지는 single 묶음입니다. 정렬처럼 늘 하나가 골라져 있어야 할 때 쓰고, 켜진 버튼을 다시 눌러도 꺼지지 않게 막아 두었습니다. 눌러서 아래 문단이 움직이는지 보세요.',
      Demo: Alignment,
    },
    {
      title: '글자 꾸미기',
      description:
        '여러 개를 함께 켤 수 있는 multiple 묶음입니다. 굵게·기울임·밑줄처럼 서로 겹쳐 쓸 수 있는 설정에 씁니다. 몇 개를 켜고 끄면서 글자가 어떻게 바뀌는지 보세요.',
      Demo: TextMarks,
    },
    {
      title: '보기 바꾸기',
      description:
        '버튼을 틈 없이 붙이면 휴대폰 앱에서 흔한 Segmented control 모양이 됩니다. 같은 목록을 다르게 보여 줄 때 쓰고, 고르는 즉시 화면이 바뀌어야 합니다. 목록과 격자를 오가 보세요.',
      Demo: ViewSwitch,
    },
    {
      title: '토글 그룹, 탭, 라디오 비교',
      description:
        '셋 다 하나를 고르지만 고른 뒤에 일어나는 일이 다릅니다. 토글 그룹은 같은 내용의 모습을, 탭은 보여 줄 내용 자체를 바꾸고, 라디오는 저장할 때 값이 반영됩니다.',
      Demo: WhichControl,
    },
  ],
}
