# 디자인 스타일 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바의 "디자인 스타일" 묶음에서 9개 스타일을 고르면, 같은 데모 앱 화면이 그 스타일로 그려지고 특징이 번호로 짚어지는 페이지와, 9개를 한눈에 보는 썸네일 첫 화면을 만든다.

**Architecture:** 데모 화면(`DemoApp`)은 기존 shadcn 컴포넌트로 한 번만 만들고, 바깥 요소의 `data-design-style="<id>"` 속성으로 범위를 정한 스타일별 CSS 파일로만 모양을 바꾼다. 스타일 정보(이름·특징)는 `src/design-styles/registry.ts`의 데이터이고, 특징 표시는 기존 `Anatomy`를 옵션으로 넓혀 재사용한다. 주소는 기존 해시 라우팅에 `#/styles`, `#/style/<id>`를 더한다.

**Tech Stack:** React 19, Vite 8, TypeScript 7, Tailwind CSS v4, shadcn/ui(radix-nova), Vitest + jsdom + Testing Library. Node는 mise(`mise exec --`)로 실행한다.

**Spec:** [docs/superpowers/specs/2026-11-12-design-styles-design.md](../specs/2026-11-12-design-styles-design.md). 관련 결정: D-012, D-013, D-014 ([DECISION.md](../../../DECISION.md)).

## Global Constraints

- 스택은 그대로다(D-004, D-005). 새 런타임 의존성을 추가하지 않는다. 라우터 라이브러리도 쓰지 않는다(D-010).
- 사이드바·페이지 틀은 지금의 도면 스타일(D-011)을 유지한다. 스타일은 데모 안에서만 바뀐다.
- 스타일 CSS의 모든 규칙은 `[data-design-style="<그 파일의 id>"]`로 시작하는 선택자만 쓴다. CSS 중첩(nesting) 문법은 쓰지 않는다. `@media`, `@supports`, `@keyframes`는 쓸 수 있다(Task 2의 범위 테스트가 이 규칙을 강제한다).
- 9개 스타일 모두 데모의 글, 배치, 요소 수가 같다.
- 데모 고정 문구: `김하늘`, `프로`, `설정 검색`, `알림 받기`, `자동 백업`, `저장 공간`, `70%`, `저장`, `취소`.
- 스타일 순서(사이드바, 이전·다음, 첫 화면 격자): `skeuomorphism`, `flat`, `material`, `neumorphism`, `glassmorphism`, `claymorphism`, `neo-brutalism`, `3d-icons`, `liquid-glass`.
- 375px에서 가로 스크롤이 없어야 한다. `prefers-reduced-motion: reduce`에서는 ripple·반짝임 같은 움직임을 끈다. 모든 스타일에서 키보드 포커스가 보여야 한다.
- 본문 글(이름, 설정 문구)은 모든 스타일에서 읽을 수 있어야 한다. 뉴모피즘의 "낮은 대비"는 테두리·그림자에서만 보여준다.
- 내려받는 이미지: 3D 아이콘은 Microsoft Fluent Emoji 3D(MIT 확인 후)에서 받아 `public/icons-3d/`에 둔다. 배경은 CC0, Unsplash License, Pexels License 중 하나인 이미지만 받아 `public/backgrounds/`에 둔다. 장당 300KB 이하로 하고, 폴더마다 `LICENSE.md`에 출처, 작가, 라이선스를 적는다(D-013, D-014).
- 기존 컴포넌트 페이지와 개요 동작은 바뀌지 않는다. 사이드바처럼 의도해서 바뀌는 부분의 테스트는 새 동작에 맞게 고친다(spec 7절).
- 결정은 DECISION.md에 기록한다. **커밋은 사용자가 요청할 때만 한다(CLAUDE.md).** 각 태스크의 커밋 단계는 사용자가 태스크별 커밋을 허용한 경우에만 실행한다. 메시지는 D-008을 따른다: `<type>(<scope>): <한국어 명사형>`, 트레일러 없음.
- 개발 서버가 같은 파일의 연속 수정을 놓쳐 옛 코드를 보여줄 수 있다. 브라우저 확인 결과가 코드와 다르면 개발 서버를 재시작한다.

## Review Focus

1. **헷갈리는 짝을 구분할 수 있는가**: 뉴모피즘 vs 클레이모피즘, 글래스모피즘 vs 리퀴드 글래스. 썸네일만 보고도 구분돼야 한다(spec 5.1의 기준). → Task 10 브라우저 확인
2. **이미지 로드 실패**: 3D 아이콘이나 배경 이미지를 불러오지 못해도 데모가 깨지지 않아야 한다. 아이콘 자리는 일반 아이콘으로 대신 보이고, 배경은 비슷한 CSS 색으로 대신 보여야 한다. → Task 2 테스트(아이콘), Task 7·9 CSS 규칙(배경색 먼저)
3. **Chrome 계열이 아닌 브라우저의 리퀴드 글래스**: 굴절 없이 유리 효과로 대신 보이고, 깨지거나 빈 화면이 되면 안 된다. → Task 5 테스트(`supportsRefraction`), Task 9 CSS
4. **키보드 포커스**: 스타일 CSS가 포커스 표시를 지워 버리는 경우가 생기기 쉽다. 9개 모두에서 Tab으로 이동할 때 포커스가 보여야 한다. → Task 10 브라우저 확인
5. **좁은 화면**: 375px에서 스타일 페이지와 첫 화면 썸네일 격자에 가로 스크롤이 없어야 하고, 특징 번호가 틀 밖으로 나가지 않아야 한다. → Task 10 브라우저 확인(기존 점검 스크립트 재사용)

---

## File Structure

