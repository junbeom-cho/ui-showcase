import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { searchPatternsEntry } from '.'
import {
  AutocompleteFormat,
  FacetFilterFormat,
  FilterChipsFormat,
  HighlightResultsFormat,
  NoResultsFormat,
  RecentSearchesFormat,
  SearchBoxFormat,
} from './formats'
import { correctionFor, PRODUCTS, search, splitMatches } from './products'

// jsdom lacks the pointer-capture and scrolling APIs that Radix Select and menus call while opening.
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

const status = () => screen.getByRole('status')
const user = () => userEvent.setup()

describe('entry', () => {
  it('is an input entry that search finds by every format name', () => {
    expect(searchPatternsEntry.id).toBe('search-patterns')
    expect(searchPatternsEntry.category).toBe('input')
    expect(searchPatternsEntry.description).toMatch(/\.$/)
    for (const query of [
      'Search bar',
      'Autocomplete',
      'Typeahead',
      'Recent searches',
      'Filter chips',
      'Faceted search',
      '검색창',
      '자동완성',
      '최근 검색어',
      '패싯 필터',
      '결과 없음',
    ]) {
      expect(filterEntries([searchPatternsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the formats after the state gallery, in order, each explained in Korean', () => {
    expect(searchPatternsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '검색창',
      '자동완성',
      '최근 검색어',
      '필터 칩',
      '패싯 필터',
      '검색 결과 강조',
      '결과 없음',
    ])
    for (const x of searchPatternsEntry.examples) expect(x.description).toMatch(/[가-힣].*\.$/)
  })

  it('opens with the search field in each state', () => {
    const States = searchPatternsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '비어 있음',
      '입력 중 (지우기 ×)',
      '검색 중',
      '결과 있음 (개수)',
      '결과 없음',
      '오류',
    ])
    expect(screen.getByRole('textbox', { name: '비어 있음' })).toHaveValue('')
    expect(within(items[1]).getByRole('button', { name: '검색어 지우기' })).toBeInTheDocument()
    expect(within(items[2]).getByLabelText('찾는 중')).toBeInTheDocument()
    expect(items[3]).toHaveTextContent('3개')
    expect(items[4]).toHaveTextContent('0개')
    expect(screen.getByRole('textbox', { name: '오류' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders its preview and every example inside the example box', () => {
    const { Preview, anatomy, examples } = searchPatternsEntry
    for (const Demo of [Preview, anatomy.Specimen, ...examples.map((x) => x.Demo)]) {
      const { container, unmount } = render(<Demo />)
      expect(container.querySelector('[class~="fixed"]')).toBeNull()
      unmount()
    }
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = searchPatternsEntry.anatomy
    const { container } = render(<Specimen />)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })
})

describe('shared products', () => {
  it('has 20 products with unique ids', () => {
    expect(PRODUCTS).toHaveLength(20)
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(20)
  })

  it('matches every word of a query in the name or description, in any case', () => {
    expect(search('이어폰').map((p) => p.name)).toEqual(['무선 블루투스 이어폰', '유선 이어폰', '3in1 충전 거치대'])
    expect(search('이어폰 무선').map((p) => p.name)).toEqual(['무선 블루투스 이어폰', '3in1 충전 거치대'])
    expect(search('USB').map((p) => p.id)).toEqual(search('usb').map((p) => p.id))
    expect(search('   ')).toHaveLength(20)
  })

  it('cuts text into marked and plain pieces', () => {
    expect(splitMatches('USB-C 고속 충전기', 'usb 충전')).toEqual([
      { text: 'USB', match: true },
      { text: '-C 고속 ', match: false },
      { text: '충전', match: true },
      { text: '기', match: false },
    ])
    expect(splitMatches('트랙패드', '')).toEqual([{ text: '트랙패드', match: false }])
  })

  it('suggests a spelling only when a word is known to be misspelt', () => {
    expect(correctionFor('블루투수')).toBe('블루투스')
    expect(correctionFor('무선 이어펀')).toBe('무선 이어폰')
    expect(correctionFor('이어폰')).toBeNull()
  })
})

it('search box: Ctrl+K jumps in, Enter searches, × and Esc clear', async () => {
  const u = user()
  render(<SearchBoxFormat />)
  const field = screen.getByRole('searchbox', { name: '검색어' })
  expect(screen.getByRole('search', { name: '상품 검색' })).toContainElement(field)

  await u.keyboard('{Control>}k{/Control}')
  expect(field).toHaveFocus()
  expect(status()).toHaveTextContent('Ctrl K로 검색창에 들어왔습니다')

  await u.keyboard('{Enter}')
  expect(status()).toHaveTextContent('검색어를 입력하세요')
  await u.type(field, '이어폰{Enter}')
  expect(status()).toHaveTextContent('검색어: 이어폰 · 결과 3개')
  expect(screen.getByText('shop.example/search?q=이어폰')).toBeInTheDocument()
  expect(within(screen.getByRole('list', { name: '검색 결과' })).getAllByRole('listitem')).toHaveLength(3)

  await u.click(screen.getByRole('button', { name: '검색어 지우기' }))
  expect(field).toHaveValue('')
  expect(field).toHaveFocus()
  await u.type(field, '무선')
  await u.keyboard('{Escape}')
  expect(field).toHaveValue('')
})

it('autocomplete: suggests while typing, bolds the typed part, and picks with ↓ and Enter', async () => {
  const u = user()
  render(<AutocompleteFormat />)
  const field = screen.getByRole('combobox', { name: '무엇을 찾으세요?' })
  expect(field).toHaveAttribute('aria-expanded', 'false')

  await u.type(field, '무선')
  const list = screen.getByRole('listbox', { name: '검색어 제안' })
  const options = within(list).getAllByRole('option')
  expect(options.map((o) => o.textContent)).toEqual(['무선 블루투스 이어폰오디오', '무선 마우스입력 장치', '무선 충전 패드충전'])
  expect(options[0].querySelector('strong')).toHaveTextContent('무선')
  expect(field).toHaveAttribute('aria-expanded', 'true')
  expect(field).not.toHaveAttribute('aria-activedescendant')
  expect(status()).toHaveTextContent('제안 3개')

  await u.keyboard('{ArrowDown}{ArrowDown}')
  expect(field).toHaveAttribute('aria-activedescendant', options[1].id)
  expect(options[1]).toHaveAttribute('aria-selected', 'true')
  expect(status()).toHaveTextContent('가리킴: 무선 마우스')
  await u.keyboard('{ArrowDown}{ArrowDown}')
  expect(field).toHaveAttribute('aria-activedescendant', options[0].id)
  await u.keyboard('{ArrowUp}')
  expect(field).toHaveAttribute('aria-activedescendant', options[2].id)

  await u.keyboard('{Enter}')
  expect(field).toHaveValue('무선 충전 패드')
  expect(field).toHaveAttribute('aria-expanded', 'false')
  expect(status()).toHaveTextContent('고른 검색어: 무선 충전 패드')

  await u.clear(field)
  await u.type(field, '거치')
  await u.click(screen.getByRole('option', { name: '노트북 거치대, 거치대' }))
  expect(field).toHaveValue('노트북 거치대')
  expect(field).toHaveFocus()
})

it('recent searches: shown on focus while empty; pick fills the field, and they can be removed', async () => {
  const u = user()
  render(<RecentSearchesFormat />)
  const field = screen.getByRole('searchbox', { name: '검색어' })
  expect(screen.queryByRole('region', { name: '최근 검색어' })).toBeNull()

  await u.click(field)
  const recent = () => within(screen.getByRole('region', { name: '최근 검색어' }))
  expect(recent().getAllByRole('listitem').map((li) => li.textContent)).toEqual(['보조배터리', '기계식 키보드', '이어폰', '거치대'])

  await u.click(recent().getByRole('button', { name: '이어폰' }))
  expect(field).toHaveValue('이어폰')
  expect(screen.queryByRole('region', { name: '최근 검색어' })).toBeNull()
  expect(status()).toHaveTextContent('최근 검색어 4개 · 검색: 이어폰')
  expect(screen.getByText(/결과/)).toHaveTextContent('‘이어폰’ 결과 3개')

  await u.click(screen.getByRole('button', { name: '검색어 지우기' }))
  expect(recent().getAllByRole('listitem')[0]).toHaveTextContent('이어폰')
  await u.click(recent().getByRole('button', { name: '거치대 지우기' }))
  expect(recent().queryByRole('button', { name: '거치대' })).toBeNull()
  expect(status()).toHaveTextContent('최근 검색어 3개')
  expect(field).toHaveFocus()

  await u.click(recent().getByRole('button', { name: '전체 삭제' }))
  expect(recent().getByText('최근 검색어가 없어요')).toBeInTheDocument()
  await u.type(field, 'usb{Enter}')
  await u.clear(field)
  expect(recent().getAllByRole('listitem').map((li) => li.textContent)).toEqual(['usb'])
})

it('filter chips: each chip narrows the list, the count follows, and 모두 지우기 resets', async () => {
  const u = user()
  render(<FilterChipsFormat />)
  expect(status()).toHaveTextContent('상품 20개 / 전체 20개 · 필터 0개 적용')

  await u.click(screen.getByRole('button', { name: '무료 배송' }))
  expect(screen.getByRole('button', { name: '무료 배송' })).toHaveAttribute('aria-pressed', 'true')
  expect(status()).toHaveTextContent('상품 11개 / 전체 20개 · 필터 1개 적용')
  await u.click(screen.getByRole('button', { name: '평점 4+' }))
  expect(status()).toHaveTextContent('상품 10개 / 전체 20개 · 필터 2개 적용')

  await u.click(screen.getByRole('button', { name: '가격대' }))
  await u.click(screen.getByRole('menuitemradio', { name: '2만원 이하' }))
  expect(screen.getByRole('button', { name: '가격대: 2만원 이하' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('상품 0개 / 전체 20개 · 필터 3개 적용')
  expect(screen.getByText('조건에 맞는 상품이 없어요')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '모두 지우기' }))
  expect(status()).toHaveTextContent('상품 20개 / 전체 20개 · 필터 0개 적용')
  expect(screen.getByRole('button', { name: '무료 배송' })).toHaveAttribute('aria-pressed', 'false')
})

it('facet filter: counts per option follow the other groups, and empty options are disabled', async () => {
  const u = user()
  render(<FacetFilterFormat />)
  const box = (name: RegExp) => screen.getByRole('checkbox', { name })
  const countOf = (name: RegExp) => box(name).parentElement!.querySelector('label span')!.textContent

  expect(countOf(/^오디오/)).toBe('5')
  expect(countOf(/^키온/)).toBe('7')
  expect(status()).toHaveTextContent('상품 20개 · 고른 조건: 없음')

  await u.click(box(/^오디오/))
  expect(status()).toHaveTextContent('상품 5개 · 고른 조건: 오디오')
  expect(countOf(/^키온/)).toBe('1')
  expect(box(/^파워업/)).toBeDisabled()
  // other options of the same group keep their own counts (they would add, not narrow)
  expect(countOf(/^충전/)).toBe('5')

  await u.click(box(/^충전/))
  await u.click(box(/^무료 배송/))
  expect(status()).toHaveTextContent('상품 6개 · 고른 조건: 오디오, 충전, 무료 배송')
  expect(within(screen.getByRole('list', { name: '상품' })).getAllByRole('listitem')).toHaveLength(6)

  await u.click(screen.getByRole('button', { name: '오디오 조건 빼기' }))
  expect(box(/^오디오/)).not.toBeChecked()
  expect(status()).toHaveTextContent('상품 3개 · 고른 조건: 충전, 무료 배송')
  await u.click(screen.getByRole('button', { name: '모두 지우기' }))
  expect(status()).toHaveTextContent('상품 20개 · 고른 조건: 없음')
})

it('highlighting: marks the query in names and descriptions, and sorts on request', async () => {
  const u = user()
  render(<HighlightResultsFormat />)
  const list = () => within(screen.getByRole('list', { name: '검색 결과' }))
  const names = () => list().getAllByRole('listitem').map((li) => li.firstElementChild!.textContent)

  expect(status()).toHaveTextContent('‘무선’ 결과 6개 · 관련도순')
  expect(names()).toEqual([
    '무선 블루투스 이어폰',
    '무선 마우스',
    '무선 충전 패드',
    '노이즈 캔슬링 헤드폰',
    '기계식 키보드',
    '3in1 충전 거치대',
  ])
  expect(list().getAllByText('무선', { selector: 'mark' }).length).toBeGreaterThanOrEqual(6)

  await u.click(screen.getByRole('combobox', { name: '정렬' }))
  await u.click(screen.getByRole('option', { name: '낮은 가격순' }))
  expect(status()).toHaveTextContent('‘무선’ 결과 6개 · 낮은 가격순')
  expect(names()[0]).toBe('무선 충전 패드')
  expect(names()[5]).toBe('노이즈 캔슬링 헤드폰')

  const field = screen.getByRole('searchbox', { name: '검색어' })
  await u.clear(field)
  await u.type(field, 'usb')
  expect(status()).toHaveTextContent('‘usb’ 결과 2개')
  expect(list().getAllByText(/usb/i, { selector: 'mark' }).map((m) => m.textContent)).toContain('USB')
})

it('no results: offers the spelling, similar words and dropping the filter, in that order of need', async () => {
  const u = user()
  render(<NoResultsFormat />)
  expect(status()).toHaveTextContent('‘블루투수’ 결과 0개 · 필터: 2만원 이하')
  expect(screen.getByRole('heading', { name: '‘블루투수’ 검색 결과가 없어요' })).toBeInTheDocument()
  expect(screen.getByText(/찾으셨나요/)).toHaveTextContent('혹시 ‘블루투스’를 찾으셨나요?')
  for (const word of ['이어폰', '스피커', '무선']) expect(screen.getByRole('button', { name: word })).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '‘블루투스’' }))
  expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('블루투스')
  expect(status()).toHaveTextContent('‘블루투스’ 결과 0개 · 필터: 2만원 이하 (필터를 풀면 3개)')
  expect(screen.getByText('필터 때문에 상품 3개가 가려져 있어요.')).toBeInTheDocument()

  await u.click(screen.getByRole('button', { name: '필터 해제' }))
  expect(status()).toHaveTextContent('‘블루투스’ 결과 3개 · 필터: 없음')
  expect(within(screen.getByRole('list', { name: '검색 결과' })).getAllByRole('listitem')).toHaveLength(3)

  await u.click(screen.getByRole('button', { name: '결과 없음 화면 다시 보기' }))
  expect(status()).toHaveTextContent('‘블루투수’ 결과 0개 · 필터: 2만원 이하')
})
