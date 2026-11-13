import { useEffect, useRef } from 'react'
import { ChevronDownIcon, ClipboardListIcon, PaletteIcon, RocketIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const CARDS = [
  { title: '봄 산책길', minutes: 3, hue: 140 },
  { title: '바다 앞 카페', minutes: 5, hue: 195 },
  { title: '숲속 오두막', minutes: 4, hue: 95 },
  { title: '도시의 야경', minutes: 6, hue: 245 },
  { title: '작은 서점', minutes: 2, hue: 25 },
  { title: '노을 전망대', minutes: 4, hue: 330 },
]

const STEPS = [
  { title: '계획', text: '무엇을 만들지 정합니다', hue: 245, Icon: ClipboardListIcon },
  { title: '디자인', text: '화면과 흐름을 그립니다', hue: 320, Icon: PaletteIcon },
  { title: '출시', text: '세상에 내보냅니다', hue: 160, Icon: RocketIcon },
]

/**
 * How far each hero layer is pushed down per pixel scrolled. A layer pushed down by
 * 0.85 px per px only moves 0.15 px on screen: it looks far away.
 */
const LAYERS = [
  { key: 'sun', rate: 0.85 },
  { key: 'far', rate: 0.62 },
  { key: 'title', rate: 0.5 },
  { key: 'mid', rate: 0.36 },
  { key: 'near', rate: 0.12 },
] as const

const SKY = 'linear-gradient(180deg, #221d5a 0%, #5b3e98 42%, #dd7799 76%, #ffc79b 100%)'
const FAR = 'M0 250 L90 190 L170 230 L290 120 L400 210 L520 150 L610 200 L720 100 L840 190 L950 140 L1060 210 L1200 130 V400 H0 Z'
const MID = 'M0 290 C120 230 220 230 340 270 S560 330 700 260 S960 210 1200 270 V400 H0 Z'
const NEAR =
  'M0 330 C150 290 260 300 380 330 S640 370 820 320 S1080 290 1200 320 V400 H0 Z M110 318 l20 -62 l20 62 Z M150 322 l14 -44 l14 44 Z M930 316 l18 -56 l18 56 Z M972 320 l13 -40 l13 40 Z'

const AUTO_AFTER = 4 // seconds without touching the page before it scrolls itself again
const REVEAL_TIME = 0.65

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (p: number) => 1 - (1 - p) ** 3
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

type Stop = { y: number; move: number; hold: number }

/** Scroll position at time t on a loop that rests at each stop, then eases on to the next. */
function along(t: number, stops: Stop[]) {
  const total = stops.reduce((sum, s) => sum + s.move + s.hold, 0)
  let u = ((t % total) + total) % total
  for (let i = 0; i < stops.length; i++) {
    const here = stops[i]
    const next = stops[(i + 1) % stops.length]
    if (u < here.hold) return here.y
    u -= here.hold
    if (u < next.move) return mix(here.y, next.y, easeInOut(u / next.move))
    u -= next.move
  }
  return stops[0].y
}

/**
 * A small web page with its own scroll container. Every effect reads one number,
 * the scroll position, and writes transforms through refs; the reveal cards also
 * use an IntersectionObserver and then animate on scene time.
 */
function ScrollEffectsScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const reveal = useRef<HTMLElement>(null)
  const sticky = useRef<HTMLElement>(null)
  const layers = useRef<Partial<Record<string, HTMLElement | SVGSVGElement | null>>>({})
  const hint = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const steps = useRef<(HTMLLIElement | null)[]>([])
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const icons = useRef<(SVGSVGElement | null)[]>([])
  const stepBar = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const percent = useRef<HTMLSpanElement>(null)
  const chip = useRef<HTMLSpanElement>(null)

  const now = useRef(0)
  const lastTouch = useRef(-AUTO_AFTER)
  const autoY = useRef<number | null>(null)
  const inView = useRef<boolean[]>(CARDS.map(() => false))
  const shownAt = useRef<(number | undefined)[]>([])

  const layer = (key: string) => (el: HTMLElement | SVGSVGElement | null) => {
    layers.current[key] = el
  }

  const redraw = useLoop(
    box,
    ({ time, delta }) => {
      now.current = time
      const sc = scroller.current
      const heroEl = hero.current
      const revealEl = reveal.current
      const stickyEl = sticky.current
      if (!sc || !heroEl || !revealEl || !stickyEl) return
      const vh = sc.clientHeight
      const max = Math.max(0, sc.scrollHeight - vh)
      const stickyTop = stickyEl.offsetTop
      const stickyRange = Math.max(1, stickyEl.offsetHeight - vh)

      // nobody is scrolling: glide down through the three sections, then back up
      if ((thumb || time - lastTouch.current > AUTO_AFTER) && max > 0) {
        const stops: Stop[] = [
          { y: 0, move: 2.6, hold: 1.4 },
          { y: revealEl.offsetTop + (revealEl.offsetHeight - vh) / 2, move: 2.2, hold: 1.6 },
          { y: stickyTop + stickyRange / 6, move: 1.6, hold: 1 },
          { y: stickyTop + stickyRange / 2, move: 1.2, hold: 1 },
          { y: stickyTop + (stickyRange * 5) / 6, move: 1.2, hold: 1 },
          { y: max, move: 1.2, hold: 1.4 },
        ].map((s) => ({ ...s, y: Math.min(max, Math.max(0, s.y)) }))
        // follow the path smoothly instead of jumping when the demo takes over mid-page
        let ay = autoY.current ?? sc.scrollTop
        ay += (along(time, stops) - ay) * (1 - Math.exp(-delta * 5))
        ay = Math.min(max, Math.max(0, ay))
        autoY.current = ay
        if (Math.abs(sc.scrollTop - ay) >= 0.5) sc.scrollTop = ay
      } else {
        autoY.current = null
      }
      const y = sc.scrollTop

      // 1. parallax: each layer is pushed down by its own share of the scroll
      const heroH = heroEl.offsetHeight
      const hy = Math.min(y, heroH)
      for (const { key, rate } of LAYERS) {
        const el = layers.current[key]
        if (el) el.style.transform = `translate3d(0, ${hy * Math.min(0.95, rate * params.parallaxDepth)}px, 0)`
      }
      const title = layers.current.title
      if (title) title.style.opacity = String(1 - clamp01(hy / (heroH * 0.7)))
      if (hint.current) {
        hint.current.style.opacity = String(1 - clamp01(y / (vh * 0.25)))
        hint.current.style.transform = `translateY(${Math.sin(time * 3.2) * 4}px)`
      }

      // 2. reveal: a card that came into view rises in; several at once rise one after another
      let batch = 0
      cards.current.forEach((card, i) => {
        if (!card) return
        if (!inView.current[i]) shownAt.current[i] = undefined
        else if (shownAt.current[i] === undefined) {
          // while paused there is no time to animate in, so show the end state
          shownAt.current[i] = paused ? time - REVEAL_TIME : time + batch++ * params.revealStagger
        }
        const at = shownAt.current[i]
        const p = at === undefined ? 0 : easeOut(clamp01((time - at) / REVEAL_TIME))
        card.style.opacity = String(p)
        card.style.transform = `translate3d(0, ${(1 - p) * params.revealDistance}px, 0) scale(${0.96 + 0.04 * p})`
      })

      // 3. sticky: the panel stays put while the section scrolls past; its progress picks the step
      const sp = clamp01((y - stickyTop) / stickyRange)
      const s3 = sp * STEPS.length
      const active = Math.min(STEPS.length - 1, Math.floor(s3))
      steps.current.forEach((el, j) => {
        if (!el) return
        el.style.opacity = j === active ? '1' : '0.38'
        el.style.transform = `translateX(${j === active ? 4 : 0}px)`
        el.style.setProperty('--dot', j === active ? `hsl(${STEPS[j].hue} 65% 52%)` : '#c4c4cc')
      })
      panels.current.forEach((el, j) => {
        if (!el) return
        const enter = j === 0 ? 1 : smoothstep(j - 0.12, j + 0.12, s3)
        const leave = j === STEPS.length - 1 ? 1 : 1 - smoothstep(j + 0.88, j + 1.12, s3)
        const v = enter * leave
        const dir = s3 < j + 0.5 ? 1 : -1
        el.style.opacity = String(v)
        el.style.transform = `translate3d(0, ${(1 - v) * dir * 18}px, 0) scale(${0.94 + 0.06 * v})`
        const icon = icons.current[j]
        if (icon) icon.style.transform = `rotate(${(s3 - j - 0.5) * 24}deg)`
      })
      if (stepBar.current) stepBar.current.style.transform = `scaleX(${sp})`

      // the reading-progress bar: how far down the whole page we are
      const total = max > 0 ? y / max : 0
      if (bar.current) bar.current.style.transform = `scaleX(${total})`
      if (percent.current) percent.current.textContent = `${Math.round(total * 100)}%`
      if (chip.current) {
        const center = y + vh / 2
        const label =
          center < heroH ? '01 패럴랙스' : center < stickyTop ? '02 나타나기' : center < stickyTop + stickyEl.offsetHeight ? '03 고정 섹션' : '끝'
        if (chip.current.textContent !== label) chip.current.textContent = label
      }
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  useEffect(() => {
    const sc = scroller.current
    if (!sc) return
    const touch = () => {
      lastTouch.current = now.current
    }
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    for (const type of inputs) sc.addEventListener(type, touch, { passive: true })
    // scroll-linked layers follow the page even while the scene is paused
    sc.addEventListener('scroll', redraw, { passive: true })

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver === 'undefined') {
      inView.current = CARDS.map(() => true)
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const i = cards.current.indexOf(entry.target as HTMLElement)
            if (i < 0) continue
            if (entry.isIntersecting) inView.current[i] = true
            // only leaving through the bottom resets a card, so it rises again on the next way down
            else if (entry.boundingClientRect.top > (entry.rootBounds?.top ?? 0)) inView.current[i] = false
          }
          redraw()
        },
        { root: sc, rootMargin: '0px 0px -8% 0px' },
      )
      for (const card of cards.current) if (card) observer.observe(card)
    }

    return () => {
      for (const type of inputs) sc.removeEventListener(type, touch)
      sc.removeEventListener('scroll', redraw)
      observer?.disconnect()
    }
  }, [redraw])

  const eyebrow = 'font-mono text-[clamp(9px,1.8cqmin,13px)] tracking-[0.2em]'

  return (
    <div ref={box} className="@container relative size-full overflow-hidden bg-[#1b1640]" style={{ containerType: 'size' }}>
      <div
        ref={scroller}
        tabIndex={thumb ? -1 : 0}
        aria-label="스크롤해 볼 수 있는 예시 페이지"
        className={cn(
          'absolute inset-0 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset',
          thumb ? '[scrollbar-width:none]' : '[scrollbar-width:thin]',
        )}
      >
        {/* 1. parallax hero: the layers sit in one box but slide at different speeds */}
        <section ref={hero} className="relative overflow-hidden" style={{ height: '100cqh', background: SKY }}>
          <div
            ref={layer('sun')}
            className="absolute rounded-full"
            style={{
              left: '64%',
              top: '20%',
              width: 'clamp(28px, 15cqmin, 120px)',
              aspectRatio: '1',
              background: 'radial-gradient(circle, #fff4c8 0%, #ffd38c 55%, #ffb37c 100%)',
              boxShadow: '0 0 60px 18px rgba(255, 196, 140, 0.45)',
            }}
          />
          <svg ref={layer('far')} aria-hidden viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[62%] w-full">
            <path d={FAR} fill="#8a6fbd" />
          </svg>
          <svg ref={layer('mid')} aria-hidden viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[46%] w-full">
            <path d={MID} fill="#57449a" />
          </svg>
          <div ref={layer('title')} className="absolute inset-x-0 top-[16%] px-4 text-center text-white">
            {!thumb && <p className={cn(eyebrow, 'text-white/70')}>01 · PARALLAX</p>}
            <h2 className="mt-1 font-bold tracking-tight [text-shadow:0_2px_18px_rgba(30,10,60,0.55)]" style={{ fontSize: 'clamp(16px, 7.5cqmin, 60px)' }}>
              스크롤해 보세요
            </h2>
            <p className="mt-1 text-white/80" style={{ fontSize: 'clamp(10px, 2.4cqmin, 18px)' }}>
              멀리 있는 것일수록 천천히 움직입니다
            </p>
          </div>
          <svg ref={layer('near')} aria-hidden viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[30%] w-full">
            <path d={NEAR} fill="#2b2258" />
          </svg>
          {!thumb && (
            <div className="absolute inset-x-0 bottom-[3%] flex justify-center text-white/80">
              <div ref={hint}>
                <ChevronDownIcon className="size-6" />
              </div>
            </div>
          )}
        </section>

        {/* 2. reveal on enter */}
        <section ref={reveal} className="bg-[#f6f4fb] px-[6cqw] py-[9cqh] text-neutral-900">
          <div className="mx-auto max-w-[880px]">
            {!thumb && <p className={cn(eyebrow, 'text-violet-600')}>02 · REVEAL</p>}
            <h2 className="mt-1 font-bold tracking-tight" style={{ fontSize: 'clamp(14px, 5cqmin, 38px)' }}>
              화면에 들어오면 떠오릅니다
            </h2>
            <div className="mt-[4cqh] grid grid-cols-2 gap-[clamp(8px,2.2cqmin,18px)] @xl:grid-cols-3">
              {CARDS.map((card, i) => (
                <article
                  key={card.title}
                  ref={(el) => {
                    cards.current[i] = el
                  }}
                  className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 will-change-transform"
                >
                  <div
                    style={{
                      height: 'clamp(36px, 15cqh, 120px)',
                      background: `linear-gradient(135deg, hsl(${card.hue} 75% 70%), hsl(${card.hue + 40} 65% 50%))`,
                    }}
                  />
                  <div className="flex flex-col gap-0.5 p-[clamp(6px,1.6cqmin,14px)]">
                    <p className="truncate font-semibold" style={{ fontSize: 'clamp(10px, 2.3cqmin, 16px)' }}>
                      {card.title}
                    </p>
                    <p className="text-neutral-500" style={{ fontSize: 'clamp(9px, 1.8cqmin, 13px)' }}>
                      읽는 데 {card.minutes}분
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. sticky section: three screens tall, the panel inside stays pinned */}
        <section ref={sticky} className="relative bg-white text-neutral-900" style={{ height: '300cqh' }}>
          <div className="sticky top-0 flex items-center overflow-hidden" style={{ height: '100cqh' }}>
            <div className="mx-auto grid w-full max-w-[880px] items-center gap-[3cqh] px-[6cqw] @lg:grid-cols-[1fr_1.15fr] @lg:gap-[5cqw]">
              <div>
                {!thumb && (
                  <>
                    <p className={cn(eyebrow, 'text-violet-600')}>03 · STICKY</p>
                    <h2 className="mt-1 font-bold tracking-tight" style={{ fontSize: 'clamp(14px, 4.6cqmin, 34px)' }}>
                      패널은 멈추고 내용만 바뀝니다
                    </h2>
                  </>
                )}
                <ol className={cn('flex flex-col gap-[clamp(4px,1.6cqh,14px)]', !thumb && 'mt-[2.5cqh]')}>
                  {STEPS.map((step, j) => (
                    <li
                      key={step.title}
                      ref={(el) => {
                        steps.current[j] = el
                      }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="grid shrink-0 place-items-center rounded-full font-mono text-white"
                        style={{
                          background: 'var(--dot, #c4c4cc)',
                          width: 'clamp(16px, 4.4cqmin, 32px)',
                          height: 'clamp(16px, 4.4cqmin, 32px)',
                          fontSize: 'clamp(9px, 2cqmin, 14px)',
                        }}
                      >
                        {j + 1}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-semibold" style={{ fontSize: 'clamp(11px, 2.6cqmin, 18px)' }}>
                          {step.title}
                        </span>
                        <span className="hidden text-neutral-500 @lg:block" style={{ fontSize: 'clamp(9px, 1.9cqmin, 13px)' }}>
                          {step.text}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5" style={{ height: 'clamp(60px, 42cqh, 320px)' }}>
                {STEPS.map((step, j) => (
                  <div
                    key={step.title}
                    ref={(el) => {
                      panels.current[j] = el
                    }}
                    className="absolute inset-0 grid place-items-center"
                    style={{ background: `linear-gradient(135deg, hsl(${step.hue} 80% 93%), hsl(${step.hue + 30} 70% 80%))` }}
                  >
                    <div className="flex flex-col items-center gap-[1.5cqh]" style={{ color: `hsl(${step.hue} 55% 38%)` }}>
                      <step.Icon
                        ref={(el: SVGSVGElement | null) => {
                          icons.current[j] = el
                        }}
                        strokeWidth={1.6}
                        style={{ width: 'clamp(22px, 12cqmin, 90px)', height: 'clamp(22px, 12cqmin, 90px)' }}
                      />
                      <span className="font-mono font-medium" style={{ fontSize: 'clamp(9px, 2cqmin, 14px)' }}>
                        STEP {j + 1} / {STEPS.length}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="absolute inset-x-[8%] bottom-[9%] h-[clamp(3px,0.8cqh,6px)] overflow-hidden rounded-full bg-black/10">
                  <div ref={stepBar} className="h-full origin-left rounded-full bg-neutral-900/70" style={{ transform: 'scaleX(0)' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid place-items-center bg-[#1b1640] px-6 text-center text-white" style={{ height: '55cqh' }}>
          <div>
            <p className="font-bold" style={{ fontSize: 'clamp(14px, 4.4cqmin, 32px)' }}>
              끝까지 내려왔습니다
            </p>
            <p className="mt-1 text-white/65" style={{ fontSize: 'clamp(10px, 2.2cqmin, 16px)' }}>
              맨 위 진행 막대가 가득 찼나요?
            </p>
          </div>
        </section>
      </div>

      {/* reading progress, laid over the page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[clamp(2px,0.7cqh,4px)] bg-white/15">
        <div
          ref={bar}
          className="h-full origin-left"
          style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b)', transform: 'scaleX(0)' }}
        />
      </div>
      {!thumb && (
        <div aria-hidden className="pointer-events-none absolute top-3 right-5 left-3 z-20 flex justify-between font-mono text-[11px] text-white">
          <span ref={chip} className="rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm" />
          <span ref={percent} className="rounded-full bg-black/55 px-2.5 py-1 tabular-nums backdrop-blur-sm" />
        </div>
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'scroll-effects',
  group: 'motion',
  name: '스크롤 연동',
  englishName: 'Scroll Effects',
  aliases: ['Scroll-driven animation', 'Parallax', 'Scroll reveal', 'Sticky section', '스크롤 애니메이션'],
  description: '페이지를 내리는 만큼 배경이 다른 속도로 움직이고, 카드가 떠오르고, 고정된 판의 내용이 바뀌는 스크롤 연동 애니메이션',
  context: '제품 소개 페이지, 브랜드 캠페인 사이트, 긴 글의 읽기 진행 막대와 단계별 설명 화면에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '무대 안을 직접 스크롤해 보세요. 4초 동안 손대지 않으면 저절로 위아래로 스크롤합니다.',
  traits: [
    {
      title: '패럴랙스: 층마다 다른 속도',
      description:
        '스크롤 위치(scrollTop)에 층마다 다른 비율을 곱해 transform으로 밀어 줍니다. 먼 산과 해는 화면에서 거의 움직이지 않고 가까운 언덕은 그대로 지나가 깊이가 생깁니다.',
    },
    {
      title: '나타나기: 들어오는 순간에 시작',
      description:
        'IntersectionObserver가 "카드가 화면에 들어왔다"고 알려 주면 그때부터 투명도와 위치를 바꿉니다. 함께 들어온 카드는 시차를 두어 하나씩 떠오르고, 아래로 다시 나가면 처음 상태로 돌아갑니다.',
    },
    {
      title: '고정 섹션과 진행률',
      description:
        'position: sticky인 판은 섹션을 지나는 동안 멈춰 있고, 섹션 안에서 얼마나 내려왔는지(0~1)로 단계를 고릅니다. 맨 위 막대도 같은 방식으로 페이지 전체 진행률을 보여 줍니다.',
    },
  ],
  params: [
    { key: 'parallaxDepth', label: '패럴랙스 깊이', min: 0, max: 1.5, step: 0.1, default: 1, unit: '×' },
    { key: 'revealDistance', label: '나타나는 거리', min: 0, max: 120, step: 4, default: 48, unit: 'px' },
    { key: 'revealStagger', label: '나타나는 시차', min: 0, max: 0.4, step: 0.02, default: 0.12, unit: '초' },
  ],
  Scene: ScrollEffectsScene,
}
