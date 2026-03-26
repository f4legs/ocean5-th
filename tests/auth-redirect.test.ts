import { describe, expect, it } from 'vitest'
import { DEFAULT_AUTH_REDIRECT, normalizeAuthRedirect } from '@/lib/auth-redirect'

describe('normalizeAuthRedirect', () => {
  it('uses default for empty and invalid values', () => {
    expect(normalizeAuthRedirect(null)).toBe(DEFAULT_AUTH_REDIRECT)
    expect(normalizeAuthRedirect(undefined)).toBe(DEFAULT_AUTH_REDIRECT)
    expect(normalizeAuthRedirect('')).toBe(DEFAULT_AUTH_REDIRECT)
    expect(normalizeAuthRedirect('https://evil.com')).toBe(DEFAULT_AUTH_REDIRECT)
    expect(normalizeAuthRedirect('//evil.com')).toBe(DEFAULT_AUTH_REDIRECT)
    expect(normalizeAuthRedirect('dashboard')).toBe(DEFAULT_AUTH_REDIRECT)
  })

  it('allows internal paths', () => {
    expect(normalizeAuthRedirect('/dashboard')).toBe('/dashboard')
    expect(normalizeAuthRedirect('/checkout?step=pay')).toBe('/checkout?step=pay')
    expect(normalizeAuthRedirect('/share/abc123')).toBe('/share/abc123')
  })
})
