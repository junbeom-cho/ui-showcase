import { CHIP_GAP, layoutCallouts } from './callouts'

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height })

it('puts chips in the margin left of the specimen, level with each part', () => {
  const [a, b] = layoutCallouts([rect(40, 0, 200, 100), rect(60, 20, 100, 20)], 300)
  expect(a!.side).toBe('left')
  expect(a!.chipX).toBeLessThan(40)
  expect(b!.chipX).toBe(a!.chipX)
  expect(b!.chipY).toBe(30)
})

it('sends narrow parts on the right half to the right margin', () => {
  const [, action] = layoutCallouts([rect(0, 0, 300, 100), rect(250, 10, 30, 30)], 300)
  expect(action!.side).toBe('right')
  expect(action!.chipX).toBeGreaterThan(300)
})

it('pushes chips apart so they never overlap on the same side', () => {
  const callouts = layoutCallouts(
    [rect(0, 0, 100, 40), rect(0, 5, 100, 30), rect(0, 10, 100, 20)],
    300,
  ).filter((c) => c !== null)
  for (const side of ['left', 'right']) {
    const ys = callouts.filter((c) => c.side === side).map((c) => c.chipY).sort((x, y) => x - y)
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(CHIP_GAP)
  }
})

it('uses the other margin when one side has no room level with the part', () => {
  // header (0–44) holds a title (0–20) and a description (24–44) that fill the left margin
  const [header] = layoutCallouts([rect(0, 0, 200, 44), rect(0, 0, 100, 20), rect(0, 24, 100, 20)], 300)
  expect(header!.side).toBe('right')
  expect(header!.chipY).toBeGreaterThanOrEqual(0)
  expect(header!.chipY).toBeLessThanOrEqual(44)
})

it('puts the chip columns outside the given bounds, not just outside the marked parts', () => {
  // a part in the middle of a wide page: chips still go to the page margins
  const [mid] = layoutCallouts([rect(200, 50, 100, 40)], 1000, { left: 40, right: 960 })
  expect(mid!.chipX).toBeLessThan(40)
})

it('keeps missing parts as null', () => {
  expect(layoutCallouts([null, rect(0, 0, 10, 10)], 100)[0]).toBeNull()
})
