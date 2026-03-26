export const DEFAULT_AUTH_REDIRECT = '/dashboard'
export const AUTH_REDIRECT_COOKIE = 'post_auth_redirect'

export function normalizeAuthRedirect(value: string | null | undefined): string {
  if (!value) return DEFAULT_AUTH_REDIRECT

  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return DEFAULT_AUTH_REDIRECT
  if (trimmed.startsWith('//')) return DEFAULT_AUTH_REDIRECT

  return trimmed
}
