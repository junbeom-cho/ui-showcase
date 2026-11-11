import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the page title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'UI 컴포넌트 쇼케이스' })).toBeInTheDocument()
})

it('renders the gallery with every registered component', () => {
  render(<App />)
  expect(screen.getByRole('searchbox', { name: '컴포넌트 검색' })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(20)
})
