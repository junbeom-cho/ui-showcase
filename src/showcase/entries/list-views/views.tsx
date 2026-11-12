import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoffeeIcon,
  FrameIcon,
  StarIcon,
  TreesIcon,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { feedPage, groupByCategory, monthOf, PLACES, shortDate, sortPlaces, type Place, type SortDir, type SortKey } from './places'

const ICONS = { 카페: CoffeeIcon, 서점: BookOpenIcon, 공원: TreesIcon, 전시: FrameIcon }

/** A drawn picture for a place: a gradient in its own colour with the category icon. */
export function Thumb({
  place,
  className,
  iconClassName,
  height,
}: {
  place: Place
  className?: string
  iconClassName?: string
  /** px; for masonry, where each picture has its own height */
  height?: number
}) {
  const Icon = ICONS[place.category]
  return (
    <div
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-md text-white', className)}
      style={{ height, background: `linear-gradient(135deg, hsl(${place.hue} 70% 64%), hsl(${place.hue + 35} 60% 42%))` }}
    >
      <Icon className={cn('size-5 opacity-90', iconClassName)} />
    </div>
  )
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
      <StarIcon aria-hidden className="size-3 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
    </span>
  )
}

/** Shared toggle for column counts. */
function ColumnPicker({ value, options, onChange }: { value: number; options: number[]; onChange: (n: number) => void }) {
  return (
    <ToggleGroup
      type="single"
      aria-label="열 수"
      variant="outline"
      size="sm"
      value={String(value)}
      onValueChange={(v) => v && onChange(Number(v))}
    >
      {options.map((n) => (
        <ToggleGroupItem key={n} value={String(n)} className="px-3">
          {n}열
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** 1. One item per row: picture, title, meta, and a way in. */
export function ListView() {
  const [selected, setSelected] = useState<Place | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul aria-label="장소 목록" className="max-h-96 divide-y overflow-y-auto rounded-lg border bg-background">
        {PLACES.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              aria-current={selected?.id === p.id ? true : undefined}
              onClick={() => setSelected(p)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none hover:bg-muted focus-visible:bg-muted aria-[current=true]:bg-muted"
            >
              <Thumb place={p} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.area}
                </p>
              </div>
              <Rating value={p.rating} />
              <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="text-sm text-muted-foreground">
        {selected ? `선택: ${selected.name}` : '줄을 누르면 고를 수 있습니다.'}
      </p>
    </div>
  )
}

/** 2. Same-sized tiles in rows and columns. */
export function GridView() {
  const [columns, setColumns] = useState(3)
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <ColumnPicker value={columns} options={[2, 3, 4]} onChange={setColumns} />
      <ul
        aria-label="장소 격자"
        data-columns={columns}
        className="grid w-full gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {PLACES.map((p) => (
          <li key={p.id} className="flex flex-col gap-1.5">
            <Thumb place={p} className="aspect-square w-full" iconClassName="size-7" />
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="-mt-1 text-xs text-muted-foreground">{p.area}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 3. Each item is a self-contained box with its own picture, text and actions. */
export function CardView() {
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label="장소 카드" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACES.slice(0, 6).map((p) => (
          <li key={p.id} className="flex">
            <Card className="w-full gap-3 overflow-hidden pt-0">
              <Thumb place={p} className="h-28 w-full rounded-none" iconClassName="size-8" />
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription className="line-clamp-2">{p.note}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto justify-between">
                <Rating value={p.rating} />
                <Button variant="outline" size="sm" aria-pressed={saved.has(p.id)} onClick={() => toggle(p.id)}>
                  <BookmarkIcon data-icon="inline-start" className={cn(saved.has(p.id) && 'fill-current')} />
                  저장
                </Button>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
      <p role="status" className="text-center text-sm text-muted-foreground">
        저장한 장소 {saved.size}곳
      </p>
    </div>
  )
}

/** 4. One slide in focus at a time; swipe, arrows or dots move along. */
export function CarouselView() {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const last = PLACES.length - 1

  const go = (next: number) => {
    const i = Math.max(0, Math.min(last, next))
    setIndex(i)
    const el = track.current
    const slide = el?.children[i] as HTMLElement | undefined
    if (el && slide) el.scrollTo?.({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: 'smooth' })
  }

  // swiping by hand: the slide nearest the middle becomes current
  const onScroll = () => {
    const el = track.current
    if (!el) return
    const middle = el.scrollLeft + el.clientWidth / 2
    let nearest = 0
    let best = Infinity
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement
      const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - middle)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setIndex(nearest)
  }

  return (
    <section aria-roledescription="carousel" aria-label="추천 장소" className="flex w-full max-w-xl flex-col gap-3">
      <div
        ref={track}
        onScroll={onScroll}
        // relative: slide offsetLeft is then measured from the track itself
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-[10%] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PLACES.map((p, i) => (
          <div
            key={p.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${PLACES.length}`}
            className={cn('flex w-[80%] shrink-0 snap-center flex-col gap-2 transition-opacity', i !== index && 'opacity-60')}
          >
            <Thumb place={p} className="h-44 w-full rounded-xl" iconClassName="size-10" />
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{p.name}</p>
              <Rating value={p.rating} />
            </div>
            <p className="line-clamp-1 text-sm text-muted-foreground">{p.note}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="icon" aria-label="이전 장소" disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeftIcon />
        </Button>
        <div className="flex flex-wrap justify-center gap-1.5">
          {PLACES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`${i + 1}번째 장소로`}
              aria-current={i === index ? true : undefined}
              onClick={() => go(i)}
              className={cn('h-2 rounded-full bg-foreground/20 transition-all', i === index ? 'w-5 bg-foreground' : 'w-2')}
            />
          ))}
        </div>
        <Button variant="outline" size="icon" aria-label="다음 장소" disabled={index === last} onClick={() => go(index + 1)}>
          <ChevronRightIcon />
        </Button>
      </div>
      <p role="status" className="text-center text-xs text-muted-foreground tabular-nums">
        {index + 1} / {PLACES.length}
      </p>
    </section>
  )
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: 'name', label: '이름' },
  { key: null, label: '분류' },
  { key: null, label: '동네' },
  { key: 'rating', label: '평점' },
  { key: 'visited', label: '방문일' },
]

/** 5. Rows and named columns, for comparing many fields; sort and select. */
export function TableView() {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const rows = sort ? sortPlaces(PLACES, sort.key, sort.dir) : PLACES
  const all = selected.size === PLACES.length

  const sortBy = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' }, // numbers and dates: biggest/newest first
    )
  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="max-h-96 overflow-y-auto rounded-lg border bg-background">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="모두 선택"
                  checked={all ? true : selected.size > 0 ? 'indeterminate' : false}
                  onCheckedChange={() => setSelected(all ? new Set() : new Set(PLACES.map((p) => p.id)))}
                />
              </TableHead>
              {COLUMNS.map((col) => {
                const active = col.key && sort?.key === col.key
                return (
                  <TableHead
                    key={col.label}
                    aria-sort={col.key ? (active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                    className={cn(col.key === 'rating' && 'text-right')}
                  >
                    {col.key ? (
                      <Button variant="ghost" size="sm" className="-mx-2" onClick={() => sortBy(col.key!)}>
                        {col.label}
                        {active ? (
                          sort!.dir === 'asc' ? <ArrowUpIcon data-icon="inline-end" /> : <ArrowDownIcon data-icon="inline-end" />
                        ) : (
                          <ArrowUpDownIcon data-icon="inline-end" className="opacity-40" />
                        )}
                      </Button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} data-state={selected.has(p.id) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox aria-label={`${p.name} 선택`} checked={selected.has(p.id)} onCheckedChange={(on) => toggle(p.id, on === true)} />
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.area}</TableCell>
                <TableCell className="text-right tabular-nums">{p.rating.toFixed(1)}</TableCell>
                <TableCell className="tabular-nums">{shortDate(p.visited)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {selected.size > 0 ? `${selected.size}개 선택됨` : '머리글을 누르면 정렬되고, 체크박스로 줄을 고릅니다.'}
      </p>
    </div>
  )
}

/** 6. Events in time order along a line, grouped by month. */
export function TimelineView() {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const sorted = sortPlaces(PLACES, 'visited', 'desc')
  const months = [...new Set(sorted.map((p) => monthOf(p.visited)))]

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      {months.map((month) => (
        <section key={month} className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">{month}</h4>
          <ol className="ml-2 flex flex-col gap-4 border-l-2 border-border pl-6">
            {sorted
              .filter((p) => monthOf(p.visited) === month)
              .map((p) => {
                const expanded = open.has(p.id)
                return (
                  <li key={p.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-1 -left-[33px] size-3.5 rounded-full border-[3px] bg-background"
                      style={{ borderColor: `hsl(${p.hue} 65% 50%)` }}
                    />
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setOpen((prev) => {
                          const next = new Set(prev)
                          if (expanded) next.delete(p.id)
                          else next.add(p.id)
                          return next
                        })
                      }
                      className="flex flex-col items-start gap-0.5 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {shortDate(p.visited)} · {p.category}
                      </span>
                      <span className="font-medium">{p.name}</span>
                    </button>
                    {expanded && <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>}
                  </li>
                )
              })}
          </ol>
        </section>
      ))}
    </div>
  )
}

/** 7. Groups that fold open and shut, so a long list stays short. */
export function AccordionView() {
  return (
    <Accordion type="multiple" defaultValue={['카페']} className="w-full max-w-md rounded-lg border bg-background px-4">
      {groupByCategory(PLACES).map(({ category, places }) => {
        const Icon = ICONS[category]
        return (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                {`${category} ${places.length}곳`}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-2">
                {places.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <Thumb place={p} className="size-8" iconClassName="size-4" />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <Rating value={p.rating} />
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

const MASONRY_HEIGHTS = [96, 168, 124, 208, 140, 112]

/** 8. Columns of cards with their own heights, packed like bricks (Pinterest). */
export function MasonryView() {
  const [columns, setColumns] = useState(3)
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <ColumnPicker value={columns} options={[2, 3, 4]} onChange={setColumns} />
      <ul aria-label="장소 메모" data-columns={columns} className="w-full gap-3" style={{ columnCount: columns }}>
        {PLACES.map((p, i) => (
          <li key={p.id} className="mb-3 break-inside-avoid overflow-hidden rounded-lg border bg-background">
            {/* pictures get their own heights, and the notes differ in length too */}
            <Thumb
              place={p}
              className="w-full rounded-none"
              iconClassName="size-7"
              height={MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]}
            />
            <div className="flex flex-col gap-1 p-3">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const PAGE_SIZE = 6
const MAX_PAGES = 5

/** 9. More items load by themselves as you near the end of the list. */
export function InfiniteScrollView() {
  const [items, setItems] = useState(() => feedPage(0, PAGE_SIZE))
  const [loading, setLoading] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const done = items.length >= PAGE_SIZE * MAX_PAGES

  const load = useCallback(() => {
    if (loading || done) return
    setLoading(true)
    // pretend the next page comes over the network
    timer.current = window.setTimeout(() => {
      setItems((prev) => [...prev, ...feedPage(prev.length / PAGE_SIZE, PAGE_SIZE)])
      setLoading(false)
    }, 700)
  }, [loading, done])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // the invisible line under the last item: when it scrolls into view, fetch the next page
  useEffect(() => {
    if (!box.current || !sentinel.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && load(), {
      root: box.current,
      rootMargin: '80px',
    })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [load])

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div ref={box} className="h-80 overflow-y-auto rounded-lg border bg-background">
        <div role="feed" aria-label="장소 피드" aria-busy={loading} className="divide-y">
          {items.map((p, i) => (
            <article key={p.id} aria-posinset={i + 1} aria-setsize={done ? items.length : -1} className="flex gap-3 p-3">
              <Thumb place={p} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.note}</p>
              </div>
            </article>
          ))}
        </div>
        {loading &&
          [0, 1].map((i) => (
            <div key={i} className="flex gap-3 border-t p-3">
              <Skeleton className="size-12" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        <div ref={sentinel} className="h-px" />
        <div className="flex justify-center p-3">
          {done ? (
            <p className="text-xs text-muted-foreground">모두 불러왔습니다</p>
          ) : (
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              더 불러오기
            </Button>
          )}
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {items.length}개 불러옴{loading ? ' · 불러오는 중…' : ''}
      </p>
    </div>
  )
}
