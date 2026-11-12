import { useRef, type CSSProperties } from 'react'
import { seeded } from '../engine/noise'
import { usePointer } from '../engine/pointer'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

// Every glowing part is a "tube" with its own --on (0 = unlit glass, 1 = fully lit).
// ids: 0–3 OPEN, 4–9 열려 있어요 (6 is the space), 10 frame, 11 heart, 12 inner heart
const OPEN = [...'OPEN'].map((ch, i) => ({ ch, id: i }))
const KOREAN = [...'열려 있어요'].map((ch, i) => ({ ch, id: 4 + i }))
const FRAME = 10
const HEART = 11
const INNER_HEART = 12
const TUBES = 13
/** chance that a tube stutters within each short window; one letter per line is the bad one */
const FAULTY = [0.05, 0.08, 0.75, 0.05, 0.06, 0.05, 0, 0.08, 0.7, 0.05, 0.04, 0.12, 0.12]
const SLOT = 2.6

const HEART_PATH =
  'M12 20.5C7 16.6 3 13.3 3 9.2 3 6.6 5 4.6 7.5 4.6c1.8 0 3.4 1 4.5 2.6 1.1-1.6 2.7-2.6 4.5-2.6 2.5 0 4.5 2 4.5 4.6 0 4.1-4 7.4-9 11.3z'

/** Brightness of one tube: steady, except for a rare burst of stutter inside a seeded time slot. */
function tube(time: number, id: number) {
  const slot = Math.floor(time / SLOT)
  const r = seeded(slot * 7919 + id * 104729 + 1)
  if (r() >= FAULTY[id]) return 1
  const start = r() * 2
  const length = 0.12 + r() * 0.5
  const local = time - slot * SLOT
  if (local < start || local > start + length) return 1
  const b = seeded(Math.floor(time * 18) * 31 + id * 977 + 3)()
  return b < 0.45 ? 0.06 : b < 0.65 ? 0.45 : 1
}

const tubeColor = (hue: string) => `hsl(${hue} calc(25% + 75% * var(--on)) calc(30% + 62% * var(--on)))`

/** layered glow: a hot core, then wider and fainter halos, then the tube's own shadow on the wall */
const textGlow = (hue: string) =>
  [
    `0 0 calc(0.03em * var(--g)) hsl(${hue} 100% 85% / var(--on))`,
    `0 0 calc(0.1em * var(--g)) hsl(${hue} 100% 65% / var(--on))`,
    `0 0 calc(0.22em * var(--g)) hsl(${hue} 100% 55% / var(--on))`,
    `0 0 calc(0.5em * var(--g)) hsl(${hue} 100% 50% / calc(var(--on) * 0.8))`,
    `0 0 calc(1em * var(--g)) hsl(${hue} 100% 50% / calc(var(--on) * 0.55))`,
    '0.03em 0.06em 0.05em rgba(0, 0, 0, 0.6)',
  ].join(', ')

const svgGlow = (hue: string) =>
  `drop-shadow(0 0 calc(0.5cqmin * var(--g)) hsl(${hue} 100% 60% / var(--on))) drop-shadow(0 0 calc(2cqmin * var(--g)) hsl(${hue} 100% 50% / calc(var(--on) * 0.8)))`

const BRICKS: CSSProperties = {
  backgroundColor: '#5b3a32',
  backgroundImage: [
    'linear-gradient(#2a2321 var(--m), transparent 0)',
    // vertical joints, only in the top row of each two-row tile; the second layer is offset by half a brick
    'conic-gradient(from 0deg at var(--m) 50%, transparent 0deg 270deg, #2a2321 270deg 360deg)',
    'conic-gradient(from 0deg at var(--m) 50%, transparent 0deg 270deg, #2a2321 270deg 360deg)',
    'linear-gradient(175deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.3))',
  ].join(', '),
  backgroundSize: '100% var(--bh), var(--bw) calc(var(--bh) * 2), var(--bw) calc(var(--bh) * 2), 100% 100%',
  backgroundPosition: '0 0, 0 0, calc(var(--bw) / 2) var(--bh), 0 0',
}

