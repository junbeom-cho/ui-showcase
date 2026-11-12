import { styleHref } from '@/showcase/route'
import { DemoApp } from './demo-app'
import type { DesignStyle } from './types'

/** A drawing sheet per style: the demo shrunk to a thumbnail, title block below. */
function StyleCard({ style }: { style: DesignStyle }) {
  return (
    <article data-slot="app-surface" className="group relative flex flex-col overflow-hidden rounded-md border border-rule bg-card hover:border-blueprint has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blueprint/40">
      {/* the dashboard is laid out at desktop width, then shrunk to fit the card */}
      <div inert className="bg-graph flex h-[11.5rem] justify-center overflow-hidden pt-3">
        <div className="w-[1000px] shrink-0 origin-top scale-[0.3]">
          <DemoApp styleId={style.id} />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 border-t border-rule px-4 py-3">
        <h2 className="font-semibold text-ink">
          <a href={styleHref(style.id)} className="outline-none after:absolute after:inset-0">
            {style.name}
          </a>
        </h2>
        <p className="text-[13px] text-ink-muted">{style.englishName}</p>
      </div>
    </article>
  )
}

export function StylesIndexPage({ styles }: { styles: DesignStyle[] }) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-[2.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-ink sm:text-[3.5rem]">
          디자인 스타일
        </h1>
        <p className="max-w-[34rem] text-lg leading-relaxed text-ink-muted">
          같은 앱 화면을 {styles.length}가지 스타일로 그렸습니다. 하나를 골라 특징을 확인하세요.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {styles.map((style) => (
          <StyleCard key={style.id} style={style} />
        ))}
      </div>
    </div>
  )
}
