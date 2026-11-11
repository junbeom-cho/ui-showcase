import { groupByCategory } from './categories'
import { badge, dialog, skeleton } from './test-entries'

it('groups entries in category order and skips empty categories', () => {
  const groups = groupByCategory([skeleton, dialog, badge])
  expect(groups.map((g) => g.category.id)).toEqual(['display', 'feedback', 'overlay'])
  expect(groups[0].entries.map((e) => e.id)).toEqual(['badge'])
})
