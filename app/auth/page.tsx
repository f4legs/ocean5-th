import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { normalizeAuthRedirect } from '@/lib/auth-redirect'
import LoginForm from './login-form'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const supabase = await createClient()

  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Await searchParams as required in Next.js 15
    const params = await searchParams
    redirect(normalizeAuthRedirect(params?.redirect))
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="loading-spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
