type RateLimitEntry = {
  count: number
  resetAt: number
}

type FixedWindowRateLimiterOptions = {
  limit: number
  windowMs: number
  cleanupInterval?: number
  maxEntries?: number
}

export type RateLimitResult = {
  limited: boolean
  remaining: number
  resetAt: number
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (!forwardedFor) return 'unknown'

  const firstIp = forwardedFor.split(',')[0]?.trim()
  return firstIp || 'unknown'
}

export function createFixedWindowRateLimiter(options: FixedWindowRateLimiterOptions) {
  const { limit, windowMs } = options
  const cleanupInterval = options.cleanupInterval ?? 100
  const maxEntries = options.maxEntries ?? 5000

  const entries = new Map<string, RateLimitEntry>()
  let checksSinceCleanup = 0

  function cleanupExpired(now: number) {
    checksSinceCleanup += 1
    if (checksSinceCleanup < cleanupInterval && entries.size <= maxEntries) return

    checksSinceCleanup = 0

    for (const [key, entry] of entries) {
      if (now > entry.resetAt) entries.delete(key)
    }

    if (entries.size > maxEntries) {
      const overflow = entries.size - maxEntries
      let removed = 0
      for (const [key] of entries) {
        entries.delete(key)
        removed += 1
        if (removed >= overflow) break
      }
    }
  }

  return (key: string): RateLimitResult => {
    const now = Date.now()
    cleanupExpired(now)

    const existing = entries.get(key)
    if (!existing || now > existing.resetAt) {
      const resetAt = now + windowMs
      entries.set(key, { count: 1, resetAt })
      return { limited: false, remaining: Math.max(limit - 1, 0), resetAt }
    }

    if (existing.count >= limit) {
      return { limited: true, remaining: 0, resetAt: existing.resetAt }
    }

    existing.count += 1
    return {
      limited: false,
      remaining: Math.max(limit - existing.count, 0),
      resetAt: existing.resetAt,
    }
  }
}
