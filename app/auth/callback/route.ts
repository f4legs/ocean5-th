import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin))
    }
    
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // If no code, return with an error
  return NextResponse.redirect(new URL('/auth?error=missing_code', origin))
}
