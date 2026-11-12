import { useMemo, useState } from 'react'
import { InfoIcon, ListIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalloutLayer, PartList, ShowAllSwitch, useCallouts } from '@/showcase/anatomy'
import { NeighbourLinks } from '@/showcase/neighbour-links'
import { styleHref } from '@/showcase/route'
import type { AnatomyPart } from '@/showcase/types'
import { DemoApp, type DemoView } from './demo-app'
import { StyleSamples } from './style-samples'
import type { DesignStyle } from './types'

/**
 * The style's traits (D-016). On wide screens it is a column beside the dashboard
 * so it never hides the parts it points at; on narrow screens it floats at the bottom.
 */
function TraitsPanel({
  style,
  parts,
  active,
  onActiveChange,
  showAll,
  onShowAllChange,
  onClose,
}: {
  style: DesignStyle
  parts: AnatomyPart[]
  active: number | null
  onActiveChange: (index: number | null) => void
  showAll: boolean
  onShowAllChange: (show: boolean) => void
  onClose: () => void
}) {
  return (
    <section
      aria-label={`${style.name}의 특징`}
      data-slot="app-surface"
      className="fixed inset-x-4 bottom-4 z-20 flex max-h-[60svh] flex-col gap-3 overflow-y-auto rounded-xl border border-rule bg-card p-4 shadow-xl lg:sticky lg:inset-auto lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:shadow-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-ink">{style.name}의 특징</h2>
          <p className="text-[13px] text-ink-muted">항목에 마우스를 올리면 화면에 표시됩니다.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="특징 닫기" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      <ShowAllSwitch checked={showAll} onCheckedChange={onShowAllChange} label="특징 번호 모두 표시" />
      <PartList parts={parts} active={active} onActiveChange={onActiveChange} nameStyle="text" label="특징" />
    </section>
  )
}

export function StylePage({ style, styles }: { style: DesignStyle; styles: DesignStyle[] }) {
  // Stable identity: the callout measurement re-runs whenever parts change.
  const parts = useMemo(
    () => style.traits.map((t) => ({ slot: t.slot, name: t.title, description: t.description })),
    [style],
  )
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  // Traits point at parts of the home view, so showing them brings the dashboard home.
  const [view, setView] = useState<DemoView>('home')
  const markOnHome = <T,>(set: (value: T) => void) => (value: T) => {
    if (value !== null && value !== false) setView('home')
    set(value)
  }
  const { stageRef, specimenRef, callouts } = useCallouts(parts)

  const index = styles.findIndex((s) => s.id === style.id)
  const link = (s?: DesignStyle) => (s ? { href: styleHref(s.id), name: s.name } : undefined)
  const otherNames = [style.englishName, ...style.aliases]

  const close = () => {
    setOpen(false)
    setActive(null)
    setShowAll(false)
  }

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={styleHref(null)}>스타일</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{style.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-ink">{style.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {otherNames.map((name) => (
              <Badge key={name} variant="outline" className="border-rule bg-card font-normal text-ink">
                {name}
              </Badge>
            ))}
          </div>
        </div>
        <p className="max-w-[46rem] text-ink">
          {style.description}. <span className="text-ink-muted">{style.context}</span>
        </p>
        {style.note && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <InfoIcon aria-hidden className="size-4 text-blueprint" />
            {style.note}
          </p>
        )}
      </header>

      <div className={cn(open && 'lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-4')}>
        {/* side padding leaves room for the number chips in the margin */}
        <div ref={stageRef} className="relative -mx-4 min-w-0 px-9 sm:mx-0">
          <div ref={specimenRef}>
            <DemoApp styleId={style.id} view={view} onViewChange={setView} />
          </div>
          <CalloutLayer
            callouts={callouts}
            parts={parts}
            active={active}
            isVisible={(i) => showAll || active === i}
          />
        </div>
        {open && (
          <TraitsPanel
            style={style}
            parts={parts}
            active={active}
            onActiveChange={markOnHome(setActive)}
            showAll={showAll}
            onShowAllChange={markOnHome(setShowAll)}
            onClose={close}
          />
        )}
      </div>

      <StyleSamples styleId={style.id} />

      <NeighbourLinks label="이전·다음 스타일" prev={link(styles[index - 1])} next={link(styles[index + 1])} />

      {!open && (
        <Button
          onClick={() => {
            setView('home')
            setOpen(true)
          }}
          className="fixed right-6 bottom-6 z-20 h-10 rounded-full bg-ink px-4 text-white shadow-lg hover:bg-ink/90"
        >
          <ListIcon data-icon="inline-start" />
          특징 보기
        </Button>
      )}
    </article>
  )
}
