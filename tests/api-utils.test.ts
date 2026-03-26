import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFixedWindowRateLimiter, getClientIp } from '@/utils/api/rate-limit'
import { getBearerToken } from '@/utils/api/auth'

describe('api auth helpers', () => {
  it('extracts bearer token only for valid Authorization header', () => {
    const validRequest = new Request('https://example.com', {
      headers: { authorization: 'Bearer abc123' },
    })
    const invalidRequest = new Request('https://example.com', {
      headers: { authorization: 'Token abc123' },
    })

    expect(getBearerToken(validRequest)).toBe('abc123')
    expect(getBearerToken(invalidRequest)).toBeNull()
    expect(getBearerToken(new Request('https://example.com'))).toBeNull()
  })
})

describe('api rate limit helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('limits requests after threshold and resets after window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const checkLimit = createFixedWindowRateLimiter({
      limit: 2,
      windowMs: 1000,
      cleanupInterval: 1,
      maxEntries: 50,
    })

    expect(checkLimit('ip-1').limited).toBe(false)
    expect(checkLimit('ip-1').limited).toBe(false)
    expect(checkLimit('ip-1').limited).toBe(true)

    vi.advanceTimersByTime(1001)
    expect(checkLimit('ip-1').limited).toBe(false)
  })

  it('resolves client ip with x-real-ip priority', () => {
    const reqWithBoth = new Request('https://example.com', {
      headers: {
        'x-real-ip': '10.0.0.1',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      },
    })
    const reqForwarded = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
    })

    expect(getClientIp(reqWithBoth)).toBe('10.0.0.1')
    expect(getClientIp(reqForwarded)).toBe('1.1.1.1')
    expect(getClientIp(new Request('https://example.com'))).toBe('unknown')
  })
})
