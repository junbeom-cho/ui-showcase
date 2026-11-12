import { advance, MAX_STEP } from './clock'

it('moves time by the real step times the speed', () => {
  const { time, delta } = advance(1, 0.016, 2, false)
  expect(time).toBeCloseTo(1.032)
  expect(delta).toBeCloseTo(0.032)
})

it('freezes while paused or at speed 0', () => {
  expect(advance(5, 0.016, 1, true)).toEqual({ time: 5, delta: 0 })
  expect(advance(5, 0.016, 0, false)).toEqual({ time: 5, delta: 0 })
})

it('caps a long gap such as a background tab', () => {
  expect(advance(0, 3, 1, false).delta).toBe(MAX_STEP)
  expect(advance(0, -1, 1, false).delta).toBe(0)
})
