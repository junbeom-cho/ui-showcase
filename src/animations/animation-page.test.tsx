import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimationPage } from './animation-page'
import { AnimationsIndexPage } from './animations-index-page'
import { testAnimations } from './test-animations'

const user = userEvent.setup()
const [wave, dots] = testAnimations
const scene = () => screen.getByTestId('scene')
const sceneParams = () => JSON.parse(scene().dataset.params!)

describe('AnimationPage', () => {
  it('names the style and links back to the animation index', () => {
    render(<AnimationPage animation={dots} animations={testAnimations} />)
    expect(screen.getByRole('heading', { level: 1, name: '점 무리' })).toBeInTheDocument()
    expect(screen.getByText('Test Dots')).toBeInTheDocument()
    expect(screen.getByText('Particles')).toBeInTheDocument()
    const crumbs = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: '애니메이션' })).toHaveAttribute('href', '#/animations')
  })

  it('plays the scene full size with speed and the style sliders at their defaults', () => {
    render(<AnimationPage animation={dots} animations={testAnimations} />)
    expect(scene()).toHaveAttribute('data-paused', 'false')
    expect(scene()).toHaveAttribute('data-thumb', 'false')
    expect(sceneParams()).toEqual({ speed: 1, count: 50 })
    expect(screen.getByRole('slider', { name: '속도' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('slider', { name: '점 개수' })).toHaveAttribute('aria-valuenow', '50')
  })

  it('pauses and plays', async () => {
    render(<AnimationPage animation={dots} animations={testAnimations} />)
    await user.click(screen.getByRole('button', { name: '일시정지' }))
    expect(scene()).toHaveAttribute('data-paused', 'true')
    await user.click(screen.getByRole('button', { name: '재생' }))
    expect(scene()).toHaveAttribute('data-paused', 'false')
  })

  it('moves a slider and puts everything back with 기본값으로', async () => {
    render(<AnimationPage animation={dots} animations={testAnimations} />)
    expect(screen.getByRole('button', { name: '기본값으로' })).toBeDisabled()
    screen.getByRole('slider', { name: '점 개수' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(sceneParams().count).toBe(60)
    expect(screen.getByText('60개')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '기본값으로' }))
    expect(sceneParams().count).toBe(50)
  })

  it('explains the technique, the interaction and three traits', () => {
    render(<AnimationPage animation={wave} animations={testAnimations} />)
    expect(screen.getByText('Canvas 2D')).toBeInTheDocument()
    expect(screen.getByText('누르면 물결이 생깁니다.')).toBeInTheDocument()
    const traits = screen.getByRole('list', { name: '물결의 특징' })
    expect(within(traits).getAllByRole('listitem')).toHaveLength(3)
  })

  it('links to the neighbouring animations', () => {
    render(<AnimationPage animation={dots} animations={testAnimations} />)
    const pager = screen.getByRole('navigation', { name: '이전·다음 애니메이션' })
    expect(within(pager).getByRole('link', { name: /물결/ })).toHaveAttribute('href', '#/animation/test-wave')
    expect(within(pager).getByRole('link', { name: /글자 춤/ })).toHaveAttribute('href', '#/animation/test-type')
  })
})

describe('AnimationsIndexPage', () => {
  it('shows a moving thumbnail and a link for every animation', () => {
    render(<AnimationsIndexPage animations={testAnimations} />)
    expect(screen.getByRole('heading', { level: 1, name: '애니메이션 스타일' })).toBeInTheDocument()
    for (const a of testAnimations) {
      expect(screen.getByRole('link', { name: a.name })).toHaveAttribute('href', `#/animation/${a.id}`)
    }
    expect(screen.getAllByRole('heading', { level: 2 }).filter((h) => !h.querySelector('a')).map((h) => h.textContent)).toEqual([
      '그래픽 표현',
      'UI 모션',
    ])
    const scenes = screen.getAllByTestId('scene')
    expect(scenes).toHaveLength(testAnimations.length)
    for (const s of scenes) expect(s).toHaveAttribute('data-thumb', 'true')
  })
})
