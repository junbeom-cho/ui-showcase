import { fireEvent, render, screen } from '@testing-library/react'
import { Specimen } from './specimen'

it('renders its children', () => {
  render(<Specimen><button>hello</button></Specimen>)
  expect(screen.getByRole('button', { name: 'hello' })).toBeInTheDocument()
})

it('keeps "#" demo links from navigating away', () => {
  render(<Specimen><a href="#">3</a></Specimen>)
  expect(fireEvent.click(screen.getByRole('link', { name: '3' }))).toBe(false)
})

it('leaves real links alone', () => {
  render(<Specimen><a href="#/badge">badge</a></Specimen>)
  expect(fireEvent.click(screen.getByRole('link', { name: 'badge' }))).toBe(true)
})
