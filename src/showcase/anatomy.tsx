import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { layoutCallouts, type Callout } from './callouts'
import { Specimen } from './specimen'
import type { AnatomyPart } from './types'

const CHIP_RADIUS = 10

/**
 * The part of an element that is actually visible: its box clipped by every
 * ancestor (up to `root`) that hides overflow. A progress bar's fill, for
 * example, is translated partly outside its track and clipped there.
 */
function visibleRect(el: Element, root: Element) {
  let { left, top, right, bottom } = el.getBoundingClientRect()
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    if (getComputedStyle(node).overflow === 'visible') continue
    const clip = node.getBoundingClientRect()
    left = Math.max(left, clip.left)
    top = Math.max(top, clip.top)
    right = Math.min(right, clip.right)
    bottom = Math.min(bottom, clip.bottom)
  }
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

/**
 * Measures where each part's [data-slot] element sits inside `specimenRef` and lays
 * out its callout relative to `stageRef`. Put the stage around the specimen with
 * enough side padding (about 2.25rem) for the number chips.
 */
export function useCallouts(parts: AnatomyPart[]) {
  const stageRef = useRef<HTMLDivElement>(null)
  const specimenRef = useRef<HTMLDivElement>(null)
  const [callouts, setCallouts] = useState<(Callout | null)[]>([])

  const measure = useCallback(() => {
    const stage = stageRef.current
    const specimen = specimenRef.current
    if (!stage || !specimen) return
    const origin = stage.getBoundingClientRect()

    const rects = parts.map((part) => {
      // Some parts render twice with one copy hidden (e.g. open/closed icons); label the visible one.
      const matches = [...specimen.querySelectorAll(`[data-slot="${part.slot}"]`)]
      const el = matches.find((m) => m.getClientRects().length > 0) ?? matches[0]
      if (!el) return null
      const rect = visibleRect(el, specimen)
      return { top: rect.top - origin.top, left: rect.left - origin.left, width: rect.width, height: rect.height }
    })
    // Chips go outside the specimen's own outer box (its first element), not just
    // outside the marked parts, so they never land on unmarked content.
    const outer = (specimen.firstElementChild ?? specimen).getBoundingClientRect()
    const bounds = { left: outer.left - origin.left, right: outer.right - origin.left }
    const next = layoutCallouts(rects, origin.width, bounds)

    setCallouts((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [parts])

  useLayoutEffect(() => {
    measure()
    const specimen = specimenRef.current
    if (!specimen) return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const resize = new ResizeObserver(schedule)
    resize.observe(specimen)
    const mutation = new MutationObserver(schedule)
    mutation.observe(specimen, { subtree: true, childList: true, attributes: true })
    window.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutation.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [measure])

  return { stageRef, specimenRef, callouts }
}

function Chip({ n, className, style }: { n: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full bg-blueprint font-mono text-[11px] font-medium leading-none text-white',
        className,
      )}
    >
      {n}
    </span>
  )
}

/** Outlines, leader lines and number chips drawn over the specimen; place it inside the stage. */
export function CalloutLayer({
  callouts,
  parts,
  isVisible,
  active,
}: {
  callouts: (Callout | null)[]
  parts: AnatomyPart[]
  isVisible: (index: number) => boolean
  active: number | null
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {callouts.map((c, i) => {
        if (!c || !isVisible(i)) return null
        const state = active === null ? 'idle' : active === i ? 'active' : 'dimmed'
        const right = c.left + c.width
        const leaderLeft = c.side === 'left' ? c.chipX + CHIP_RADIUS : right
        const leaderWidth = c.side === 'left' ? c.left - leaderLeft : c.chipX - CHIP_RADIUS - right
        return (
          <div
            key={parts[i].slot}
            data-testid="anatomy-marker"
            data-state={state}
            className={cn('absolute inset-0 motion-safe:transition-opacity', state === 'dimmed' && 'opacity-15')}
          >
            <div
              className={cn(
                'absolute rounded-[3px] border border-dashed border-blueprint/45',
                state === 'active' && 'border-solid border-blueprint bg-blueprint/10',
              )}
              style={{ top: c.top, left: c.left, width: c.width, height: c.height }}
            />
            <div
              className="absolute border-t border-blueprint/70"
              style={{ top: c.chipY, left: leaderLeft, width: Math.max(0, leaderWidth) }}
            />
            <Chip
              n={i + 1}
              className="absolute ring-2 ring-white"
              style={{ top: c.chipY - CHIP_RADIUS, left: c.chipX - CHIP_RADIUS }}
            />
          </div>
        )
      })}
    </div>
  )
}

/** Numbered list of parts; hovering or focusing an item makes it the active one. */
export function PartList({
  parts,
  active,
  onActiveChange,
  nameStyle = 'code',
  label,
  className,
}: {
  parts: AnatomyPart[]
  active: number | null
  onActiveChange: (index: number | null) => void
  nameStyle?: 'code' | 'text'
  label: string
  className?: string
}) {
  return (
    <ol aria-label={label} className={cn('grid', className)}>
      {parts.map((part, i) => (
        <li
          key={part.slot}
          tabIndex={0}
          onMouseEnter={() => onActiveChange(i)}
          onMouseLeave={() => onActiveChange(null)}
          onFocus={() => onActiveChange(i)}
          onBlur={() => onActiveChange(null)}
          className={cn(
            'grid cursor-default grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 rounded-md px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-blueprint/40',
            active === i && 'bg-blueprint-soft',
          )}
        >
          <Chip n={i + 1} className="row-span-2 mt-px" />
          {nameStyle === 'code' ? (
            <code className="font-mono text-[13px] font-medium text-ink">{part.name}</code>
          ) : (
            <span className="text-[14px] font-medium leading-snug text-ink">{part.name}</span>
          )}
          <span className="text-[13px] leading-snug text-ink-muted">{part.description}</span>
        </li>
      ))}
    </ol>
  )
}

/** Switch that shows every marker at once. */
export function ShowAllSwitch({ checked, onCheckedChange, label }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
      <Label htmlFor={id} className="text-ink-muted">
        {label}
      </Label>
    </div>
  )
}

type AnatomyProps = {
  Specimen: ComponentType
  parts: AnatomyPart[]
  layout?: 'side' | 'stacked'
  /**
   * 'always': every marker shows until the switch turns them off (component pages).
   * 'on-focus': markers start hidden; hovering or focusing a list item shows only
   * that part, and the switch shows them all.
   */
  markers?: 'always' | 'on-focus'
  /** 'code' shows part names in the mono code face; 'text' for plain phrases. */
  nameStyle?: 'code' | 'text'
  labels?: { toggle: string; list: string }
}

export function Anatomy({
  Specimen: SpecimenComponent,
  parts,
  layout = 'side',
  markers = 'always',
  nameStyle = 'code',
  labels = { toggle: '부분 번호 표시', list: '부분 이름' },
}: AnatomyProps) {
  const [showAll, setShowAll] = useState(markers === 'always')
  const [active, setActive] = useState<number | null>(null)
  const { stageRef, specimenRef, callouts } = useCallouts(parts)

  return (
    <div className={cn('grid gap-5', layout === 'side' && 'lg:grid-cols-[minmax(0,1fr)_15rem]')}>
      <Specimen className="min-h-64 p-10 sm:p-14">
        <div ref={stageRef} className="relative flex w-full justify-center">
          <div ref={specimenRef} className="flex w-full justify-center">
            <SpecimenComponent />
          </div>
          <CalloutLayer
            callouts={callouts}
            parts={parts}
            active={active}
            isVisible={(i) => showAll || (markers === 'on-focus' && active === i)}
          />
        </div>
      </Specimen>

      <div className="flex flex-col gap-3">
        <ShowAllSwitch checked={showAll} onCheckedChange={setShowAll} label={labels.toggle} />
        <PartList
          parts={parts}
          active={active}
          onActiveChange={setActive}
          nameStyle={nameStyle}
          label={labels.list}
          className={cn(layout === 'stacked' && 'gap-x-4 sm:grid-cols-2')}
        />
      </div>
    </div>
  )
}
