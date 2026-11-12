import { render, screen, within } from '@testing-library/react'
import { designStyles } from './registry'
import { StylesIndexPage } from './styles-index-page'

it('shows a linked card for each of the 9 styles', () => {
  render(<StylesIndexPage styles={designStyles} />)
  expect(screen.getByRole('heading', { level: 1, name: '디자인 스타일' })).toBeInTheDocument()
  const links = screen.getAllByRole('heading', { level: 2 }).map((h) => within(h).getByRole('link'))
  expect(links.map((a) => a.getAttribute('href'))).toEqual(designStyles.map((s) => `#/style/${s.id}`))
  expect(links.map((a) => a.textContent)).toEqual(designStyles.map((s) => s.name))
})

it('draws each thumbnail with its own style and keeps it inert', () => {
  const { container } = render(<StylesIndexPage styles={designStyles} />)
  for (const s of designStyles) {
    const demo = container.querySelector(`[data-design-style="${s.id}"]`)
    expect(demo, s.id).not.toBeNull()
    expect(demo!.closest('[inert]'), s.id).not.toBeNull()
  }
})
