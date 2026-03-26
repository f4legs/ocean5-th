import { Suspense } from 'react'
import Results120Client from './results120-client'

export default function Results120Page() {
  return (
    <Suspense fallback={
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังโหลดผลลัพธ์...</p>
        </div>
      </main>
    }>
      <Results120Client />
    </Suspense>
  )
}
