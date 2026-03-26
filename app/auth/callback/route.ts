import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  AUTH_REDIRECT_COOKIE,
  normalizeAuthRedirect,
} from '@/lib/auth-redirect'

export const dynamic = 'force-dynamic'

type RedirectSource = 'query_redirect' | 'query_next' | 'cookie' | 'default'

function logAuthCallbackDebug(payload: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return
  console.info('[auth/callback]', payload)
}

function resolveRedirectTarget(req: NextRequest): { targetPath: string; source: RedirectSource } {
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

  if (queryRedirect) {
    return { targetPath: normalizeAuthRedirect(queryRedirect), source: 'query_redirect' }
  }
  if (nextRedirect) {
    return { targetPath: normalizeAuthRedirect(nextRedirect), source: 'query_next' }
  }
  if (decodedCookie) {
    return { targetPath: normalizeAuthRedirect(decodedCookie), source: 'cookie' }
  }
  return { targetPath: normalizeAuthRedirect(null), source: 'default' }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const { targetPath, source } = resolveRedirectTarget(req)

  logAuthCallbackDebug({
    hasCode: Boolean(code),
    source,
    targetPath,
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      logAuthCallbackDebug({ status: 'session_exchanged', redirectTo: targetPath })
      const response = NextResponse.redirect(new URL(targetPath, origin))
      response.cookies.set(AUTH_REDIRECT_COOKIE, '', { path: '/', maxAge: 0 })
      return response
    }
    
    logAuthCallbackDebug({ status: 'exchange_failed', message: error.message })
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  logAuthCallbackDebug({ status: 'missing_code' })
  // If no code, return with an error
  return NextResponse.redirect(new URL('/auth?error=missing_code', origin))
}
