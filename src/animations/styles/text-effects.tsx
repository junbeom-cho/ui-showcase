import { useRef, useState, type ReactNode } from 'react'
import { seeded } from '../engine/noise'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const SENTENCES = ['안녕하세요, 반갑습니다', '한 글자씩 또박또박', '지우고 다시 씁니다']
const PHRASES = ['비밀 메시지를 찾았습니다', 'ACCESS GRANTED', '글자가 제자리를 찾습니다']
const TICKER = ['오늘만 무료 배송', 'NEW ARRIVALS', '신상품 30% 할인', '첫 주문 쿠폰 증정', 'LIMITED EDITION', '주말 특가']

const MAX_CHARS = 24
const GLYPHS = '!<>-_/[]{}=+*^?#%&$@'
const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const HANGUL_START = 0xac00
const HANGUL_COUNT = 11172

const TYPE_HOLD = 1.6 // seconds the finished sentence stays
const TYPE_GAP = 0.4 // empty line before the next sentence
const DELETE_RATE = 2.5 // deleting is this many times faster than typing
const SETTLE_HOLD = 2.2 // seconds a decoded phrase stays before the next one scrambles in

const PAD = 'clamp(14px, 6cqw, 72px)'
const SIZE = 'clamp(14px, 4.6cqmin, 40px)'
const ACCENT = '#5eead4'

const isHangul = (ch: string) => {
  const c = ch.charCodeAt(0)
  return c >= HANGUL_START && c < HANGUL_START + HANGUL_COUNT
}

/** The strings shown while typing `text` key by key. Hangul syllables build up: ㅇ → 아 → 안. */
function keystrokes(text: string): string[] {
  const out: string[] = []
  let done = ''
  for (const ch of text) {
    if (isHangul(ch)) {
      const code = ch.charCodeAt(0) - HANGUL_START
      const initial = Math.floor(code / 588)
      const vowel = Math.floor((code % 588) / 28)
      out.push(done + CHOSEONG[initial])
      if (code % 28) out.push(done + String.fromCharCode(HANGUL_START + initial * 588 + vowel * 28))
    }
    done += ch
    out.push(done)
  }
  return out
}

/** What the typewriter shows at `time`, and whether a key is being pressed (the caret stays solid then). */
function typewriter(time: number, sentences: string[], rate: number) {
  const plans = sentences.map((s) => {
    const strokes = keystrokes(s)
    const chars = [...s]
    const type = strokes.length / rate
    const erase = chars.length / (rate * DELETE_RATE)
    return { strokes, chars, type, erase, total: type + TYPE_HOLD + erase + TYPE_GAP }
  })
  let t = time % plans.reduce((sum, p) => sum + p.total, 0)
  for (const p of plans) {
    if (t >= p.total) {
      t -= p.total
      continue
    }
    if (t < p.type) return { text: p.strokes[Math.min(p.strokes.length - 1, Math.floor(t * rate))], typing: true }
    t -= p.type
    if (t < TYPE_HOLD) return { text: p.chars.join(''), typing: false }
    t -= TYPE_HOLD
    if (t < p.erase) return { text: p.chars.slice(0, p.chars.length - Math.floor(t * rate * DELETE_RATE)).join(''), typing: true }
    return { text: '', typing: false }
  }
  return { text: '', typing: false }
}

type Glyph = { ch: string; state: 'busy' | 'fresh' | 'done' }

/**
 * Every unsettled letter shows a random glyph that changes 18 times a second (seeded
 * by the time bucket, so a paused frame stays still). Letters settle left to right.
 */
function scramble(time: number, phrases: string[], length: number): Glyph[] {
  const per = length + SETTLE_HOLD
  const index = Math.floor(time / per) % phrases.length
  const t = time % per
  const chars = [...phrases[index]].slice(0, MAX_CHARS)
  const n = chars.length
  const bucket = Math.floor(time * 18)
  return chars.map((ch, i): Glyph => {
    const settleAt = length * (0.25 + 0.75 * (n > 1 ? i / (n - 1) : 1))
    if (ch === ' ' || t >= settleAt) return { ch, state: t - settleAt < 0.3 ? 'fresh' : 'done' }
    const r = seeded(bucket * 1009 + i * 31 + index)()
    // a Hangul slot gets a random syllable and any other slot a symbol, so the line keeps its width
    const fake = isHangul(ch) ? String.fromCharCode(HANGUL_START + Math.floor(r * HANGUL_COUNT)) : GLYPHS[Math.floor(r * GLYPHS.length)]
    return { ch: fake, state: 'busy' }
  })
}