```
src/showcase/
  route.ts                     # + styles / style routes, styleHref (modify)
  filter-entries.ts            # + matchesQuery (modify)
  anatomy.tsx                  # + markers / nameStyle / labels options (modify)
  app-sidebar.tsx              # nav takes route, adds design-style group, shared search (modify)
src/design-styles/
  types.ts                     # DesignStyle, DesignStyleTrait
  registry.ts                  # designStyles (9, fixed order)
  filter-styles.ts             # filterStyles
  demo-app.tsx                 # DemoApp, demo icons, liquid-glass SVG filter
  refraction.ts                # supportsRefraction
  style-page.tsx               # StylePage
  styles-index-page.tsx        # StylesIndexPage
  styles/index.css             # imports the 9 files
  styles/<id>.css              # one per style (9)
  *.test.ts(x)
src/App.tsx                    # new routes, NotFound for styles (modify)
public/icons-3d/*.png, LICENSE.md
public/backgrounds/*, LICENSE.md
```

---

### Task 1: 주소와 검색 도우미

**Files:**
- Modify: `src/showcase/route.ts`, `src/showcase/filter-entries.ts`
- Test: `src/showcase/route.test.ts`, `src/showcase/filter-entries.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // route.ts
  export type Route =
    | { page: 'overview' }
    | { page: 'component'; id: string }
    | { page: 'styles' }
    | { page: 'style'; id: string }
  export function styleHref(id: string | null): string   // null → '#/styles', id → '#/style/<id>'
  // filter-entries.ts
  export function matchesQuery(fields: string[], query: string): boolean
  ```
  `parseRoute`, `hrefFor`, `useRoute`, `filterEntries`의 이름과 시그니처는 그대로다. `filterEntries`는 `matchesQuery`를 쓰도록 바꾼다.

- [ ] **Step 1: 실패하는 테스트 추가**

```ts
// route.test.ts
it('reads the design-style index and pages', () => {
  expect(parseRoute('#/styles')).toEqual({ page: 'styles' })
  expect(parseRoute('#/style/neumorphism')).toEqual({ page: 'style', id: 'neumorphism' })
  expect(parseRoute('#/style/3d-icons/')).toEqual({ page: 'style', id: '3d-icons' })
})
it('still reads component ids', () => {
  expect(parseRoute('#/badge')).toEqual({ page: 'component', id: 'badge' })
})
it('builds style links', () => {
  expect(styleHref(null)).toBe('#/styles')
  expect(styleHref('flat')).toBe('#/style/flat')
})
// filter-entries.test.ts
it('matchesQuery trims, ignores case and checks every field', () => {
  expect(matchesQuery(['뉴모피즘', 'Neumorphism', 'Soft UI'], '  soft ui ')).toBe(true)
  expect(matchesQuery(['플랫 디자인'], '')).toBe(true)
  expect(matchesQuery(['플랫 디자인'], 'glass')).toBe(false)
})
```

- [ ] **Step 2: 실패 확인** — Run: `mise exec -- npx vitest run src/showcase/route.test.ts src/showcase/filter-entries.test.ts` / Expected: FAIL (`styleHref`, `matchesQuery` 없음, `#/styles`가 component로 해석됨)

- [ ] **Step 3: 구현** — `parseRoute`는 `#/styles`와 `#/style/<id>`를 컴포넌트 패턴보다 먼저 검사한다(`styles`가 컴포넌트 id로 잡히지 않게). `matchesQuery`의 규칙은 기존 `filterEntries`와 같다(trim, 소문자, 부분 일치, 빈 검색어는 true).

- [ ] **Step 4: 통과 확인** — Run: 같은 명령 / Expected: PASS. 이어서 `mise exec -- npm test`로 전체가 통과하는지 본다.

- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(route): 디자인 스타일 주소와 공통 검색 함수 추가"`

---

### Task 2: 스타일 데이터와 데모 앱

**Files:**
- Create: `src/design-styles/types.ts`, `registry.ts`, `filter-styles.ts`, `demo-app.tsx`, `styles/index.css`, `styles/<id>.css` ×9
- Test: `src/design-styles/registry.test.tsx`, `demo-app.test.tsx`, `styles-scope.test.ts`

**Interfaces:**
- Consumes: `matchesQuery` (Task 1)
- Produces:
  ```ts
  // types.ts
  export type DesignStyleTrait = { slot: string; title: string; description: string }
  export type DesignStyle = {
    id: string           // kebab-case, used in #/style/<id> and data-design-style
    name: string         // Korean, e.g. '뉴모피즘'
    englishName: string  // e.g. 'Neumorphism'
    aliases: string[]    // e.g. ['Soft UI']
    description: string  // one Korean sentence (spec section 5 table)
    context: string      // one Korean sentence, era and examples (spec section 5 list)
    note?: string        // extra notice shown on the page (liquid-glass only)
    traits: DesignStyleTrait[]  // 3–4
  }
  // registry.ts
  export const designStyles: DesignStyle[]   // fixed order from Global Constraints
  // filter-styles.ts
  export function filterStyles(styles: DesignStyle[], query: string): DesignStyle[]  // name, englishName, aliases, description
  // demo-app.tsx
  export function DemoApp({ styleId }: { styleId: string }): JSX.Element
  export const DEMO_SLOTS: readonly string[]  // every data-slot a trait may point to (list below)
  ```

**DemoApp 구조:** 바깥 `<div data-design-style={styleId} data-slot="demo-backdrop">`(바탕, 패딩 포함, 폭 100%, 최대 약 360px) 안에 Card(폭 약 320px, 좁으면 줄어듦)가 있다. 그 안의 내용은 위에서 아래 순서로 다음과 같다.
- **프로필**: Avatar(`/avatar.svg` + fallback "김"), 이름 `<p data-slot="demo-name">김하늘</p>`, Badge "프로"
- **검색**: 아이콘 `demo-icon-search` + Input(placeholder "설정 검색", aria-label "설정 검색")
- **설정 줄**: 아이콘 `demo-icon-bell` + "알림 받기" + Switch(defaultChecked), 아이콘 `demo-icon-cloud` + "자동 백업" + Switch(꺼짐). 라벨은 `Label htmlFor`로 연결한다.
- **저장 공간**: 아이콘 `demo-icon-storage` + "저장 공간" + "70%" + Progress(value 70, aria-label "저장 공간 70%")
- **버튼 줄**: `<div data-slot="demo-actions">` 안에 Button "저장"(default)과 Button "취소"(variant outline)

