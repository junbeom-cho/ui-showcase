import { useMemo } from 'react'
import { InfoIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Anatomy } from '@/showcase/anatomy'
import { NeighbourLinks } from '@/showcase/neighbour-links'
import { hrefFor, styleHref } from '@/showcase/route'
import { DemoApp } from './demo-app'
import type { DesignStyle } from './types'

export function StylePage({ style, styles }: { style: DesignStyle; styles: DesignStyle[] }) {
  // Stable identities: Anatomy re-measures whenever Specimen or parts change.
  const Specimen = useMemo(
    () =>
      function StyleDemo() {
        return <DemoApp styleId={style.id} />
      },
    [style.id],
  )
  const parts = useMemo(
    () => style.traits.map((t) => ({ slot: t.slot, name: t.title, description: t.description })),
    [style],
  )

  const index = styles.findIndex((s) => s.id === style.id)
  const link = (s?: DesignStyle) => (s ? { href: styleHref(s.id), name: s.name } : undefined)
  const otherNames = [style.englishName, ...style.aliases]

  return (
    <article className="flex flex-col gap-14">
      <header className="flex flex-col gap-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={hrefFor(null)}>개요</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={styleHref(null)}>디자인 스타일</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{style.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-5xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl">{style.name}</h1>
        <p className="max-w-[38rem] text-lg leading-relaxed text-ink">{style.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-ink-muted">다른 이름</span>
          {otherNames.map((name) => (
            <Badge key={name} variant="outline" className="border-rule bg-white font-normal text-ink">
              {name}
            </Badge>
          ))}
        </div>
        <p className="max-w-[38rem] text-ink-muted">{style.context}</p>
        {style.note && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <InfoIcon aria-hidden className="size-4 text-blueprint" />
            {style.note}
          </p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">생김새와 특징</h2>
          <p className="text-ink-muted">특징에 마우스를 올리면 데모에서 해당 부분이 표시됩니다.</p>
        </div>
        <Anatomy
          Specimen={Specimen}
          parts={parts}
          markers="on-focus"
          nameStyle="text"
          labels={{ toggle: '특징 번호 모두 표시', list: '특징' }}
        />
      </section>

      <NeighbourLinks label="이전·다음 스타일" prev={link(styles[index - 1])} next={link(styles[index + 1])} />
    </article>
  )
}
