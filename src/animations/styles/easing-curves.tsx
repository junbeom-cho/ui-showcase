import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import type { AnimationStyle, SceneProps } from '../types'

/** CSS cubic-bezier(x1, y1, x2, y2): solve x(s) = t for s, then return y(s). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3
  const dx = (s: number) => 3 * x1 * (1 - s) ** 2 + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s
  return (t: number) => {
    let s = t
    for (let i = 0; i < 6; i++) {
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      s -= (bx(s) - t) / d
    }
    // Newton can wander near flat ends; fall back to bisection
    if (s < 0 || s > 1 || Math.abs(bx(s) - t) > 1e-3) {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 24; i++) {
        s = (lo + hi) / 2
        if (bx(s) < t) lo = s
        else hi = s
      }
    }
    return by(s)
  }
}

/** A damped spring settling at 1; CSS can only fake this with linear() or JS. */
const spring = (t: number) => 1 - Math.exp(-5 * t) * Math.cos(10 * t)

type Easing = { name: string; css: string; fn: (t: number) => number; color: string }

const EASINGS: Easing[] = [
  { name: 'linear', css: '일정한 속도', fn: (t) => t, color: '#8a8f98' },
  { name: 'ease', css: 'CSS 기본값', fn: cubicBezier(0.25, 0.1, 0.25, 1), color: '#2f6fed' },
  { name: 'ease-in', css: '천천히 출발', fn: cubicBezier(0.42, 0, 1, 1), color: '#7b4dff' },
  { name: 'ease-out', css: '천천히 도착', fn: cubicBezier(0, 0, 0.58, 1), color: '#0f9d76' },
  { name: 'ease-in-out', css: '천천히 출발·도착', fn: cubicBezier(0.42, 0, 0.58, 1), color: '#d97706' },
  { name: 'back', css: '살짝 넘쳤다 돌아옴', fn: cubicBezier(0.34, 1.56, 0.64, 1), color: '#e0457b' },
  { name: 'spring', css: '튕기며 멈춤', fn: spring, color: '#e5484d' },
]

const HOLD = 0.9 // seconds the balls rest at the end before starting over

