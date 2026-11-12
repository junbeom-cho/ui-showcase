import { noise3, seeded } from './noise'

it('repeats the same numbers for the same seed', () => {
  const a = seeded(42)
  const b = seeded(42)
  expect([a(), a(), a()]).toEqual([b(), b(), b()])
})

it('starts neighbouring seeds far apart', () => {
  const firsts = Array.from({ length: 20 }, (_, i) => seeded(i)())
  const gaps = firsts.slice(1).map((v, i) => Math.abs(v - firsts[i]))
  expect(Math.max(...gaps)).toBeGreaterThan(0.3)
  expect(gaps.filter((g) => g < 0.01).length).toBeLessThan(3)
  for (const v of firsts) expect(v).toBeGreaterThanOrEqual(0)
  for (const v of firsts) expect(v).toBeLessThan(1)
})

it('gives smooth noise in about -1..1', () => {
  expect(Math.abs(noise3(0.1, 0.2, 0.3) - noise3(0.1001, 0.2, 0.3))).toBeLessThan(0.01)
  for (let i = 0; i < 200; i++) expect(Math.abs(noise3(i * 0.37, i * 0.11, i * 0.07))).toBeLessThanOrEqual(1.1)
})
