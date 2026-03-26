import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeMarkdown, startStreamReport } from '@/lib/stream-report'

function createMockReader(chunks: string[], gate?: Promise<void>) {
  const encoder = new TextEncoder()
  let index = 0
  let firstRead = true

  return {
    read: vi.fn(async () => {
      if (firstRead && gate) {
        firstRead = false
        await gate
      }

      if (index < chunks.length) {
        const value = encoder.encode(chunks[index])
        index += 1
        return { done: false, value }
      }

      return { done: true, value: undefined }
    }),
    cancel: vi.fn(async () => {}),
  }
}

describe('stream report helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('normalizes markdown from streamed responses', () => {
    const raw = '```markdown\n#หัวข้อ\nบรรทัด\n##ย่อย\n```'
    expect(normalizeMarkdown(raw)).toBe('# หัวข้อ\nบรรทัด\n\n## ย่อย')
  })

  it('clears stale progress intervals when a request is superseded', async () => {
    vi.useFakeTimers()

    let releaseFirstRead!: () => void
    const firstGate = new Promise<void>(resolve => {
      releaseFirstRead = resolve
    })

    const firstReader = createMockReader(['old'], firstGate)
    const secondReader = createMockReader(['new'])

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => firstReader },
      })
      .mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => secondReader },
      })

    vi.stubGlobal('fetch', fetchMock)

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const activeRequestId = { current: 0 }

    const setReport = vi.fn()
    const setLoading = vi.fn()
    const setError = vi.fn()
    const setFakeProgress = vi.fn()
    const setLoadingSeconds = vi.fn()

    startStreamReport({
      url: '/api/interpret-deep',
      body: { run: 'first' },
      activeRequestId,
      setReport: setReport as never,
      setLoading: setLoading as never,
      setError: setError as never,
      setFakeProgress: setFakeProgress as never,
      setLoadingSeconds: setLoadingSeconds as never,
    })

    startStreamReport({
      url: '/api/interpret-deep',
      body: { run: 'second' },
      activeRequestId,
      setReport: setReport as never,
      setLoading: setLoading as never,
      setError: setError as never,
      setFakeProgress: setFakeProgress as never,
      setLoadingSeconds: setLoadingSeconds as never,
    })

    releaseFirstRead()

    await vi.waitFor(() => {
      expect(firstReader.cancel).toHaveBeenCalledTimes(1)
      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })
})
