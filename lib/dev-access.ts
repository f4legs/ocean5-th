function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function parseEmailAllowlist(raw: string | undefined | null): string[] {
  if (!raw) return []

  return raw
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean)
}

export function isEmailAllowlisted(
  email: string | null | undefined,
  rawAllowlist: string | undefined | null,
): boolean {
  if (!email) return false
  const normalizedEmail = normalizeEmail(email)
  const allowlist = parseEmailAllowlist(rawAllowlist)
  return allowlist.includes(normalizedEmail)
}

export function isServerDevEmail(email: string | null | undefined): boolean {
  return isEmailAllowlisted(email, process.env.DEV_EMAIL_ALLOWLIST)
}

export function isPublicDevEmail(email: string | null | undefined): boolean {
  return isEmailAllowlisted(email, process.env.NEXT_PUBLIC_DEV_EMAIL_ALLOWLIST)
}