**DEMO_SLOTS:** `demo-backdrop`, `card`, `avatar`, `badge`, `demo-name`, `input`, `demo-icon-search`, `demo-icon-bell`, `demo-icon-cloud`, `demo-icon-storage`, `switch`, `switch-thumb`, `progress`, `progress-indicator`, `demo-actions`, `button`

**아이콘:** 아이콘 자리는 `<span data-slot="demo-icon-<name>" className="… size-5 …">`이다. 기본은 lucide 아이콘이다(Search, Bell, Cloud, FolderOpen). `styleId === '3d-icons'`이면 `<img src={`${import.meta.env.BASE_URL}icons-3d/<name>.png`}>`이고, 이미지의 `onError`가 나면 같은 lucide 아이콘으로 바꾼다. alt는 각각 `검색 아이콘`, `알림 아이콘`, `백업 아이콘`, `저장 공간 아이콘`이다. lucide 아이콘에는 `aria-hidden`을 둔다. 3D 모드에서는 자리 크기가 더 크다(약 size-8). 아이콘 파일 이름은 `search.png`, `bell.png`, `cloud.png`, `storage.png`로 정한다(Task 6이 이 이름으로 저장한다).

**스타일 데이터(registry):** 9개 각각의 `name`, `englishName`, `aliases`, `description`, `context`는 spec 5절 표와 목록 그대로 쓴다. 영어 이름은 다른 이름 칸의 첫 단어이고, 나머지가 `aliases`다(예: 머티리얼 → englishName `Material Design`, aliases `['Material You']`). `liquid-glass.note` = `굴절 효과는 Chrome 계열 브라우저에서 가장 잘 보입니다.` 특징의 `title`은 spec 5절 특징 칸의 문구 그대로다. `description`은 한 문장으로 "데모의 어디를 보면 무엇이 보이는지"를 쓴다. 특징 → slot 매핑:

| id | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| skeuomorphism | 재질 질감 → `demo-backdrop` | 위에서 비추는 빛의 광택 → `button` | 볼록한 버튼과 오목한 입력칸·스위치 홈 → `input` | 바느질선·나사 디테일 → `card` |
| flat | 단색 면 → `button` | 그림자 없음 → `card` | 선명한 원색 → `badge` | 단순한 선 아이콘과 큰 글자 → `demo-icon-bell` |
| material | 높이에 따른 그림자 → `card` | 누를 때 퍼지는 물결 → `button` | 알약 모양 버튼과 큰 둥근 모서리 → `switch` | 한 색에서 뽑은 톤 팔레트 → `badge` |
| neumorphism | 요소 색 = 배경 색 → `card` | 밝은·어두운 그림자 한 쌍 → `button` | 눌리면 안쪽으로 파임 → `input` | 낮은 대비 → `badge` |
| glassmorphism | 뒤를 흐리게 하는 블러 → `card` | 반투명한 흰 바탕 → `input` | 얇고 밝은 테두리 → `button` | 화려한 배경이 있어야 함 → `demo-backdrop` |
| claymorphism | 아주 큰 둥근 모서리 → `card` | 바깥 + 안쪽 그림자 → `button` | 파스텔 색 → `badge` | 떠 있는 듯한 부피감 → `avatar` |
| neo-brutalism | 굵은 검은 테두리 → `card` | 블러 없는 어긋난 그림자 → `button` | 강한 원색 → `badge` | 투박한 글자 → `demo-name` |
| 3d-icons | 조명과 질감이 있는 입체 아이콘 → `demo-icon-bell` | 크고 눈에 띄는 아이콘 → `demo-icon-storage` | 단순하고 밝은 나머지 UI → `card` | 부드러운 그림자 → `demo-icon-cloud` |
| liquid-glass | 가장자리의 굴절 → `card` | 가장자리 반사 하이라이트 → `switch` | 매우 투명함 → `input` | 떠 있는 캡슐 모양 컨트롤 → `demo-actions` |

**스타일 CSS 뼈대:** `styles/<id>.css` 9개와 그것을 모두 `@import`하는 `styles/index.css`를 만든다. `demo-app.tsx`가 `./styles/index.css`를 import한다. 이 태스크에서는 파일마다 바탕색 한 줄만 둔다. 예: `[data-design-style="flat"][data-slot="demo-backdrop"] { background: #e8eef7; }`. 실제 모양은 Task 7~9에서 채운다. 이 CSS는 Tailwind 레이어 밖에 있어 Tailwind 유틸리티보다 우선한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// registry.test.tsx
const ORDER = ['skeuomorphism','flat','material','neumorphism','glassmorphism','claymorphism','neo-brutalism','3d-icons','liquid-glass']
it('lists the 9 styles in the fixed order', () => {
  expect(designStyles.map((s) => s.id)).toEqual(ORDER)
})
it.each(designStyles.map((s) => [s.id, s] as const))('%s has 3–4 traits pointing at demo slots', (_id, s) => {
  expect(s.traits.length).toBeGreaterThanOrEqual(3)
  expect(s.traits.length).toBeLessThanOrEqual(4)
  const { container } = render(<DemoApp styleId={s.id} />)
  for (const t of s.traits) {
    expect(DEMO_SLOTS).toContain(t.slot)
    expect(container.querySelector(`[data-slot="${t.slot}"]`), t.slot).not.toBeNull()
  }
})
it('renders the same text in every style', () => {
  const texts = designStyles.map((s) => render(<DemoApp styleId={s.id} />).container.textContent)
  expect(new Set(texts).size).toBe(1)
  for (const copy of ['김하늘','프로','알림 받기','자동 백업','저장 공간','70%','저장','취소']) expect(texts[0]).toContain(copy)
})
it('filterStyles finds by Korean, English and alias', () => {
  expect(filterStyles(designStyles, 'soft ui').map((s) => s.id)).toEqual(['neumorphism'])
  expect(filterStyles(designStyles, '클레이').map((s) => s.id)).toEqual(['claymorphism'])
  expect(filterStyles(designStyles, 'GLASS').map((s) => s.id)).toEqual(['glassmorphism', 'liquid-glass'])
})

