import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { contextMenuEntry } from './context-menu'

// jsdom lacks the pointer-capture and scrolling APIs that Radix menus may call.
beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>
  const stubs: Record<string, () => unknown> = {
    hasPointerCapture: () => false,
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    scrollIntoView: () => {},
  }
  for (const [name, stub] of Object.entries(stubs)) {
    if (typeof proto[name] !== 'function') proto[name] = stub
  }
})

const user = () => userEvent.setup()
const demo = (title: string) => contextMenuEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const rightClick = (element: Element) => fireEvent.contextMenu(element)

it('is an overlay findable by other names, with a Korean sentence', () => {
  expect(contextMenuEntry).toMatchObject({ id: 'context-menu', name: 'Context Menu', category: 'overlay' })
  expect(contextMenuEntry.aliases).toEqual(
    expect.arrayContaining(['Right-click menu', '우클릭 메뉴', '컨텍스트 메뉴']),
  )
  expect(contextMenuEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning focus', () => {
  expect(contextMenuEntry.examples[0].title).toBe('상태 모음')
  const States = contextMenuEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '닫힘', '포커스', '열림', '항목 강조', '비활성 항목', '체크 항목', '위험한 항목', '하위 메뉴 열림',
  ])
  const [closed, focused] = screen.getAllByText('여기를 우클릭').filter((el) => el.closest('[role="img"]') === null)
  expect(closed).not.toHaveAttribute('data-demo-state')
  expect(focused).toHaveAttribute('data-demo-state', 'focus')
  expect(screen.getByRole('img', { name: /열린 메뉴/ })).toHaveTextContent('새로고침')
  expect(screen.getByRole('img', { name: /하위 메뉴/ })).toHaveTextContent('링크 복사')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(contextMenuEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(contextMenuEntry.examples.map((x) => x.title)).size).toBe(contextMenuEntry.examples.length)
  for (const x of contextMenuEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = contextMenuEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [contextMenuEntry.Preview, contextMenuEntry.anatomy.Specimen, ...contextMenuEntry.examples.map((x) => x.Demo)]
  const { container } = render(
    <>
      {[...demos, ...demos].map((Demo, i) => (
        <Demo key={i} />
      ))}
    </>,
  )
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
  expect(ids.length).toBeGreaterThan(0)
  expect(new Set(ids).size).toBe(ids.length)
})

it('the gallery area opens a real menu on a right mouse button press', async () => {
  const u = user()
  const States = contextMenuEntry.examples[0].Demo
  render(<States />)
  const [area] = screen.getAllByText('여기를 우클릭')
  await u.pointer({ keys: '[MouseRight]', target: area })
  const menu = screen.getByRole('menu')
  expect(within(menu).getByRole('menuitem', { name: /새로고침/ })).toBeInTheDocument()
  expect(area).toHaveAttribute('data-state', 'open')
})

it('file menu: items act on the right-clicked file, including a submenu', async () => {
  const u = user()
  const Files = demo('파일 우클릭 메뉴')
  render(<Files />)
  const files = () => within(screen.getByRole('list', { name: '파일' })).getAllByRole('listitem').map((li) => li.textContent)
  expect(files()).toEqual(['보고서.pdf', '여행 사진.png', '예산.xlsx'])

  rightClick(screen.getByText('보고서.pdf'))
  expect(screen.getByRole('menu')).toHaveTextContent('보고서.pdf')
  await u.click(screen.getByRole('menuitem', { name: /복제/ }))
  expect(screen.queryByRole('menu')).toBeNull()
  expect(files()).toEqual(['보고서.pdf', '보고서 (사본).pdf', '여행 사진.png', '예산.xlsx'])
  expect(status()).toHaveTextContent('"보고서.pdf"을(를) 복제했습니다.')

  // jsdom has no layout, so Radix cannot trace a pointer sliding into the submenu
  // (it closes it); the arrow keys reach it the same way a keyboard user does.
  rightClick(screen.getByText('여행 사진.png'))
  screen.getByRole('menuitem', { name: '공유' }).focus()
  await u.keyboard('{ArrowRight}')
  const firstWay = await screen.findByRole('menuitem', { name: '링크 복사' })
  await waitFor(() => expect(firstWay).toHaveFocus())
  await u.keyboard('{Enter}')
  expect(screen.queryByRole('menu')).toBeNull()
  expect(status()).toHaveTextContent('"여행 사진.png" 공유: 링크 복사')

  rightClick(screen.getByText('예산.xlsx'))
  await u.click(screen.getByRole('menuitem', { name: /삭제/ }))
  expect(files()).toEqual(['보고서.pdf', '보고서 (사본).pdf', '여행 사진.png'])
  expect(status()).toHaveTextContent('"예산.xlsx"을(를) 삭제했습니다.')

  await u.click(screen.getByRole('button', { name: '처음으로' }))
  expect(files()).toEqual(['보고서.pdf', '여행 사진.png', '예산.xlsx'])
})

