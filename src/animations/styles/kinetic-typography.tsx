import { useRef, useState } from 'react'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const MOVES = ['물결', '늘이기', '돌기'] as const
const COLORS = ['#ff4d2e', '#1f5cff', '#111111']
const SECONDS_PER_MOVE = 4

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Each letter is its own span whose transform is set every frame. The three moves
 * take turns and blend into each other, so the text never snaps.
 */
function KineticTypographyScene({ params, paused, thumb }: SceneProps) {
  const [text, setText] = useState('MOVE YOUR TYPE')
  const box = useRef<HTMLDivElement>(null)
  const letters = useRef<(HTMLSpanElement | null)[]>([])
  const label = useRef<HTMLSpanElement>(null)
  const chars = [...text]

  useLoop(
    box,
    ({ time }) => {
      // start a quarter into the first move, so it is already fully in (no blend from the last move)
      const cycle = time / SECONDS_PER_MOVE + 0.25
      const current = Math.floor(cycle) % MOVES.length
      const blend = smooth(Math.min(1, (cycle % 1) * 4)) // the first quarter of a move fades in
      const weight = (move: number) =>
        move === current ? blend : move === (current + MOVES.length - 1) % MOVES.length ? 1 - blend : 0
      const amp = params.amplitude
      if (label.current) label.current.textContent = MOVES[current]

      letters.current.slice(0, chars.length).forEach((el, i) => {
        if (!el) return
        const t = time * 2.6 - i * params.stagger
        const y = -Math.max(0, Math.sin(t)) * 0.45 * amp * weight(0) // em, bouncing up
        const stretch = 1 + Math.sin(t) * 0.45 * amp * weight(1)
        // one eased full turn per cycle, then a rest; whole turns look the same, so only the fraction matters
        const turn = (((t / (Math.PI * 2)) % 1) + 1) % 1
        const spin = smooth(Math.min(1, turn * 2)) * 360 * weight(2)
        el.style.transform = `translateY(${y}em) scale(${1 / Math.sqrt(stretch)}, ${stretch}) rotate(${spin}deg)`
        el.style.color = COLORS[current]
      })
    },
    { paused, speed: params.speed ?? 1, redrawKey: `${JSON.stringify(params)}|${text}` },
  )

  return (
    <div ref={box} className="@container relative flex size-full items-center justify-center overflow-hidden bg-[#f3efe6] text-[#111]">
      <span ref={label} aria-hidden className="absolute top-3 left-4 font-mono text-xs tracking-widest text-black/50 uppercase" />
      <p
        aria-label={text}
        className="flex flex-wrap justify-center px-6 text-center leading-[1.05] font-black tracking-tight"
        style={{ fontSize: thumb ? '2rem' : 'clamp(2rem, 10cqw, 7.5rem)' }}
      >
        {chars.map((ch, i) => (
          <span
            key={`${i}-${ch}`}
            aria-hidden
            ref={(el) => {
              letters.current[i] = el
            }}
            className="inline-block origin-bottom will-change-transform"
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
      {!thumb && (
        <input
          value={text}
          maxLength={24}
          onChange={(e) => setText(e.target.value || ' ')}
          aria-label="움직일 글자"
          className="absolute bottom-4 left-1/2 w-56 -translate-x-1/2 rounded-full border border-black/15 bg-white/80 px-4 py-1.5 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        />
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'kinetic-typography',
  name: '키네틱 타이포그래피',
  englishName: 'Kinetic Typography',
  aliases: ['Motion typography', 'Animated type', '움직이는 글자'],
  description: '글자 하나하나가 튀고, 늘어나고, 돌면서 문장 자체가 움직임이 되는 애니메이션',
  context: '영화 오프닝 타이틀, 광고 영상, 브랜드 캠페인 페이지의 큰 제목에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '아래 칸에 글자를 바꿔 쓰면 그 글자가 움직입니다.',
  traits: [
    { title: '글자마다 따로 움직임', description: '문장을 글자 단위로 쪼개 각각 위치·크기·회전을 줍니다.' },
    { title: '시차(stagger)', description: '같은 움직임을 글자마다 조금씩 늦게 시작해 물결처럼 앞에서 뒤로 번집니다.' },
    { title: '움직임이 바뀌며 이어짐', description: '물결 → 늘이기 → 돌기가 차례로 이어지고, 바뀔 때 앞 움직임과 섞여 끊기지 않습니다.' },
  ],
  params: [
    { key: 'amplitude', label: '움직임 크기', min: 0, max: 2, step: 0.1, default: 1, unit: '×' },
    { key: 'stagger', label: '글자 사이 시차', min: 0, max: 1.2, step: 0.05, default: 0.35 },
  ],
  Scene: KineticTypographyScene,
}
