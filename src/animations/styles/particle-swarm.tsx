import { useRef } from 'react'
import { CanvasScene, type CanvasFrame } from '../engine/canvas-scene'
import { noise3 } from '../engine/noise'
import type { AnimationStyle, SceneProps } from '../types'

type Swarm = { n: number; x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array }

const BUCKETS = ['#3ab7ff', '#5f8bff', '#9a6bff', '#e15cff', '#ff6fa8', '#ffb86b']

/** Moves every particle by `step` 60-fps frames toward (tx, ty). */
function simulate(s: Swarm, w: number, h: number, tx: number, ty: number, pull: number, step: number, time: number) {
  const damping = Math.pow(0.955, step)
  const scale = Math.min(w, h)
  for (let i = 0; i < s.n; i++) {
    const dx = tx - s.x[i]
    const dy = ty - s.y[i]
    const d = Math.hypot(dx, dy) + 1
    // pull inward, swirl around, and wander with noise so the swarm breathes
    const swirl = 0.22 + 0.1 * Math.sin(i)
    const wander = noise3(s.x[i] * 0.004, s.y[i] * 0.004, time * 0.25) * 0.45
    const ax = (dx / d) * pull - (dy / d) * swirl + Math.cos(wander * 6.28) * 0.18
    const ay = (dy / d) * pull + (dx / d) * swirl + Math.sin(wander * 6.28) * 0.18
    s.vx[i] = (s.vx[i] + ax * step) * damping
    s.vy[i] = (s.vy[i] + ay * step) * damping
    s.x[i] += s.vx[i] * step * (scale / 600)
    s.y[i] += s.vy[i] * step * (scale / 600)
    if (s.x[i] < -50 || s.x[i] > w + 50 || s.y[i] < -50 || s.y[i] > h + 50) {
      s.x[i] = Math.random() * w
      s.y[i] = Math.random() * h
      s.vx[i] = s.vy[i] = 0
    }
  }
}

function ParticleSwarmScene({ params, paused, thumb }: SceneProps) {
  const swarm = useRef<Swarm | null>(null)

  const draw = ({ ctx, width: w, height: h, delta, time, pointer, resized, params, thumb }: CanvasFrame) => {
    // the swarm chases the pointer, or a slow figure-eight when the pointer is away
    const tx = pointer.inside ? pointer.x : w / 2 + Math.sin(time * 0.6) * w * 0.32
    const ty = pointer.inside ? pointer.y : h / 2 + Math.sin(time * 1.2) * h * 0.22
    const pull = (pointer.down ? -2.5 : 1) * params.attraction * 0.35

    const n = Math.round(params.count * (thumb ? 0.3 : 1))
    if (resized || !swarm.current || swarm.current.n !== n) {
      const s: Swarm = { n, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n) }
      for (let i = 0; i < n; i++) {
        s.x[i] = Math.random() * w
        s.y[i] = Math.random() * h
      }
      // settle for a moment first, so even a paused first frame already looks like a swarm
      for (let k = 0; k < 90; k++) simulate(s, w, h, tx, ty, pull, 1, time)
      swarm.current = s
      ctx.fillStyle = '#06070f'
      ctx.fillRect(0, 0, w, h)
    }
    const s = swarm.current

    // a translucent wash instead of clearing leaves short trails behind each particle
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(6, 7, 15, ${1 - params.trail})`
    ctx.fillRect(0, 0, w, h)

    simulate(s, w, h, tx, ty, pull, Math.min(delta, 0.05) * 60, time) // steps in 60-fps frames

    // colour by speed; one fillStyle per bucket keeps thousands of dots cheap
    ctx.globalCompositeOperation = 'lighter'
    const size = thumb ? 1.2 : 1.8
    for (let b = 0; b < BUCKETS.length; b++) {
      ctx.fillStyle = BUCKETS[b]
      for (let i = 0; i < s.n; i++) {
        const speed = Math.hypot(s.vx[i], s.vy[i])
        if (Math.min(BUCKETS.length - 1, Math.floor(speed * 1.1)) === b) ctx.fillRect(s.x[i], s.y[i], size, size)
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  return <CanvasScene draw={draw} params={params} paused={paused} thumb={thumb} className="bg-[#06070f]" />
}

export const animation: AnimationStyle = {
  id: 'particle-swarm',
  name: '파티클 스웜',
  englishName: 'Particle Swarm',
  aliases: ['Particles', 'Particle system', '입자 무리'],
  description: '수천 개의 작은 점이 한 무리처럼 함께 움직이며 소용돌이치는 애니메이션',
  context: '제품 소개 페이지 배경, 음악 시각화, 로딩 화면에서 자주 봅니다.',
  technique: 'Canvas 2D',
  interaction: '마우스를 올리면 무리가 따라오고, 누르고 있으면 흩어집니다.',
  traits: [
    { title: '단순한 규칙, 복잡한 움직임', description: '점 하나하나는 "가운데로 끌리고, 옆으로 돌고, 조금씩 헤맨다"는 규칙만 따르지만 모이면 살아 있는 무리처럼 보입니다.' },
    { title: '잔상 꼬리', description: '화면을 지우지 않고 반투명하게 덮어 지나간 자리가 꼬리처럼 남습니다.' },
    { title: '빛이 겹치는 색', description: '빠른 점일수록 분홍빛을 띠고, 겹치는 곳은 색을 더해 밝게 빛납니다.' },
  ],
  params: [
    { key: 'count', label: '입자 수', min: 200, max: 4000, step: 100, default: 1800, unit: '개' },
    { key: 'attraction', label: '끌림', min: 0, max: 2, step: 0.1, default: 1 },
    { key: 'trail', label: '꼬리 길이', min: 0, max: 0.95, step: 0.05, default: 0.8 },
  ],
  Scene: ParticleSwarmScene,
}
