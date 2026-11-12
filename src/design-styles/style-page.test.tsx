import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { designStyles } from './registry'
import { StylePage } from './style-page'

const user = userEvent.setup()
const neu = designStyles.find((s) => s.id === 'neumorphism')!

it('shows name, other names, context and the traits list', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.getByRole('heading', { level: 1, name: '뉴모피즘' })).toBeInTheDocument()
  expect(screen.getByText('Neumorphism')).toBeInTheDocument()
  expect(screen.getByText('Soft UI')).toBeInTheDocument()
  expect(screen.getByText(neu.context)).toBeInTheDocument()
  expect(within(screen.getByRole('list', { name: '특징' })).getAllByRole('listitem')).toHaveLength(
    neu.traits.length,
  )
})

it('starts without trait markers and shows one on hover', async () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.queryAllByTestId('anatomy-marker')).toHaveLength(0)
  await user.hover(screen.getByText(neu.traits[1].title))
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(1)
})

it('renders the demo in this style', () => {
  const { container } = render(<StylePage style={neu} styles={designStyles} />)
  expect(container.querySelector('[data-design-style="neumorphism"]')).not.toBeNull()
})

it('links breadcrumb and neighbours', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  const crumbs = screen.getByRole('navigation', { name: 'breadcrumb' })
  expect(within(crumbs).getByRole('link', { name: '개요' })).toHaveAttribute('href', '#/')
  expect(within(crumbs).getByRole('link', { name: '디자인 스타일' })).toHaveAttribute('href', '#/styles')
  const pager = screen.getByRole('navigation', { name: '이전·다음 스타일' })
  expect(within(pager).getByRole('link', { name: /머티리얼/ })).toHaveAttribute('href', '#/style/material')
  expect(within(pager).getByRole('link', { name: /글래스모피즘/ })).toHaveAttribute(
    'href',
    '#/style/glassmorphism',
  )
})

it('shows the browser note only for liquid glass', () => {
  const { unmount } = render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.queryByText('굴절 효과는 Chrome 계열 브라우저에서 가장 잘 보입니다.')).toBeNull()
  unmount()
  render(<StylePage style={designStyles.at(-1)!} styles={designStyles} />)
  expect(screen.getByText('굴절 효과는 Chrome 계열 브라우저에서 가장 잘 보입니다.')).toBeInTheDocument()
})
