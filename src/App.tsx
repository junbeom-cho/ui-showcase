import { Gallery } from '@/showcase/gallery'
import { entries } from '@/showcase/registry'

function App() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">UI 컴포넌트 쇼케이스</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        이름만 들어서는 헷갈리는 UI 컴포넌트를 실제 모양과 함께 확인하세요.
      </p>
      <Gallery entries={entries} />
    </main>
  )
}

export default App
