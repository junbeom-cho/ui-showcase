import { useRef, useState } from 'react'
import { BookmarkIcon, CheckIcon, CopyIcon, HeartIcon, LoaderIcon, SendIcon, StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoop } from '../engine/use-loop'
import type { AnimationStyle, SceneProps } from '../types'

const WIDGETS = ['like', 'save', 'toggle', 'copy', 'send', 'rate'] as const
type Widget = (typeof WIDGETS)[number]

const LABELS: Record<Widget, string> = {
  like: '좋아요',
  save: '저장',
  toggle: '스위치',
  copy: '복사',
  send: '보내기',
  rate: '별점',
}

/** 0 → 1 over `length` seconds after `start`; 1 before anything happened. */
const since = (now: number, start: number | undefined, length: number) =>
  start === undefined ? 1 : Math.min(1, Math.max(0, (now - start) / length))

/** Rises past 1 and settles back: the "pop" of a tap. amount = how far it overshoots. */
const pop = (p: number, amount: number) => 1 + Math.sin(Math.min(p, 1) * Math.PI) * amount * (1 - p * 0.4)

const easeOut = (p: number) => 1 - (1 - p) ** 3

const AUTO_AFTER = 4 // seconds without a click before the demo plays itself again
const AUTO_EVERY = 1.3

/**
 * Six small tap responses. Each remembers when it fired (in scene time) and every
 * frame draws itself from "seconds since": pausing freezes them mid-motion.
 */