function draw({ ctx, width: w, height: h, time, pointer, params, thumb }: CanvasFrame) {
  const duration = params.duration
  // the pointer scrubs time from left to right; otherwise the clock loops
  const t = pointer.inside
    ? Math.min(1, Math.max(0, (pointer.x - w * 0.08) / (w * 0.84)))
    : Math.min(1, (time % (duration + HOLD)) / duration)

  ctx.fillStyle = '#f7f5ef'
  ctx.fillRect(0, 0, w, h)

  const pad = thumb ? 10 : Math.max(16, w * 0.03)
  const rowH = (h - pad * 2) / EASINGS.length
  const labelW = thumb ? 0 : Math.min(190, w * 0.24)
  const graphW = thumb ? 0 : Math.min(rowH * 1.5, w * 0.12)
  const trackX = pad + labelW + (graphW ? graphW + pad : 0)
  const trackW = w - trackX - pad
  const r = Math.max(3, Math.min(rowH * 0.22, 11))

  // strobe: where the ball was at equal time steps — close dots mean slow, far apart means fast
  const strobes = Math.round(params.strobe)

  EASINGS.forEach((e, i) => {
    const top = pad + i * rowH
    const cy = top + rowH / 2
    if (i > 0) {
      ctx.fillStyle = 'rgba(30, 30, 40, 0.06)'
      ctx.fillRect(pad, top, w - pad * 2, 1)
    }

    if (!thumb) {
      ctx.fillStyle = '#1d1d24'
      ctx.font = `600 ${Math.min(15, rowH * 0.3)}px "IBM Plex Mono", ui-monospace, monospace`
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(e.name, pad, cy - 2)
      ctx.fillStyle = '#6b6f78'
      ctx.font = `${Math.min(12, rowH * 0.24)}px "IBM Plex Sans KR", system-ui, sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText(e.css, pad, cy + 3)

      // the curve: time to the right, progress up; the dot rides on it
      const gx = pad + labelW
      const gy = top + rowH * 0.15
      const gh = rowH * 0.7
      const lo = -0.15
      const hi = 1.3
      const yOf = (v: number) => gy + gh - ((v - lo) / (hi - lo)) * gh
      ctx.strokeStyle = 'rgba(30, 30, 40, 0.15)'
      ctx.lineWidth = 1
      ctx.strokeRect(gx, yOf(1), graphW, yOf(0) - yOf(1))
      ctx.beginPath()
      for (let k = 0; k <= 40; k++) {
        const x = k / 40
        const px = gx + x * graphW
        const py = yOf(e.fn(x))
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = e.color
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(gx + t * graphW, yOf(e.fn(t)), 3, 0, Math.PI * 2)
      ctx.fillStyle = e.color
      ctx.fill()
    }

    // the track and its end marks
    const x0 = trackX + r
    const x1 = trackX + trackW - r
    ctx.fillStyle = 'rgba(30, 30, 40, 0.08)'
    ctx.fillRect(x0, cy - 1, x1 - x0, 2)
    ctx.fillRect(x1, cy - rowH * 0.25, 2, rowH * 0.5)

    for (let k = 1; k <= strobes; k++) {
      const st = (k / (strobes + 1)) * Math.min(t, 1)
      ctx.beginPath()
      ctx.arc(x0 + e.fn(st) * (x1 - x0), cy, r * 0.45, 0, Math.PI * 2)
      ctx.fillStyle = e.color + '55'
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(x0 + e.fn(t) * (x1 - x0), cy, r, 0, Math.PI * 2)
    ctx.fillStyle = e.color
    ctx.fill()
  })

  // one shared clock hand across every row: the same moment, different positions
  if (!thumb) {
    const handX = trackX + t * trackW
    ctx.strokeStyle = 'rgba(30, 30, 40, 0.25)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(handX, pad)
    ctx.lineTo(handX, h - pad)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#6b6f78'
    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${(t * duration).toFixed(2)}s`, Math.min(handX + 4, w - 48), h - 4)
  }
}

function EasingCurvesScene(props: SceneProps) {
  return <CanvasScene draw={draw} {...props} className="bg-[#f7f5ef]" />
}

export const animation: AnimationStyle = {
  id: 'easing-curves',
  group: 'motion',
  name: '이징 곡선',
  englishName: 'Easing Curves',
  aliases: ['Easing', 'Timing function', 'cubic-bezier', 'Spring', '가속 곡선'],
  description: '같은 거리를 같은 시간에 움직여도 속도를 내는 방식에 따라 느낌이 달라지는 것을 나란히 비교하는 애니메이션',
  context: 'CSS의 transition-timing-function, 디자인 도구의 애니메이션 설정, 모든 버튼·메뉴·화면 전환에서 고르는 값입니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 무대 위에서 왼쪽→오른쪽으로 움직이면 시간을 직접 넘겨 볼 수 있습니다.',
  traits: [
    {
      title: '같은 시간, 다른 위치',
      description: '세로 점선은 모든 줄에서 같은 순간입니다. 그런데 공의 위치가 다릅니다. 이징은 "언제 얼마나 갔나"를 정하는 곡선입니다.',
    },
    {
      title: '들어올 땐 ease-out, 나갈 땐 ease-in',
      description: '화면에 들어오는 것은 빠르게 왔다가 천천히 멈춰야 자연스럽고, 사라지는 것은 천천히 출발해 빠르게 나가야 합니다. linear는 기계처럼 보입니다.',
    },
    {
      title: '잔상 점으로 보는 속도',
      description: '흐린 점은 같은 시간 간격마다 찍은 위치입니다. 점 사이가 넓으면 빠르고 좁으면 느립니다. back과 spring은 끝을 지나쳤다가 돌아옵니다.',
    },
  ],
  params: [
    { key: 'duration', label: '움직이는 시간', min: 0.3, max: 3, step: 0.1, default: 1.2, unit: '초' },
    { key: 'strobe', label: '잔상 점', min: 0, max: 12, step: 1, default: 6, unit: '개' },
  ],
  Scene: EasingCurvesScene,
}