// demo-app.test.tsx
it('scopes the demo with data-design-style', () => {
  const { container } = render(<DemoApp styleId="flat" />)
  expect(container.firstElementChild).toHaveAttribute('data-design-style', 'flat')
})
it('uses 3D images only in the 3d-icons style', () => {
  render(<DemoApp styleId="3d-icons" />)
  expect(screen.getByAltText('알림 아이콘')).toHaveAttribute('src', expect.stringContaining('icons-3d/bell.png'))
})
it('falls back to a line icon when a 3D image fails to load', () => {
  const { container } = render(<DemoApp styleId="3d-icons" />)
  fireEvent.error(screen.getByAltText('알림 아이콘'))
  expect(screen.queryByAltText('알림 아이콘')).toBeNull()
  expect(container.querySelector('[data-slot="demo-icon-bell"] svg')).not.toBeNull()
})

// styles-scope.test.ts — every rule in styles/<id>.css starts with that file's scope
const files = import.meta.glob('./styles/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
it.each(Object.entries(files).filter(([p]) => !p.endsWith('index.css')))('%s stays inside its scope', (path, css) => {
  const id = path.match(/styles\/(.+)\.css$/)![1]
  for (const selector of ruleSelectors(css)) expect(selector.startsWith(`[data-design-style="${id}"]`), selector).toBe(true)
})
```

`ruleSelectors(css: string): string[]`는 테스트 파일 안의 도우미다. 주석을 지우고 `{` 앞의 선택자 목록을 쉼표로 나눠 돌려준다. `@`로 시작하는 at-rule 머리와 `@keyframes` 블록 안의 `from`/`to`/`N%`는 건너뛴다.

- [ ] **Step 2: 실패 확인** — Run: `mise exec -- npx vitest run src/design-styles` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: 구현** — 위 Interfaces, 구조, 표대로 `types.ts`, `registry.ts`, `filter-styles.ts`(`matchesQuery` 사용), `demo-app.tsx`, CSS 뼈대를 만든다.
- [ ] **Step 4: 통과 확인** — Run: 같은 명령 / Expected: PASS. 이어서 `mise exec -- npm test`
- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(styles): 디자인 스타일 데이터와 데모 앱 화면 추가"`

---

### Task 3: Anatomy 옵션 넓히기

**Files:**
- Modify: `src/showcase/anatomy.tsx`
- Test: `src/showcase/anatomy.test.tsx`

**Interfaces:**
- Produces (new optional props; defaults keep today's behavior):
  ```ts
  Anatomy({
    Specimen, parts, layout = 'side',
    markers = 'always',          // 'always' | 'on-focus'
    nameStyle = 'code',          // 'code' (mono <code>) | 'text' (plain <span>)
    labels = { toggle: '부분 번호 표시', list: '부분 이름' },
  })
  ```
  `markers: 'on-focus'`의 동작은 이렇다. 처음에는 스위치가 꺼져 있고 번호가 없다. 목록 항목에 마우스를 올리거나 포커스하면 그 항목의 번호·윤곽·지시선만 보인다. 스위치를 켜면 지금처럼 전부 보인다.

- [ ] **Step 1: 실패하는 테스트 추가** (기존 `badge` 테스트 항목 사용)

```tsx
it('on-focus markers start hidden and show only the hovered part', async () => {
  render(<Anatomy {...badge.anatomy} markers="on-focus" />)
  expect(screen.queryAllByTestId('anatomy-marker')).toHaveLength(0)
  await user.hover(screen.getByText('BadgeLabel'))
  expect(screen.getAllByTestId('anatomy-marker').map((m) => m.textContent)).toEqual(['2'])
  await user.unhover(screen.getByText('BadgeLabel'))
  await user.click(screen.getByRole('switch', { name: '부분 번호 표시' }))
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(2)
})
it('uses custom labels and plain-text names when asked', () => {
  render(<Anatomy {...badge.anatomy} nameStyle="text" labels={{ toggle: '특징 번호 모두 표시', list: '특징' }} />)
  expect(screen.getByRole('switch', { name: '특징 번호 모두 표시' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: '특징' })).toBeInTheDocument()
  expect(screen.getByText('BadgeLabel').tagName).not.toBe('CODE')
})
```

- [ ] **Step 2: 실패 확인** — Run: `mise exec -- npx vitest run src/showcase/anatomy.test.tsx` / Expected: 새 테스트 2개 FAIL, 기존 테스트 PASS
- [ ] **Step 3: 구현** — 위 옵션을 추가한다. 스위치의 `id`는 지금처럼 고유해야 한다.
- [ ] **Step 4: 통과 확인** — Run: 같은 명령, 이어서 `mise exec -- npm test` / Expected: 전부 PASS
- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(anatomy): 번호 표시 방식과 목록 문구 옵션 추가"`

---

### Task 4: 사이드바에 디자인 스타일 묶음 추가

**Files:**
- Modify: `src/showcase/app-sidebar.tsx`, `src/App.tsx`(props만)
- Test: `src/showcase/app-sidebar.test.tsx` (의도한 변경에 맞게 고침)

**Interfaces:**
- Consumes: `Route`, `styleHref` (Task 1), `DesignStyle`, `filterStyles` (Task 2)
- Produces:
  ```ts
  type NavProps = { entries: ShowcaseEntry[]; styles: DesignStyle[]; route: Route; onNavigate?: () => void }
  NavList(props: NavProps); AppSidebar(props: NavProps); MobileNav(props: Omit<NavProps, 'onNavigate'>)
  ```
  `currentId` prop은 없앤다. `aria-current`는 `route`로 정한다. 개요는 `route.page === 'overview'`, 컴포넌트는 id가 같을 때, "전체 보기"는 `route.page === 'styles'`, 스타일은 `route.page === 'style'`이고 id가 같을 때다.

**정해진 동작과 문구:**
- 검색창: `aria-label="검색"`, placeholder `컴포넌트·스타일 찾기`
- nav는 하나다. `aria-label`은 `탐색 목록`이다.
- 순서: "개요" 링크(늘 보임) → 컴포넌트 분류들(지금과 같음) → `<h2>디자인 스타일</h2>` 묶음
  - 검색어가 비어 있으면 묶음에 "전체 보기"(`#/styles`)와 9개 스타일(한국어 이름)이 있다.
  - 검색어가 있으면 일치하는 스타일만 보인다. 일치하는 스타일이 없으면 묶음 전체를 숨긴다. "전체 보기"는 검색어가 있을 때 숨긴다.
- 컴포넌트와 스타일 모두 결과가 없으면 `'{query}'와 일치하는 항목이 없습니다.`
- 묶음 제목 위에 구분선(`border-t border-rule`)을 둔다.

- [ ] **Step 1: 테스트 고치기·추가** — 기존 테스트에서 nav 이름은 `'탐색 목록'`, 검색창 이름은 `'검색'`, 빈 결과 문구는 `"'xyz'와 일치하는 항목이 없습니다."`로 바꾼다. `currentId` 대신 `route`를 넘긴다. 추가할 테스트:

```tsx
it('adds a design-style group after the component categories', () => {
  render(<NavList entries={items} styles={designStyles} route={{ page: 'overview' }} />)
  const headings = within(nav()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(headings.at(-1)).toBe('디자인 스타일')
  expect(within(nav()).getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '#/styles')
  expect(within(nav()).getByRole('link', { name: '뉴모피즘' })).toHaveAttribute('href', '#/style/neumorphism')
})
it('marks the current style', () => {
  render(<NavList entries={items} styles={designStyles} route={{ page: 'style', id: 'flat' }} />)
  expect(within(nav()).getByRole('link', { name: '플랫 디자인' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav()).getByRole('link', { name: '개요' })).not.toHaveAttribute('aria-current')
})
it('searches styles and components together', async () => {
  render(<NavList entries={items} styles={designStyles} route={{ page: 'overview' }} />)
  await user.type(screen.getByRole('searchbox', { name: '검색' }), 'soft ui')
  expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', '뉴모피즘'])
})
it('hides the style group when no style matches', async () => {
  render(<NavList entries={items} styles={designStyles} route={{ page: 'overview' }} />)
  await user.type(screen.getByRole('searchbox', { name: '검색' }), 'modal')
  expect(within(nav()).getAllByRole('link').map((a) => a.textContent)).toEqual(['개요', 'Dialog'])
})
```

- [ ] **Step 2: 실패 확인** — Run: `mise exec -- npx vitest run src/showcase/app-sidebar.test.tsx` / Expected: FAIL
- [ ] **Step 3: 구현** — 위 동작대로 고친다. `App.tsx`는 `styles={designStyles}`와 `route`를 넘기도록 props만 바꾼다(새 페이지 연결은 Task 5).
- [ ] **Step 4: 통과 확인** — Run: 같은 명령, 이어서 `mise exec -- npm test` / Expected: 전부 PASS
- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(sidebar): 디자인 스타일 묶음과 통합 검색 추가"`

---

### Task 5: 스타일 페이지, 스타일 첫 화면, 라우팅 연결

**Files:**
- Create: `src/design-styles/style-page.tsx`, `styles-index-page.tsx`, `refraction.ts`
- Modify: `src/App.tsx`, `src/design-styles/demo-app.tsx`(굴절 표시 속성)
- Test: `src/design-styles/style-page.test.tsx`, `styles-index-page.test.tsx`, `refraction.test.ts`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `Anatomy` 옵션 (Task 3), `DemoApp`, `designStyles` (Task 2), `styleHref`, `Route` (Task 1)
- Produces:
  ```ts
  StylePage({ style, styles }: { style: DesignStyle; styles: DesignStyle[] }): JSX.Element
  StylesIndexPage({ styles }: { styles: DesignStyle[] }): JSX.Element
  supportsRefraction(nav?: Navigator): boolean  // true only when navigator.userAgentData.brands includes 'Chromium'
  ```
  `DemoApp`은 바깥 요소에 `data-refraction={supportsRefraction() ? 'on' : 'off'}`를 붙인다. `styleId === 'liquid-glass'`이면 SVG 필터 정의(`<svg width="0" height="0" aria-hidden>`의 `<filter id="liquid-glass-refraction">`)를 렌더링한다. 필터 내용은 Task 9에서 채운다.

**StylePage 구성** (spec 3.2):
1. Breadcrumb: `개요`(`#/`) › `디자인 스타일`(`#/styles`) › `{name}`
2. h1 `{name}`, "다른 이름" 배지 `[englishName, ...aliases]`, `description`, `context`(흐린 글), `note`가 있으면 한 줄 안내
3. h2 `생김새와 특징`, 설명 문구 `특징에 마우스를 올리면 데모에서 해당 부분이 표시됩니다.`
4. `<Anatomy Specimen={…DemoApp styleId…} parts={traits → {slot, name: title, description}} markers="on-focus" nameStyle="text" labels={{ toggle: '특징 번호 모두 표시', list: '특징' }} />`. `Specimen`과 `parts`는 `useMemo([style])`로 고정한다. 매 렌더마다 새로 만들면 측정 effect가 계속 다시 걸린다.
5. 이전·다음: `nav aria-label="이전·다음 스타일"`. 순서는 `styles` 배열 순서다.

**StylesIndexPage 구성** (spec 3.3):
- h1 `디자인 스타일`, 소개 `같은 앱 화면을 9가지 스타일로 그렸습니다. 하나를 골라 특징을 확인하세요.`
- 카드 격자(1열 → sm 2열 → xl 3열)를 둔다. 각 카드는 `article` 안에 다음을 담는다.
  - 썸네일: `inert` 영역 안에 `DemoApp`을 축소해서 넣는다(`transform: scale(…)`, 고정 높이, overflow hidden).
  - 이름: `h2` 안의 링크 `{name}` → `#/style/<id>`. 링크는 카드 전체를 덮는다(기존 개요 카드와 같은 방식).
  - 영어 이름

**App:** `route.page === 'styles'`이면 `StylesIndexPage`, `'style'`이면 `StylePage`(`key={id}`)를 렌더링한다. 없는 id에는 `'{id}' 스타일을 찾을 수 없습니다.`와 링크 `디자인 스타일로 돌아가기`(`#/styles`)를 보여준다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// style-page.test.tsx
const neu = designStyles.find((s) => s.id === 'neumorphism')!
it('shows name, other names, context and the traits list', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.getByRole('heading', { level: 1, name: '뉴모피즘' })).toBeInTheDocument()
  expect(screen.getByText('Neumorphism')).toBeInTheDocument()
  expect(screen.getByText('Soft UI')).toBeInTheDocument()
  expect(within(screen.getByRole('list', { name: '특징' })).getAllByRole('listitem')).toHaveLength(neu.traits.length)
})
it('starts without trait markers and shows one on hover', async () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(screen.queryAllByTestId('anatomy-marker')).toHaveLength(0)
  await user.hover(screen.getByText(neu.traits[1].title))
  expect(screen.getAllByTestId('anatomy-marker')).toHaveLength(1)
})
it('links breadcrumb and neighbours', () => {
  render(<StylePage style={neu} styles={designStyles} />)
  expect(within(screen.getByRole('navigation', { name: 'breadcrumb' })).getByRole('link', { name: '디자인 스타일' })).toHaveAttribute('href', '#/styles')
  const pager = screen.getByRole('navigation', { name: '이전·다음 스타일' })
  expect(within(pager).getByRole('link', { name: /머티리얼/ })).toHaveAttribute('href', '#/style/material')
  expect(within(pager).getByRole('link', { name: /글래스모피즘/ })).toHaveAttribute('href', '#/style/glassmorphism')
})
it('shows the browser note only for liquid glass', () => {
  render(<StylePage style={designStyles.at(-1)!} styles={designStyles} />)
  expect(screen.getByText('굴절 효과는 Chrome 계열 브라우저에서 가장 잘 보입니다.')).toBeInTheDocument()
})

