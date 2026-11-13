import { SearchIcon, XIcon } from 'lucide-react'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  AutocompleteFormat,
  FacetFilterFormat,
  FilterChipsFormat,
  HighlightResultsFormat,
  NoResultsFormat,
  RecentSearchesFormat,
  SearchBoxFormat,
} from './formats'
import { BoldMatch, SearchFieldDrawing } from './parts'

function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '비어 있음', node: <SearchFieldDrawing label="비어 있음" look="empty" /> },
        { label: '입력 중 (지우기 ×)', node: <SearchFieldDrawing label="입력 중" look="typing" value="이어폰" /> },
        { label: '검색 중', node: <SearchFieldDrawing label="검색 중" look="searching" value="이어폰" /> },
        { label: '결과 있음 (개수)', node: <SearchFieldDrawing label="결과 있음" look="results" value="이어폰" /> },
        { label: '결과 없음', node: <SearchFieldDrawing label="결과 없음" look="none" value="블루투수" /> },
        { label: '오류', node: <SearchFieldDrawing label="오류" look="error" value="이어폰" /> },
      ]}
    />
  )
}

const SPECIMEN_SUGGESTIONS = ['무선 블루투스 이어폰', '유선 이어폰']

function SearchSpecimen() {
  return (
    <div className="flex w-72 flex-col gap-1.5">
      <div
        data-slot="search-field"
        className="flex h-9 items-center gap-2 rounded-lg border border-ring bg-background px-2.5 ring-3 ring-ring/30"
      >
        <SearchIcon data-slot="search-icon" aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span data-slot="search-input" className="flex flex-1 items-center text-sm">
          이어
          <span aria-hidden className="ml-px h-4 w-px bg-foreground" />
        </span>
        <span data-slot="search-clear" className="grid size-5 place-items-center rounded-full bg-muted text-muted-foreground">
          <XIcon aria-hidden className="size-3" />
        </span>
        <kbd data-slot="search-shortcut" className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </div>
      <div data-slot="search-suggestions" className="flex flex-col rounded-lg border bg-popover p-1 shadow-md">
        {SPECIMEN_SUGGESTIONS.map((name, i) => (
          <div key={name} className={i === 0 ? 'flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-sm' : 'flex items-center gap-2 px-2 py-1.5 text-sm'}>
            <SearchIcon aria-hidden className="size-3.5 text-muted-foreground" />
            <span>
              <BoldMatch text={name} query="이어" slots={i === 0} />
            </span>
          </div>
        ))}
        <p data-slot="result-count" className="mt-1 border-t px-2 pt-1.5 pb-0.5 text-xs text-muted-foreground">
          ‘이어’ 결과 3개 모두 보기
        </p>
      </div>
    </div>
  )
}

function SearchPreview() {
  return (
    <div aria-hidden className="flex w-40 flex-col gap-1.5">
      <div className="flex h-7 items-center gap-1.5 rounded-md border bg-background px-2">
        <SearchIcon className="size-3 text-muted-foreground" />
        <span className="h-1.5 w-10 rounded-full bg-foreground/70" />
      </div>
      <div className="flex flex-col gap-1 rounded-md border bg-background p-1.5 shadow-sm">
        <span className="flex items-center gap-1 rounded bg-muted px-1 py-0.5">
          <span className="h-1.5 w-5 rounded-full bg-foreground/80" />
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="flex items-center gap-1 px-1 py-0.5">
          <span className="h-1.5 w-5 rounded-full bg-foreground/80" />
          <span className="h-1.5 w-7 rounded-full bg-muted-foreground/30" />
        </span>
      </div>
    </div>
  )
}