function NeonGlowScene({ params, paused }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const spill = useRef<HTMLDivElement>(null)
  const tubes = useRef<(HTMLElement | SVGSVGElement | null)[]>([])
  const last = useRef<number[]>(Array.from({ length: TUBES + 1 }, () => 1))
  const power = useRef({ down: false, releasedAt: -10 })
  const pointer = usePointer(box)

  const bind = (id: number) => (el: HTMLElement | SVGSVGElement | null) => {
    tubes.current[id] = el
  }

  useLoop(
    box,
    ({ time, delta }) => {
      // holding the pointer down cuts the power; letting go strikes the tubes back on with a stutter
      const pw = power.current
      const down = pointer.current.down
      if (down) pw.down = true
      else if (pw.down) {
        pw.down = false
        pw.releasedAt = delta > 0 ? time : -10
      }
      const striking = time - pw.releasedAt < 0.5

      let sum = 0
      let count = 0
      for (let id = 0; id < TUBES; id++) {
        const el = tubes.current[id]
        if (!el) continue
        let v = 1 - params.flicker * (1 - tube(time, id))
        if (id === INNER_HEART) v *= Math.floor(time / 0.7) % 2 === 0 ? 1 : 0.04
        if (pw.down) v = 0
        else if (striking) v *= seeded(Math.floor(time * 22) * 17 + id * 131)() < 0.5 ? 0.08 : 1
        sum += v
        count++
        if (Math.abs(v - last.current[id]) > 0.004) {
          el.style.setProperty('--on', v.toFixed(3))
          last.current[id] = v
        }
      }
      const light = count ? sum / count : 1
      if (spill.current && Math.abs(light - last.current[TUBES]) > 0.004) {
        spill.current.style.opacity = light.toFixed(3)
        last.current[TUBES] = light
      }
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  const hue = Math.round(params.hue)
  const vars = {
    containerType: 'size', // cqmin follows the stage, not the window
    '--hue': hue,
    '--hue2': (hue + 230) % 360,
    '--g': params.glow,
    '--bh': '6.5cqmin',
    '--bw': 'calc(var(--bh) * 2.1)',
    '--m': 'max(1px, 0.5cqmin)',
  } as CSSProperties
  const lit = { '--on': 1 } as CSSProperties

  return (
    <div ref={box} className="@container relative flex size-full items-center justify-center overflow-hidden bg-[#0c0809] select-none" style={vars}>
      {/* the wall in ambient light */}
      <div aria-hidden className="absolute inset-0" style={BRICKS} />
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 40%, rgba(10, 6, 16, 0.8), rgba(4, 2, 8, 0.95))' }} />
      {/* the same wall lit by the sign: bricks × neon colour, added on top and dimmed with the tubes */}
      <div ref={spill} aria-hidden className="absolute inset-0" style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
        <div className="absolute inset-0" style={BRICKS} />
        <div
          className="absolute inset-0"
          style={{
            mixBlendMode: 'multiply',
            background:
              'radial-gradient(ellipse 55cqw 50cqh at 50% 48%, hsl(var(--hue) 100% 72%) 0%, hsl(var(--hue) 85% 45%) 32%, hsl(var(--hue2) 70% 22%) 58%, #000 82%)',
          }}
        />
      </div>

      <div
        ref={bind(FRAME)}
        className="relative flex flex-col items-center"
        style={{
          ...lit,
          padding: '3.5cqmin 6cqmin 4cqmin',
          gap: '1.5cqmin',
          borderRadius: '5cqmin',
          border: `max(1.5px, 0.55cqmin) solid ${tubeColor('var(--hue2)')}`,
          boxShadow: [
            '0 0 calc(0.6cqmin * var(--g)) hsl(var(--hue2) 100% 60% / var(--on))',
            '0 0 calc(2.5cqmin * var(--g)) hsl(var(--hue2) 100% 50% / calc(var(--on) * 0.7))',
            'inset 0 0 calc(0.6cqmin * var(--g)) hsl(var(--hue2) 100% 60% / var(--on))',
            'inset 0 0 calc(2.5cqmin * var(--g)) hsl(var(--hue2) 100% 50% / calc(var(--on) * 0.45))',
            '0.4cqmin 0.7cqmin 0.6cqmin rgba(0, 0, 0, 0.5)',
          ].join(', '),
        }}
      >
        <p className="font-mono leading-none" style={{ fontSize: 'min(19cqw, 25cqh)', letterSpacing: '0.12em', marginRight: '-0.12em' }}>
          {OPEN.map(({ ch, id }) => (
            <span key={id} ref={bind(id)} className="inline-block" style={{ ...lit, color: tubeColor('var(--hue)'), textShadow: textGlow('var(--hue)') }}>
              {ch}
            </span>
          ))}
        </p>
        <div className="flex items-center" style={{ gap: '2cqmin' }}>
          <div aria-hidden className="relative" style={{ width: 'min(7.5cqw, 10cqh)', aspectRatio: '1' }}>
            <svg ref={bind(HEART)} viewBox="0 0 24 24" className="absolute inset-0 size-full overflow-visible" style={{ ...lit, filter: svgGlow('var(--hue)') }}>
              <path d={HEART_PATH} fill="none" strokeWidth={1.7} strokeLinejoin="round" style={{ stroke: `hsl(var(--hue) calc(25% + 75% * var(--on)) calc(30% + 35% * var(--on)))` }} />
              <path d={HEART_PATH} fill="none" strokeWidth={0.7} strokeLinejoin="round" style={{ stroke: tubeColor('var(--hue)') }} />
            </svg>
            <svg ref={bind(INNER_HEART)} viewBox="0 0 24 24" className="absolute inset-0 size-full overflow-visible" style={{ ...lit, filter: svgGlow('var(--hue)') }}>
              <g transform="translate(12 12.5) scale(0.5) translate(-12 -12.5)">
                <path d={HEART_PATH} fill="none" strokeWidth={2.6} strokeLinejoin="round" style={{ stroke: `hsl(var(--hue) calc(25% + 75% * var(--on)) calc(30% + 35% * var(--on)))` }} />
                <path d={HEART_PATH} fill="none" strokeWidth={1.1} strokeLinejoin="round" style={{ stroke: tubeColor('var(--hue)') }} />
              </g>
            </svg>
          </div>
          <p className="leading-none font-medium" style={{ fontSize: 'min(6.5cqw, 8.5cqh)', letterSpacing: '0.04em' }}>
            {KOREAN.map(({ ch, id }) =>
              ch === ' ' ? (
                <span key={id}> </span>
              ) : (
                <span key={id} ref={bind(id)} style={{ ...lit, color: tubeColor('var(--hue2)'), textShadow: textGlow('var(--hue2)') }}>
                  {ch}
                </span>
              ),
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'neon-glow',
  name: '네온 글로우',
  englishName: 'Neon Glow',
  aliases: ['Neon sign', 'Neon light', '네온사인'],
  description: '어두운 벽 위에서 유리관 글자가 빛을 번지며 이따금 깜빡이는 네온사인',
  context: '바·카페 간판, 게임과 음악 이벤트 포스터, 다크 모드 랜딩 페이지의 강조 문구에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '누르고 있으면 전원이 꺼져 불 꺼진 유리관이 보이고, 떼면 깜빡이며 다시 켜집니다.',
  traits: [
    { title: '여러 겹의 빛 번짐', description: '하얗게 달아오른 가운데 선 둘레에 점점 넓고 옅은 색 그림자를 여러 겹 쌓아 유리관이 빛나는 것처럼 보이게 합니다.' },
    { title: '벽에 번지는 색', description: '간판 주변 벽돌이 네온 색으로 물들고, 글자가 깜빡이면 벽의 빛도 함께 흔들립니다.' },
    { title: '불규칙한 깜빡임', description: '낡은 관 한두 개가 가끔 툭툭 끊기듯 꺼졌다 켜집니다. 규칙적이지 않아야 진짜 간판처럼 보입니다.' },
  ],
  params: [
    { key: 'glow', label: '빛 번짐', min: 0.3, max: 2, step: 0.1, default: 1, unit: '×' },
    { key: 'hue', label: '색', min: 0, max: 360, step: 1, default: 320, unit: '°' },
    { key: 'flicker', label: '깜빡임', min: 0, max: 1, step: 0.05, default: 0.6 },
  ],
  Scene: NeonGlowScene,
}
