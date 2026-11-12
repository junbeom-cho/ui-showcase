import { useRef, useState } from 'react'
import { ChevronLeftIcon, MapPinIcon, StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const KINDS = [
  { id: 'fade', label: '페이드' },
  { id: 'push', label: '밀어내기' },
  { id: 'zoom', label: '확대' },
  { id: 'shared', label: '공유 요소' },
] as const
type Kind = (typeof KINDS)[number]['id']

const ROWS = [
  { name: '모래시계 커피', area: '성수', hue: 28 },
  { name: '책방 오후', area: '연남', hue: 200 },
  { name: '물빛 정원', area: '마포', hue: 160 },
  { name: '빛과 그림자展', area: '종로', hue: 265 },
  { name: '아침 빵집 카페', area: '을지로', hue: 40 },
]

// layout of the phone screen in percent, shared by the rows and the shared-element card
const HEADER = 14 // list header height
const ROW_H = 15
const HERO_H = 40 // detail picture height

const gradient = (hue: number) => `linear-gradient(135deg, hsl(${hue} 70% 64%), hsl(${hue + 35} 60% 42%))`
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

const AUTO_AFTER = 5 // seconds without a click before the demo runs by itself
const AUTO_EVERY = 2.2

/**
 * A phone with a list and a detail screen. Both screens are always there; the
 * transition is only opacity and transform driven from scene time, so the same
 * picture can be paused mid-way and every kind of transition is easy to compare.
 */
function ScreenTransitionsScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const detail = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const detailBody = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const now = useRef(0)
  const changedAt = useRef(-10)
  const lastTouch = useRef(-AUTO_AFTER)
  const lastAuto = useRef(-1)
  const [open, setOpen] = useState(false)
  const [row, setRow] = useState(1)
  const [kind, setKind] = useState<Kind>('shared')

  const go = (nextOpen: boolean, byUser: boolean, nextRow = row) => {
    changedAt.current = now.current
    if (byUser) lastTouch.current = now.current
    setRow(nextRow)
    setOpen(nextOpen)
  }

  useLoop(
    box,
    ({ time }) => {
      now.current = time

      if (thumb || time - lastTouch.current > AUTO_AFTER) {
        const slot = Math.floor(time / AUTO_EVERY)
        if (slot !== lastAuto.current) {
          lastAuto.current = slot
          // open, close, open, close… and try the next kind every full round
          go(slot % 2 === 0, false, 1 + (Math.floor(slot / 2) % 3))
          if (slot % 2 === 0 && (thumb || time - lastTouch.current > AUTO_AFTER * 2)) {
            setKind(KINDS[Math.floor(slot / 2) % KINDS.length].id)
          }
        }
      }

      const p = easeInOut(Math.min(1, Math.max(0, (time - changedAt.current) / params.duration)))
      const x = open ? p : 1 - p // 0 = list, 1 = detail
      const L = list.current?.style
      const D = detail.current?.style
      const H = hero.current?.style
      const B = detailBody.current?.style
      const C = card.current?.style
      if (!L || !D || !H || !B || !C) return
      L.transform = D.transform = ''
      L.opacity = D.opacity = H.opacity = B.opacity = '1'
      L.filter = ''
      B.transform = ''
      C.display = 'none'

      if (kind === 'fade') {
        L.opacity = String(1 - x)
        D.opacity = String(x)
      } else if (kind === 'push') {
        // the new screen slides over; the old one drifts left and dims a little
        L.transform = `translateX(${-30 * x}%)`
        L.filter = `brightness(${1 - 0.25 * x})`
        D.transform = `translateX(${100 * (1 - x)}%)`
      } else if (kind === 'zoom') {
        L.transform = `scale(${1 + 0.06 * x})`
        L.opacity = String(1 - x)
        D.transform = `scale(${0.88 + 0.12 * x})`
        D.opacity = String(x)
      } else {
        // shared element: the tapped row's picture grows into the detail picture
        const top = mix(HEADER + row * ROW_H + 2, 0, x)
        const left = mix(5, 0, x)
        const width = mix(19, 100, x)
        const height = mix(ROW_H - 4, HERO_H, x)
        const moving = x > 0.001 && x < 0.999
        C.display = moving ? 'block' : 'none'
        C.top = `${top}%`
        C.left = `${left}%`
        C.width = `${width}%`
        C.height = `${height}%`
        C.borderRadius = `${mix(10, 0, x)}px`
        C.background = gradient(ROWS[row].hue)
        // the screens cross-fade underneath while the picture travels on top;
        // the detail's own picture only appears once the travelling one has landed
        L.opacity = String(1 - x)
        D.opacity = String(x)
        H.opacity = moving ? '0' : '1'
        // the text waits for the picture, then rises in
        const text = Math.max(0, (x - 0.55) / 0.45)
        B.opacity = String(text)
        B.transform = `translateY(${(1 - text) * 12}px)`
      }
    },
    { paused, speed: params.speed ?? 1, redrawKey: `${JSON.stringify(params)}|${kind}|${open}|${row}` },
  )

  const current = ROWS[row]

  return (
    <div
      ref={box}
      className="@container relative flex size-full flex-col items-center justify-center gap-3 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#e9e6ff,#d9dbe6)] p-3"
      style={{ containerType: 'size' }}
    >
      {/* the phone */}
      <div
        className="relative overflow-hidden rounded-[22px] border-[6px] border-neutral-900 bg-white shadow-2xl"
        style={{ height: thumb ? '92cqh' : 'min(80cqh, 150cqw)', aspectRatio: '9 / 17' }}
      >
        <div ref={list} className="absolute inset-0 origin-center bg-white">
          <div className="flex items-end px-[6%] pb-[3%] text-neutral-900" style={{ height: `${HEADER}%` }}>
            <p className="text-[clamp(10px,3cqh,18px)] font-bold">가 볼 곳</p>
          </div>
          {ROWS.map((r, i) => (
            <button
              key={r.name}
              type="button"
              tabIndex={thumb ? -1 : 0}
              onClick={() => go(true, true, i)}
              className="absolute inset-x-0 flex items-center gap-[4%] px-[5%] text-left outline-none focus-visible:bg-neutral-100"
              style={{ top: `${HEADER + i * ROW_H}%`, height: `${ROW_H}%` }}
            >
              <span className="h-[73%] w-[19%] shrink-0 rounded-[10px]" style={{ background: gradient(r.hue) }} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[clamp(8px,2.2cqh,14px)] font-semibold text-neutral-900">{r.name}</span>
                <span className="text-[clamp(7px,1.8cqh,12px)] text-neutral-500">{r.area}</span>
              </span>
            </button>
          ))}
        </div>

        <div ref={detail} className="absolute inset-0 origin-center bg-white shadow-[-12px_0_24px_rgba(0,0,0,0.12)]">
          <div ref={hero} className="relative" style={{ height: `${HERO_H}%`, background: gradient(current.hue) }}>
            <button
              type="button"
              tabIndex={thumb ? -1 : 0}
              aria-label="목록으로"
              onClick={() => go(false, true)}
              className="absolute top-[8%] left-[5%] grid size-[clamp(18px,5cqh,30px)] place-items-center rounded-full bg-white/80 text-neutral-800 outline-none"
            >
              <ChevronLeftIcon className="size-[70%]" />
            </button>
          </div>
          <div ref={detailBody} className="flex flex-col gap-[clamp(3px,1cqh,8px)] p-[6%] text-neutral-900">
            <p className="text-[clamp(10px,3cqh,20px)] font-bold">{current.name}</p>
            <p className="flex items-center gap-1 text-[clamp(7px,1.9cqh,12px)] text-neutral-500">
              <MapPinIcon className="size-[1.1em]" /> {current.area}
              <StarIcon className="ml-2 size-[1.1em] fill-amber-400 text-amber-400" /> 4.6
            </p>
            {[92, 80, 86, 60].map((w) => (
              <span key={w} className="h-[clamp(4px,1.2cqh,8px)] rounded-full bg-neutral-200" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        {/* the travelling picture used by the shared-element transition */}
        <div ref={card} aria-hidden className="pointer-events-none absolute hidden" />
      </div>

      {!thumb && (
        <div role="group" aria-label="전환 방식" className="flex flex-wrap justify-center gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => {
                setKind(k.id)
                go(!open, true)
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium outline-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-indigo-400',
                kind === k.id ? 'bg-neutral-900 text-white' : 'bg-white/80 text-neutral-700',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'screen-transitions',
  group: 'motion',
  name: '화면 전환',
  englishName: 'Screen Transitions',
  aliases: ['Page transition', 'Navigation transition', 'Shared element transition', 'View Transitions', '페이지 전환'],
  description: '목록에서 상세 화면으로 넘어갈 때 두 화면을 어떻게 이어 붙일지 정하는 애니메이션',
  context: '모바일 앱의 화면 이동, 웹의 페이지 이동(View Transitions API), 사진 앱에서 썸네일이 커지는 장면에서 봅니다.',
  technique: 'DOM·CSS',
  interaction: '휴대폰 안의 항목이나 뒤로 버튼을 누르고, 아래 버튼으로 전환 방식을 바꿔 보세요.',
  traits: [
    {
      title: '어디서 왔고 어디로 가는지',
      description: '밀어내기는 "앞으로 들어간다", 확대는 "안을 들여다본다"는 느낌을 줍니다. 전환은 두 화면의 관계를 설명합니다.',
    },
    {
      title: '공유 요소로 이어지는 시선',
      description: '누른 항목의 그림이 그대로 커져 상세 화면의 큰 그림이 됩니다. 눈이 따라갈 대상이 끊기지 않아 길을 잃지 않습니다.',
    },
    {
      title: '짧고 가볍게',
      description: '보통 0.2~0.5초입니다. 길게 늘이면 기다리는 시간이 됩니다. 속도와 전환 길이를 바꿔 차이를 느껴 보세요.',
    },
  ],
  params: [{ key: 'duration', label: '전환 길이', min: 0.15, max: 1.5, step: 0.05, default: 0.45, unit: '초' }],
  Scene: ScreenTransitionsScene,
}
