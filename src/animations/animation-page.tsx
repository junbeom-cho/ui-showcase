import { useState } from 'react'
import { MousePointerClickIcon, PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { NeighbourLinks } from '@/showcase/neighbour-links'
import { animationHref } from '@/showcase/route'
import { defaultParams, SPEED, type AnimationStyle, type ParamSpec, type Params } from './types'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

const decimals = (step: number) => (Number.isInteger(step) ? 0 : String(step).split('.')[1].length)

function ParamSlider({ spec, value, onChange }: { spec: ParamSpec; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{spec.label}</span>
        <output className="font-mono text-xs text-ink-muted tabular-nums">
          {value.toFixed(decimals(spec.step))}
          {spec.unit}
        </output>
      </div>
      <Slider
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        thumbLabel={spec.label}
      />
    </div>
  )
}

/** One animation style: a big live stage, its sliders, and what to look for (D-021). */
export function AnimationPage({ animation, animations }: { animation: AnimationStyle; animations: AnimationStyle[] }) {
  const defaults = defaultParams(animation)
  const [params, setParams] = useState<Params>(defaults)
  const [reduced] = useState(prefersReducedMotion)
  const [paused, setPaused] = useState(reduced)
  const [run, setRun] = useState(0) // bumping it remounts the scene, so time starts over
  const changed = Object.keys(defaults).some((key) => params[key] !== defaults[key])
  const { Scene } = animation

  const index = animations.findIndex((a) => a.id === animation.id)
  const link = (a?: AnimationStyle) => (a ? { href: animationHref(a.id), name: a.name } : undefined)

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={animationHref(null)}>애니메이션</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{animation.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-ink">{animation.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {[animation.englishName, ...animation.aliases].map((name) => (
              <Badge key={name} variant="outline" className="border-rule bg-card font-normal text-ink">
                {name}
              </Badge>
            ))}
          </div>
        </div>
        <p className="max-w-[46rem] text-ink">
          {animation.description}. <span className="text-ink-muted">{animation.context}</span>
        </p>
      </header>

      {/* the panel moves beside the stage only when the stage can stay wide */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
        <section
          aria-label={`${animation.name} 무대`}
          className="relative h-[min(68svh,36rem)] min-h-80 overflow-hidden rounded-xl border border-rule bg-black"
        >
          <Scene key={run} params={params} paused={paused} />
        </section>

        <aside aria-label="조절" data-slot="app-surface" className="flex flex-col gap-5 rounded-xl border border-rule bg-card p-5">
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setPaused(!paused)}>
              {paused ? <PlayIcon data-icon="inline-start" /> : <PauseIcon data-icon="inline-start" />}
              {paused ? '재생' : '일시정지'}
            </Button>
            <Button variant="outline" size="icon" aria-label="처음부터" onClick={() => setRun(run + 1)}>
              <RotateCcwIcon />
            </Button>
          </div>
          {reduced && (
            <p className="-mt-2 text-xs leading-relaxed text-ink-muted">
              기기에 '움직임 줄이기'가 켜져 있어 멈춘 채로 시작했습니다. 재생을 누르면 움직입니다.
            </p>
          )}
          {[SPEED, ...animation.params].map((spec) => (
            <ParamSlider
              key={spec.key}
              spec={spec}
              value={params[spec.key]}
              onChange={(value) => setParams({ ...params, [spec.key]: value })}
            />
          ))}
          <Button variant="ghost" size="sm" disabled={!changed} onClick={() => setParams(defaults)} className="self-start">
            기본값으로
          </Button>
          <dl className="flex flex-col gap-3 border-t border-rule pt-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-ink-muted">그리는 방법</dt>
              <dd>
                <Badge variant="secondary" className="font-mono font-normal">
                  {animation.technique}
                </Badge>
              </dd>
            </div>
            {animation.interaction && (
              <div className="flex gap-2 text-ink">
                <dt className="sr-only">해 보기</dt>
                <MousePointerClickIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-blueprint" />
                <dd>{animation.interaction}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">알아볼 점</h2>
        <ol aria-label={`${animation.name}의 특징`} className="grid gap-3 md:grid-cols-3">
          {animation.traits.map((trait, i) => (
            <li key={trait.title} data-slot="app-surface" className="flex flex-col gap-1.5 rounded-lg border border-rule bg-card p-4">
              <span className="font-mono text-xs text-blueprint">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-semibold text-ink">{trait.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{trait.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <NeighbourLinks
        label="이전·다음 애니메이션"
        prev={link(animations[index - 1])}
        next={link(animations[index + 1])}
      />
    </article>
  )
}
