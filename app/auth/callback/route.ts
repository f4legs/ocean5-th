import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', req.url))
  }

  // Use a temporary browser-style client with cookie-based session exchange
  // We call exchangeCodeForSession via the anon client to set the session cookie
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, detectSessionInUrl: false } }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(redirect, req.url))
}
