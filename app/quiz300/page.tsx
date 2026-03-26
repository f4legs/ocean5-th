import { Suspense } from 'react'
import Quiz300Client from './quiz300-client'

export default function Quiz300Page() {
  return (
    <Suspense fallback={
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังโหลด...</p>
        </div>
      </main>
    }>
      <Quiz300Client />
    </Suspense>
  )
}
