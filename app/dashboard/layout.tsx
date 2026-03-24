'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth?redirect=/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  if (checking) {
    return (
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[50vh]">
          <p className="body-soft">กำลังโหลด...</p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
