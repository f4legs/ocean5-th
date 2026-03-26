import { Suspense } from 'react'
import Quiz120Client from './quiz120-client'

export default function Quiz120Page() {
  return (
    <Suspense fallback={
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังโหลด...</p>
        </div>
      </main>
    }>
      <Quiz120Client />
    </Suspense>
  )
}
