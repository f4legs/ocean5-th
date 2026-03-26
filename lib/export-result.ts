/**
 * Client-side export utilities for 120/300 OCEAN test results.
 * JSON export is round-trip compatible with /api/profiles/upload.
 */

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

export interface ExportProfile {
  age?: string | null
  sex?: string | null
  occupation?: string | null
  goal?: string | null
}

export interface ExportScores {
  raw: Record<Factor, number>
  pct: Record<Factor, number>
  facets?: Record<string, { raw: number; pct: number }>
}

export interface ExportData {
  testId: string
  testType: '120' | '300'
  completedAt: string
  label: string
  profile: ExportProfile | null
  scores: ExportScores
}

/** Downloads a JSON file. Format matches /api/profiles/upload for round-trip import. */
export function exportAsJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 20)
  a.download = `ocean-result-${data.testType}-${safe(data.label)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Requests a server-side PDF from /api/result-deep-pdf and triggers download. */
export async function exportAsPDF(
  data: ExportData,
  report: string,
): Promise<void> {
  const res = await fetch('/api/result-deep-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, report }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 20)
  a.download = `ocean-result-${data.testType}-${safe(data.label)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
