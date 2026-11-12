import { useEffect, useRef, type CSSProperties } from 'react'
import { Cloud, CloudSun, MapPin, MessageCircle, Pause, SkipBack, SkipForward, Sun } from 'lucide-react'
import { usePointer } from '../engine/pointer'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

// Colourful shapes behind the glass. Edges stay fairly crisp, so the blur of the cards is easy to see.
const BLOBS = [
  { color: '#ff4fa3', light: '#ffa3cf', x: 24, y: 30, size: 56, speed: 0.13, phase: 0, radius: '42% 58% 63% 37% / 41% 44% 56% 59%' },
  { color: '#ffb23f', light: '#ffdc8f', x: 78, y: 74, size: 50, speed: 0.11, phase: 1.7, radius: '58% 42% 38% 62% / 52% 61% 39% 48%' },
  { color: '#7c5cff', light: '#b6a6ff', x: 72, y: 20, size: 60, speed: 0.09, phase: 3.1, radius: '47% 53% 58% 42% / 38% 52% 48% 62%' },
  { color: '#22d3ee', light: '#a2eef9', x: 28, y: 82, size: 48, speed: 0.15, phase: 4.4, radius: '61% 39% 47% 53% / 55% 43% 57% 45%' },
  { color: '#f43f5e', light: '#fc96a6', x: 52, y: 50, size: 32, speed: 0.17, phase: 2.3, radius: '50% 50% 41% 59% / 60% 45% 55% 40%' },
]

/** where each card sits: centre in % of the stage, width in stage units */
type Slot = { x: number; y: number; w: string }
const LANDSCAPE: Slot[] = [
  { x: 35, y: 50, w: 'min(34cqw, 58cqh)' },
  { x: 67, y: 37, w: 'min(29cqw, 48cqh)' },
  { x: 65, y: 77, w: 'min(27cqw, 42cqh)' },
]
const PORTRAIT: Slot[] = [
  { x: 50, y: 29, w: 'min(78cqw, 50cqh)' },
  { x: 42, y: 66, w: 'min(62cqw, 40cqh)' },
  { x: 64, y: 89, w: 'min(56cqw, 36cqh)' },
]
const DEPTH = [1, 1.7, 2.4]

const TRACK = 225 // seconds
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const HOURS = [
  { label: '지금', Icon: Sun, temp: '23°' },
  { label: '15시', Icon: Sun, temp: '24°' },
  { label: '16시', Icon: CloudSun, temp: '24°' },
  { label: '17시', Icon: Cloud, temp: '22°' },
]

const GLASS: CSSProperties = {
  position: 'absolute',
  containerType: 'inline-size', // text inside sizes itself to the card (cqw = 1% of the card)
  borderRadius: '2.8cqmin',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, calc(var(--alpha) + 0.14)), rgba(255, 255, 255, var(--alpha)) 60%)',
  backdropFilter: 'blur(var(--blur)) saturate(170%)',
  WebkitBackdropFilter: 'blur(var(--blur)) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.38)',
  boxShadow: '0 1.6cqmin 5cqmin rgba(24, 10, 64, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  willChange: 'transform',
}
const icon = (size: number): CSSProperties => ({ width: `${size}cqw`, height: `${size}cqw` })

function GlassmorphismScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const blobs = useRef<(HTMLDivElement | null)[]>([])
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const bars = useRef<(HTMLDivElement | null)[]>([])
  const progress = useRef<HTMLDivElement>(null)
  const elapsed = useRef<HTMLSpanElement>(null)
  const rays = useRef<HTMLDivElement>(null)
  const pointer = usePointer(box)
  const size = useRef({ w: 0, h: 0 })
  const view = useRef({ x: 0, y: 0, second: -1 })

  // cards are laid out once per resize: side by side on wide stages, stacked on tall ones
  useEffect(() => {
    const el = box.current
    if (!el) return
    const layout = () => {
      const r = el.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
      const slots = r.width > 0 && r.height > 0 && r.width / r.height < 1.1 ? PORTRAIT : LANDSCAPE
      cards.current.forEach((card, i) => {
        if (!card) return
        card.style.left = `${slots[i].x}%`
        card.style.top = `${slots[i].y}%`
        card.style.width = slots[i].w
      })
    }
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLoop(
    box,
    ({ time, delta }) => {
      const p = pointer.current
      const { w, h } = size.current
      const v = view.current
      const tx = p.inside && w > 0 ? p.x / w - 0.5 : 0
      const ty = p.inside && h > 0 ? p.y / h - 0.5 : 0
      const k = delta > 0 ? 1 - Math.exp(-delta * 4) : 1
      v.x += (tx - v.x) * k
      v.y += (ty - v.y) * k

      // blobs drift, turn and squash; the pointer nudges them the other way
      BLOBS.forEach((b, i) => {
        const el = blobs.current[i]
        if (!el) return
        const t = time * b.speed
        const dx = Math.sin(t * 2.1 + b.phase) * 9 + Math.sin(t * 1.3 + b.phase * 2) * 4 - v.x * 4
        const dy = Math.cos(t * 1.7 + b.phase) * 8 - v.y * 4
        const sx = 1 + 0.18 * Math.sin(t * 3.1 + b.phase)
        const sy = 1 + 0.18 * Math.cos(t * 2.6 + b.phase * 1.3)
        el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(2)}cqw, ${dy.toFixed(2)}cqh) rotate(${(t * 40 + b.phase * 30).toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`
      })

      // cards bob gently and follow the pointer, the nearer ones a little more
      cards.current.forEach((el, i) => {
        if (!el) return
        const x = Math.sin(time * 0.6 + i * 1.1) * 0.6 + v.x * DEPTH[i] * 2.4
        const y = Math.sin(time * 0.9 + i * 1.9) * 1.2 + v.y * DEPTH[i] * 2.4
        const r = Math.sin(time * 0.5 + i * 2.3) * 0.8
        el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}cqmin, ${y.toFixed(2)}cqmin) rotate(${r.toFixed(2)}deg)`
      })

      // the music card plays along
      const pos = (84 + time) % TRACK
      if (progress.current) progress.current.style.transform = `scaleX(${(pos / TRACK).toFixed(4)})`
      const second = Math.floor(pos)
      if (elapsed.current && second !== v.second) {
        elapsed.current.textContent = fmt(second)
        v.second = second
      }
      bars.current.forEach((el, i) => {
        if (!el) return
        const level = (0.5 + 0.5 * Math.sin(time * (5 + i * 1.7) + i * 2)) * (0.65 + 0.35 * Math.sin(time * 1.3 + i))
        el.style.transform = `scaleY(${(0.2 + 0.8 * level).toFixed(3)})`
      })
      if (rays.current) rays.current.style.transform = `rotate(${((time * 12) % 360).toFixed(1)}deg)`
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  const vars = {
    containerType: 'size', // cq units follow the stage, not the window
    '--blur': `${params.blur * (thumb ? 0.5 : 1)}px`,
    '--alpha': (0.04 + (1 - params.transparency) * 0.4).toFixed(3),
  } as CSSProperties
  const place = (i: number): CSSProperties => ({ ...GLASS, left: `${LANDSCAPE[i].x}%`, top: `${LANDSCAPE[i].y}%`, width: LANDSCAPE[i].w, transform: 'translate(-50%, -50%)' })

  return (
    <div
      ref={box}
      className="@container relative size-full overflow-hidden text-white"
      style={{ ...vars, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)' }}
    >
      <div aria-hidden className="absolute inset-0">
        {BLOBS.map((b, i) => (
          <div
            key={b.color}
            ref={(el) => {
              blobs.current[i] = el
            }}
            className="absolute will-change-transform"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}cqmax`,
              aspectRatio: '1',
              borderRadius: b.radius,
              background: `radial-gradient(circle at 35% 30%, ${b.light} 0%, ${b.color} 55%, ${b.color} 100%)`,
              filter: 'blur(1cqmin)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* music player */}
      <div
        ref={(el) => {
          cards.current[0] = el
        }}
        style={place(0)}
      >
        <div className="flex flex-col" style={{ padding: '6cqw', gap: '4.5cqw' }}>
          <div className="flex items-center" style={{ gap: '5cqw' }}>
            <div
              aria-hidden
              className="relative shrink-0 overflow-hidden"
              style={{
                width: '27cqw',
                aspectRatio: '1',
                borderRadius: '4cqw',
                background: 'linear-gradient(135deg, #ff7eb3, #7c5cff 55%, #22d3ee)',
                boxShadow: '0 2cqw 5cqw rgba(20, 10, 60, 0.35)',
              }}
            >
              <div className="absolute rounded-full" style={{ inset: '22%', background: 'radial-gradient(circle, #ffe08a 0 30%, rgba(255, 224, 138, 0) 72%)' }} />
              <div className="absolute inset-x-0 bottom-0" style={{ height: '38%', background: 'linear-gradient(transparent, rgba(30, 10, 70, 0.55))' }} />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-white/70" style={{ fontSize: '4.2cqw' }}>
                지금 재생 중
              </p>
              <p className="truncate font-semibold" style={{ fontSize: '7cqw' }}>
                새벽 드라이브
              </p>
              <p className="truncate text-white/75" style={{ fontSize: '4.8cqw' }}>
                글래스 아워즈
              </p>
            </div>
            <div aria-hidden className="flex items-end self-start" style={{ height: '8cqw', gap: '1.2cqw' }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  ref={(el) => {
                    bars.current[i] = el
                  }}
                  className="h-full origin-bottom rounded-full bg-white/85"
                  style={{ width: '1.5cqw', transform: 'scaleY(0.5)' }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="relative overflow-hidden rounded-full bg-white/25" style={{ height: '1.6cqw' }}>
              <div ref={progress} className="absolute inset-0 origin-left rounded-full bg-white" style={{ transform: 'scaleX(0.37)' }} />
            </div>
            <div className="flex justify-between font-mono text-white/70" style={{ fontSize: '3.8cqw', marginTop: '2cqw' }}>
              <span ref={elapsed}>1:24</span>
              <span>{fmt(TRACK)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ gap: '9cqw' }}>
            <SkipBack style={icon(8)} fill="currentColor" />
            <div className="grid place-items-center rounded-full bg-white/25" style={{ width: '15cqw', height: '15cqw', border: '1px solid rgba(255, 255, 255, 0.45)' }}>
              <Pause style={icon(7)} fill="currentColor" />
            </div>
            <SkipForward style={icon(8)} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* weather */}
      <div
        ref={(el) => {
          cards.current[1] = el
        }}
        style={place(1)}
      >
        <div style={{ padding: '7cqw' }}>
          <div className="flex items-start justify-between">
            <div className="leading-tight">
              <p className="flex items-center font-medium" style={{ fontSize: '6cqw', gap: '1.5cqw' }}>
                <MapPin style={icon(5)} />
                서울
              </p>
              <p className="leading-none" style={{ fontSize: '22cqw', marginTop: '2cqw' }}>
                23°
              </p>
              <p className="text-white/75" style={{ fontSize: '4.6cqw', marginTop: '1.5cqw' }}>
                맑음 · 최고 26° 최저 17°
              </p>
            </div>
            <div aria-hidden className="relative shrink-0" style={{ width: '26cqw', aspectRatio: '1' }}>
              <div
                ref={rays}
                className="absolute inset-0"
                style={{
                  background: 'repeating-conic-gradient(rgba(255, 228, 120, 0.95) 0deg 7deg, transparent 7deg 30deg)',
                  maskImage: 'radial-gradient(circle closest-side, transparent 64%, #000 66%, #000 96%, transparent 98%)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{ inset: '22%', background: 'radial-gradient(circle at 35% 35%, #fff6b0, #ffd23f 55%, #ffab1f)', boxShadow: '0 0 6cqw rgba(255, 200, 60, 0.8)' }}
              />
            </div>
          </div>
          <div className="flex justify-between" style={{ marginTop: '5cqw', paddingTop: '4cqw', borderTop: '1px solid rgba(255, 255, 255, 0.25)' }}>
            {HOURS.map(({ label, Icon, temp }) => (
              <div key={label} className="flex flex-col items-center" style={{ gap: '1.5cqw' }}>
                <span className="text-white/70" style={{ fontSize: '4cqw' }}>
                  {label}
                </span>
                <Icon style={icon(6.5)} />
                <span className="font-medium" style={{ fontSize: '4.8cqw' }}>
                  {temp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* notification */}
      <div
        ref={(el) => {
          cards.current[2] = el
        }}
        style={place(2)}
      >
        <div className="flex items-center" style={{ padding: '5cqw', gap: '5cqw' }}>
          <div className="grid shrink-0 place-items-center rounded-full" style={{ width: '16cqw', height: '16cqw', background: 'linear-gradient(135deg, #34d399, #0ea5e9)' }}>
            <MessageCircle style={icon(8.5)} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-white/70" style={{ fontSize: '5cqw' }}>
              메시지 · 지금
            </p>
            <p className="truncate font-medium" style={{ fontSize: '6.4cqw' }}>
              새 메시지 2개
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'glassmorphism',
  name: '글래스모피즘',
  englishName: 'Glassmorphism',
  aliases: ['Frosted glass', 'Glass UI', '유리 질감'],
  description: '알록달록한 도형이 흐르는 배경 위로 반투명한 젖빛 유리 카드가 떠 있는 화면',
  context: '운영체제의 알림 센터와 위젯, 음악 앱 플레이어, 핀테크·대시보드 랜딩 페이지에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '마우스를 움직이면 카드와 배경이 서로 반대로 조금씩 움직여 유리 너머가 달리 보입니다.',
  traits: [
    { title: '뒤를 흐리게 비추는 유리', description: '카드 자체가 아니라 카드 뒤에 보이는 배경을 흐리게 합니다(backdrop-filter). 그래서 뒤의 도형이 움직이면 유리 속 색도 따라 번집니다.' },
    { title: '얇은 테두리와 반투명 흰색', description: '살짝 하얀 반투명 바탕, 1px 밝은 테두리, 부드러운 그림자를 함께 써야 유리판처럼 보입니다.' },
    { title: '선명한 색의 배경', description: '유리 효과는 뒤에 색이 풍부할 때만 살아납니다. 그래서 크고 화려한 색 덩어리를 배경에 둡니다.' },
  ],
  params: [
    { key: 'blur', label: '흐림 정도', min: 0, max: 40, step: 1, default: 18, unit: 'px' },
    { key: 'transparency', label: '유리 투명도', min: 0, max: 1, step: 0.05, default: 0.7 },
  ],
  Scene: GlassmorphismScene,
}