export const searchPatternsEntry: ShowcaseEntry = {
  id: 'search-patterns',
  name: 'Search Patterns',
  aliases: [
    'Search bar',
    'Search box',
    'Autocomplete',
    'Typeahead',
    'Recent searches',
    'Filter chips',
    'Faceted search',
    'Search highlighting',
    'No results',
    '검색',
    '검색창',
    '자동완성',
    '최근 검색어',
    '필터 칩',
    '패싯 필터',
    '검색 결과 강조',
    '결과 없음',
  ],
  description: '찾는 것을 입력하고 결과를 좁혀 가는 검색 화면을 검색창·자동완성·최근 검색어·필터·결과 강조 같은 방식으로 보여 주는 형식.',
  category: 'input',
  Preview: SearchPreview,
  anatomy: {
    Specimen: SearchSpecimen,
    parts: [
      { slot: 'search-field', name: 'Search field', description: '검색어를 넣는 칸 전체. 코드에서는 role="search" 폼 안의 입력칸' },
      { slot: 'search-icon', name: 'Icon', description: '돋보기. 이 칸이 검색칸임을 한눈에 알려 줌' },
      { slot: 'search-input', name: 'Input', description: '사용자가 입력한 검색어' },
      { slot: 'search-clear', name: 'Clear button', description: '입력한 검색어를 한 번에 지우는 ×. 글자가 있을 때만 보임' },
      { slot: 'search-shortcut', name: 'Shortcut hint', description: '어디서든 검색칸으로 오는 단축키(Ctrl K, ⌘K)' },
      { slot: 'search-suggestions', name: 'Suggestions', description: '입력하는 동안 아래에 뜨는 제안 목록. ↑↓와 Enter로 고름' },
      { slot: 'suggestion-match', name: 'Match', description: '제안 속에서 입력한 글자와 같은 부분. 굵게 표시' },
      { slot: 'result-count', name: 'Result count', description: '찾은 결과가 몇 개인지. 0개일 때 할 일도 알려 줌' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '검색칸 하나가 거치는 상태입니다. 비어 있을 때와 입력 중(지우기 버튼), 검색 중(도는 표시), 그리고 끝난 뒤의 세 갈래인 결과 있음·결과 없음·오류를 그렸습니다.',
      Demo: States,
    },
    {
      title: '검색창',
      description:
        '돋보기 아이콘, 지우기 버튼, 단축키 안내를 갖춘 기본 검색칸입니다. 어느 화면에서나 찾을 일이 있는 사이트·앱 머리말에 두고, 고를 값이 몇 개 안 되면 검색 대신 목록이나 선택 상자가 낫습니다. 이 예시가 화면에 보일 때 Ctrl+K(맥은 ⌘K)를 눌러 칸으로 들어가고, 검색어를 넣어 Enter, ×나 Esc로 지워 보세요.',
      Demo: SearchBoxFormat,
    },
    {
      title: '자동완성',
      description:
        '입력하는 동안 맞는 상품 이름을 아래에 제안하고, 입력한 부분은 굵게 보여 줍니다. 이름을 정확히 몰라도 몇 글자로 찾게 할 때 쓰고, 정해진 값 가운데 하나만 골라야 하면 콤보박스가 맞습니다. 키보드로 쓰려면 초점은 입력칸에 둔 채 ↑↓로 가리키는 제안만 바꿉니다(aria-activedescendant). ‘무선’을 입력하고 ↓와 Enter로 골라 보세요.',
      Demo: AutocompleteFormat,
    },
    {
      title: '최근 검색어',
      description:
        '검색칸을 눌렀는데 아직 아무것도 입력하지 않았을 때 지난 검색어를 보여 줍니다. 같은 것을 자주 다시 찾는 쇼핑·지도 앱에 쓰고, 남이 같이 쓰는 기기나 민감한 검색에는 하나씩 지우기와 전체 삭제가 꼭 필요합니다. 칸을 눌러 목록을 열고, 하나를 골라 보고, ×와 전체 삭제로 지워 보세요.',
      Demo: RecentSearchesFormat,
    },
    {
      title: '필터 칩',
      description:
        '결과 위에 가격대·평점·무료 배송 같은 조건을 동그란 칩으로 늘어놓고 눌러서 켜고 끕니다. 조건이 몇 개 안 되는 휴대폰 화면에 쓰고, 조건이 많고 여러 개를 함께 고르면 패싯 필터가 낫습니다. 칩을 켜 가며 상품 수와 필터 개수가 바뀌는지 보고, 모두 지우기를 눌러 보세요.',
      Demo: FilterChipsFormat,
    },
    {
      title: '패싯 필터',
      description:
        '옆 칸에 카테고리·브랜드·배송 같은 묶음별 체크박스를 두고, 옵션마다 고르면 몇 개가 남는지 숫자로 보여 줍니다. 상품이 많은 쇼핑몰 목록 화면에 쓰며, 같은 묶음 안에서는 "또는", 묶음끼리는 "그리고"로 합칩니다. 휴대폰처럼 옆 칸을 둘 자리가 없으면 필터 버튼 뒤의 시트로 옮깁니다. 오디오를 고른 뒤 브랜드 숫자가 바뀌고 0개인 옵션이 흐려지는 것을 보세요.',
      Demo: FacetFilterFormat,
    },
    {
      title: '검색 결과 강조',
      description:
        '결과 목록에서 검색어와 같은 부분을 형광펜(<mark>)으로 칠하고, 결과 개수와 정렬 기준을 위에 둡니다. 왜 이 결과가 나왔는지 바로 보이게 할 때 쓰고, 칠할 곳이 너무 많아 글이 얼룩덜룩해지면 제목에만 칠합니다. 이름에 검색어가 있는 상품이 관련도순 위에 옵니다. 검색어를 바꾸고 정렬을 낮은 가격순으로 바꿔 보세요.',
      Demo: HighlightResultsFormat,
    },
    {
      title: '결과 없음',
      description:
        '결과가 0개일 때 빈 목록만 두지 않고, 철자 확인·비슷한 검색어·필터 해제처럼 다음에 할 일을 줍니다. 결과가 없는 까닭이 오타인지 필터인지에 따라 안내가 달라집니다. 맞춤법 제안을 눌러 본 뒤, 그래도 0개면 필터 해제를 눌러 보세요.',
      Demo: NoResultsFormat,
    },
  ],
}