// styles-index-page.test.tsx
it('shows a linked card for each of the 9 styles', () => {
  render(<StylesIndexPage styles={designStyles} />)
  expect(screen.getByRole('heading', { level: 1, name: '디자인 스타일' })).toBeInTheDocument()
  const links = screen.getAllByRole('heading', { level: 2 }).map((h) => within(h).getByRole('link'))
  expect(links.map((a) => a.getAttribute('href'))).toEqual(designStyles.map((s) => `#/style/${s.id}`))
})

// refraction.test.ts
it('detects Chromium from userAgentData', () => {
  expect(supportsRefraction({ userAgentData: { brands: [{ brand: 'Chromium', version: '140' }] } } as unknown as Navigator)).toBe(true)
  expect(supportsRefraction({ userAgentData: { brands: [{ brand: 'Not A Brand', version: '1' }] } } as unknown as Navigator)).toBe(false)
  expect(supportsRefraction({} as Navigator)).toBe(false)   // Firefox, Safari
})

// App.test.tsx (add)
it('opens the style index and a style page from the hash', () => {
  render(<App />)
  go('#/styles'); expect(screen.getByRole('heading', { level: 1, name: '디자인 스타일' })).toBeInTheDocument()
  go('#/style/flat'); expect(screen.getByRole('heading', { level: 1, name: '플랫 디자인' })).toBeInTheDocument()
})
it('explains an unknown style id', () => {
  window.location.hash = '#/style/vaporwave'
  render(<App />)
  expect(screen.getByText("'vaporwave' 스타일을 찾을 수 없습니다.")).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '디자인 스타일로 돌아가기' })).toHaveAttribute('href', '#/styles')
})
```

- [ ] **Step 2: 실패 확인** — Run: `mise exec -- npx vitest run src/design-styles src/App.test.tsx` / Expected: FAIL
- [ ] **Step 3: 구현** — 위 구성대로 만든다.
- [ ] **Step 4: 통과 확인** — Run: `mise exec -- npm test`, `mise exec -- npm run build` / Expected: 전부 PASS, 빌드 성공
- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(styles): 스타일 페이지와 스타일 첫 화면 추가"`

