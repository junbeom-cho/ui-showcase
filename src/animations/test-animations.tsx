import type { AnimationStyle, SceneProps } from './types'

/** Stands in for a real scene: shows what the page passed down. */
function FakeScene({ params, paused, thumb }: SceneProps) {
  return (
    <div
      data-testid="scene"
      data-paused={paused}
      data-thumb={Boolean(thumb)}
      data-params={JSON.stringify(params)}
    />
  )
}

const base = {
  context: '시험용 장면입니다.',
  technique: 'Canvas 2D',
  traits: [
    { title: '첫째', description: '첫째 특징입니다.' },
    { title: '둘째', description: '둘째 특징입니다.' },
    { title: '셋째', description: '셋째 특징입니다.' },
  ],
  Scene: FakeScene,
} satisfies Partial<AnimationStyle>

/** Small, stable animations for page and menu tests (the real ones draw on canvas). */
export const testAnimations: AnimationStyle[] = [
  {
    ...base,
    id: 'test-wave',
    name: '물결',
    englishName: 'Test Wave',
    aliases: ['Ripple'],
    description: '물결이 퍼지는 애니메이션',
    interaction: '누르면 물결이 생깁니다.',
    params: [{ key: 'height', label: '물결 높이', min: 0, max: 2, step: 0.1, default: 1 }],
  },
  {
    ...base,
    id: 'test-dots',
    name: '점 무리',
    englishName: 'Test Dots',
    aliases: ['Particles'],
    description: '점이 모였다 흩어지는 애니메이션',
    technique: 'WebGL',
    params: [{ key: 'count', label: '점 개수', min: 10, max: 100, step: 10, default: 50, unit: '개' }],
  },
  {
    ...base,
    id: 'test-type',
    name: '글자 춤',
    englishName: 'Test Type',
    aliases: ['Letters'],
    description: '글자가 춤추는 애니메이션',
    technique: 'DOM·CSS',
    params: [{ key: 'size', label: '크기', min: 1, max: 3, step: 1, default: 2 }],
  },
]
