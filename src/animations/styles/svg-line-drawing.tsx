import { useRef } from 'react'
import { usePointer } from '../engine/pointer'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

type Stroke = { d: string; fill?: string; stroke?: string }
type Step = { name: string; strokes: Stroke[] }

const INK = '#2b2622'
const SUN_INK = '#de8f2a'

const rays: Stroke[] = Array.from({ length: 8 }, (_, k) => {
  const a = (k / 8) * Math.PI * 2
  const at = (r: number) => `${(78 + Math.cos(a) * r).toFixed(1)} ${(66 + Math.sin(a) * r).toFixed(1)}`
  return { d: `M${at(30)} L${at(40)}`, stroke: SUN_INK }
})

/** Drawn in this order. Strokes in the same step draw together; each is a single subpath. */
const STEPS: Step[] = [
  { name: '땅', strokes: [{ d: 'M14 214 C90 204 150 222 230 212 S350 206 386 214' }] },
  { name: '벽', strokes: [{ d: 'M150 214 V130 H270 V214 Z', fill: '#f6e5bd' }] },
  { name: '지붕', strokes: [{ d: 'M138 134 L210 82 L282 134 Z', fill: '#e07a5f' }] },
  { name: '굴뚝', strokes: [{ d: 'M240 104 V90 H254 V114 Z', fill: '#b5574a' }] },
  { name: '문', strokes: [{ d: 'M197 214 V176 Q197 166 207 166 H213 Q223 166 223 176 V214 Z', fill: '#8a5a3c' }] },
  {
    name: '창문',
    strokes: [
      { d: 'M162 148 H188 V172 H162 Z', fill: '#bfe3f2' },
      { d: 'M232 148 H258 V172 H232 Z', fill: '#bfe3f2' },
    ],
  },
  { name: '창살', strokes: [{ d: 'M175 148 V172' }, { d: 'M162 160 H188' }, { d: 'M245 148 V172' }, { d: 'M232 160 H258' }] },
  { name: '길', strokes: [{ d: 'M200 214 C197 228 186 240 172 252' }, { d: 'M220 214 C224 228 236 240 252 252' }] },
  { name: '나무 줄기', strokes: [{ d: 'M318 214 L320 172 H330 L332 214 Z', fill: '#8b5e3c' }] },
  {
    name: '나뭇잎',
    strokes: [
      {
        d: 'M308 178 C288 178 284 152 300 146 C296 124 322 116 330 130 C346 120 364 138 354 152 C368 164 354 182 340 176 C332 186 314 186 308 178 Z',
        fill: '#7cc27f',
      },
    ],
  },
  { name: '해', strokes: [{ d: 'M56 66 A22 22 0 1 1 100 66 A22 22 0 1 1 56 66 Z', fill: '#ffd25e', stroke: SUN_INK }] },
  { name: '햇살', strokes: rays },
  { name: '연기', strokes: [{ d: 'M247 86 C239 80 255 74 247 68 C239 62 255 56 247 50', stroke: '#8d8a86' }] },
  { name: '새', strokes: [{ d: 'M128 52 Q136 44 144 52 Q152 44 160 52' }, { d: 'M170 36 Q176 30 182 36 Q188 30 194 36' }] },
]

const PATHS = STEPS.flatMap((step, s) => step.strokes.map((stroke) => ({ ...stroke, step: s })))

// the rest of the loop after the last line is drawn, in seconds
const FILL = 0.9
const HOLD = 1.8
const UNFILL = 0.4
const ERASE_EACH = 0.55
const ERASE_GAP = 0.04
const REST = 0.5

