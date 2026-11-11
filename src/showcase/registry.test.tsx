import { render, screen } from '@testing-library/react'
import { categories } from './categories'
import { filterEntries } from './filter-entries'
import { entries } from './registry'

const ids = () => entries.map((e) => e.id)
const byId = (id: string) => entries.find((e) => e.id === id)!

it('has all 20 components with unique kebab-case ids and non-empty text', () => {
  expect(entries).toHaveLength(20)
  expect(new Set(ids()).size).toBe(entries.length)
  for (const e of entries) {
    expect(e.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
    expect(e.name.trim()).not.toBe('')
    expect(e.description.trim()).not.toBe('')
  }
})

it('is sorted by name', () => {
  const names = entries.map((e) => e.name)
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')))
})

it('puts every component in a known category and leaves no category empty', () => {
  const known = categories.map((c) => c.id)
  for (const e of entries) expect(known).toContain(e.category)
  for (const c of known) expect(entries.some((e) => e.category === c)).toBe(true)
})

it.each(entries.map((e) => [e.id, e] as const))('%s has at least 3 distinct examples', (_id, e) => {
  expect(e.examples.length).toBeGreaterThanOrEqual(3)
  expect(new Set(e.examples.map((x) => x.title)).size).toBe(e.examples.length)
  for (const x of e.examples) expect(x.description.trim()).not.toBe('')
})

it.each(entries.map((e) => [e.id, e] as const))(
  '%s anatomy names parts that exist in its specimen',
  (_id, e) => {
    expect(e.anatomy.parts.length).toBeGreaterThanOrEqual(2)
    const { container } = render(<e.anatomy.Specimen />)
    for (const part of e.anatomy.parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
      expect(part.description.trim()).not.toBe('')
    }
  },
)

it.each(entries.map((e) => [e.id, e] as const))('%s preview and examples render', (_id, e) => {
  expect(() => render(<e.Preview />)).not.toThrow()
  for (const x of e.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it.each([
  ['Modal', 'dialog'],
  ['Drawer', 'sheet'],
  ['Toggle', 'switch'],
  ['Chip', 'badge'],
  ['Divider', 'separator'],
  ['Placeholder', 'skeleton'],
])('finds %s under its shadcn name', (query, id) => {
  expect(filterEntries(entries, query).map((e) => e.id)).toContain(id)
})

it('keeps every sidebar demo inside its frame (no fixed positioning)', () => {
  const sidebar = byId('sidebar')
  const demos = [sidebar.Preview, sidebar.anatomy.Specimen, ...sidebar.examples.map((x) => x.Demo)]
  for (const Demo of demos) {
    const { container, unmount } = render(<Demo />)
    expect(container.querySelector('[class~="fixed"]')).toBeNull()
    unmount()
  }
})

it('shows avatar initials when the image is not loaded', () => {
  // jsdom never loads images, so Radix shows AvatarFallback — same as a broken image URL
  const Preview = byId('avatar').Preview
  render(<Preview />)
  expect(screen.getByText('AB')).toBeInTheDocument()
  expect(screen.getByText('CD')).toBeInTheDocument()
})
