import { describe, expect, it } from 'vitest'
import { isEmailAllowlisted, parseEmailAllowlist } from '@/lib/dev-access'

describe('dev access helpers', () => {
  it('parses and normalizes comma-separated allowlist emails', () => {
    const parsed = parseEmailAllowlist(' Dev@Example.com,qa@example.com , , ADMIN@EXAMPLE.COM ')
    expect(parsed).toEqual(['dev@example.com', 'qa@example.com', 'admin@example.com'])
  })

  it('checks allowlist membership with case-insensitive email matching', () => {
    const allowlist = 'dev@example.com, qa@example.com'
    expect(isEmailAllowlisted('DEV@example.com', allowlist)).toBe(true)
    expect(isEmailAllowlisted('user@example.com', allowlist)).toBe(false)
    expect(isEmailAllowlisted(null, allowlist)).toBe(false)
  })
})