function timeline(stagger: number, drawTime: number) {
  const drawEnd = (STEPS.length - 1) * stagger + drawTime
  const filled = drawEnd + FILL
  const eraseStart = filled + HOLD + UNFILL
  const erased = eraseStart + (STEPS.length - 1) * ERASE_GAP + ERASE_EACH
  return { drawEnd, filled, eraseStart, erased, cycle: erased + REST }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (p: number) => 0.5 - Math.cos(p * Math.PI) / 2
const mod = (a: number, n: number) => ((a % n) + n) % n

/** Path length for the dash trick, or null where there is no geometry (jsdom, not rendered yet). */
function measure(el: SVGPathElement | null) {
  try {
    const length = el && typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0
    if (Number.isFinite(length) && length > 0) return length
  } catch {
    // not rendered yet
  }
  return null
}

/**
 * Line drawing with the dash trick: each path's dash is as long as the path itself,
 * and sliding the dash offset from that length to 0 reveals the line from its start.
 */
function SvgLineDrawingScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const paths = useRef<(SVGPathElement | null)[]>([])
  const lengths = useRef<number[] | null>(null)
  const tip = useRef<SVGCircleElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const stateLine = useRef<HTMLParagraphElement>(null)
  const dashLine = useRef<HTMLParagraphElement>(null)
  const shift = useRef<number | null>(null)
  const focus = useRef(0)
  const pointer = usePointer(box)

  const tl = timeline(params.stagger, params.drawTime)

  const redraw = useLoop(
    box,
    ({ time }) => {
      // a scene that starts paused (thumbnail, reduced motion) shows the finished picture, not blank paper
      shift.current ??= paused ? tl.filled + HOLD / 2 - time : -time
      const p = pointer.current
      let phase: number
      if (p.inside && !thumb && box.current) {
        // hovering scrubs: the pointer's place along the timeline bar is the moment shown
        const root = box.current.getBoundingClientRect()
        const bar = track.current?.getBoundingClientRect()
        const left = bar && bar.width > 0 ? bar.left - root.left : 0
        const width = bar && bar.width > 0 ? bar.width : root.width
        phase = clamp01((p.x - left) / Math.max(1, width)) * tl.cycle
        shift.current = phase - time // carry on from here when the pointer leaves
      } else {
        phase = mod(time + (shift.current ?? 0), tl.cycle)
      }

      if (!lengths.current) {
        const measured = PATHS.map((_, i) => measure(paths.current[i]))
        // keep the numbers only once every path could be measured; until then guess
        if (measured.every((l) => l !== null)) lengths.current = measured as number[]
      }
      const lens = lengths.current ?? PATHS.map(() => 400)

      let drawing = -1
      let erasing = -1
      PATHS.forEach((path, i) => {
        const el = paths.current[i]
        if (!el) return
        const dash = lens[i] + 1 // a hair longer than the path, so a closed shape meets itself
        const draw = ease(clamp01((phase - path.step * params.stagger) / params.drawTime))
        const eraseFrom = tl.eraseStart + (STEPS.length - 1 - path.step) * ERASE_GAP
        const erase = ease(clamp01((phase - eraseFrom) / ERASE_EACH))
        // drawing: offset dash → 0 shows the line from its start; erasing: 0 → -dash hides it from its start
        const offset = erase > 0 ? -dash * erase : dash * (1 - draw)
        el.style.strokeDasharray = `${dash} ${dash}`
        el.style.strokeDashoffset = String(offset)
        el.style.strokeWidth = String(params.strokeWidth)
        el.style.visibility = draw > 0 && erase < 1 ? 'visible' : 'hidden'
        if (path.fill) {
          const fillIn = clamp01((phase - tl.drawEnd - path.step * 0.05) / 0.5)
          const fillOut = clamp01((phase - tl.filled - HOLD) / UNFILL)
          el.style.fillOpacity = String(fillIn * (1 - fillOut))
        }
        if (draw > 0 && draw < 1 && erase === 0) drawing = i
        if (erase > 0 && erase < 1 && erasing < 0) erasing = i
      })

      // the pen: a dot riding the tip of the line being drawn (or rubbed out)
      const active = drawing >= 0 ? drawing : erasing
      const tipEl = tip.current
      if (tipEl) {
        const el = paths.current[active]
        let shown = false
        if (active >= 0 && el && typeof el.getPointAtLength === 'function') {
          const path = PATHS[active]
          const along =
            drawing >= 0
              ? ease(clamp01((phase - path.step * params.stagger) / params.drawTime))
              : ease(clamp01((phase - tl.eraseStart - (STEPS.length - 1 - path.step) * ERASE_GAP) / ERASE_EACH))
          try {
            const pt = el.getPointAtLength(lens[active] * along)
            tipEl.setAttribute('cx', String(pt.x))
            tipEl.setAttribute('cy', String(pt.y))
            tipEl.setAttribute('r', String(Math.max(2.4, params.strokeWidth * 1.3)))
            tipEl.style.fill = drawing >= 0 ? '#ff5a36' : '#a8a29e'
            shown = true
          } catch {
            // no geometry (jsdom)
          }
        }
        tipEl.style.visibility = shown ? 'visible' : 'hidden'
      }

      // the readout: which stage we are in, and the two numbers that make it work
      if (active >= 0) focus.current = active
      const f = focus.current
      const fp = paths.current[f]
      const state =
        phase < tl.drawEnd
          ? `그리는 중 · ${STEPS[PATHS[f].step].name}`
          : phase < tl.filled
            ? '색 채우기'
            : phase < tl.filled + HOLD
              ? '완성'
              : phase < tl.eraseStart
                ? '색 빼기'
                : phase < tl.erased
                  ? `지우는 중 · ${STEPS[PATHS[f].step].name}`
                  : '빈 종이'
      if (stateLine.current && stateLine.current.textContent !== state) stateLine.current.textContent = state
      if (dashLine.current && fp) {
        dashLine.current.textContent = `dasharray ${Math.round(lens[f] + 1)} · dashoffset ${Math.round(Number(fp.style.strokeDashoffset) || 0)}`
      }
      if (head.current) head.current.style.left = `${(phase / tl.cycle) * 100}%`
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  const pct = (t: number) => `${(t / tl.cycle) * 100}%`
  const segments = [
    { label: '그리기', from: 0, to: tl.drawEnd, color: INK },
    { label: '채우기', from: tl.drawEnd, to: tl.filled, color: '#e07a5f' },
    { label: '멈춤', from: tl.filled, to: tl.filled + HOLD, color: '#c9bfae' },
    { label: '지우기', from: tl.filled + HOLD, to: tl.erased, color: '#a8a29e' },
  ]

  return (
    <div
      ref={box}
      onPointerMove={redraw}
      onPointerLeave={redraw}
      className="@container relative flex size-full flex-col overflow-hidden bg-[#fbf7ee] text-[#2b2622]"
      style={{
        containerType: 'size',
        backgroundImage: 'radial-gradient(rgba(60, 45, 20, 0.13) 1px, transparent 1.3px)',
        backgroundSize: '18px 18px',
      }}
    >
      {!thumb && (
        <div className="flex shrink-0 px-[clamp(12px,4cqw,32px)] pt-[clamp(10px,3cqh,24px)]">
          <div aria-live="off" className="rounded-lg bg-white/85 px-3 py-1.5 shadow-sm ring-1 ring-black/5">
            <p ref={stateLine} className="text-[13px] font-semibold" />
            <p ref={dashLine} className="font-mono text-[11px] text-black/55 tabular-nums" />
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid meet"
        aria-label="집과 나무, 해가 있는 선 그림"
        role="img"
        className="min-h-0 w-full flex-1"
        style={{ padding: thumb ? '6px' : 'clamp(4px, 2cqh, 16px) clamp(12px, 4cqw, 32px)' }}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {PATHS.map((path, i) => (
          <path
            key={i}
            ref={(el) => {
              paths.current[i] = el
            }}
            d={path.d}
            fill={path.fill ?? 'none'}
            fillOpacity={0}
            stroke={path.stroke ?? INK}
            strokeWidth={params.strokeWidth}
            visibility="hidden"
          />
        ))}
        <circle ref={tip} r={3} fill="#ff5a36" stroke="#fff" strokeWidth={1} visibility="hidden" />
      </svg>

      {!thumb && (
        <div className="shrink-0 px-[clamp(12px,4cqw,32px)] pb-[clamp(10px,3cqh,24px)]">
          <div ref={track} className="relative h-2 rounded-full bg-black/[0.06]">
            {segments.map((s) => (
              <div
                key={s.label}
                className="absolute inset-y-0 rounded-full opacity-35"
                style={{ left: pct(s.from), width: pct(s.to - s.from), background: s.color }}
              />
            ))}
            {STEPS.map((step, s) => (
              <div
                key={step.name}
                className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-black/35"
                style={{ left: pct(s * params.stagger) }}
              />
            ))}
            <div ref={head} className="absolute -top-1 h-4 w-[3px] -translate-x-1/2 rounded-full bg-[#ff5a36]" />
          </div>
          <div className="relative mt-1.5 h-4 text-[11px] text-black/50">
            {segments.map((s) => (
              <span key={s.label} className="absolute truncate" style={{ left: pct(s.from), width: pct(s.to - s.from) }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'svg-line-drawing',
  group: 'motion',
  name: 'SVG 선 그리기',
  englishName: 'SVG Line Drawing',
  aliases: ['Line drawing animation', 'Stroke animation', 'stroke-dashoffset', 'Self-drawing SVG', '선 따라 그리기'],
  description: '펜으로 그리듯 선이 한 획씩 이어져 그림이 완성되고, 색이 채워졌다가 다시 지워지는 SVG 애니메이션',
  context: '서비스 소개 페이지의 일러스트, 로고 등장 장면, 서명 효과, 그래프 선이 그려지는 대시보드에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '무대 위에서 마우스를 왼쪽→오른쪽으로 움직이면 아래 시간 막대처럼 그리는 과정을 직접 넘겨 볼 수 있습니다.',
  traits: [
    {
      title: '점선 한 칸 = 선 전체 길이',
      description:
        'getTotalLength()로 선의 길이를 재서 stroke-dasharray를 그 길이로 두면 선 전체가 점선 한 칸이 됩니다. stroke-dashoffset을 길이에서 0으로 줄이면 그 칸이 밀려 들어오며 선이 그려지는 것처럼 보입니다.',
    },
    {
      title: '순서와 시차',
      description:
        '선마다 시작 시간을 조금씩 늦춰 땅 → 집 → 나무 → 해 순서로 그립니다. 순서 간격을 0으로 하면 모두 한꺼번에, 크게 하면 한 획씩 또박또박 그려집니다.',
    },
    {
      title: '선 다음에 색, 지울 땐 반대로',
      description:
        '선이 다 그려진 뒤에 채우기 색을 천천히 올려 스케치가 그림이 됩니다. 지울 때는 오프셋을 음수로 보내 선이 그려졌던 방향으로 사라집니다.',
    },
  ],
  params: [
    { key: 'strokeWidth', label: '선 굵기', min: 0.5, max: 6, step: 0.5, default: 2.5 },
    { key: 'stagger', label: '순서 간격', min: 0, max: 1, step: 0.05, default: 0.3, unit: '초' },
    { key: 'drawTime', label: '한 획 그리는 시간', min: 0.2, max: 3, step: 0.1, default: 0.9, unit: '초' },
  ],
  Scene: SvgLineDrawingScene,
}