function MicroInteractionsScene({ params, paused, thumb }: SceneProps) {
  const box = useRef<HTMLDivElement>(null)
  const el = useRef<Partial<Record<string, HTMLElement | SVGElement | null>>>({})
  const fired = useRef<Partial<Record<Widget, number>>>({})
  const now = useRef(0)
  const lastTouch = useRef(-AUTO_AFTER)
  const lastAuto = useRef(-1)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(24)
  const [saved, setSaved] = useState(false)
  const [on, setOn] = useState(false)
  const [rating, setRating] = useState(3)
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [copied, setCopied] = useState(false)

  const ref = (key: string) => (node: HTMLElement | SVGElement | null) => {
    el.current[key] = node
  }

  const fire = (w: Widget, byUser: boolean) => {
    fired.current[w] = now.current
    if (byUser) lastTouch.current = now.current
    if (w === 'like') {
      setLiked((v) => !v)
      setLikes((n) => (liked ? n - 1 : n + 1))
    }
    if (w === 'save') setSaved((v) => !v)
    if (w === 'toggle') setOn((v) => !v)
    if (w === 'copy') setCopied(true)
    if (w === 'send') setSendState('sending')
    if (w === 'rate') setRating((r) => (r % 5) + 1)
  }

  useLoop(
    box,
    ({ time }) => {
      now.current = time
      const x = params.exaggeration
      const f = fired.current
      const set = (key: string, style: Partial<CSSStyleDeclaration>) => {
        const node = el.current[key]
        if (node) Object.assign(node.style, style)
      }

      // nobody is clicking: tap the widgets one after another so the motion is always visible
      if (thumb || time - lastTouch.current > AUTO_AFTER) {
        const slot = Math.floor(time / AUTO_EVERY)
        if (slot !== lastAuto.current) {
          lastAuto.current = slot
          fire(WIDGETS[slot % WIDGETS.length], false)
        }
      }

      // like: the heart pops and a ring of dots bursts out and fades
      const pl = since(time, f.like, 0.6)
      set('heart', { transform: `scale(${pop(pl, 0.45 * x)})` })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const d = easeOut(pl) * 26 * (0.6 + 0.4 * x)
        set(`dot${i}`, {
          transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(${1 - pl})`,
          opacity: String(liked && pl < 1 ? 1 - pl : 0),
        })
      }

      // save: the bookmark drops in from above with a little bounce
      const ps = since(time, f.save, 0.5)
      set('bookmark', { transform: `translateY(${(1 - easeOut(ps)) * -10 * x}px) scaleY(${pop(ps, 0.25 * x)})` })

      // toggle: the knob stretches while it travels, then snaps round again
      const pt = since(time, f.toggle, 0.35)
      const travel = easeOut(pt)
      const stretch = 1 + Math.sin(pt * Math.PI) * 0.45 * x
      set('knob', { transform: `translateX(${(on ? travel : 1 - travel) * 20}px) scaleX(${stretch})` })

      // copy: the icon swaps with a quick shrink-and-grow; it reverts after a moment
      const pc = since(time, f.copy, 1.6)
      set('copyIcon', { transform: `scale(${pc < 0.12 ? 1 - pc / 0.12 : pop(Math.min(1, (pc - 0.12) / 0.15), 0.3 * x)})` })
      if (copied && pc >= 1) setCopied(false)

      // send: spinner while "sending", then a check that pops, then back to idle
      const pn = since(time, f.send, 2.2)
      if (sendState === 'sending' && pn > 0.4) setSendState('sent')
      if (sendState === 'sent' && pn >= 1) setSendState('idle')
      set('sendIcon', {
        transform: sendState === 'sending' ? `rotate(${time * 540}deg)` : `scale(${pop(Math.min(1, (pn - 0.4) / 0.12), 0.35 * x)})`,
      })

      // rate: the stars up to the new rating pop one after another
      const pr = since(time, f.rate, 0.9)
      for (let i = 0; i < 5; i++) {
        const local = Math.min(1, Math.max(0, (pr - i * 0.08) / 0.3))
        set(`star${i}`, { transform: `scale(${i < rating ? pop(local, 0.4 * x) : 1})` })
      }
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  const tile = 'flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5'
  const caption = 'text-xs font-medium text-neutral-500'
  const tap = (w: Widget) => () => fire(w, true)

  return (
    <div
      ref={box}
      className={cn('grid size-full grid-cols-3 grid-rows-2 gap-3 bg-[#eef0f4] p-4 text-neutral-900', thumb && 'gap-2 p-2 [&_.label]:hidden')}
    >
      <div className={tile}>
        <button type="button" onClick={tap('like')} aria-pressed={liked} aria-label="좋아요" className="relative grid size-12 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-rose-300">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} ref={ref(`dot${i}`)} aria-hidden className="absolute size-1.5 rounded-full bg-rose-400 opacity-0" />
          ))}
          <HeartIcon ref={ref('heart')} className={cn('size-8 transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400')} />
        </button>
        <span className={cn(caption, 'label tabular-nums')}>{LABELS.like} {likes}</span>
      </div>

      <div className={tile}>
        <button type="button" onClick={tap('save')} aria-pressed={saved} aria-label="저장" className="grid size-12 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-sky-300">
          <BookmarkIcon ref={ref('bookmark')} className={cn('size-8 origin-top transition-colors', saved ? 'fill-sky-500 text-sky-500' : 'text-neutral-400')} />
        </button>
        <span className={cn(caption, 'label')}>{saved ? '저장됨' : LABELS.save}</span>
      </div>

      <div className={tile}>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="알림"
          onClick={tap('toggle')}
          className={cn('relative h-8 w-14 rounded-full p-1 outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-emerald-300', on ? 'bg-emerald-500' : 'bg-neutral-300')}
        >
          <span ref={ref('knob')} className="block size-6 rounded-full bg-white shadow" />
        </button>
        <span className={cn(caption, 'label')}>{on ? '켜짐' : '꺼짐'}</span>
      </div>

      <div className={tile}>
        <button type="button" onClick={tap('copy')} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus-visible:ring-3 focus-visible:ring-neutral-400">
          <span ref={ref('copyIcon')} className="grid">
            {copied ? <CheckIcon className="size-4 text-emerald-300" /> : <CopyIcon className="size-4" />}
          </span>
          <span className="label">{copied ? '복사됨' : '링크 복사'}</span>
        </button>
        <span className={cn(caption, 'label')}>{LABELS.copy}</span>
      </div>

      <div className={tile}>
        <button
          type="button"
          onClick={tap('send')}
          disabled={sendState !== 'idle'}
          className={cn(
            'flex min-w-24 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus-visible:ring-3 focus-visible:ring-indigo-300',
            sendState === 'sent' ? 'bg-emerald-500' : 'bg-indigo-500',
          )}
        >
          <span ref={ref('sendIcon')} className="grid">
            {sendState === 'sending' ? <LoaderIcon className="size-4" /> : sendState === 'sent' ? <CheckIcon className="size-4" /> : <SendIcon className="size-4" />}
          </span>
          <span className="label">{sendState === 'sending' ? '보내는 중' : sendState === 'sent' ? '보냄' : '보내기'}</span>
        </button>
        <span className={cn(caption, 'label')}>{LABELS.send}</span>
      </div>

      <div className={tile}>
        <button type="button" onClick={tap('rate')} aria-label={`별점 ${rating}점, 눌러서 바꾸기`} className="flex gap-0.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-amber-300">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon
              key={i}
              ref={ref(`star${i}`)}
              className={cn('size-5 transition-colors', i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300')}
            />
          ))}
        </button>
        <span className={cn(caption, 'label')}>{LABELS.rate} {rating}점</span>
      </div>
    </div>
  )
}

export const animation: AnimationStyle = {
  id: 'micro-interactions',
  group: 'motion',
  name: '마이크로인터랙션',
  englishName: 'Micro-interactions',
  aliases: ['Microinteraction', 'Feedback animation', 'Tap feedback', '작은 반응'],
  description: '버튼을 누르거나 스위치를 켤 때처럼 한 번의 동작에 짧게 돌아오는 작은 반응 애니메이션',
  context: '좋아요·저장·복사 버튼, 스위치, 전송 버튼처럼 앱에서 매일 누르는 거의 모든 부품에 들어 있습니다.',
  technique: 'DOM·CSS',
  interaction: '여섯 부품을 직접 눌러 보세요. 4초 동안 아무것도 누르지 않으면 하나씩 저절로 눌립니다.',
  traits: [
    {
      title: '눌렀다는 확인',
      description: '아이콘이 커졌다 돌아오고 색이 바뀌어 "눌렸다"를 바로 알려 줍니다. 반응이 없으면 사람은 같은 버튼을 다시 누릅니다.',
    },
    {
      title: '0.2~0.6초의 짧은 시간',
      description: '대부분 반 초 안에 끝납니다. 길어지면 기다리게 만들고, 짧으면 알아채지 못합니다.',
    },
    {
      title: '상태가 바뀌는 과정을 보여 줌',
      description: '복사 → 복사됨, 보내기 → 보내는 중 → 보냄처럼 아이콘과 글자가 이어서 바뀌어 지금 무슨 일이 일어나는지 설명합니다.',
    },
  ],
  params: [{ key: 'exaggeration', label: '과장 정도', min: 0, max: 2, step: 0.1, default: 1, unit: '×' }],
  Scene: MicroInteractionsScene,
}
