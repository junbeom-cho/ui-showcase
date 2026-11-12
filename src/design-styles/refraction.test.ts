import { supportsRefraction } from './refraction'

const withBrands = (brands: string[]) =>
  ({ userAgentData: { brands: brands.map((brand) => ({ brand, version: '1' })) } }) as unknown as Navigator

it('detects Chromium from userAgentData', () => {
  expect(supportsRefraction(withBrands(['Chromium', 'Google Chrome']))).toBe(true)
  expect(supportsRefraction(withBrands(['Not A Brand']))).toBe(false)
})

it('treats browsers without userAgentData (Firefox, Safari) as unsupported', () => {
  expect(supportsRefraction({} as Navigator)).toBe(false)
})
