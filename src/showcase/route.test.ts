import { parseRoute } from './route'

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