---

### Task 6: 이미지 내려받기 (3D 아이콘, 배경)

**Files:**
- Create: `public/icons-3d/{search,bell,cloud,storage}.png`, `public/icons-3d/LICENSE.md`, `public/backgrounds/<이름>.(webp|jpg)`, `public/backgrounds/LICENSE.md`

내려받기는 사용자가 허용했다(D-013, D-014). 받은 파일의 이름, 출처 URL, 크기를 태스크 보고에 적는다.

- [ ] **Step 1: 3D 아이콘 라이선스 확인** — `https://github.com/microsoft/fluentui-emoji`의 LICENSE가 MIT인지 확인한다. 아니면 멈추고 사용자에게 묻는다.
- [ ] **Step 2: 3D 아이콘 4개 받기** — `assets/<Emoji Name>/3D/<emoji_name>_3d.png`에서 받는다. 이름은 각각 돋보기(Magnifying glass tilted left), 종(Bell), 구름(Cloud), 폴더·상자(Open file folder 또는 Package) 계열이다. 정확한 이모지는 고른다. 저장할 때 `search.png`, `bell.png`, `cloud.png`, `storage.png`로 이름을 바꾼다.
- [ ] **Step 3: 배경 이미지 받기** — 스큐어모피즘용 질감 1~2장(나무 또는 리넨, 필요하면 가죽 또는 브러시드 메탈)과 리퀴드 글래스용 사진 1장(색과 형태가 뚜렷한 풍경, 꽃, 도시)을 받는다. 라이선스가 CC0, Unsplash, Pexels인 것만 받는다. Unsplash는 `?w=800&q=70&fm=webp` 같은 주소 옵션으로 줄인 사본을 받는다. 파일 이름은 `skeuo-wood.webp`처럼 스타일과 내용이 드러나게 짓는다.
- [ ] **Step 4: LICENSE.md 작성** — `public/icons-3d/LICENSE.md`에는 Fluent Emoji 저작권 문구와 MIT 전문(또는 원문 링크)을 적는다. `public/backgrounds/LICENSE.md`에는 파일마다 출처 URL, 작가, 라이선스를 적는다.
- [ ] **Step 5: 확인** — Run: `Get-ChildItem public/icons-3d, public/backgrounds | Select-Object Name, Length` / Expected: 아이콘 4개 합 1MB 이하, 배경 장당 300KB 이하, LICENSE.md 2개
- [ ] **Step 6: 커밋 (허용 시)** — `git commit -m "chore(assets): 3D 아이콘과 배경 이미지 추가"`

