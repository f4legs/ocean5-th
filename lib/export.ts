// Export utilities for the 50-item results page.
// Handles JSON and PDF export, native share, and report caching.

import type { ScoreResult } from '@/lib/scoring'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportData {
  version: string
  testId: string
  sessionId: string
  startedAt: string
  completedAt: string
  profile: ExportProfile
  scores: {
    raw: Record<string, number>
    pct: Record<string, number>
    maxPerDimension: number
    minPerDimension: number
  }
  answers: Record<string, number>
  metadata: {
    itemSource: string
    adaptation: string
    copyrightNotice: string
    scale: string
    totalItems: number
    durationSeconds: number | null
    pageDurations: Record<string, number>
    responseTimes: Record<string, number>
    replacedItems: string[]
  }
}

export interface ProfileData {
  age?: string | null
  sex?: string | null
  occupation?: string | null
  goal?: string | null
}

export interface ExportProfile {
  age: string | null
  sex: string | null
  occupation: string | null
  goal: string | null
}

export interface SessionData {
  sessionId: string
  startedAt: string
  quizCompletedAt?: string
}

export interface CachedReport {
  sessionId: string
  signature: string
  report: string
  generatedAt: string
}

// ─── Report Cache ─────────────────────────────────────────────────────────────

export function buildReportSignature(scoresPct: ScoreResult['pct'], profileData: ProfileData): string {
  return JSON.stringify({
    scores: {
      O: scoresPct.O,
      C: scoresPct.C,
      E: scoresPct.E,
      A: scoresPct.A,
      N: scoresPct.N,
    },
    profile: {
      age: profileData.age ?? null,
      sex: profileData.sex ?? null,
      occupation: profileData.occupation ?? null,
      goal: profileData.goal ?? null,
    },
  })
}

export function readCachedReport(raw: string | null, sessionId: string, signature: string): string | null {
  if (!raw) return null
  try {
    const cached = JSON.parse(raw) as Partial<CachedReport>
    if (
      cached.sessionId === sessionId &&
      cached.signature === signature &&
      typeof cached.report === 'string' &&
      cached.report.trim()
    ) {
      return cached.report
    }
  } catch {
    /* ignore corrupt cache and regenerate */
  }
  return null
}

// ─── Profile Helpers ──────────────────────────────────────────────────────────

export function normalizeProfile(profileData: ProfileData): ExportProfile {
  return {
    age: profileData.age ?? null,
    sex: profileData.sex ?? null,
    occupation: profileData.occupation ?? null,
    goal: profileData.goal ?? null,
  }
}

// ─── Export Builders ──────────────────────────────────────────────────────────

export function buildExport(
  scores: ScoreResult,
  profile: ProfileData,
  answers: Record<number, number>,
  session: SessionData,
  pageDurations: Record<number, number>,
  responseTimes: Record<number, number>,
): ExportData {
  const completedAt = new Date().toISOString()
  const startMs = new Date(session.startedAt).getTime()
  const endMs = new Date(completedAt).getTime()
  const durationSeconds = Math.round((endMs - startMs) / 1000)

  const answersStr: Record<string, number> = {}
  for (const [k, v] of Object.entries(answers)) answersStr[String(k)] = v

  const pageDurStr: Record<string, number> = {}
  for (const [k, v] of Object.entries(pageDurations)) pageDurStr[String(k)] = v

  const rtStr: Record<string, number> = {}
  for (const [k, v] of Object.entries(responseTimes)) rtStr[String(k)] = v

  return {
    version: '1.0',
    testId: 'ipip-neo-50-th',
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    completedAt,
    profile: normalizeProfile(profile),
    scores: {
      raw: { ...scores.raw },
      pct: { ...scores.pct },
      maxPerDimension: 50,
      minPerDimension: 10,
    },
    answers: answersStr,
    metadata: {
      itemSource: 'Adapted from IPIP NEO Domains Thai translation by Panida Yomaboot & Andrew J. Cooper — https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm',
      adaptation: 'This implementation includes two locally replaced items for contextual suitability and is not an official IPIP or Oregon Research Institute deployment.',
      copyrightNotice: 'IPIP items and scales are public-domain according to ipip.ori.org. App code, interface, explanatory copy, and report structure © 2026 fars-ai / FARS-AI Cognitive Science Team.',
      scale: '1=ไม่ตรงกับฉันเลย, 2=ไม่ค่อยตรงกับฉัน, 3=เป็นกลาง, 4=ค่อนข้างตรงกับฉัน, 5=ตรงกับฉันมาก',
      totalItems: 50,
      durationSeconds,
      pageDurations: pageDurStr,
      responseTimes: rtStr,
      replacedItems: [
        'item16: "Tend to vote for liberal political candidates" → "Spend time reflecting deeply on things" (O+)',
        'item48: "Tend to vote for conservative political candidates" → "Prefer following traditions and familiar things" (O-)',
      ],
    },
  }
}

export function buildJsonFile(data: ExportData): File {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  return new File([blob], `ocean-result-${data.sessionId.slice(0, 8)}.json`, {
    type: 'application/json',
  })
}

export async function buildPdfFile(data: ExportData, report: string): Promise<File> {
  const response = await fetch('/api/report-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, report }),
  })

  if (!response.ok) {
    try {
      const errorBody = await response.json() as { error?: string }
      throw new Error(errorBody.error || 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
    }
  }

  const blob = await response.blob()
  return new File([blob], `ocean-result-${data.sessionId.slice(0, 8)}.pdf`, {
    type: 'application/pdf',
  })
}

// ─── Share / Download ─────────────────────────────────────────────────────────

export function isProbablyIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}

export function shouldUseNativeShare(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  const ua = nav.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  const isAndroid = /Android/i.test(ua)
  return isIos || isAndroid || nav.userAgentData?.mobile === true
}

export function downloadBlob(fileName: string, blob: Blob, preferPreview = false) {
  const url = URL.createObjectURL(blob)
  if (preferPreview) {
    const preview = window.open(url, '_blank', 'noopener,noreferrer')
    if (preview) {
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return
    }
  }
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function shareOrDownloadFile(file: File): Promise<void> {
  if (
    shouldUseNativeShare() &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: file.name,
      text: 'ผลลัพธ์การประเมินบุคลิกภาพ OCEAN',
    })
    return
  }
  downloadBlob(file.name, file, isProbablyIos())
}
