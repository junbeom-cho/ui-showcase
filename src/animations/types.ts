import type { ComponentType } from 'react'

/** One slider on the animation page. Its value reaches the scene as params[key]. */
export type ParamSpec = {
  key: string
  /** Korean, short: '입자 수' */
  label: string
  min: number
  max: number
  step: number
  default: number
  /** shown after the value: '×', 'px', '개' */
  unit?: string
}

export type Params = Record<string, number>

export type SceneProps = {
  /** every param of the style plus `speed` (handled by the engine clock) */
  params: Params
  paused: boolean
  /** small and cheap version for the index grid: fewer particles, lower resolution */
  thumb?: boolean
}

export type Technique = 'Canvas 2D' | 'WebGL' | 'DOM·CSS'

/** graphic: visual styles and effects; motion: how interface parts move (D-024) */
export type AnimationGroup = 'graphic' | 'motion'

export const ANIMATION_GROUPS: { id: AnimationGroup; label: string; description: string }[] = [
  { id: 'graphic', label: '그래픽 표현', description: '화면 전체를 채우는 움직이는 그림과 효과' },
  { id: 'motion', label: 'UI 모션', description: '버튼·화면 같은 인터페이스 부품이 움직이는 방식' },
]

export type AnimationStyle = {
  /** kebab-case, used in #/animation/<id> */
  id: string
  /** defaults to 'graphic' */
  group?: AnimationGroup
  /** Korean: '메타볼' */
  name: string
  /** 'Metaballs' */
  englishName: string
  /** other names, English or Korean */
  aliases: string[]
  /** one Korean sentence: what it looks like */
  description: string
  /** one Korean sentence: where you meet it */
  context: string
  technique: Technique
  /** one Korean sentence on what the pointer does, if anything */
  interaction?: string
  /** exactly 3 */
  traits: { title: string; description: string }[]
  /** the style's own sliders; speed is added by the page */
  params: ParamSpec[]
  Scene: ComponentType<SceneProps>
}

/** Every animation gets this slider first. 0 stops time without pausing the page. */
export const SPEED: ParamSpec = { key: 'speed', label: '속도', min: 0, max: 3, step: 0.1, default: 1, unit: '×' }

export const groupOf = (style: AnimationStyle): AnimationGroup => style.group ?? 'graphic'

/** The groups in menu order, leaving out empty ones. */
export const groupAnimations = (styles: AnimationStyle[]) =>
  ANIMATION_GROUPS.map((group) => ({ ...group, items: styles.filter((s) => groupOf(s) === group.id) })).filter(
    (g) => g.items.length > 0,
  )

export const defaultParams =(style: AnimationStyle): Params =>
  Object.fromEntries([SPEED, ...style.params].map((p) => [p.key, p.default]))