---

### Tasks 7–9: 스타일 CSS

세 태스크 모두 방식이 같다. 각 스타일의 `styles/<id>.css`를 채워 spec 5절 표의 특징이 데모에서 보이게 한다.

**모든 스타일 CSS에 공통인 규칙:**
- 선택자: `[data-design-style="<id>"] [data-slot="…"]`(데모 안 요소) 또는 `[data-design-style="<id>"][data-slot="demo-backdrop"]`(바탕 자체). 버튼은 `[data-variant="default"]`과 `[data-variant="outline"]`로 구분한다.
- 이미지 배경은 반드시 비슷한 색을 먼저 깐다. 예: `background: #6b4a2f url(/backgrounds/skeuo-wood.webp) center / cover;`
- 포커스: `:focus-visible` 상태에 그 스타일에 맞는 포커스 표시를 둔다. 기존 링을 지우기만 하는 규칙은 쓰지 않는다.
- 움직임은 `@media (prefers-reduced-motion: reduce)`에서 끈다.
- 본문 글 색은 바탕과 충분히 대비되게 한다.

**태스크마다 공통 단계:**
- [ ] **Step 1: CSS 작성** — 아래 스타일별 지침대로 작성한다.
- [ ] **Step 2: 범위 테스트** — Run: `mise exec -- npx vitest run src/design-styles/styles-scope.test.ts` / Expected: PASS
- [ ] **Step 3: 브라우저 확인** — 개발 서버에서 `#/style/<id>`를 연다. 데스크톱 폭과 375px에서 스크린샷을 찍는다. 특징 목록에 차례로 마우스를 올려 각 특징이 가리키는 부분에서 실제로 보이는지 확인한다. 스위치 토글, 버튼 누름, 입력칸 포커스(Tab)도 확인한다.
- [ ] **Step 4: 전체 테스트** — Run: `mise exec -- npm test` / Expected: PASS
- [ ] **Step 5: 커밋 (허용 시)** — `git commit -m "feat(styles): <스타일 이름들> 스타일 추가"`

### Task 7: 스큐어모피즘, 플랫, 머티리얼

**Files:** Modify `src/design-styles/styles/{skeuomorphism,flat,material}.css`
- **skeuomorphism**: 나무·리넨 이미지 바탕. 카드는 가죽이나 종이 질감(이미지 또는 노이즈 그라디언트)에 점선 바느질 테두리(`outline: 1px dashed` + offset)를 둔다. 버튼은 위쪽이 밝은 세로 그라디언트 + 광택 하이라이트 + 볼록한 그림자이고, `:active`에서 오목해진다. 입력칸과 스위치 트랙은 inset 그림자로 파인 홈을 만든다.
- **flat**: 단색 바탕. 그림자·그라디언트·테두리 반경 효과를 모두 없앤다(`box-shadow: none`). 버튼과 배지는 선명한 원색 단색, 아이콘은 단색 선, 이름은 크고 굵은 글자다.
- **material**: 연한 톤 바탕. 카드에는 elevation 그림자(2단계 정도)를 주고 hover에서 한 단계 높인다. 버튼은 알약 모양에 톤 색을 쓴다. 누르면 물결이 퍼지는 ripple은 CSS만으로 근사해도 된다(예: `:active`에서 radial-gradient의 `background-size` 전환). 스위치는 M3처럼 크고 둥근 트랙과 큰 손잡이다. 배지와 프로그레스는 같은 색에서 뽑은 톤을 쓴다.

### Task 8: 뉴모피즘, 글래스모피즘, 클레이모피즘

