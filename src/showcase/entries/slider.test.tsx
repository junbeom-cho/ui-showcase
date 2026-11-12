import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { sliderEntry } from './slider'

const user = () => userEvent.setup()
const demo = (title: string) => sliderEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const thumb = (name: string) => screen.getByRole('slider', { name })
const focus = (el: HTMLElement) => act(() => el.focus())

it('is an input with other names, a Korean sentence and distinct examples', () => {
  expect(sliderEntry.id).toBe('slider')
  expect(sliderEntry.name).toBe('Slider')
  expect(sliderEntry.category).toBe('input')
  expect(sliderEntry.aliases).toEqual(expect.arrayContaining(['Range', 'Range slider', '슬라이더']))
  expect(sliderEntry.description).toMatch(/\.$/)
  expect(sliderEntry.examples.length).toBeGreaterThanOrEqual(4)
  expect(new Set(sliderEntry.examples.map((x) => x.title)).size).toBe(sliderEntry.examples.length)
  for (const x of sliderEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('opens with a labelled state gallery, pinning the thumb states', () => {
  expect(sliderEntry.examples[0].title).toBe('상태 모음')
  const States = sliderEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '포커스·호버·끌기', '비활성', '값 표시', '범위 (두 손잡이)',
  ])
  expect(thumb('기본')).not.toHaveAttribute('data-demo-state')
  expect(thumb('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(thumb('비활성')).toHaveAttribute('data-disabled')
  expect(thumb('값 표시')).toHaveAttribute('aria-valuenow', '60')
  expect(within(items[3]).getByText('60')).toBeInTheDocument()
  expect(thumb('범위 시작')).toHaveAttribute('aria-valuenow', '25')
  expect(thumb('범위 끝')).toHaveAttribute('aria-valuenow', '70')
})

it('names anatomy parts that exist in the specimen', () => {
  const { container } = render(<sliderEntry.anatomy.Specimen />)
  expect(sliderEntry.anatomy.parts.length).toBeGreaterThanOrEqual(2)
  for (const part of sliderEntry.anatomy.parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview and every example', () => {
  expect(() => render(<sliderEntry.Preview />)).not.toThrow()
  for (const x of sliderEntry.examples) expect(() => render(<x.Demo />)).not.toThrow()
})

it('volume: keys change the level and the icon button mutes and restores it', async () => {
  const u = user()
  const Volume = demo('음량 조절')
  render(<Volume />)
  expect(status()).toHaveTextContent('음량 60')
  focus(thumb('음량'))
  await u.keyboard('{ArrowRight}')
  expect(status()).toHaveTextContent('음량 61')
  await u.keyboard('{End}')
  expect(status()).toHaveTextContent('음량 100')

  const mute = screen.getByRole('button', { name: '음소거' })
  await u.click(mute)
  expect(mute).toHaveAttribute('aria-pressed', 'true')
  expect(thumb('음량')).toHaveAttribute('aria-valuenow', '0')
  expect(status()).toHaveTextContent('음소거')
  await u.click(mute)
  expect(status()).toHaveTextContent('음량 100')
})

it('price range: two named thumbs and the range as min – max', async () => {
  const u = user()
  const Price = demo('가격 범위')
  render(<Price />)
  expect(status()).toHaveTextContent('₩100,000 – ₩300,000')
  focus(thumb('최저 가격'))
  await u.keyboard('{ArrowRight}')
  expect(status()).toHaveTextContent('₩110,000 – ₩300,000')
  expect(thumb('최저 가격')).toHaveAttribute('aria-valuetext', '₩110,000')
  focus(thumb('최고 가격'))
  await u.keyboard('{End}')
  expect(status()).toHaveTextContent('₩110,000 – ₩500,000')
  expect(screen.getByText('조건에 맞는 상품 6개')).toBeInTheDocument()
})

it('ticks: the thumb moves one step of 25 at a time', async () => {
  const u = user()
  const Ticks = demo('눈금과 단계')
  render(<Ticks />)
  expect(status()).toHaveTextContent('불투명도 50%')
  focus(thumb('불투명도'))
  await u.keyboard('{ArrowRight}')
  expect(status()).toHaveTextContent('불투명도 75%')
  await u.keyboard('{Home}')
  expect(status()).toHaveTextContent('불투명도 0%')
  await u.keyboard('{End}')
  expect(status()).toHaveTextContent('불투명도 100%')
})

it('vertical: each band moves up and down, and presets set them all', async () => {
  const u = user()
  const Eq = demo('세로 슬라이더')
  render(<Eq />)
  const mid = thumb('1kHz 대역')
  expect(mid).toHaveAttribute('aria-orientation', 'vertical')
  focus(mid)
  await u.keyboard('{ArrowUp}{ArrowUp}')
  expect(mid).toHaveAttribute('aria-valuenow', '2')
  expect(mid).toHaveAttribute('aria-valuetext', '+2 dB')
  await u.click(screen.getByRole('button', { name: '평평하게' }))
  for (const band of ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz']) {
    expect(thumb(`${band} 대역`)).toHaveAttribute('aria-valuenow', '0')
  }
  expect(screen.getAllByText('0 dB')).toHaveLength(5)
})
