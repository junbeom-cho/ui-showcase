import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Volume1Icon, Volume2Icon, VolumeIcon, VolumeXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

/**
 * shadcn's Slider gives every thumb the same props, so whatever differs per
 * thumb (a pinned demo state, separate names for the two ends of a range) is
 * written onto the thumb elements after each render.
 */
function TunedSlider({ thumbs, ...props }: ComponentProps<typeof Slider> & { thumbs: Record<string, string>[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    ref.current?.querySelectorAll('[data-slot="slider-thumb"]').forEach((thumb, index) => {
      for (const [name, value] of Object.entries(thumbs[index] ?? {})) thumb.setAttribute(name, value)
    })
  })
  return <Slider ref={ref} {...props} />
}

/**
 * Where the centre of a 12px thumb sits along the track. Radix keeps the thumb
 * inside the track, so at the ends it moves in by up to half its width.
 */
function thumbCenter(percent: number) {
  return `calc(${percent}% + ${6 - (percent / 100) * 12}px)`
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-32">{children}</div>
}

/** A slider with its value in a small bubble above the thumb. */
function BubbleSlider() {
  const [value, setValue] = useState(60)
  return (
    <div className="relative w-full pt-8">
      <span
        aria-hidden
        style={{ left: thumbCenter(value) }}
        className="absolute top-0 -translate-x-1/2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-primary"
      >
        {value}
      </span>
      <Slider value={[value]} onValueChange={([next]) => setValue(next)} thumbLabel="값 표시" />
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Cell><Slider defaultValue={[40]} thumbLabel="기본" /></Cell> },
        // hover and dragging draw the same ring as focus in this design, so one cell shows all three
        {
          label: '포커스·호버·끌기',
          node: <Cell><TunedSlider defaultValue={[40]} thumbLabel="포커스" thumbs={[{ 'data-demo-state': 'focus' }]} /></Cell>,
        },
        { label: '비활성', node: <Cell><Slider defaultValue={[40]} thumbLabel="비활성" disabled /></Cell> },
        { label: '값 표시', node: <Cell><BubbleSlider /></Cell> },
        {
          label: '범위 (두 손잡이)',
          node: (
            <Cell>
              <TunedSlider defaultValue={[25, 70]} thumbs={[{ 'aria-label': '범위 시작' }, { 'aria-label': '범위 끝' }]} />
            </Cell>
          ),
        },
      ]}
    />
  )
}

function SliderPreview() {
  const [value, setValue] = useState(60)
  return (
    <div className="flex w-full max-w-52 flex-col gap-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium">밝기</span>
        <span className="text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={([next]) => setValue(next)} thumbLabel="밝기" />
    </div>
  )
}

function SliderSpecimen() {
  return (
    <div className="w-64 py-2">
      <Slider
        defaultValue={[60]}
        thumbLabel="음량"
        className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-track]]:h-1.5"
      />
    </div>
  )
}

function VolumeControl() {
  const [volume, setVolume] = useState(60)
  const [muted, setMuted] = useState(false)
  const level = muted ? 0 : volume
  const Icon = level === 0 ? VolumeXIcon : level < 34 ? VolumeIcon : level < 67 ? Volume1Icon : Volume2Icon

  const toggleMute = () => {
    if (level > 0) {
      setMuted(true)
    } else {
      setMuted(false)
      if (volume === 0) setVolume(50) // nothing to go back to
    }
  }

  return (
    <div className="flex w-full max-w-72 flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="음소거" aria-pressed={level === 0} onClick={toggleMute}>
          <Icon />
        </Button>
        <Slider
          value={[level]}
          onValueChange={([next]) => {
            setVolume(next)
            setMuted(false)
          }}
          thumbLabel="음량"
        />
        <span className="w-8 shrink-0 text-right text-sm tabular-nums">{level}</span>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {level === 0 ? '음소거. 아이콘을 다시 누르면 전 음량으로 돌아갑니다.' : `음량 ${level}`}
      </p>
    </div>
  )
}

