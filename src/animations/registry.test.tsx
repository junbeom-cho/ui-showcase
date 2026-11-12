import { render } from '@testing-library/react'
import { ANIMATION_ORDER, animationModules, animations } from './registry'
import { defaultParams, SPEED } from './types'

const modules = Object.entries(animationModules).map(([path, module]) => [path, module.animation] as const)

it('has all 20 animation styles in the listed order', () => {
  expect(animations.map((a) => a.id)).toEqual([...ANIMATION_ORDER])
})

it.each(modules)('%s is listed and named after its file', (path, a) => {
  expect(path).toBe(`./styles/${a.id}.tsx`)
  expect(ANIMATION_ORDER).toContain(a.id)
})

describe.each(modules)('%s', (_path, a) => {
  it('describes itself in Korean with an English name', () => {
    expect(a.name).toMatch(/[가-힣]/)
    expect(a.englishName).toMatch(/[A-Za-z]/)
    expect(a.aliases.length).toBeGreaterThanOrEqual(1)
    for (const text of [a.description, a.context, a.interaction ?? '가']) expect(text).toMatch(/[가-힣]/)
    expect(a.traits).toHaveLength(3)
    for (const t of a.traits) {
      expect(t.title.trim()).not.toBe('')
      expect(t.description).toMatch(/[가-힣]/)
    }
  })

  it('offers sliders that make sense', () => {
    expect(a.params.length).toBeGreaterThanOrEqual(1)
    expect(a.params.length).toBeLessThanOrEqual(4)
    const keys = a.params.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).not.toContain(SPEED.key)
    for (const p of a.params) {
      expect(p.key).toMatch(/^[a-z][a-zA-Z0-9]*$/) // also a GLSL uniform name
      expect(p.label).toMatch(/[가-힣]/)
      expect(p.step).toBeGreaterThan(0)
      expect(p.min).toBeLessThan(p.max)
      expect(p.default).toBeGreaterThanOrEqual(p.min)
      expect(p.default).toBeLessThanOrEqual(p.max)
    }
  })

  it('renders, also paused and as a thumbnail', () => {
    const params = defaultParams(a)
    expect(() => render(<a.Scene params={params} paused={false} />).unmount()).not.toThrow()
    expect(() => render(<a.Scene params={params} paused thumb />).unmount()).not.toThrow()
  })
})
