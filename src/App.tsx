import { designStyles } from '@/design-styles/registry'
import { StylePage } from '@/design-styles/style-page'
import { StylesIndexPage } from '@/design-styles/styles-index-page'
import { AppSidebar, MobileNav } from '@/showcase/app-sidebar'
import { ComponentPage } from '@/showcase/component-page'
import { OverviewPage } from '@/showcase/overview-page'
import { entries } from '@/showcase/registry'
import { hrefFor, styleHref, useRoute } from '@/showcase/route'

function NotFound({ message, href, back }: { message: string; href: string; back: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-20">
      <p className="text-xl font-semibold text-ink">{message}</p>
      <p className="text-ink-muted">주소가 바뀌었을 수 있습니다. 목록에서 다시 골라 주세요.</p>
      <a href={href} className="font-medium text-blueprint underline underline-offset-4">
        {back}
      </a>
    </div>
  )
}

function usePage() {
  const route = useRoute()

  switch (route.page) {
    case 'overview':
      return { route, content: <OverviewPage entries={entries} /> }
    case 'component': {
      const entry = entries.find((e) => e.id === route.id)
      return {
        route,
        content: entry ? (
          <ComponentPage key={entry.id} entry={entry} entries={entries} />
        ) : (
          <NotFound message={`'${route.id}' 컴포넌트를 찾을 수 없습니다.`} href={hrefFor(null)} back="개요로 돌아가기" />
        ),
      }
    }
    case 'styles':
      return { route, content: <StylesIndexPage styles={designStyles} /> }
    case 'style': {
      const style = designStyles.find((s) => s.id === route.id)
      return {
        route,
        content: style ? (
          <StylePage key={style.id} style={style} styles={designStyles} />
        ) : (
          <NotFound
            message={`'${route.id}' 스타일을 찾을 수 없습니다.`}
            href={styleHref(null)}
            back="디자인 스타일로 돌아가기"
          />
        ),
      }
    }
  }
}

function App() {
  const { route, content } = usePage()

  return (
    <div className="flex min-h-svh">
      <AppSidebar entries={entries} styles={designStyles} route={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav entries={entries} styles={designStyles} route={route} />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 lg:px-12 lg:py-14">{content}</main>
      </div>
    </div>
  )
}

export default App
