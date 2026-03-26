// Shared report streaming logic for results, results120, and results300 pages.
// Handles fetch, streaming read, markdown normalization, and fake-progress timer.

import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

export interface StreamReportOptions {
  url: string
  body: Record<string, unknown>
  headers?: Record<string, string>
  activeRequestId: MutableRefObject<number>
  setReport: Dispatch<SetStateAction<string>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
  setFakeProgress: Dispatch<SetStateAction<number>>
  setLoadingSeconds: Dispatch<SetStateAction<number>>
  onSuccess?: (normalizedReport: string) => void
}

// Normalizes streamed markdown: removes code-fence wrappers, fixes heading spacing
export function normalizeMarkdown(text: string): string {
  return text
    .trim()
    .replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim()
    .replace(/^(#{1,6})([^\s#\n])/gm, '$1 $2')
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
}

// Starts a streaming report fetch. Uses requestId for cancellation safety.
// Returns a cleanup function (call to cancel).
export function startStreamReport(opts: StreamReportOptions): () => void {
  const {
    url, body, headers = {}, activeRequestId,
    setReport, setLoading, setError, setFakeProgress, setLoadingSeconds,
    onSuccess,
  } = opts

  const requestId = activeRequestId.current + 1
  activeRequestId.current = requestId

  setFakeProgress(7)
  setLoadingSeconds(0)
  setLoading(true)
  setError(null)

  // Fake progress timer — identical step logic across all results pages
  const startedAt = Date.now()
  const interval = window.setInterval(() => {
    setLoadingSeconds(Math.floor((Date.now() - startedAt) / 1000))
    setFakeProgress(prev => {
      if (prev >= 93) return prev
      if (prev < 24) return Math.min(93, prev + 6)
      if (prev < 48) return Math.min(93, prev + 4)
      if (prev < 72) return Math.min(93, prev + 3)
      if (prev < 86) return Math.min(93, prev + 2)
      return Math.min(93, prev + 1)
    })
  }, 1800)

  async function run() {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error || 'ไม่สามารถสร้างรายงานได้ในขณะนี้')
      }

      if (!res.body) throw new Error('ไม่สามารถสร้างรายงานได้ในขณะนี้')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (requestId !== activeRequestId.current) { void reader.cancel(); return }
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setReport(accumulated)
        setLoading(false)
      }

      if (requestId !== activeRequestId.current) return

      const normalized = normalizeMarkdown(accumulated)
      setReport(normalized)

      if (!normalized) {
        setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
        return
      }

      onSuccess?.(normalized)

    } catch (err) {
      if (requestId !== activeRequestId.current) return
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false)
        window.clearInterval(interval)
      }
    }
  }

  void run()

  return () => {
    window.clearInterval(interval)
  }
}