function Row({ label, thumb, children }: { label: string; thumb?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[clamp(2px,1cqh,8px)]">
      {!thumb && <p className="font-mono text-[clamp(9px,1.7cqmin,12px)] tracking-[0.18em] text-white/45 uppercase">{label}</p>}
      {children}
    </section>
  )
}

/**
 * Three text effects side by side, all drawn from scene time: a typewriter, a
 * scramble that decodes into the real text, and an endless ticker.
 */
function TextEffectsScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const typed = useRef<HTMLSpanElement>(null)
  const caret = useRef<HTMLSpanElement>(null)
  const cells = useRef<(HTMLSpanElement | null)[]>([])
  const track = useRef<HTMLDivElement>(null)
  const firstCopy = useRef<HTMLDivElement>(null)
  const hovered = useRef(false)
  const flow = useRef({ offset: 0, pace: 1 })
  const lead = useRef<{ type: number; decode: number } | null>(null)
  const [custom, setCustom] = useState('')

  const own = custom.trim()
  const sentences = own ? [own] : SENTENCES
  const phrases = own ? [own] : PHRASES
  const ticker = own ? [own, ...TICKER] : TICKER

  useLoop(
    box,
    ({ time, delta }) => {
      // a scene that starts paused (thumbnail, reduced motion) shows finished text, not a lone ㅇ and noise
      lead.current ??= paused
        ? { type: keystrokes(sentences[0]).length / params.typeSpeed + 0.5, decode: params.scrambleLength + 0.6 }
        : { type: 0, decode: 0 }

      // 1. typewriter: the caret blinks only while no key is pressed
      const tw = typewriter(time + lead.current.type, sentences, params.typeSpeed)
      if (typed.current && typed.current.textContent !== tw.text) typed.current.textContent = tw.text
      if (caret.current) caret.current.style.opacity = tw.typing || Math.floor(time / 0.5) % 2 === 0 ? '1' : '0'

      // 2. scramble
      const glyphs = scramble(time + lead.current.decode, phrases, params.scrambleLength)
      cells.current.forEach((cell, i) => {
        if (!cell) return
        const g = glyphs[i]
        const text = g ? g.ch : ''
        if (cell.textContent !== text) cell.textContent = text
        cell.style.color = g?.state === 'busy' ? ACCENT : g?.state === 'fresh' ? '#ffffff' : '#e4e4e7'
        cell.style.opacity = g?.state === 'busy' ? '0.75' : '1'
        cell.style.textShadow = g?.state === 'fresh' ? `0 0 12px ${ACCENT}` : 'none'
      })

      // 3. ticker: slide left, and after exactly one copy's width jump back; the next copy hides the seam
      const f = flow.current
      f.pace += ((hovered.current ? 0 : 1) - f.pace) * (1 - Math.exp(-delta * 7))
      f.offset += delta * params.tickerSpeed * f.pace
      const width = firstCopy.current?.offsetWidth ?? 0
      if (width > 0) f.offset %= width
      if (track.current) track.current.style.transform = `translate3d(${-f.offset}px, 0, 0)`
    },
    { paused, speed: params.speed ?? 1, redrawKey: `${JSON.stringify(params)}|${own}` },
  )

  return (
    <div
      ref={box}
      className="@container relative flex size-full flex-col justify-center overflow-hidden bg-[#111215] text-white"
      style={{ containerType: 'size', paddingInline: PAD, gap: 'clamp(10px, 5cqh, 40px)' }}
    >
      <Row label="01 · 타자기 typewriter" thumb={thumb}>
        <p className="font-semibold whitespace-pre" style={{ fontSize: SIZE, lineHeight: 1.35 }}>
          <span className="sr-only">{sentences.join(' / ')}</span>
          <span ref={typed} aria-hidden />
          <span
            ref={caret}
            aria-hidden
            className="ml-[0.06em] inline-block w-[0.08em] rounded-full align-[-0.18em]"
            style={{ height: '1.1em', background: ACCENT }}
          />
        </p>
      </Row>

      <Row label="02 · 글자 해독 scramble" thumb={thumb}>
        <p
          className="font-medium whitespace-pre"
          style={{ fontSize: SIZE, lineHeight: 1.35, fontFamily: "'IBM Plex Mono', 'IBM Plex Sans KR', monospace" }}
        >
          <span className="sr-only">{phrases.join(' / ')}</span>
          {Array.from({ length: MAX_CHARS }, (_, i) => (
            <span
              key={i}
              aria-hidden
              ref={(el) => {
                cells.current[i] = el
              }}
            />
          ))}
        </p>
      </Row>

      <Row label="03 · 흐르는 띠 marquee" thumb={thumb}>
        <div
          onPointerEnter={() => (hovered.current = true)}
          onPointerLeave={() => (hovered.current = false)}
          className="overflow-hidden bg-[#c8f135] text-[#141414]"
          style={{
            marginInline: `calc(-1 * ${PAD})`,
            paddingBlock: 'clamp(5px, 2.2cqh, 16px)',
            maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          }}
        >
          <span className="sr-only">{ticker.join(', ')}</span>
          {/* three identical copies in a row: one is always wider than the gap a wrap could open */}
          <div ref={track} aria-hidden className="flex w-max will-change-transform">
            {[0, 1, 2].map((copy) => (
              <div key={copy} ref={copy === 0 ? firstCopy : undefined} className="flex shrink-0 items-center">
                {ticker.map((item, i) => (
                  <span
                    key={`${i}-${item}`}
                    className="flex items-center font-extrabold whitespace-nowrap"
                    style={{ fontSize: 'clamp(13px, 4cqmin, 34px)' }}
                  >
                    <span className="px-[0.9em]">{item}</span>
                    <span className="text-[0.55em]">●</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Row>

      {!thumb && (
        <input
          value={custom}
          maxLength={20}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="내 문장을 넣어 보세요"
          aria-label="효과를 줄 문장"
          className="absolute bottom-[clamp(8px,3cqh,20px)] left-1/2 w-[min(18rem,80cqw)] -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-center text-sm text-white outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
        />
      )}
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'text-effects',
  group: 'motion',
  name: '글자 효과',
  englishName: 'Text Effects',
  aliases: ['Typewriter', 'Text scramble', 'Marquee', 'Ticker', '타이핑 효과'],
  description: '글자가 한 자씩 찍히고, 뒤섞인 기호가 진짜 글자로 풀리고, 띠 위의 문구가 끝없이 흘러가는 글자 애니메이션',
  context: '챗봇의 답변 출력, 해커 느낌의 로딩 문구, 쇼핑몰과 뉴스 사이트 상단의 공지 띠에서 자주 봅니다.',
  technique: 'DOM·CSS',
  interaction: '흐르는 띠에 마우스를 올리면 멈춥니다. 아래 칸에 문장을 쓰면 세 효과가 그 문장으로 바뀝니다.',
  traits: [
    {
      title: '타자기: 보여 줄 길이만 늘리기',
      description:
        '문장 전체를 미리 알고, 시간에 따라 앞에서부터 몇 글자를 보여 줄지만 바꿉니다. 한글은 ㅇ→아→안처럼 자모가 조합되는 단계까지 보여 주면 실제로 치는 느낌이 나고, 커서는 칠 때는 켜져 있다가 쉴 때만 깜빡입니다.',
    },
    {
      title: '스크램블: 무작위에서 제자리로',
      description:
        '아직 자리를 못 찾은 글자는 매 순간 무작위 글자로 바뀌고, 정해진 시각이 지나면 왼쪽부터 차례로 진짜 글자로 굳습니다. 한글 자리에는 한글, 영문 자리에는 기호를 넣어 줄 길이가 흔들리지 않게 합니다.',
    },
    {
      title: '마키: 복사본으로 이음매 숨기기',
      description:
        '같은 내용을 여러 벌 이어 붙여 왼쪽으로 옮기다가, 정확히 한 벌의 폭만큼 가면 처음 위치로 되돌립니다. 바로 뒤의 복사본이 같은 자리에 와 있어 끝없이 흐르는 것처럼 보입니다.',
    },
  ],
  params: [
    { key: 'typeSpeed', label: '타자 속도', min: 3, max: 30, step: 1, default: 12, unit: '타/초' },
    { key: 'scrambleLength', label: '스크램블 길이', min: 0.2, max: 3, step: 0.1, default: 1.2, unit: '초' },
    { key: 'tickerSpeed', label: '띠 속도', min: 10, max: 300, step: 10, default: 90, unit: 'px/초' },
  ],
  Scene: TextEffectsScene,
}
