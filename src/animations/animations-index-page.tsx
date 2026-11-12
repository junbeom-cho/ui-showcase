import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { animationHref } from '@/showcase/route'
import { prefersReducedMotion } from './animation-page'
import { defaultParams, groupAnimations, type AnimationStyle } from './types'

/**
 * Mounts the scene only while the card is on or near the screen. Leaving unmounts it,
 * which also hands back its WebGL context — browsers allow only about sixteen at once.
 */
function LiveThumbnail({ animation }: { animation: AnimationStyle }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined')
  const [params] = useState(() => defaultParams(animation))
  const [paused] = useState(prefersReducedMotion)
  const { Scene } = animation

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '150px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} inert aria-hidden className="relative h-44 overflow-hidden bg-black">
      {near && <Scene params={params} paused={paused} thumb />}
    </div>
  )
}

function AnimationCard({ animation }: { animation: AnimationStyle }) {
  return (
    <article
      data-slot="app-surface"
      className="group relative flex flex-col overflow-hidden rounded-md border border-rule bg-card hover:border-blueprint has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blueprint/40"
    >
      <LiveThumbnail animation={animation} />
      <div className="flex items-start justify-between gap-2 border-t border-rule px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-ink">
            <a href={animationHref(animation.id)} className="outline-none after:absolute after:inset-0">
              {animation.name}
            </a>
          </h3>
          <p className="text-[13px] text-ink-muted">{animation.englishName}</p>
        </div>
        <Badge variant="outline" className="shrink-0 border-rule font-mono text-[11px] font-normal text-ink-muted">
          {animation.technique}
        </Badge>
      </div>
    </article>
  )
}

export function AnimationsIndexPage({ animations }: { animations: AnimationStyle[] }) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-[2.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-ink sm:text-[3.5rem]">
          애니메이션 스타일
        </h1>
        <p className="max-w-[36rem] text-lg leading-relaxed text-ink-muted">
          화면을 움직이는 {animations.length}가지 표현을 실제로 돌려 봅니다. 하나를 골라 속도와 모양을 바꿔 보세요.
        </p>
        {prefersReducedMotion() && (
          <p className="text-sm text-ink-muted">
            기기에 '움직임 줄이기'가 켜져 있어 썸네일은 멈춰 있습니다. 페이지를 열고 재생을 누르면 움직입니다.
          </p>
        )}
      </header>
      {groupAnimations(animations).map((group) => (
        <section key={group.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{group.label}</h2>
            <p className="text-ink-muted">{group.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((animation) => (
              <AnimationCard key={animation.id} animation={animation} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
