import { useRef } from 'react'
import { RotateCcwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const CITIES = [
  { name: '오사카', note: '2박 3일 · 312,000원', hue: 12 },
  { name: '후쿠오카', note: '1박 2일 · 189,000원', hue: 200 },
  { name: '삿포로', note: '3박 4일 · 458,000원', hue: 225 },
  { name: '타이베이', note: '2박 3일 · 276,000원', hue: 150 },
  { name: '다낭', note: '3박 5일 · 399,000원', hue: 175 },
  { name: '방콕', note: '3박 5일 · 421,000원', hue: 40 },
  { name: '하노이', note: '2박 4일 · 335,000원', hue: 95 },
  { name: '세부', note: '3박 5일 · 389,000원', hue: 265 },
]

const SIDES = [
  { id: 'stagger', label: '순차 등장' },
  { id: 'together', label: '동시에' },
] as const

const GRID_COLS = 4
const ENTER = 0.45 // seconds one item takes to arrive
const HOLD = 1.4 // seconds everything rests before leaving
const LEAVE = 0.3 // everything leaves together, quickly

const easeOut = (p: number) => 1 - (1 - p) ** 3
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const gradient = (hue: number) => `linear-gradient(135deg, hsl(${hue} 75% 66%), hsl(${hue + 30} 60% 45%))`

/**
 * The same cards twice: on the left each one waits `gap` seconds longer than the one
 * before, on the right all start at once. Styles are set from scene time every frame,
 * so pausing freezes the cascade mid-way.
 */
function StaggerScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const el = useRef<Record<string, HTMLElement | null>>({})
  const now = useRef(0)
  const startedAt = useRef(0)
  const count = thumb ? 4 : Math.round(params.count)
  const items = CITIES.slice(0, count)

  const ref = (key: string) => (node: HTMLElement | null) => {
    el.current[key] = node
  }

  useLoop(
    box,
    ({ time }) => {
      now.current = time
      const gap = params.gap
      const enter = (count - 1) * gap + ENTER
      const cycle = enter + HOLD + LEAVE
      // a scene that never played (paused from the start) shows the finished picture
      const t = paused && time === 0 ? enter : (time - startedAt.current) % cycle
      const leave = clamp01((t - enter - HOLD) / LEAVE)

      for (const side of SIDES) {
        for (let i = 0; i < count; i++) {
          // the grid cascades diagonally: a tile waits for its row and its column
          const order = { list: i, grid: Math.floor(i / GRID_COLS) + (i % GRID_COLS) }
          for (const kind of ['list', 'grid'] as const) {
            const node = el.current[`${side.id}-${kind}-${i}`]
            if (!node) continue
            const delay = side.id === 'stagger' ? order[kind] * gap : 0
            const p = easeOut(clamp01((t - delay) / ENTER))
            const shift = (1 - p) * params.distance
            node.style.opacity = String(p * (1 - leave))
            node.style.transform =
              kind === 'list' ? `translateY(${shift}px)` : `translateY(${shift}px) scale(${0.9 + 0.1 * p})`
          }
        }
      }
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  return (
    <div
      ref={box}
      className={cn('@container relative grid size-full grid-cols-2 gap-3 bg-[#eef1f6] p-4 pb-11 text-neutral-900', thumb && 'gap-2 p-2')}
      style={{ containerType: 'size' }}
    >
      {SIDES.map((side) => (
        <div key={side.id} className="flex min-h-0 flex-col gap-2 rounded-2xl bg-white/60 p-[3cqh] ring-1 ring-black/5">
          {!thumb && (
            <p className="flex items-baseline justify-between text-[clamp(10px,2.6cqh,14px)] font-semibold">
              {side.label}
              <span className="font-mono text-[0.8em] font-normal text-neutral-500">
                {side.id === 'stagger' ? `+${params.gap.toFixed(2)}s씩` : '0s'}
              </span>
            </p>
          )}
          <ul className="flex min-h-0 flex-[3] flex-col gap-[1.2cqh]">
            {items.map((c, i) => (
              <li
                key={c.name}
                ref={ref(`${side.id}-list-${i}`)}
                className="flex min-h-0 flex-1 items-center gap-[4%] rounded-xl bg-white px-[4%] shadow-sm ring-1 ring-black/5"
              >
                <span className="aspect-square h-[70%] max-h-10 shrink-0 rounded-lg" style={{ background: gradient(c.hue) }} />
                {!thumb && (
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[clamp(9px,2.2cqh,14px)] font-semibold">{c.name}</span>
                    <span className="truncate text-[clamp(8px,1.7cqh,12px)] text-neutral-500">{c.note}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {!thumb && (
            <div className="grid min-h-0 flex-[2] grid-cols-4 gap-[1.2cqh]">
              {items.map((c, i) => (
                <span key={c.name} ref={ref(`${side.id}-grid-${i}`)} className="min-h-0 rounded-lg" style={{ background: gradient(c.hue) }} />
              ))}
            </div>
          )}
        </div>
      ))}
      {!thumb && (
        <button
          type="button"
          onClick={() => {
            startedAt.current = now.current
          }}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white shadow outline-none focus-visible:ring-3 focus-visible:ring-indigo-300"
        >
          <RotateCcwIcon className="size-3.5" />
          다시 등장
        </button>
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'stagger',
  group: 'motion',
  name: '순차 등장',
  englishName: 'Stagger',
  aliases: ['Staggered animation', 'Cascade', '시차 등장'],
  description: '목록이나 격자의 항목이 한꺼번에 나타나지 않고 조금씩 시차를 두고 차례로 들어오는 애니메이션',
  context: '검색 결과·피드·카드 목록이 처음 뜰 때, 메뉴가 펼쳐질 때, 대시보드 타일이 채워질 때 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '다시 등장을 누르면 처음부터 다시 들어옵니다. 가만히 두면 저절로 되풀이됩니다.',
  traits: [
    {
      title: '눈이 위에서 아래로 따라감',
      description: '왼쪽은 항목마다 조금씩 늦게 출발해 시선이 첫 카드부터 차례로 내려갑니다. 오른쪽처럼 한꺼번에 뜨면 덩어리 하나가 툭 나타난 느낌입니다.',
    },
    {
      title: '시차는 짧게, 전체도 짧게',
      description: '보통 항목 사이 0.03~0.1초입니다. 항목 수 × 시차만큼 마지막 카드가 늦어지므로, 항목이 많으면 시차를 줄이거나 화면에 보이는 것만 순서를 줍니다.',
    },
    {
      title: '격자는 대각선으로',
      description: '격자 타일은 행과 열을 더한 순서로 늦춰 왼쪽 위에서 오른쪽 아래로 물결처럼 퍼집니다. 나갈 때는 모두 함께 빠르게 사라져 기다리게 하지 않습니다.',
    },
  ],
  params: [
    { key: 'gap', label: '항목 사이 시차', min: 0, max: 0.3, step: 0.01, default: 0.08, unit: '초' },
    { key: 'count', label: '항목 수', min: 3, max: 8, step: 1, default: 6, unit: '개' },
    { key: 'distance', label: '등장 거리', min: 0, max: 60, step: 2, default: 24, unit: 'px' },
  ],
  Scene: StaggerScene,
}