const PRICE_MAX = 500_000
const PRICE_STEP = 10_000
const productPrices = [12_000, 39_000, 58_000, 89_000, 129_000, 159_000, 210_000, 249_000, 320_000, 459_000]
const won = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`

function PriceRange() {
  const [range, setRange] = useState([100_000, 300_000])
  const [low, high] = range
  const count = productPrices.filter((price) => price >= low && price <= high).length

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">가격</span>
        <span role="status" className="text-sm tabular-nums">
          {won(low)} – {won(high)}
        </span>
      </div>
      <TunedSlider
        value={range}
        onValueChange={setRange}
        max={PRICE_MAX}
        step={PRICE_STEP}
        minStepsBetweenThumbs={1}
        thumbs={[
          { 'aria-label': '최저 가격', 'aria-valuetext': won(low) },
          { 'aria-label': '최고 가격', 'aria-valuetext': won(high) },
        ]}
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{won(0)}</span>
        <span>{won(PRICE_MAX)}</span>
      </div>
      <p className="text-xs text-muted-foreground">조건에 맞는 상품 {count}개</p>
    </div>
  )
}

const OPACITY_TICKS = [0, 25, 50, 75, 100]

function SteppedTicks() {
  const [opacity, setOpacity] = useState(50)
  return (
    <div className="flex w-full max-w-72 flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative grid size-12 shrink-0 place-items-center rounded-md border bg-background text-sm font-semibold">
          Aa
          <span className="absolute inset-0 rounded-md bg-primary" style={{ opacity: opacity / 100 }} />
        </div>
        <p role="status" className="text-sm">
          불투명도 {opacity}%
        </p>
      </div>
      <div>
        <Slider value={[opacity]} onValueChange={([next]) => setOpacity(next)} step={25} thumbLabel="불투명도" />
        <div aria-hidden className="relative mt-2 h-8">
          {OPACITY_TICKS.map((tick) => (
            <span
              key={tick}
              style={{ left: thumbCenter(tick) }}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
            >
              <span className="h-1.5 w-px bg-foreground/30" />
              <span
                className={cn('text-xs tabular-nums', tick === opacity ? 'font-medium text-foreground' : 'text-muted-foreground')}
              >
                {tick}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const BANDS = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz']
const PRESETS = [
  { name: '평평하게', gains: [0, 0, 0, 0, 0] },
  { name: '저음 강조', gains: [6, 4, 0, -1, -2] },
  { name: '목소리 강조', gains: [-3, 0, 4, 3, 0] },
]
const decibels = (gain: number) => `${gain > 0 ? '+' : ''}${gain} dB`

function Equalizer() {
  const [gains, setGains] = useState([2, 1, 0, 1, 3])
  return (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <div className="grid grid-cols-5 gap-2">
        {BANDS.map((band, index) => (
          <div key={band} className="flex flex-col items-center gap-2">
            <span className="text-xs tabular-nums">{decibels(gains[index])}</span>
            <div className="flex h-40 justify-center">
              <TunedSlider
                orientation="vertical"
                min={-12}
                max={12}
                value={[gains[index]]}
                onValueChange={([next]) => setGains((prev) => prev.map((gain, i) => (i === index ? next : gain)))}
                thumbLabel={`${band} 대역`}
                thumbs={[{ 'aria-valuetext': decibels(gains[index]) }]}
              />
            </div>
            <span className="text-xs text-muted-foreground">{band}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => (
          <Button key={preset.name} variant="outline" size="sm" onClick={() => setGains(preset.gains)}>
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export const sliderEntry: ShowcaseEntry = {
  id: 'slider',
  name: 'Slider',
  aliases: ['Range', 'Range slider', '슬라이더'],
  description: '손잡이를 끌어 정해진 범위 안의 값을 고르는 막대.',
  category: 'input',
  Preview: SliderPreview,
  anatomy: {
    Specimen: SliderSpecimen,
    parts: [
      { slot: 'slider', name: 'Slider', description: '막대와 손잡이를 모두 담은 전체. 아무 곳이나 눌러도 값이 옮겨감' },
      { slot: 'slider-track', name: 'SliderTrack', description: '고를 수 있는 값의 전체 길이를 나타내는 막대' },
      { slot: 'slider-range', name: 'SliderRange', description: '최솟값부터 손잡이까지 채워지는 부분' },
      { slot: 'slider-thumb', name: 'SliderThumb', description: '끌거나 방향키로 움직이는 동그란 손잡이' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '손잡이가 거치는 상태를 나란히 놓았습니다. 이 디자인에서는 호버·포커스·끌기 모두 손잡이 둘레에 같은 테두리가 생겨 한 칸으로 묶었습니다. 값 표시는 끌어 보면 숫자가 따라옵니다.',
      Demo: States,
    },
    {
      title: '음량 조절',
      description: '아이콘이 음량에 따라 바뀌고, 누르면 음소거됩니다. 음소거를 풀면 전 음량으로 돌아갑니다.',
      Demo: VolumeControl,
    },
    {
      title: '가격 범위',
      description: '손잡이 두 개로 최저·최고를 함께 고릅니다. 두 손잡이는 한 칸(₩10,000) 이상 떨어져 있습니다.',
      Demo: PriceRange,
    },
    {
      title: '눈금과 단계',
      description: '25씩 움직이도록 단계(step)를 정하면 손잡이가 눈금에 딱 붙습니다. 방향키 한 번에 한 칸씩 갑니다.',
      Demo: SteppedTicks,
    },
    {
      title: '세로 슬라이더',
      description: '이퀄라이저처럼 여러 값을 나란히 비교할 때는 세로로 세웁니다. 위가 큰 값이고, 방향키 ↑↓로도 움직입니다.',
      Demo: Equalizer,
    },
  ],
}
