import { Suspense } from 'react'
import Results300Client from './results300-client'

export default function Results300Page() {
  return (
    <Suspense fallback={
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังโหลดผลลัพธ์...</p>
        </div>
      </main>
    }>
      <Results300Client />
    </Suspense>
  )
}
