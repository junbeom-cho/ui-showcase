import { render, screen } from '@testing-library/react'
import { Progress } from './progress'

it('tells assistive tech how far along it is', () => {
  render(<Progress value={40} aria-label="내보내기" />)
  const bar = screen.getByRole('progressbar', { name: '내보내기' })
  expect(bar).toHaveAttribute('aria-valuenow', '40')
  expect(bar).toHaveAttribute('data-state', 'loading')
})

it('stays indeterminate without a value', () => {
  render(<Progress aria-label="맞추는 중" />)
  const bar = screen.getByRole('progressbar', { name: '맞추는 중' })
  expect(bar).not.toHaveAttribute('aria-valuenow')
  expect(bar).toHaveAttribute('data-state', 'indeterminate')
})
