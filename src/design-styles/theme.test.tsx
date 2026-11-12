import { render } from '@testing-library/react'
import { usePageStyle } from './theme'

const html = () => document.documentElement

function Probe({ styleId }: { styleId: string | null }) {
  usePageStyle(styleId)
  return null
}

afterEach(() => {
  delete html().dataset.designStyle
})

describe('usePageStyle', () => {
  it('dresses the whole document in the style while a style page is open', () => {
    const { rerender, unmount } = render(<Probe styleId="flat" />)
    expect(html()).toHaveAttribute('data-design-style', 'flat')
    rerender(<Probe styleId="neumorphism" />)
    expect(html()).toHaveAttribute('data-design-style', 'neumorphism')
    rerender(<Probe styleId={null} />)
    expect(html()).not.toHaveAttribute('data-design-style')
    rerender(<Probe styleId="flat" />)
    unmount()
    expect(html()).not.toHaveAttribute('data-design-style')
  })

  it('does not remember the style between visits', () => {
    render(<Probe styleId="flat" />)
    expect(localStorage.length).toBe(0)
  })
})
