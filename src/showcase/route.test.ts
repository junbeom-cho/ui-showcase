import { animationHref, parseRoute, styleHref } from './route'

it('reads the animation index and pages', () => {
  expect(parseRoute('#/animations')).toEqual({ page: 'animations' })
  expect(parseRoute('#/animation/metaballs')).toEqual({ page: 'animation', id: 'metaballs' })
  expect(parseRoute('#/animation/clay-3d/')).toEqual({ page: 'animation', id: 'clay-3d' })
})

it('builds animation links', () => {
  expect(animationHref(null)).toBe('#/animations')
  expect(animationHref('metaballs')).toBe('#/animation/metaballs')
})

it('reads the design-style index and pages', () => {
  expect(parseRoute('#/styles')).toEqual({ page: 'styles' })
  expect(parseRoute('#/style/neumorphism')).toEqual({ page: 'style', id: 'neumorphism' })
  expect(parseRoute('#/style/3d-icons/')).toEqual({ page: 'style', id: '3d-icons' })
})

it('still reads component ids', () => {
  expect(parseRoute('#/badge')).toEqual({ page: 'component', id: 'badge' })
})

it('builds style links', () => {
  expect(styleHref(null)).toBe('#/styles')
  expect(styleHref('flat')).toBe('#/style/flat')
})

it.each(['', '#', '#/', '#/ '])('treats %j as the overview', (hash) => {
  expect(parseRoute(hash)).toEqual({ page: 'overview' })
})

it('reads a component id from #/<id>', () => {
  expect(parseRoute('#/badge')).toEqual({ page: 'component', id: 'badge' })
  expect(parseRoute('#/dropdown-menu/')).toEqual({ page: 'component', id: 'dropdown-menu' })
})

it('ignores plain in-page anchors like #top', () => {
  expect(parseRoute('#top')).toEqual({ page: 'overview' })
})
