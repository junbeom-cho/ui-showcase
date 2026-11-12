import { useEffect, useRef, type CSSProperties } from 'react'
import { usePointer } from '../engine/pointer'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

/** card width; the height follows from 5:7 and always fits the stage */
const CARD_WIDTH = 'min(58cqh, 72cqw)'
const u = (k: number) => `calc(var(--cw) * ${k})`

const RAINBOW =
  'repeating-linear-gradient(110deg, hsl(2 100% 73%) 0%, hsl(53 100% 69%) 4%, hsl(93 100% 69%) 8%, hsl(176 100% 76%) 12%, hsl(228 100% 74%) 16%, hsl(283 100% 73%) 20%, hsl(2 100% 73%) 24%)'
const SHEEN =
  'repeating-linear-gradient(135deg, #0e152e 0%, hsl(180 10% 60%) 3.8%, hsl(180 29% 66%) 4.5%, hsl(180 10% 60%) 5.2%, #0e152e 10%, #0e152e 12%)'
const METAL =
  'linear-gradient(125deg, #7f8299 0%, #f2f2ff 18%, #9a9db4 34%, #e8e2ff 50%, #878aa1 66%, #f6f1ff 82%, #9496aa 100%)'
const GLITTER = [
  'radial-gradient(circle at 30% 40%, #000 0 0.6px, transparent 1.5px)',
  'radial-gradient(circle at 70% 65%, #000 0 0.7px, transparent 1.7px)',
  'radial-gradient(circle at 50% 20%, #000 0 0.9px, transparent 2.1px)',
].join(', ')

const STARS: [number, number][] = [
  [12, 14],
  [84, 20],
  [22, 70],
  [78, 76],
  [64, 9],
  [34, 32],
  [90, 52],
]

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

function Gem() {
  const facet = (clipPath: string, background: string) => <div className="absolute inset-0" style={{ clipPath, background }} />
  return (
    <div
      className="absolute"
      style={{
        left: '50%',
        top: '56%',
        width: '30%',
        aspectRatio: '0.85',
        transform: 'translate(-50%, -50%) translateY(var(--float))',
        filter: `drop-shadow(0 0 ${u(0.035)} rgba(150, 210, 255, 0.85))`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(25% 0, 75% 0, 100% 30%, 50% 100%, 0 30%)',
          background: 'linear-gradient(160deg, #e6f6ff, #8fd3ff 35%, #6d6af5 70%, #3b1f8f)',
        }}
      >
        {facet('polygon(25% 0, 75% 0, 100% 30%, 0 30%)', 'rgba(255, 255, 255, 0.28)')}
        {facet('polygon(25% 0, 75% 0, 62% 30%, 38% 30%)', 'rgba(255, 255, 255, 0.4)')}
        {facet('polygon(0 30%, 38% 30%, 50% 100%)', 'rgba(30, 10, 90, 0.22)')}
        {facet('polygon(38% 30%, 62% 30%, 50% 100%)', 'rgba(255, 255, 255, 0.14)')}
        {facet('polygon(62% 30%, 100% 30%, 50% 100%)', 'rgba(15, 0, 70, 0.4)')}
      </div>
    </div>
  )
}

/**
 * A trading card that tilts toward the pointer. Every frame only writes custom
 * properties (--rx, --ry, --mx, --my, --bx, --by, --hyp) on the card; the foil,
 * glitter and glare layers read them in CSS.
 */
