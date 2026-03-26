import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  AUTH_REDIRECT_COOKIE,
  normalizeAuthRedirect,
} from '@/lib/auth-redirect'

export const dynamic = 'force-dynamic'

function resolveRedirectTarget(req: NextRequest): string {
  const queryRedirect = req.nextUrl.searchParams.get('redirect')
  const nextRedirect = req.nextUrl.searchParams.get('next')
  const cookieRedirect = req.cookies.get(AUTH_REDIRECT_COOKIE)?.value
  let decodedCookie: string | null = null
  if (cookieRedirect) {
    try {
      decodedCookie = decodeURIComponent(cookieRedirect)
    } catch {
      decodedCookie = null
    }
  }

  return normalizeAuthRedirect(queryRedirect ?? nextRedirect ?? decodedCookie)
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const targetPath = resolveRedirectTarget(req)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const response = NextResponse.redirect(new URL(targetPath, origin))
      response.cookies.set(AUTH_REDIRECT_COOKIE, '', { path: '/', maxAge: 0 })
      return response
    }
    
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // If no code, return with an error
  return NextResponse.redirect(new URL('/auth?error=missing_code', origin))
}
