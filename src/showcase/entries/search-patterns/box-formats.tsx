import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeftIcon, ClockIcon, SearchIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { BrowserFrame, PhoneFrame } from '../navigation-patterns/frames'
import { BoldMatch, ProductRow, shortcutLabel } from './parts'
import { PRODUCTS, search, terms } from './products'

// type="search" draws its own clear button in Chromium and Safari; these demos draw one instead
const searchInputClass = '[&::-webkit-search-cancel-button]:appearance-none'

/** 1. One field: icon, clear button, Ctrl/⌘K to get there, Enter to search. */
export function SearchBoxFormat() {
  const [value, setValue] = useState('')
  const [searched, setSearched] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const shortcut = shortcutLabel()

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      const box = frame.current?.getBoundingClientRect()
      // answer only while this example is on screen, so the shortcut does not jump across the page
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return
      event.preventDefault()
      input.current?.focus()
      input.current?.select()
      setNote(`${shortcut}로 검색창에 들어왔습니다.`)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcut])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = value.trim()
    if (!q) {
      setNote('검색어를 입력하세요.')
      input.current?.focus()
      return
    }
    setSearched(q)
    setNote('Enter로 검색했습니다.')
  }

  const clear = () => {
    setValue('')
    setNote('검색어를 지웠습니다.')
    input.current?.focus()
  }

  const results = searched ? search(searched) : []

  return (
    <div ref={frame} className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url={searched ? `shop.example/search?q=${searched}` : 'shop.example'} className="h-80">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <span className="hidden shrink-0 text-sm font-semibold sm:block">모아 쇼핑</span>
          <form role="search" aria-label="상품 검색" onSubmit={submit} className="min-w-0 flex-1">
            <InputGroup className="h-9">
              <InputGroupInput
                ref={input}
                type="search"
                aria-label="검색어"
                aria-keyshortcuts="Control+K Meta+K"
                placeholder="상품 검색"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && value) {
                    e.preventDefault()
                    clear()
                  }
                }}
                className={searchInputClass}
              />
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {value ? (
                  <InputGroupButton size="icon-xs" aria-label="검색어 지우기" onClick={clear}>
                    <XIcon />
                  </InputGroupButton>
                ) : (
                  <kbd aria-hidden className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                    {shortcut}
                  </kbd>
                )}
              </InputGroupAddon>
            </InputGroup>
          </form>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {searched ? (
            <>
              <p className="text-sm">
                ‘{searched}’ 검색 결과 <span className="font-semibold tabular-nums">{results.length}개</span>
              </p>
              <ul aria-label="검색 결과" className="divide-y">
                {results.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <ProductRow product={p} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">이렇게 찾아보세요</p>
              <div className="flex flex-wrap gap-1.5">
                {['이어폰', '무선', '거치대', 'usb'].map((t) => (
                  <span key={t} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {searched ? `검색어: ${searched} · 결과 ${results.length}개` : '아직 검색하지 않음'}
        {note && ` · ${note}`}
      </p>
    </div>
  )
}

/** 2. Suggestions while typing; ↑↓ to move, Enter to pick, the typed part in bold. */
export function AutocompleteFormat() {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [chosen, setChosen] = useState<string | null>(null)
  const id = useId()
  const listId = `${id}-list`
  const optionId = (i: number) => `${id}-option-${i}`

  const suggestions = terms(value).length > 0 ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 6) : []
  const expanded = open && suggestions.length > 0

  const pick = (name: string) => {
    setValue(name)
    setChosen(name)
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setOpen(true)
      // from "nothing pointed at", ↓ goes to the first and ↑ to the last
      setActive((i) => (i === -1 ? (step === 1 ? 0 : suggestions.length - 1) : (i + step + suggestions.length) % suggestions.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (expanded && active >= 0) pick(suggestions[active].name)
      else if (value.trim()) pick(value.trim())
    } else if (event.key === 'Escape') {
      event.preventDefault()
      if (expanded) {
        setOpen(false)
        setActive(-1)
      } else {
        setValue('')
        setChosen(null)
      }
    }
  }

  let message = '‘무선’이나 ‘거치대’를 입력해 보세요.'
  if (chosen) message = `고른 검색어: ${chosen}`
  else if (expanded) message = `제안 ${suggestions.length}개${active >= 0 ? ` · 가리킴: ${suggestions[active].name}` : ' · ↑↓로 고르고 Enter'}`
  else if (value.trim()) message = '맞는 제안이 없습니다. Enter로 그대로 검색할 수 있어요.'

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <BrowserFrame url="shop.example" className="h-[22rem]">
        <div className="relative flex flex-col gap-2 p-4">
          <label htmlFor={`${id}-input`} className="text-sm font-medium">
            무엇을 찾으세요?
          </label>
          <div className="relative">
            <InputGroup className="h-9">
              <InputGroupInput
                id={`${id}-input`}
                role="combobox"
                aria-expanded={expanded}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
                autoComplete="off"
                placeholder="상품 이름"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setOpen(true)
                  setActive(-1)
                  setChosen(null)
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  setOpen(false)
                  setActive(-1)
                }}
                onKeyDown={onKeyDown}
              />
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
            </InputGroup>
            <ul
              id={listId}
              role="listbox"
              aria-label="검색어 제안"
              hidden={!expanded}
              className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border bg-popover p-1 shadow-md"
            >
              {suggestions.map((p, i) => (
                <li
                  key={p.id}
                  id={optionId(i)}
                  role="option"
                  // one clean name; the bold piece would otherwise split the words for some readers
                  aria-label={`${p.name}, ${p.category}`}
                  aria-selected={i === active}
                  // keep the focus in the field while the pointer picks
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => pick(p.name)}
                  className={cn(
                    'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                    i === active && 'bg-muted',
                  )}
                >
                  <SearchIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    <BoldMatch text={p.name} query={value} />
                  </span>
                  <span className="text-xs text-muted-foreground">{p.category}</span>
                </li>
              ))}
            </ul>
          </div>
          {chosen && (
            <ul aria-label="검색 결과" className="divide-y">
              {search(chosen)
                .slice(0, 3)
                .map((p) => (
                  <li key={p.id}>
                    <ProductRow product={p} />
                  </li>
                ))}
            </ul>
          )}
        </div>
      </BrowserFrame>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

const FIRST_RECENT = ['보조배터리', '기계식 키보드', '이어폰', '거치대']
const MAX_RECENT = 5

/** 3. Past searches offered when the field is focused and empty. */
export function RecentSearchesFormat() {
  const [value, setValue] = useState('')
  const [recent, setRecent] = useState(FIRST_RECENT)
  const [focused, setFocused] = useState(false)
  const [searched, setSearched] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const showRecent = focused && value.trim() === ''

  const run = (q: string) => {
    setValue(q)
    setSearched(q)
    setRecent((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, MAX_RECENT))
    setNote('')
    // a picked term's button disappears with the panel; keep the focus somewhere useful
    input.current?.focus()
  }

  const remove = (term: string) => {
    setRecent((prev) => prev.filter((x) => x !== term))
    setNote(`‘${term}’ 지움`)
    input.current?.focus()
  }

  const clearAll = () => {
    setRecent([])
    setNote('최근 검색어를 모두 지움')
    input.current?.focus()
  }

  // the panel stays while the focus moves between the field and its own buttons
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <PhoneFrame>
        <div className="flex min-h-0 flex-1 flex-col" onFocus={() => setFocused(true)} onBlur={onBlur}>
          <form
            role="search"
            aria-label="상품 검색"
            className="flex shrink-0 items-center gap-1 border-b px-2 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (value.trim()) run(value.trim())
            }}
          >
            <Button type="button" variant="ghost" size="icon-sm" aria-label="뒤로" tabIndex={-1}>
              <ArrowLeftIcon />
            </Button>
            <InputGroup className="h-9 rounded-full bg-muted/60">
              <InputGroupInput
                ref={input}
                id={`${id}-input`}
                type="search"
                aria-label="검색어"
                placeholder="검색어를 입력하세요"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setSearched(null)
                }}
                className={searchInputClass}
              />
              {value && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="검색어 지우기"
                    className="rounded-full"
                    onClick={() => {
                      setValue('')
                      setSearched(null)
                      input.current?.focus()
                    }}
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </form>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {showRecent && (
              <section aria-label="최근 검색어" className="flex flex-col py-2">
                <div className="flex items-center justify-between px-4 py-1">
                  <h4 className="text-xs font-semibold">최근 검색어</h4>
                  {recent.length > 0 && (
                    <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={clearAll}>
                      전체 삭제
                    </Button>
                  )}
                </div>
                {recent.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">최근 검색어가 없어요</p>
                ) : (
                  <ul className="flex flex-col">
                    {recent.map((term) => (
                      <li key={term} className="flex items-center pr-2">
                        <button
                          type="button"
                          onClick={() => run(term)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5 text-left text-sm outline-none hover:bg-muted/60 focus-visible:bg-muted"
                        >
                          <ClockIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{term}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${term} 지우기`}
                          className="text-muted-foreground"
                          onClick={() => remove(term)}
                        >
                          <XIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {!showRecent && searched && (
              <div className="px-4 py-3">
                <p className="text-sm">
                  ‘{searched}’ 결과 <span className="font-semibold tabular-nums">{search(searched).length}개</span>
                </p>
                <ul aria-label="검색 결과" className="divide-y">
                  {search(searched)
                    .slice(0, 4)
                    .map((p) => (
                      <li key={p.id}>
                        <ProductRow product={p} />
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {!showRecent && !searched && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">검색창을 눌러 보세요</p>
            )}
          </div>
        </div>
      </PhoneFrame>
      <p role="status" className="self-start text-sm text-muted-foreground">
        최근 검색어 {recent.length}개{searched && ` · 검색: ${searched}`}
        {note && ` · ${note}`}
      </p>
    </div>
  )
}
