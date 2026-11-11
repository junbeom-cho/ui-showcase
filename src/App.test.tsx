import { act, render, screen } from '@testing-library/react'
import App from './App'

function go(hash: string) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => {
  window.location.hash = ''
})

it('opens on the overview', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: '컴포넌트 이름과 생김새를 함께 봅니다' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Badge' }).length).toBeGreaterThan(0)
})

it('shows a component page for #/<id> and follows hash changes', () => {
  render(<App />)
  go('#/badge')
  expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument()
  go('#/tooltip')
  expect(screen.getByRole('heading', { level: 1, name: 'Tooltip' })).toBeInTheDocument()
})

it('explains an unknown component id and links back to the overview', () => {
  window.location.hash = '#/carousel'
  render(<App />)
  expect(screen.getByText("'carousel' 컴포넌트를 찾을 수 없습니다.")).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '개요로 돌아가기' })).toHaveAttribute('href', '#/')
})
