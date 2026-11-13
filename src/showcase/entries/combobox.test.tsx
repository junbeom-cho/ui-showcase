import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { comboboxEntry } from './combobox'

// jsdom lacks the pointer-capture and scrolling APIs that Radix Select and cmdk call.
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
const demo = (title: string) => comboboxEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent)

it('is an input findable by other names, with a Korean sentence', () => {
  expect(comboboxEntry).toMatchObject({ id: 'combobox', name: 'Combobox', category: 'input' })
  expect(comboboxEntry.aliases).toEqual(
    expect.arrayContaining(['Autocomplete', 'Searchable select', '콤보박스', '자동완성 선택']),
  )
  expect(comboboxEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery, pinning hover and focus', () => {
  expect(comboboxEntry.examples[0].title).toBe('상태 모음')
  const States = comboboxEntry.examples[0].Demo
  render(<States />)
  const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
  expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
    '닫힘', '값 있음', '호버', '포커스', '비활성', '오류', '열림', '검색 중', '결과 없음',
  ])
  const trigger = (name: string) => screen.getByRole('combobox', { name })
  expect(trigger('닫힘')).toHaveTextContent('도시 선택')
  expect(trigger('값 있음')).toHaveTextContent('서울')
  expect(trigger('호버')).toHaveAttribute('data-demo-state', 'hover')
  expect(trigger('포커스')).toHaveAttribute('data-demo-state', 'focus')
  expect(trigger('비활성')).toBeDisabled()
  expect(trigger('오류')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('img', { name: /열린 목록/ })).toHaveTextContent('부산')
  expect(screen.getByRole('img', { name: /검색 중/ })).toHaveTextContent('부천')
  expect(screen.getByRole('img', { name: /결과 없음/ })).toHaveTextContent('결과 없음')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(comboboxEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(comboboxEntry.examples.map((x) => x.title)).size).toBe(comboboxEntry.examples.length)
  for (const x of comboboxEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = comboboxEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [comboboxEntry.Preview, comboboxEntry.anatomy.Specimen, ...comboboxEntry.examples.map((x) => x.Demo)]
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

it('pick one: typing filters the list, and a click or Enter chooses', async () => {
  const u = user()
  const PickOne = demo('검색해서 하나 고르기')
  render(<PickOne />)
  const trigger = screen.getByRole('combobox', { name: '도시' })

  await u.click(trigger)
  const search = screen.getByRole('combobox', { name: '도시 검색' })
  expect(search).toHaveFocus()
  await u.type(search, '부')
  expect(optionNames()).toEqual(['부산', '부천'])
  await u.click(screen.getByRole('option', { name: '부산' }))
  expect(screen.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveTextContent('부산')
  expect(status()).toHaveTextContent('부산을(를) 골랐습니다.')

  await u.click(trigger)
  await u.type(screen.getByRole('combobox', { name: '도시 검색' }), '런던')
  expect(optionNames()).toEqual([])
  expect(screen.getByText('결과 없음')).toBeInTheDocument()
  await u.clear(screen.getByRole('combobox', { name: '도시 검색' }))
  await u.type(screen.getByRole('combobox', { name: '도시 검색' }), '세{Enter}')
  expect(trigger).toHaveTextContent('세종')
  expect(status()).toHaveTextContent('세종을(를) 골랐습니다.')
})

it('pick many: the list stays open and chosen items become removable badges', async () => {
  const u = user()
  const PickMany = demo('여러 개 고르기')
  render(<PickMany />)
  expect(screen.getByRole('button', { name: '디자인 빼기' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '개발 빼기' })).toBeInTheDocument()

  await u.click(screen.getByRole('combobox', { name: '관심 분야' }))
  await u.click(screen.getByRole('option', { name: '데이터' }))
  expect(screen.getByRole('option', { name: '데이터' })).toHaveAttribute('data-checked', 'true')
  expect(screen.getByRole('button', { name: '데이터 빼기' })).toBeInTheDocument()
  await u.click(screen.getByRole('option', { name: '디자인' }))
  expect(screen.queryByRole('button', { name: '디자인 빼기' })).toBeNull()
  expect(status()).toHaveTextContent('2개 고름: 개발, 데이터')

  await u.keyboard('{Escape}')
  expect(screen.queryByRole('listbox')).toBeNull()
  await u.click(screen.getByRole('button', { name: '개발 빼기' }))
  expect(status()).toHaveTextContent('1개 고름: 데이터')
})

it('groups: recent picks sit on top until a search, and the last pick moves to the front', async () => {
  const u = user()
  const Groups = demo('묶음과 최근 항목')
  render(<Groups />)
  const trigger = screen.getByRole('combobox', { name: '도착역' })

  await u.click(trigger)
  const recent = screen.getByRole('group', { name: '최근 고른 역' })
  expect(within(recent).getAllByRole('option').map((o) => o.textContent)).toEqual(['부산', '대전'])
  expect(screen.getByRole('separator')).toBeInTheDocument()

  await u.type(screen.getByRole('combobox', { name: '역 이름 검색' }), '울')
  expect(screen.queryByRole('group', { name: '최근 고른 역' })).toBeNull()
  expect(screen.queryByRole('separator')).toBeNull()
  expect(optionNames()).toEqual(expect.arrayContaining(['서울', '울산']))
  expect(screen.getByText('충청')).not.toBeVisible()
  await u.click(screen.getByRole('option', { name: '울산' }))
  expect(status()).toHaveTextContent('도착역: 울산')

  await u.click(trigger)
  const again = screen.getByRole('group', { name: '최근 고른 역' })
  expect(within(again).getAllByRole('option').map((o) => o.textContent)).toEqual(['울산', '부산', '대전'])
})

it('create new: a name that is not in the list can be added and chosen', async () => {
  const u = user()
  const Create = demo('없으면 새로 만들기')
  render(<Create />)
  const trigger = screen.getByRole('combobox', { name: '라벨' })

  await u.click(trigger)
  const search = screen.getByRole('combobox', { name: '라벨 검색' })
  await u.type(search, '버그')
  expect(optionNames()).toEqual(['버그']) // already exists: nothing to add
  await u.clear(search)
  await u.type(search, '성능')
  expect(optionNames()).toEqual(["'성능' 추가"])
  await u.click(screen.getByRole('option', { name: "'성능' 추가" }))
  expect(trigger).toHaveTextContent('성능')
  expect(status()).toHaveTextContent("'성능' 라벨을 새로 만들어 골랐습니다.")

  await u.click(trigger)
  expect(optionNames()).toEqual(['버그', '기능 요청', '문서', '질문', '성능'])
  expect(screen.getByRole('option', { name: '성능' })).toHaveAttribute('data-checked', 'true')
})

it('server search: waits for typing to pause, sends one request and lists what came back', async () => {
  const u = user()
  const Server = demo('서버에서 찾기')
  render(<Server />)
  await u.click(screen.getByRole('combobox', { name: '담당자' }))
  expect(screen.getByText('이름이나 팀을 쳐 보세요')).toBeInTheDocument()

  await u.type(screen.getByRole('combobox', { name: '이름이나 팀 검색' }), '개발')
  expect(screen.getByText('입력이 멈추길 기다리는 중…')).toBeInTheDocument()
  expect(await screen.findByRole('progressbar', { name: '찾는 중' })).toBeInTheDocument()
  const option = await screen.findByRole('option', { name: /김민준/ }, { timeout: 2000 })
  expect(optionNames()).toHaveLength(4)
  expect(screen.getByText('서버 요청 1번')).toBeInTheDocument()

  await u.click(option)
  expect(status()).toHaveTextContent('담당자: 김민준 (개발팀)')
})

it('compared with Select: both pick a value', async () => {
  const u = user()
  const Compare = demo('Select와 비교')
  render(<Compare />)
  await u.click(screen.getByRole('combobox', { name: 'Select · 정렬' }))
  await u.click(screen.getByRole('option', { name: '인기순' }))
  expect(screen.getByText('고른 값: 인기순')).toBeInTheDocument()

  await u.click(screen.getByRole('combobox', { name: 'Combobox · 나라' }))
  await u.type(screen.getByRole('combobox', { name: '나라 검색' }), '노르')
  await u.click(screen.getByRole('option', { name: '노르웨이' }))
  expect(screen.getByText('고른 값: 노르웨이')).toBeInTheDocument()
})
