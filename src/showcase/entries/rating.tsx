import { useId, useState, type ReactNode } from 'react'
import {
  AngryIcon,
  FrownIcon,
  HeartIcon,
  LaughIcon,
  MehIcon,
  SmileIcon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

const MAX = 5
const words = ['', '별로예요', '그저 그래요', '보통이에요', '좋아요', '최고예요']

const tones = {
  star: { on: 'fill-amber-400 text-amber-400', preview: 'fill-amber-200 text-amber-400' },
  heart: { on: 'fill-rose-500 text-rose-500', preview: 'fill-rose-200 text-rose-500' },
}

type RatingProps = {
  value: number
  onValueChange?: (value: number) => void
  /** the star under the pointer, or 0 when the pointer leaves */
  onPreviewChange?: (value: number) => void
  label?: string
  labelledBy?: string
  describedBy?: string
  itemLabel?: (n: number) => string
  Icon?: LucideIcon
  tone?: keyof typeof tones
  size?: string
  disabled?: boolean
  /** pin the pointer over a star, or keyboard focus on one, for the state gallery */
  demoHover?: number
  demoFocus?: number
}

/**
 * Five native radios hidden behind star icons: a click picks a star, the arrow
 * keys move between them as in any radio group, and screen readers hear "4점".
 */
function Rating({
  value,
  onValueChange,
  onPreviewChange,
  label,
  labelledBy,
  describedBy,
  itemLabel = (n) => `${n}점`,
  Icon = StarIcon,
  tone = 'star',
  size = 'size-6',
  disabled = false,
  demoHover,
  demoFocus,
}: RatingProps) {
  const name = useId()
  const [hover, setHover] = useState(0)
  const preview = demoHover ?? hover
  const shown = preview || value
  const colors = tones[tone]

  const point = (n: number) => {
    if (disabled) return
    setHover(n)
    onPreviewChange?.(n)
  }

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      data-slot="rating"
      onMouseLeave={() => point(0)}
      className={cn('flex w-fit items-center', disabled && 'opacity-50')}
    >
      {Array.from({ length: MAX }, (_, i) => {
        const n = i + 1
        const fill = n > shown ? 'off' : preview && n > value ? 'preview' : 'on'
        return (
          <label
            key={n}
            data-slot="rating-item"
            data-fill={fill}
            data-demo-state={n === demoHover ? 'hover' : n === demoFocus ? 'focus' : undefined}
            onMouseEnter={() => point(n)}
            className={cn(
              'relative rounded-md p-0.5 motion-safe:transition-transform',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-115',
              // the radio itself is hidden, so its keyboard focus is drawn around the star
              'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 focus-visible:ring-3 focus-visible:ring-ring/50',
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              disabled={disabled}
              aria-label={itemLabel(n)}
              onChange={() => onValueChange?.(n)}
              className="sr-only"
            />
            <Icon
              aria-hidden
              className={cn(size, fill === 'on' ? colors.on : fill === 'preview' ? colors.preview : 'text-muted-foreground/40')}
            />
          </label>
        )
      })}
    </div>
  )
}

/** A read-only average drawn to the nearest half star. */
function Stars({ value, size = 'size-5' }: { value: number; size?: string }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span role="img" aria-label={`5점 만점에 ${value}점`} data-value={rounded} className="inline-flex items-center gap-0.5">
      {Array.from({ length: MAX }, (_, i) => {
        const part = Math.min(1, Math.max(0, rounded - i))
        return (
          <span key={i} className={cn('relative inline-block shrink-0', size)}>
            <StarIcon aria-hidden className={cn('absolute inset-0 text-muted-foreground/40', size)} />
            {part > 0 && (
              // the filled star, cut off at the half for x.5
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${part * 100}%` }}>
                <StarIcon aria-hidden className={cn('fill-amber-400 text-amber-400', size)} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** A rating that keeps its own value, for the state gallery. */
function LiveRating({ initial, ...props }: Omit<RatingProps, 'value' | 'onValueChange'> & { initial: number }) {
  const [value, setValue] = useState(initial)
  return <Rating value={value} onValueChange={setValue} {...props} />
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '빈 별', node: <LiveRating label="빈 별" initial={0} /> },
        { label: '일부', node: <LiveRating label="일부" initial={3} /> },
        { label: '가득', node: <LiveRating label="가득" initial={5} /> },
        { label: '마우스 올림 미리보기', node: <LiveRating label="마우스 올림 미리보기" initial={2} demoHover={4} /> },
        { label: '포커스', node: <LiveRating label="포커스" initial={3} demoFocus={3} /> },
        {
          label: '읽기 전용',
          node: (
            <span className="flex items-center gap-1.5">
              <Stars value={4.5} size="size-6" />
              <span className="text-sm font-medium tabular-nums">4.5</span>
            </span>
          ),
        },
        { label: '비활성', node: <LiveRating label="비활성" initial={3} disabled /> },
      ]}
    />
  )
}

function RatingPreview() {
  const [value, setValue] = useState(4)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Rating label="별점" value={value} onValueChange={setValue} />
      <span className="text-xs text-muted-foreground">
        {value}점 · {words[value]}
      </span>
    </div>
  )
}

function RatingSpecimen() {
  const id = useId()
  const [value, setValue] = useState(3)
  return (
    <div className="flex flex-col items-start gap-2">
      <span id={`${id}-label`} className="text-sm font-medium">
        이 상품은 어땠나요?
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <Rating labelledBy={`${id}-label`} value={value} onValueChange={setValue} size="size-7" />
        <span data-slot="rating-value" className="text-sm tabular-nums">
          {value > 0 ? `${value}점 · ${words[value]}` : '고르지 않음'}
        </span>
        <Button data-slot="rating-clear" variant="ghost" size="sm" disabled={value === 0} onClick={() => setValue(0)}>
          지우기
        </Button>
      </div>
    </div>
  )
}

function LeaveRating() {
  const id = useId()
  const [value, setValue] = useState(0)
  const [preview, setPreview] = useState(0)
  const word = preview ? words[preview] : value ? words[value] : '별을 눌러 골라 주세요'

  return (
    <div className="flex w-full max-w-80 flex-col items-center gap-3 text-center">
      <span id={`${id}-label`} className="text-sm font-medium">
        배송은 만족스러우셨나요?
      </span>
      <Rating
        labelledBy={`${id}-label`}
        describedBy={`${id}-hint`}
        value={value}
        onValueChange={setValue}
        onPreviewChange={setPreview}
        size="size-8"
      />
      {/* screen readers get the chosen value from the status line below */}
      <p aria-hidden className={cn('h-5 text-sm', preview ? 'text-muted-foreground' : 'font-medium')}>
        {word}
      </p>
      <Button variant="outline" size="sm" disabled={value === 0} onClick={() => setValue(0)}>
        지우기
      </Button>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        마우스를 올리면 미리 보이고 누르면 정해집니다. 방향키 ←→로도 바꿀 수 있습니다.
      </p>
      <p role="status" className="text-xs">
        {value > 0 ? `고른 별점: ${value}점 (${words[value]})` : '아직 고르지 않았습니다.'}
      </p>
    </div>
  )
}

const products = [
  { id: 'earbuds', name: '무선 이어폰', average: 4.5, reviews: 1284 },
  { id: 'tumbler', name: '텀블러', average: 3.7, reviews: 312 },
  { id: 'backpack', name: '등산 가방', average: 4.2, reviews: 87 },
  { id: 'kettle', name: '전기 포트', average: 2.3, reviews: 45 },
]

function HalfStars() {
  const [productId, setProductId] = useState(products[0].id)
  const product = products.find((p) => p.id === productId)!
  const drawn = Math.round(product.average * 2) / 2

  return (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="상품"
        value={productId}
        onValueChange={(next) => next && setProductId(next)}
        className="flex-wrap"
      >
        {products.map((p) => (
          <ToggleGroupItem key={p.id} value={p.id} className="bg-background">
            {p.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-md bg-muted text-xl font-semibold text-muted-foreground"
        >
          {product.name[0]}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium">{product.name}</p>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Stars value={product.average} />
            <span className="text-sm font-semibold tabular-nums">{product.average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">(리뷰 {product.reviews.toLocaleString('ko-KR')}개)</span>
          </div>
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        평균 {product.average}점 → 별 {drawn}개로 그립니다 (0.5 단위로 반올림)
      </p>
    </div>
  )
}

const distribution = [
  { score: 5, count: 82 },
  { score: 4, count: 31 },
  { score: 3, count: 9 },
  { score: 2, count: 3 },
  { score: 1, count: 3 },
]
const reviewTotal = distribution.reduce((sum, d) => sum + d.count, 0)
const reviewAverage = distribution.reduce((sum, d) => sum + d.score * d.count, 0) / reviewTotal

const sampleReviews = [
  { score: 5, text: '소리가 깨끗하고 배터리가 오래 갑니다.' },
  { score: 5, text: '주문한 다음 날 바로 왔어요.' },
  { score: 4, text: '좋은데 케이스가 조금 큽니다.' },
  { score: 4, text: '가격을 생각하면 만족합니다.' },
  { score: 3, text: '무난합니다.' },
  { score: 1, text: '한쪽이 안 들려서 교환했어요.' },
]

function Distribution() {
  const [filter, setFilter] = useState<number | null>(null)
  const shown = filter ? sampleReviews.filter((r) => r.score === filter) : sampleReviews
  const filterCount = distribution.find((d) => d.score === filter)?.count ?? reviewTotal

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:w-28">
          <span className="text-4xl font-semibold tabular-nums">{reviewAverage.toFixed(1)}</span>
          <Stars value={Number(reviewAverage.toFixed(1))} size="size-4" />
          <span className="text-xs text-muted-foreground">리뷰 {reviewTotal}개</span>
        </div>
        <ul aria-label="점수별 리뷰 수" className="flex flex-1 flex-col gap-0.5">
          {distribution.map(({ score, count }) => (
            <li key={score}>
              <button
                type="button"
                aria-pressed={filter === score}
                onClick={() => setFilter(filter === score ? null : score)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-muted aria-pressed:font-semibold"
              >
                {/* the space keeps the button's name "5점 82개" rather than "5점82개" */}
                <span className="w-7 shrink-0 text-left tabular-nums">{score}점</span>{' '}
                <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / reviewTotal) * 100}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">{count}개</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {shown.length > 0 ? (
        <ul aria-label="리뷰" className="flex flex-col divide-y rounded-lg border bg-background">
          {shown.map((review) => (
            <li key={review.text} className="flex flex-col gap-1 px-3 py-2">
              <Stars value={review.score} size="size-3.5" />
              <span className="text-sm">{review.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
          이 점수의 예시 리뷰가 없습니다.
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {filter
          ? `${filter}점 리뷰만 보는 중 (${filterCount}개 중 예시 ${shown.length}개)`
          : `모든 리뷰 보는 중 (${reviewTotal}개 중 예시 ${shown.length}개)`}
      </p>
    </div>
  )
}

function Panel({ title, rule, children }: { title: string; rule: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      {children}
      <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{rule}</p>
    </div>
  )
}

const moods = [
  { value: 1, label: '매우 불만', Icon: AngryIcon },
  { value: 2, label: '불만', Icon: FrownIcon },
  { value: 3, label: '보통', Icon: MehIcon },
  { value: 4, label: '만족', Icon: SmileIcon },
  { value: 5, label: '매우 만족', Icon: LaughIcon },
]

const UP = 24
const DOWN = 3

function OtherShapes() {
  const id = useId()
  const [hearts, setHearts] = useState(3)
  const [mood, setMood] = useState(0)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const toggleVote = (next: 'up' | 'down') => setVote(vote === next ? null : next)

  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      <Panel title="하트" rule="별과 같이 왼쪽부터 차오릅니다. 좋아하는 정도를 잴 때 씁니다.">
        <Rating
          label="마음에 든 정도"
          Icon={HeartIcon}
          tone="heart"
          itemLabel={(n) => `하트 ${n}개`}
          value={hearts}
          onValueChange={setHearts}
        />
        <p className="text-xs">하트 {hearts}개</p>
      </Panel>

      <Panel title="얼굴 5단계" rule="차오르지 않고 얼굴 하나만 고릅니다. 만족도 조사에 흔합니다.">
        <div role="radiogroup" aria-label="만족도" className="flex gap-0.5">
          {moods.map(({ value, label, Icon }) => (
            <label
              key={value}
              title={label}
              className={cn(
                'relative cursor-pointer rounded-md p-0.5 motion-safe:transition-transform',
                'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                mood === value ? 'scale-110 text-amber-600' : 'text-muted-foreground/60 hover:text-muted-foreground',
              )}
            >
              <input
                type="radio"
                name={`${id}-mood`}
                value={value}
                checked={mood === value}
                onChange={() => setMood(value)}
                aria-label={label}
                className="sr-only"
              />
              <Icon aria-hidden className={cn('size-7', mood === value && 'fill-amber-100')} />
            </label>
          ))}
        </div>
        <p className="text-xs">만족도: {mood > 0 ? moods[mood - 1].label : '고르지 않음'}</p>
      </Panel>

      <Panel title="좋아요·싫어요" rule="점수 없이 둘 중 하나만 누릅니다. 다시 누르면 취소됩니다.">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" aria-pressed={vote === 'up'} onClick={() => toggleVote('up')} className="aria-pressed:bg-muted">
            <ThumbsUpIcon className={cn(vote === 'up' && 'fill-current')} />
            좋아요 <span className="tabular-nums">{UP + (vote === 'up' ? 1 : 0)}</span>
          </Button>
          <Button variant="outline" size="sm" aria-pressed={vote === 'down'} onClick={() => toggleVote('down')} className="aria-pressed:bg-muted">
            <ThumbsDownIcon className={cn(vote === 'down' && 'fill-current')} />
            싫어요 <span className="tabular-nums">{DOWN + (vote === 'down' ? 1 : 0)}</span>
          </Button>
        </div>
        <p className="text-xs">{vote === 'up' ? '좋아요를 눌렀습니다' : vote === 'down' ? '싫어요를 눌렀습니다' : '아직 누르지 않았습니다'}</p>
      </Panel>
    </div>
  )
}

export const ratingEntry: ShowcaseEntry = {
  id: 'rating',
  name: 'Rating',
  aliases: ['Star rating', 'Review stars', 'Stars', 'Rate', '별점', '평점'],
  description: '별 다섯 개 가운데 몇 개를 채워 좋고 나쁨을 점수로 남기거나 보여주는 표시.',
  category: 'input',
  Preview: RatingPreview,
  anatomy: {
    Specimen: RatingSpecimen,
    parts: [
      { slot: 'rating', name: 'Rating', description: '별 다섯 개를 묶은 전체. 라디오 묶음이라 방향키로도 옮겨 다님' },
      { slot: 'rating-item', name: 'RatingItem', description: '별 하나. 안에 숨은 라디오가 있어 누르면 그 점수가 됨' },
      { slot: 'rating-value', name: 'value', description: '고른 점수와 그 뜻을 글로 적은 부분' },
      { slot: 'rating-clear', name: 'clear', description: '고른 별점을 지우는 버튼' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '별점이 놓이는 상태를 나란히 놓았습니다. 마우스를 올린 미리보기는 정해진 별보다 연하게 칠해지고, 읽기 전용은 평균을 반 별까지 그립니다. 칸마다 직접 눌러 볼 수 있습니다.',
      Demo: States,
    },
    {
      title: '별점 남기기',
      description:
        '마우스를 올리면 그 별까지 미리 칠해지고 뜻(좋아요 등)이 보입니다. 누르면 정해지고, 방향키로 한 칸씩 옮기거나 지우기로 비울 수 있습니다.',
      Demo: LeaveRating,
    },
    {
      title: '반 별 (0.5 단위)',
      description:
        '여러 사람의 평균은 4.5처럼 소수가 되므로 반 별까지 그려서 보여 줍니다. 이때는 누를 수 없는 읽기 전용입니다. 상품을 바꿔 가며 평균이 몇 개의 별로 그려지는지 보세요.',
      Demo: HalfStars,
    },
    {
      title: '평점 분포',
      description:
        '평균 하나로는 알 수 없는 점수별 리뷰 수를 막대로 보여 줍니다. 막대를 누르면 그 점수의 리뷰만 걸러지고, 다시 누르면 풀립니다.',
      Demo: Distribution,
    },
    {
      title: '다른 모양',
      description:
        '별 대신 하트, 얼굴, 엄지를 쓰기도 합니다. 하트는 별처럼 차오르고, 얼굴은 하나만 고르며, 좋아요·싫어요는 점수 없이 둘 중 하나입니다.',
      Demo: OtherShapes,
    },
  ],
}
