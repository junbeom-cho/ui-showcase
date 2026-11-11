import { render, screen } from '@testing-library/react'
import { filterEntries } from './filter-entries'
import { entries } from './registry'

const ids = () => entries.map((e) => e.id)

it('has unique kebab-case ids and non-empty text', () => {
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

it('includes the layout entries', () => {
  expect(ids()).toEqual(expect.arrayContaining(['grid', 'sidebar', 'card', 'separator']))
})

it('includes the display entries', () => {
  expect(ids()).toEqual(
    expect.arrayContaining(['avatar', 'badge', 'skeleton', 'alert', 'progress', 'breadcrumb', 'pagination']),
  )
})

it('shows avatar initials when the image is not loaded', () => {
  // jsdom never loads images, so Radix shows AvatarFallback — same as a broken image URL
  const avatar = entries.find((e) => e.id === 'avatar')!
  render(<avatar.Preview />)
  expect(screen.getByText('AB')).toBeInTheDocument()
  expect(screen.getByText('CD')).toBeInTheDocument()
})

it('includes the input and overlay entries', () => {
  expect(ids()).toEqual(
    expect.arrayContaining([
      'button', 'checkbox', 'switch', 'tabs', 'accordion', 'dialog', 'sheet', 'dropdown-menu', 'tooltip',
    ]),
  )
})

it('has all 20 entries', () => {
  expect(entries).toHaveLength(20)
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

it.each(entries.map((e) => [e.id, e] as const))('renders the %s preview', (_id, e) => {
  expect(() => render(<e.Preview />)).not.toThrow()
})

it('keeps the sidebar preview inside its card (no fixed positioning)', () => {
  const sidebar = entries.find((e) => e.id === 'sidebar')!
  const { container } = render(<sidebar.Preview />)
  expect(container.querySelector('[class~="fixed"]')).toBeNull()
  expect(container.textContent).toContain('홈')
})