it('view options: checkbox and radio items keep the menu open and change the list', async () => {
  const u = user()
  const View = demo('보기 설정')
  render(<View />)
  const names = () =>
    within(screen.getByRole('list', { name: '폴더 내용' }))
      .getAllByRole('listitem')
      .map((li) => li.querySelector('span')!.textContent)
  expect(names()).toEqual(['디자인 시안.fig', '사진 모음.zip', '예산.xlsx', '회의록.docx'])

  rightClick(screen.getByRole('list', { name: '폴더 내용' }))
  const hidden = screen.getByRole('menuitemcheckbox', { name: '숨긴 파일 보기' })
  expect(hidden).toHaveAttribute('aria-checked', 'false')
  await u.click(hidden)
  expect(screen.getByRole('menu')).toBeInTheDocument()
  expect(screen.getByRole('menuitemcheckbox', { name: '숨긴 파일 보기' })).toHaveAttribute('aria-checked', 'true')
  await u.click(screen.getByRole('menuitemcheckbox', { name: '확장자 보기' }))
  await u.click(screen.getByRole('menuitemradio', { name: '큰 파일순' }))
  expect(screen.getByRole('menuitemradio', { name: '큰 파일순' })).toHaveAttribute('aria-checked', 'true')

  // the open menu hides the rest of the page from assistive tech; close it to read the list
  await u.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).toBeNull()
  expect(names()).toEqual(['사진 모음', '디자인 시안', '예산', '회의록', '.임시 저장'])
  expect(status()).toHaveTextContent('정렬: 큰 파일순 · 숨긴 파일 보임 · 확장자 숨김')
})

it('text edit menu: cut and copy need a selection, paste needs something copied', async () => {
  const u = user()
  const TextEdit = demo('텍스트 편집 메뉴')
  render(<TextEdit />)
  const memo = screen.getByRole('textbox', { name: '메모' }) as HTMLTextAreaElement
  const original = memo.value

  memo.setSelectionRange(original.length, original.length)
  rightClick(memo)
  expect(screen.getByRole('menuitem', { name: /잘라내기/ })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('menuitem', { name: /복사/ })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('menuitem', { name: /붙여넣기/ })).toHaveAttribute('aria-disabled', 'true')
  await u.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).toBeNull()

  memo.setSelectionRange(0, 3)
  rightClick(memo)
  await u.click(screen.getByRole('menuitem', { name: /복사/ }))
  expect(status()).toHaveTextContent('"우클릭"을(를) 복사했습니다.')
  expect(screen.getByText('붙여 넣을 글: "우클릭"')).toBeInTheDocument()

  memo.setSelectionRange(original.length, original.length)
  rightClick(memo)
  await u.click(screen.getByRole('menuitem', { name: /붙여넣기/ }))
  expect(memo).toHaveValue(`${original}우클릭`)
  expect(status()).toHaveTextContent('"우클릭"을(를) 붙여 넣었습니다.')

  memo.setSelectionRange(0, 3)
  rightClick(memo)
  await u.click(screen.getByRole('menuitem', { name: /잘라내기/ }))
  expect(memo).toHaveValue(`${original.slice(3)}우클릭`)
  expect(status()).toHaveTextContent('"우클릭"을(를) 잘라냈습니다.')
})

it('both ways: the same actions open from a right-click and from the ⋯ button', async () => {
  const u = user()
  const Both = demo('⋯ 버튼과 함께 두기')
  render(<Both />)
  rightClick(screen.getByText('디자인 검토'))
  await u.click(screen.getByRole('menuitem', { name: '고정' }))
  expect(status()).toHaveTextContent('우클릭 메뉴에서 "고정"을(를) 골랐습니다.')

  await u.click(screen.getByRole('button', { name: '더 보기' }))
  await u.click(screen.getByRole('menuitem', { name: '보관' }))
  expect(status()).toHaveTextContent('⋯ 버튼 메뉴에서 "보관"을(를) 골랐습니다.')
})