**Files:** Modify `src/design-styles/styles/{neumorphism,glassmorphism,claymorphism}.css`
- **neumorphism**: 바탕과 카드, 버튼, 입력칸이 모두 같은 연회색이다(예: `#e0e5ec`). 볼록한 요소는 `-6px -6px 12px #fff, 6px 6px 12px #a3b1c6` 계열의 그림자 한 쌍을 쓴다. 입력칸, 스위치 트랙, 버튼 `:active`는 inset 한 쌍이다. 배지는 대비가 낮다. 본문 글은 읽을 수 있게 진한 회청색이다.
- **glassmorphism**: 바탕은 CSS 색 번짐이다(여러 `radial-gradient`, 선명한 보라·분홍·파랑). 카드는 `background: rgb(255 255 255 / .18)`, `backdrop-filter: blur(16px)`, 1px 밝은 반투명 테두리다. 입력칸과 버튼도 반투명 흰 바탕이다. 글은 흰색 또는 진한 색 중 대비가 맞는 쪽으로 한다.
- **claymorphism**: 밝은 파스텔 바탕. 카드, 버튼, 아바타는 바탕과 **다른** 파스텔 색이다. 모서리는 아주 크게(카드 약 32px, 버튼은 알약) 한다. 그림자는 바깥 부드러운 그림자 + 안쪽 위 밝은 inset + 안쪽 아래 어두운 inset의 세 겹이다. 뉴모피즘과 구분되도록 요소 색이 바탕과 달라야 한다(spec 5.1).

### Task 9: 네오 브루탈리즘, 3D 아이콘, 리퀴드 글래스

**Files:** Modify `src/design-styles/styles/{neo-brutalism,3d-icons,liquid-glass}.css`, `src/design-styles/demo-app.tsx`(굴절 필터 내용)
- **neo-brutalism**: 원색 바탕(예: 노랑). 카드, 버튼, 입력칸, 배지에 2~3px 검은 테두리, 모서리 0~4px, 블러 없는 어긋난 그림자(`4px 4px 0 #000`)를 준다. 버튼 `:active`는 그림자만큼 이동해 눌린 느낌을 낸다. 배지는 강한 원색, 이름은 굵고 투박하게(대문자 느낌의 굵기) 한다.
- **3d-icons**: 밝은 단색 또는 옅은 그라디언트 바탕. 3D 아이콘 자리는 크게(약 32px) 하고 부드러운 그림자(`drop-shadow`)를 준다. 나머지 UI는 단순하고 밝게 한다(얇은 테두리, 약한 그림자).
- **liquid-glass**: 배경은 Task 6의 사진에 비슷한 색을 먼저 깐다. 카드, 입력칸, 스위치, 버튼 줄은 거의 투명하고(`rgb(255 255 255 / .06~.12)`), 블러는 약하게(≤4px) 한다. 가장자리에는 반사 하이라이트를 둔다(inset 그림자 + 위쪽 가장자리 밝은 그라디언트). 버튼 줄(`demo-actions`)은 떠 있는 캡슐 모양이다.
  - 굴절: `demo-app.tsx`의 `<filter id="liquid-glass-refraction">`에 `feTurbulence`/`feImage` + `feDisplacementMap`로 가장자리를 휘게 하는 필터를 채운다. CSS에서는 `[data-design-style="liquid-glass"][data-refraction="on"] [data-slot="card"] { backdrop-filter: url(#liquid-glass-refraction) blur(2px); }`처럼 `data-refraction="on"`일 때만 건다.
  - `off`일 때는 하이라이트와 약한 블러만으로 유리처럼 보이게 한다(Review Focus 3).
  - 글래스모피즘과 구분되도록 덜 흐리고 더 투명해야 한다(spec 5.1).

---

### Task 10: 브라우저 전체 확인

**Files:** 없음(문제가 있으면 해당 CSS나 컴포넌트를 고친다)

- [ ] **Step 1: 테스트·빌드** — Run: `mise exec -- npm test; mise exec -- npm run build` / Expected: 전부 PASS, 빌드 성공
- [ ] **Step 2: 헷갈리는 짝 구분 (Review Focus 1)** — `#/styles`에서 데스크톱 스크린샷을 찍고, 썸네일만 보고 뉴모피즘/클레이모피즘, 글래스모피즘/리퀴드 글래스가 구분되는지 본다. 구분되지 않으면 spec 5.1 기준으로 CSS를 고친다.
- [ ] **Step 3: 포커스 (Review Focus 4)** — 9개 스타일 페이지에서 데모 안을 Tab으로 이동한다. 검색칸, 스위치 2개, 버튼 2개 모두에서 포커스가 보이는지 스크린샷으로 확인한다.
- [ ] **Step 4: 좁은 화면 (Review Focus 5)** — 375px에서 `#/styles`와 9개 스타일 페이지를 브라우저 JS로 점검한다. `document.documentElement.scrollWidth <= clientWidth`이어야 하고, 특징 번호(`[data-testid=anatomy-marker] > span`)가 `.bg-graph` 틀 안에 있어야 한다. 특징 번호는 "특징 번호 모두 표시" 스위치를 켠 상태에서 점검한다.
- [ ] **Step 5: 이미지와 리퀴드 글래스 (Review Focus 2, 3)** — 개발자 도구에서 `/backgrounds/*`, `/icons-3d/*` 요청을 막고(또는 파일 이름을 잠시 바꾸고) 스큐어모피즘, 리퀴드 글래스, 3D 아이콘 페이지를 연다. 대체 색과 대체 아이콘으로 깨지지 않는지 본다. 리퀴드 글래스는 `data-refraction="off"`를 강제로 붙여서 대체 표시도 확인한다.
- [ ] **Step 6: 기존 화면 회귀** — `#/`, `#/card`, `#/dialog`를 열어 지금과 같은지 보고, 콘솔 오류가 없는지 확인한다.
- [ ] **Step 7: 커밋 (허용 시)** — 고친 것이 있으면 `git commit -m "fix(styles): 브라우저 확인 결과 수정"`
