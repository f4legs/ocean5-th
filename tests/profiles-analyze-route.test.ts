import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetBearerToken,
  mockCreateAuthenticatedSupabaseClient,
  mockGetAuthenticatedUser,
  mockCheckRateLimit,
  mockGetClientIp,
  mockMaybeSingle,
  mockUpdateEqFinal,
  mockGenerateContentStream,
} = vi.hoisted(() => ({
  mockGetBearerToken: vi.fn(),
  mockCreateAuthenticatedSupabaseClient: vi.fn(),
  mockGetAuthenticatedUser: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockUpdateEqFinal: vi.fn(),
  mockGenerateContentStream: vi.fn(),
}))

vi.mock('@/utils/api/auth', () => ({
  getBearerToken: mockGetBearerToken,
  createAuthenticatedSupabaseClient: mockCreateAuthenticatedSupabaseClient,
  getAuthenticatedUser: mockGetAuthenticatedUser,
}))

vi.mock('@/utils/api/rate-limit', () => ({
  createFixedWindowRateLimiter: vi.fn(() => mockCheckRateLimit),
  getClientIp: mockGetClientIp,
}))

vi.mock('@google/genai', () => ({
  ThinkingLevel: { MEDIUM: 'MEDIUM' },
  GoogleGenAI: class {
    models = {
      generateContentStream: mockGenerateContentStream,
    }
  },
}))

function createUserClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: mockUpdateEqFinal,
        })),
      })),
    })),
  }
}

function toStream(chunks: string[]) {
  return (async function* () {
    for (const chunk of chunks) {
      yield { text: chunk }
    }
  })()
}

describe('POST /api/profiles/analyze', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.GEMINI_API_KEY = 'test-key'

    mockGetClientIp.mockReturnValue('1.1.1.1')
    mockCheckRateLimit.mockReturnValue({ limited: false })
    mockGetBearerToken.mockReturnValue('token')
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1' })
    mockCreateAuthenticatedSupabaseClient.mockReturnValue(createUserClient())
    mockUpdateEqFinal.mockResolvedValue({ error: null })
    mockGenerateContentStream.mockResolvedValue(toStream(['chunk-1', 'chunk-2']))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it('returns 401 when bearer token is missing', async () => {
    mockGetBearerToken.mockReturnValueOnce(null)
    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'id-1' }),
    }) as never)

    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ limited: true })
    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'id-1' }),
    }) as never)

    expect(res.status).toBe(429)
  })

  it('returns 400 for malformed request body', async () => {
    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: '{bad-json',
    }) as never)

    expect(res.status).toBe(400)
  })

  it('returns 404 when profile is not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'missing' }),
    }) as never)

    expect(res.status).toBe(404)
  })

  it('streams and saves analysis for a 50-item profile', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'prof-50',
        owner_id: 'user-1',
        label: 'โปรไฟล์ 50',
        source: 'upload',
        test_type: '50',
        scores: { pct: { O: 10, C: 20, E: 30, A: 40, N: 50 } },
        profile: null,
        ai_report: null,
      },
      error: null,
    })

    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'prof-50' }),
    }) as never)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('chunk-1chunk-2')
    await Promise.resolve()
    expect(mockUpdateEqFinal).toHaveBeenCalled()
  })

  it('streams and saves analysis for a 120-item profile', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'prof-120',
        owner_id: 'user-1',
        label: 'โปรไฟล์ 120',
        source: 'shared',
        test_type: '120',
        scores: {
          pct: { O: 60, C: 70, E: 55, A: 48, N: 35 },
          facets: { O1: { pct: 66 }, C1: { pct: 72 } },
        },
        profile: { occupation: 'นักพัฒนา' },
        ai_report: null,
      },
      error: null,
    })

    const { POST } = await import('@/app/api/profiles/analyze/route')
    const res = await POST(new Request('http://localhost/api/profiles/analyze', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'prof-120' }),
    }) as never)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('chunk-1')
    await Promise.resolve()
    expect(mockUpdateEqFinal).toHaveBeenCalled()
  })
})
