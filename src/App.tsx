import { AppSidebar, MobileNav } from '@/showcase/app-sidebar'
import { ComponentPage } from '@/showcase/component-page'
import { OverviewPage } from '@/showcase/overview-page'
import { entries } from '@/showcase/registry'
import { hrefFor, useRoute } from '@/showcase/route'

function NotFound({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-20">
      <p className="text-xl font-semibold text-ink">'{id}' 컴포넌트를 찾을 수 없습니다.</p>
      <p className="text-ink-muted">주소가 바뀌었을 수 있습니다. 목록에서 다시 골라 주세요.</p>
      <a href={hrefFor(null)} className="font-medium text-blueprint underline underline-offset-4">
        개요로 돌아가기
      </a>
    </div>
  )
}

function App() {
  const route = useRoute()
  const entry = route.page === 'component' ? entries.find((e) => e.id === route.id) : undefined
  const currentId = route.page === 'component' ? route.id : null

  return (
    <div className="flex min-h-svh">
      <AppSidebar entries={entries} currentId={currentId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav entries={entries} currentId={currentId} />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
          {route.page === 'overview' && <OverviewPage entries={entries} />}
          {route.page === 'component' &&
            (entry ? (
              <ComponentPage key={entry.id} entry={entry} entries={entries} />
            ) : (
              <NotFound id={route.id} />
            ))}
        </main>
      </div>
    </div>
  )
}

export default App
