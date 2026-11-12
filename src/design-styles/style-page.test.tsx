import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { designStyles } from './registry'
import { StylePage } from './style-page'

const user = userEvent.setup()
const neu = designStyles.find((s) => s.id === 'neumorphism')!
const openPanel = () => user.click(screen.getByRole('button', { name: '특징 보기' }))

it('shows name, other names and context above the page', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.getByRole('heading', { level: 1, name: '뉴모피즘' })).toBeInTheDocument()
  expect(screen.getByText('Neumorphism')).toBeInTheDocument()
  expect(screen.getByText('Soft UI')).toBeInTheDocument()
  expect(screen.getByText(neu.context)).toBeInTheDocument()
})

it('draws the whole dashboard in this style', () => {
  const { container } = render(<StylePage style={neu} styles={designStyles} />)
  const demo = container.querySelector('[data-design-style="neumorphism"]')
  expect(demo).not.toBeNull()
  expect(demo!.querySelector('[data-slot="demo-sidebar"]')).not.toBeNull()
})

it('shows a collection of components drawn in this style', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  const section = screen.getByRole('region', { name: '이 스타일로 그린 컴포넌트' })
  expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    '버튼',
    '아이콘',
    '배지와 아바타',
    '입력',
    '알림과 진행',
  ])
  const icons = within(section).getByRole('list', { name: '아이콘 모음' })
  expect(within(icons).getAllByRole('listitem')).toHaveLength(12)
  expect(icons.querySelectorAll('[data-style-icon]')).toHaveLength(12)
  for (const name of ['저장', '취소', '삭제']) expect(within(section).getByRole('button', { name })).toBeInTheDocument()
  expect(within(section).getByRole('checkbox', { name: '약관에 동의합니다' })).toBeInTheDocument()
  expect(within(section).getByRole('tablist')).toBeInTheDocument()
})

it('uses the 3D images in the collection for the 3d-icons style', () => {
  render(<StylePage style={designStyles.find((s) => s.id === '3d-icons')!} styles={designStyles} />)
  const icons = screen.getByRole('list', { name: '아이콘 모음' })
  expect(icons.querySelectorAll('img')).toHaveLength(12)
})

it('keeps the traits panel closed until asked', async () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.queryByRole('list', { name: '특징' })).toBeNull()
  await openPanel()
  expect(within(screen.getByRole('list', { name: '특징' })).getAllByRole('listitem')).toHaveLength(
    neu.traits.length,
  )
  await user.click(screen.getByRole('button', { name: '특징 닫기' }))
  expect(screen.queryByRole('list', { name: '특징' })).toBeNull()
})

it('marks one trait on the dashboard while it is hovered', async () => {
  render(<StylePage style={neu} styles={designStyles} />)
  await openPanel()
  expect(screen.queryAllByTestId('anatomy-marker')).toHaveLength(0)
  await user.hover(screen.getByText(neu.traits[1].title))
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(1)
  await user.click(screen.getByRole('switch', { name: '특징 번호 모두 표시' }))
  await user.unhover(screen.getByText(neu.traits[1].title))
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(neu.traits.length)
})

it('brings the dashboard back home when traits are shown, so every trait has its part', async () => {
  const icons3d = designStyles.find((s) => s.id === '3d-icons')!
  const { container } = render(<StylePage style={icons3d} styles={designStyles} />)
  const sidebar = container.querySelector<HTMLElement>('[data-slot="demo-sidebar"]')!
  await user.click(within(sidebar).getByRole('button', { name: '팀' }))
  expect(container.querySelector('[data-slot="demo-icon-storage"]')).toBeNull()
  await openPanel()
  await user.click(screen.getByRole('switch', { name: '특징 번호 모두 표시' }))
  expect(screen.getByRole('heading', { name: '안녕하세요, 김하늘님' })).toBeInTheDocument()
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(icons3d.traits.length)
})

it('links breadcrumb and neighbours', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  const crumbs = screen.getByRole('navigation', { name: 'breadcrumb' })
  expect(within(crumbs).getByRole('link', { name: '스타일' })).toHaveAttribute('href', '#/styles')
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
  render(<StylePage style={designStyles.find((s) => s.id === 'liquid-glass')!} styles={designStyles} />)
  expect(screen.getByText('굴절 효과는 Chrome 계열 브라우저에서 가장 잘 보입니다.')).toBeInTheDocument()
})