function HolographicFoilScene({ params, paused }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const pointer = usePointer(box)
  const size = useRef({ w: 0, h: 0 })
  const light = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLoop(
    box,
    ({ time, delta }) => {
      const el = card.current
      if (!el) return
      const p = pointer.current
      const { w, h } = size.current
      // the light sweeps a slow figure on its own; the pointer takes over when it is on the stage
      let tx = Math.sin(time * 0.7) * 0.75
      let ty = Math.sin(time * 0.47 + 1.1) * 0.6
      if (p.inside && w > 0 && h > 0) {
        tx = clamp((p.x / w - 0.5) * 2.4)
        ty = clamp((p.y / h - 0.5) * 2.4)
      }
      const k = delta > 0 ? 1 - Math.exp(-delta * 7) : 1
      const l = light.current
      l.x += (tx - l.x) * k
      l.y += (ty - l.y) * k

      const s = el.style
      s.setProperty('--rx', `${(-l.y * params.tilt).toFixed(2)}deg`)
      s.setProperty('--ry', `${(l.x * params.tilt).toFixed(2)}deg`)
      s.setProperty('--mx', `${(50 + l.x * 45).toFixed(2)}%`)
      s.setProperty('--my', `${(50 + l.y * 45).toFixed(2)}%`)
      s.setProperty('--bx', `${(50 + l.x * 40).toFixed(2)}%`)
      s.setProperty('--by', `${(50 + l.y * 40).toFixed(2)}%`)
      s.setProperty('--hyp', Math.min(1, Math.hypot(l.x, l.y)).toFixed(3))
      s.setProperty('--sx', (-l.x * 0.06).toFixed(3))
      s.setProperty('--sy', (0.05 - l.y * 0.04).toFixed(3))
      s.setProperty('--float', `${(Math.sin(time * 1.3) * 4).toFixed(2)}%`)
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  return (
    <div
      ref={box}
      className="@container relative flex size-full items-center justify-center overflow-hidden bg-[#0b0a12]"
      // a size container, so cqh follows the stage height too
      style={{ containerType: 'size', '--cw': CARD_WIDTH } as CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70cqmin 55cqmin at 50% 48%, rgba(120, 90, 255, 0.3), transparent 70%), radial-gradient(90cqmin 40cqmin at 50% 100%, rgba(40, 200, 220, 0.12), transparent 70%)',
        }}
      />
      <div
        ref={card}
        className="relative overflow-hidden"
        style={
          {
            width: 'var(--cw)',
            aspectRatio: '5 / 7',
            borderRadius: u(0.05),
            transform: `perspective(${u(3.2)}) rotateX(var(--rx)) rotateY(var(--ry))`,
            boxShadow: `calc(var(--sx) * var(--cw)) calc(var(--sy) * var(--cw)) ${u(0.12)} rgba(0, 0, 0, 0.6), 0 0 ${u(0.18)} rgba(140, 110, 255, 0.28)`,
            willChange: 'transform',
            '--rx': '0deg',
            '--ry': '0deg',
            '--mx': '50%',
            '--my': '50%',
            '--bx': '50%',
            '--by': '50%',
            '--hyp': 0,
            '--sx': 0,
            '--sy': 0.05,
            '--float': '0%',
            '--foil': params.foil,
          } as CSSProperties
        }
      >
        {/* metal frame whose shine slides with the tilt */}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: METAL, backgroundSize: '300% 300%', backgroundPosition: 'var(--bx) var(--by)' }} />

        <div
          className="absolute flex flex-col text-[#f4f1ff]"
          style={{
            inset: u(0.035),
            borderRadius: u(0.03),
            padding: u(0.045),
            gap: u(0.028),
            background: 'linear-gradient(180deg, #1f1a3d, #110e22)',
          }}
        >
          <div className="flex items-baseline justify-between leading-none">
            <p className="font-bold" style={{ fontSize: u(0.072) }}>
              빛의 결정
            </p>
            <p className="font-mono" style={{ fontSize: u(0.042) }}>
              HP 120
            </p>
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              aspectRatio: '4 / 3',
              borderRadius: u(0.018),
              background: 'radial-gradient(circle at 50% 62%, #5b3fc4 0%, #2a1b6e 38%, #0f0b2e 75%)',
              boxShadow: `inset 0 0 0 ${u(0.008)} rgba(255, 255, 255, 0.35)`,
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'repeating-conic-gradient(from 0deg at 50% 58%, rgba(255, 255, 255, 0.07) 0deg 6deg, transparent 6deg 18deg)' }}
            />
            {[78, 58, 38].map((d) => (
              <div
                key={d}
                aria-hidden
                className="absolute rounded-full"
                style={{
                  left: '50%',
                  top: '58%',
                  width: `${d}%`,
                  aspectRatio: '1',
                  transform: 'translate(-50%, -50%)',
                  border: `${u(0.004)} solid rgba(190, 170, 255, 0.35)`,
                }}
              />
            ))}
            {STARS.map(([x, y]) => (
              <div
                key={`${x}-${y}`}
                aria-hidden
                className="absolute rounded-full bg-white"
                style={{ left: `${x}%`, top: `${y}%`, width: u(0.01), height: u(0.01), boxShadow: `0 0 ${u(0.02)} #cfe8ff` }}
              />
            ))}
            <div
              aria-hidden
              className="absolute"
              style={{ left: '50%', top: '84%', width: '40%', height: '9%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(0, 0, 0, 0.55), transparent)' }}
            />
            <Gem />

            {/* holo foil: rainbow bands and metallic streaks, dodged onto the art */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `${RAINBOW}, ${SHEEN}`,
                backgroundSize: '400% 400%, 300% 300%',
                backgroundPosition: 'var(--bx) var(--by), calc(100% - var(--bx)) calc(100% - var(--by))',
                backgroundBlendMode: 'screen',
                mixBlendMode: 'color-dodge',
                filter: 'brightness(0.72) contrast(1.4)',
                opacity: 'var(--foil)',
              }}
            />
            {/* glitter: rainbow seen only through tiny dots, strongest near the light */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                mixBlendMode: 'color-dodge',
                opacity: 'calc(var(--foil) * (0.55 + var(--hyp) * 0.45))',
                maskImage: 'radial-gradient(circle at var(--mx) var(--my), #000 0%, rgba(0, 0, 0, 0.35) 35%, transparent 65%)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: RAINBOW,
                  backgroundSize: '300% 300%',
                  backgroundPosition: 'calc(100% - var(--bx)) var(--by)',
                  maskImage: GLITTER,
                  maskSize: '9px 11px, 15px 13px, 23px 27px',
                  maskPosition: '0 0, 3px 5px, 7px 2px',
                }}
              />
            </div>
          </div>

          <p className="leading-none opacity-70" style={{ fontSize: u(0.038) }}>
            결정 타입 · 무지개 속성
          </p>
          <div className="leading-snug">
            <p className="flex justify-between font-semibold" style={{ fontSize: u(0.05) }}>
              <span>프리즘 반사</span>
              <span className="font-mono">60</span>
            </p>
            <p className="opacity-80" style={{ fontSize: u(0.04) }}>
              보는 각도에 따라 빛이 여러 색으로 갈라집니다.
            </p>
          </div>
          <div className="mt-auto flex justify-between font-mono leading-none opacity-70" style={{ fontSize: u(0.032) }}>
            <span>No. 017 / 120</span>
            <span>★ 홀로 레어</span>
          </div>
        </div>

        {/* a faint rainbow over the whole card, then the glare that follows the light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: RAINBOW,
            backgroundSize: '400% 400%',
            backgroundPosition: 'var(--bx) var(--by)',
            mixBlendMode: 'soft-light',
            opacity: 'calc(var(--foil) * 0.6)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(farthest-corner circle at var(--mx) var(--my), rgba(255, 255, 255, 0.8) 10%, rgba(255, 255, 255, 0.55) 20%, rgba(0, 0, 0, 0.5) 90%)',
            mixBlendMode: 'overlay',
            opacity: 'calc(0.3 + var(--hyp) * 0.45)',
          }}
        />
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'holographic-foil',
  name: '홀로그램 포일',
  englishName: 'Holographic Foil',
  aliases: ['Holo card', 'Iridescent foil', '홀로 카드'],
  description: '카드를 기울일 때마다 무지개빛 반사와 반짝이가 표면을 따라 흐르는 홀로그램 효과',
  context: '트레이딩 카드 게임의 레어 카드, 한정판 굿즈 페이지, 이벤트 티켓과 멤버십 카드 화면에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '마우스를 움직이면 카드가 그쪽으로 기울고, 빛 반사와 무지개 띠가 함께 따라옵니다.',
  traits: [
    { title: '각도에 따라 바뀌는 색', description: '무지개 그러데이션을 카드보다 크게 깔고 기울기에 맞춰 밀어, 보는 각도마다 다른 색이 지나갑니다.' },
    { title: '섞기 모드로 입힌 빛', description: '무지개 층을 그림 위에 그대로 덮지 않고 color-dodge·overlay로 섞어, 어두운 곳은 은은하고 밝은 곳은 강하게 빛납니다.' },
    { title: '반짝이와 하이라이트', description: '작은 점 무늬의 반짝이와 빛이 닿는 자리의 둥근 하이라이트가 기울기를 따라 움직여 금속 포일처럼 보입니다.' },
  ],
  params: [
    { key: 'foil', label: '반짝임 세기', min: 0, max: 1, step: 0.05, default: 0.7 },
    { key: 'tilt', label: '기울기 크기', min: 0, max: 30, step: 1, default: 16, unit: '°' },
  ],
  Scene: HolographicFoilScene,
}
