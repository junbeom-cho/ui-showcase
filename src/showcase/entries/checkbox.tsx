import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ShowcaseEntry } from '../types'

function CheckboxPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-notify" defaultChecked />
        <Label htmlFor="checkbox-notify">알림 받기</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-marketing" />
        <Label htmlFor="checkbox-marketing">마케팅 수신</Label>
      </div>
    </div>
  )
}

function CheckboxSpecimen() {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id="checkbox-specimen" defaultChecked className="size-5" />
      <Label htmlFor="checkbox-specimen" className="text-base">이용약관에 동의합니다</Label>
    </div>
  )
}

function WithDescription() {
  return (
    <div className="flex max-w-72 items-start gap-3">
      <Checkbox id="checkbox-backup" defaultChecked className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor="checkbox-backup">매일 자동 백업</Label>
        <p className="text-sm text-muted-foreground">새벽 3시에 사진과 문서를 클라우드에 복사합니다.</p>
      </div>
    </div>
  )
}

const toppings = ['치즈', '올리브', '버섯', '할라피뇨']

function SelectAll() {
  const [picked, setPicked] = useState<string[]>(['치즈'])
  const all = picked.length === toppings.length
  const some = picked.length > 0 && !all

  return (
    <div className="flex w-full max-w-56 flex-col gap-3">
      <div className="flex items-center gap-2 border-b pb-3">
        <Checkbox
          id="toppings-all"
          checked={all ? true : some ? 'indeterminate' : false}
          onCheckedChange={() => setPicked(all ? [] : toppings)}
        />
        <Label htmlFor="toppings-all">토핑 전체 선택</Label>
        <span className="ml-auto text-xs text-muted-foreground">{picked.length}/4</span>
      </div>
      {toppings.map((topping) => (
        <div key={topping} className="flex items-center gap-2 pl-6">
          <Checkbox
            id={`topping-${topping}`}
            checked={picked.includes(topping)}
            onCheckedChange={(checked) =>
              setPicked((prev) => (checked ? [...prev, topping] : prev.filter((t) => t !== topping)))
            }
          />
          <Label htmlFor={`topping-${topping}`}>{topping}</Label>
        </div>
      ))}
    </div>
  )
}

const tasks = [
  { id: 'design', label: '시안 공유', done: true },
  { id: 'review', label: '코드 리뷰', done: false },
  { id: 'deploy', label: '배포 확인', done: false },
]

function TodoList() {
  const [done, setDone] = useState(() => new Set(tasks.filter((t) => t.done).map((t) => t.id)))
  return (
    <ul className="flex w-full max-w-56 flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2">
          <Checkbox
            id={`todo-${task.id}`}
            checked={done.has(task.id)}
            onCheckedChange={(checked) =>
              setDone((prev) => {
                const next = new Set(prev)
                if (checked) next.add(task.id)
                else next.delete(task.id)
                return next
              })
            }
          />
          <Label
            htmlFor={`todo-${task.id}`}
            className={done.has(task.id) ? 'text-muted-foreground line-through' : ''}
          >
            {task.label}
          </Label>
        </li>
      ))}
      <li className="pt-1 text-xs text-muted-foreground">
        {done.size === tasks.length ? '모두 끝났습니다.' : `남은 할 일 ${tasks.length - done.size}개`}
      </li>
    </ul>
  )
}

export const checkboxEntry: ShowcaseEntry = {
  id: 'checkbox',
  name: 'Checkbox',
  aliases: ['Check box', '체크박스'],
  description: '여러 항목 중 원하는 것을 각각 켜고 끄는 네모 선택 상자.',
  category: 'input',
  Preview: CheckboxPreview,
  anatomy: {
    Specimen: CheckboxSpecimen,
    parts: [
      { slot: 'checkbox', name: 'Checkbox', description: '눌러서 켜고 끄는 네모 상자' },
      { slot: 'checkbox-indicator', name: 'CheckboxIndicator', description: '켜졌을 때 나타나는 체크 표시' },
      { slot: 'label', name: 'Label', description: '무엇을 고르는지 알려주는 글. 눌러도 상자가 바뀜' },
    ],
  },
  examples: [
    {
      title: '설명이 붙은 체크박스',
      description: '선택의 결과를 한 줄 더 설명해야 할 때 라벨 아래에 흐린 글을 둡니다.',
      Demo: WithDescription,
    },
    {
      title: '전체 선택',
      description: '일부만 골랐을 때 위쪽 상자는 가로줄(indeterminate) 상태가 됩니다. 눌러 보세요.',
      Demo: SelectAll,
    },
    {
      title: '할 일 목록',
      description: '체크하면 글에 줄이 그어지고 남은 개수가 줄어듭니다.',
      Demo: TodoList,
    },
  ],
}
