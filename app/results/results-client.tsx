'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { calcScores, DIMENSION_INFO, ScoreResult } from '@/lib/scoring'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItemAsync, removeItem, setItem } from '@/lib/storage'
import ReferenceNote from '@/components/reference-note'
import { FACTOR_ORDER, DOMAIN_COLORS as DIMENSION_STYLES, pctToLabel, formatDuration } from '@/lib/ocean-constants'
import { normalizeMarkdown } from '@/lib/markdown'
import {
  buildExport, buildJsonFile, buildPdfFile, shareOrDownloadFile,
  buildReportSignature, readCachedReport,
  type ProfileData, type SessionData, type CachedReport,
} from '@/lib/export'


export default function ResultsClient() {
  const router = useRouter()
  const [scores, setScores] = useState<ScoreResult | null>(null)
  const [profile, setProfile] = useState<ProfileData>({})
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [session, setSession] = useState<SessionData | null>(null)
  const [pageDurations, setPageDurations] = useState<Record<number, number>>({})
  const [responseTimes, setResponseTimes] = useState<Record<number, number>>({})
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fakeProgress, setFakeProgress] = useState(7)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showRestartWarning, setShowRestartWarning] = useState(false)
  const activeRequestId = useRef(0)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteOwner, setInviteOwner] = useState<string | null>(null)
  const [inviteShareStatus, setInviteShareStatus] = useState<'idle' | 'sharing' | 'done' | 'declined'>('idle')

  const fetchReport = useCallback((
    scoresPct: ScoreResult['pct'],
    profileData: ProfileData,
    cacheContext?: { sessionId: string; signature: string },
  ) => {
    const requestId = activeRequestId.current + 1
    activeRequestId.current = requestId
    setFakeProgress(7)
    setLoadingSeconds(0)
    setLoading(true)
    setError(null)

    async function streamReport() {
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: scoresPct, profile: profileData }),
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
        }

        if (requestId !== activeRequestId.current) return

        const normalized = normalizeMarkdown(accumulated)

        setReport(normalized)

        if (!normalized) {
          setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
          return
        }

        if (cacheContext) {
          setItem(
            STORAGE_KEYS.AI_REPORT,
            JSON.stringify({
              sessionId: cacheContext.sessionId,
              signature: cacheContext.signature,
              report: normalized,
              generatedAt: new Date().toISOString(),
            } satisfies CachedReport)
          )
        }

      } catch (err) {
        if (requestId !== activeRequestId.current) return
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ')
      } finally {
        if (requestId === activeRequestId.current) setLoading(false)
      }
    }

    void streamReport()
  }, [])

  useEffect(() => {
    if (!loading) return

    const startedAt = Date.now()

    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      setLoadingSeconds(elapsedSeconds)
      setFakeProgress(prev => {
        if (prev >= 93) return prev
        if (prev < 24) return Math.min(93, prev + 6)
        if (prev < 48) return Math.min(93, prev + 4)
        if (prev < 72) return Math.min(93, prev + 3)
        if (prev < 86) return Math.min(93, prev + 2)
        return Math.min(93, prev + 1)
      })
    }, 1800)

    return () => window.clearInterval(interval)
  }, [loading])

  useEffect(() => {
    let cancelled = false

    async function restoreResults() {
      try {
        const [
          rawAnswers,
          rawProfile,
          rawSession,
          rawPageDur,
          rawRT,
          rawCachedReport,
        ] = await Promise.all([
          getItemAsync(STORAGE_KEYS.ANSWERS),
          getItemAsync(STORAGE_KEYS.PROFILE),
          getItemAsync(STORAGE_KEYS.SESSION),
          getItemAsync(STORAGE_KEYS.PAGE_DURATIONS),
          getItemAsync(STORAGE_KEYS.RESPONSE_TIMES),
          getItemAsync(STORAGE_KEYS.AI_REPORT),
        ])

        if (!rawAnswers) {
          router.push('/')
          return
        }

        const parsedAnswers = JSON.parse(rawAnswers) as Record<number, number>
        const profileData = (rawProfile ? JSON.parse(rawProfile) : {}) as ProfileData
        const sessionData = rawSession
          ? (JSON.parse(rawSession) as SessionData)
          : { sessionId: crypto.randomUUID(), startedAt: new Date().toISOString() }
        const pageDurData = rawPageDur ? JSON.parse(rawPageDur) : {}
        const rtData = rawRT ? JSON.parse(rawRT) : {}

        const result = calcScores(parsedAnswers)
        const reportSignature = buildReportSignature(result.pct, profileData)
        const cachedReport = readCachedReport(rawCachedReport, sessionData.sessionId, reportSignature)
        const normalizedCachedReport = normalizeMarkdown(cachedReport ?? '')

        if (cancelled) return

        setScores(result)
        setProfile(profileData)
        setAnswers(parsedAnswers)
        setSession(sessionData)
        setPageDurations(pageDurData)
        setResponseTimes(rtData)
        setReport(normalizedCachedReport)
        setLoading(!normalizedCachedReport)
        setError(null)

        const storedCode = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        const storedOwner = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        if (storedCode) {
          setInviteCode(storedCode)
          setInviteOwner(storedOwner)
        }

        if (!normalizedCachedReport) {
          queueMicrotask(() => {
            fetchReport(result.pct, profileData, {
              sessionId: sessionData.sessionId,
              signature: reportSignature,
            })
          })
        }
      } catch {
        if (!cancelled) {
          router.push('/')
        }
      }
    }

    void restoreResults()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; router and fetchReport are stable refs
  }, [])

  function handleRestart() {
    removeItem(STORAGE_KEYS.ANSWERS)
    removeItem(STORAGE_KEYS.PROFILE)
    removeItem(STORAGE_KEYS.QUIZ_PAGE)
    removeItem(STORAGE_KEYS.SESSION)
    removeItem(STORAGE_KEYS.RESPONSE_TIMES)
    removeItem(STORAGE_KEYS.PAGE_DURATIONS)
    removeItem(STORAGE_KEYS.ANSWERS_DRAFT)
    removeItem(STORAGE_KEYS.AI_REPORT)
    router.push('/')
  }

  if (!scores) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="page-wrap max-w-xl">
          <div className="section-panel rounded-[1.75rem] px-6 py-10 text-center">
            <div className="loading-line soft" aria-hidden="true" />
            <p className="mt-4 text-base font-medium text-slate-700">กำลังเตรียมรายงานผลลัพธ์</p>
            <p className="body-faint mt-2 text-sm">กรุณารอสักครู่</p>
          </div>
        </div>
      </main>
    )
  }

  const exportData = session
    ? buildExport(scores, profile, answers, session, pageDurations, responseTimes)
    : null

  const rankedFactors = [...FACTOR_ORDER].sort((a, b) => scores.pct[b] - scores.pct[a])
  const profileSummary = [profile.age && `อายุ ${profile.age} ปี`, profile.sex, profile.occupation]
    .filter(Boolean)
    .join(' · ')
  const displayProgress = loading ? fakeProgress : report ? 100 : 0
  const loadingMessage =
    loadingSeconds < 30
      ? 'AI กำลังสรุปภาพรวมบุคลิกภาพของคุณ'
      : loadingSeconds < 70
        ? 'AI กำลังเชื่อมโยงคะแนนทั้ง 5 มิติให้เป็นรายงานเดียวกัน'
        : 'AI กำลังเรียบเรียงรายงานฉบับเต็มให้อ่านง่ายและละเอียด'
  const isReportComplete = Boolean(report) && !loading

  function handleReevaluate() {
    if (!scores || !session) return

    fetchReport(scores.pct, profile, {
      sessionId: session.sessionId,
      signature: buildReportSignature(scores.pct, profile),
    })
  }

  async function handleDownloadJson() {
    if (!exportData || !isReportComplete) return

    setExportError(null)

    try {
      await shareOrDownloadFile(buildJsonFile(exportData))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setExportError('ไม่สามารถดาวน์โหลดไฟล์ JSON ได้ในขณะนี้')
    }
  }

  function handleInviteDecline() {
    localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
    localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
    setInviteShareStatus('declined')
  }

  function handleInviteShare() {
    if (!inviteCode || !scores || !session) return
    setInviteShareStatus('sharing')
    void fetch('/api/profiles/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode,
        scores: { pct: scores.pct },
        profile,
        sessionId: session.sessionId,
      }),
    }).then(res => {
      if (res.ok) {
        localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        setInviteShareStatus('done')
      } else {
        setInviteShareStatus('idle')
      }
    }).catch(() => setInviteShareStatus('idle'))
  }

  function handleDownloadPdf() {
    if (!session || !exportData || !report || !isReportComplete) return

    setExportError(null)
    setExportingPdf(true)

    void buildPdfFile(exportData, report)
      .then(pdfFile => shareOrDownloadFile(pdfFile))
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setExportError(err instanceof Error ? err.message : 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
      })
      .finally(() => {
        setExportingPdf(false)
      })
  }

  function renderActionsCard(className = '') {
    return (
      <div className={`section-panel no-print rounded-[1.75rem] p-5 sm:p-6 ${className}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          การใช้งาน
        </p>
        <div className="mt-4 space-y-3 no-print">
          <button
            onClick={handleDownloadPdf}
            disabled={!isReportComplete || exportingPdf}
            className="primary-button w-full text-sm"
          >
            {exportingPdf ? 'กำลังสร้าง PDF...' : loading ? 'รอรายงาน AI...' : 'ดาวน์โหลด PDF'}
          </button>

          {exportData && (
            <button
              onClick={handleDownloadJson}
              disabled={!isReportComplete}
              className="secondary-button w-full text-sm"
            >
              ดาวน์โหลด JSON
            </button>
          )}

          <button
            onClick={() => window.print()}
            disabled={!isReportComplete}
            className="secondary-button w-full text-sm"
          >
            เปิดหน้าพิมพ์
          </button>

          <div className="border-t border-[rgba(95,116,130,0.12)] pt-3 mt-1">
            <Link
              href="/checkout"
              className="primary-button w-full justify-center text-sm"
            >
              ทดสอบเชิงลึก 120 ข้อ ฿49 →
            </Link>
            <p className="mt-2 text-xs text-[var(--text-faint)] text-center leading-[1.5]">
              วิเคราะห์ 30 ลักษณะย่อย · รายงาน AI 2,000 คำ
            </p>
          </div>

          <button
            onClick={() => setShowRestartWarning(true)}
            className="tertiary-button w-full text-sm"
          >
            ทำแบบทดสอบอีกครั้ง
          </button>

          {showRestartWarning && (
            <div className="mt-3 rounded-[1.2rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-[1.6] text-amber-800">
              <p className="font-medium">คะแนนและข้อมูลทั้งหมดจะถูกลบออก</p>
              <p className="mt-0.5 text-amber-700">รวมถึงคำตอบ โปรไฟล์ และรายงาน AI ต้องการดำเนินการต่อหรือไม่?</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRestart}
                  className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  ยืนยัน ลบและเริ่มใหม่
                </button>
                <button
                  onClick={() => setShowRestartWarning(false)}
                  className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="body-faint mt-3 text-xs leading-[1.5]">
          ระบบจะสร้างไฟล์ PDF จากฝั่งเซิร์ฟเวอร์แล้วดาวน์โหลดหรือเปิดแผ่นแชร์ให้โดยอัตโนมัติ
        </p>

        {exportError && (
          <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-[1.5] text-amber-800">
            {exportError}
          </div>
        )}
      </div>
    )
  }

  return (
    <main id="main" className="page-shell results-page">
      <div className="page-wrap space-y-6">
        <section className="glass-panel results-hero overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                results // b5
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                รายงานผลการประเมินบุคลิกภาพ
              </h1>

              <p className="body-soft mt-4 max-w-2xl text-base leading-8">
                ผลลัพธ์นี้สะท้อนแนวโน้มบุคลิกภาพจากคำตอบทั้ง 50 ข้อ
                เพื่อช่วยให้เห็นรูปแบบการคิด การทำงาน และการรับมือกับอารมณ์ได้ชัดขึ้น
                สามารถดาวน์โหลด PDF ฉบับย่อที่ระบบสร้างจากฝั่งเซิร์ฟเวอร์สำหรับการอ่านและเก็บอ้างอิง
                หรือดาวน์โหลดไฟล์ JSON หาก ADMIN แจ้ง (ในกรณีที่ต้องการวิเคราะห์เชิงลึกหรือเก็บเป็นข้อมูลส่วนตัว)
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {profileSummary ? (
                  <span className="metric-pill text-sm">{profileSummary}</span>
                ) : null}
                <span className="metric-pill text-sm">
                  มิติเด่น: {DIMENSION_INFO[rankedFactors[0]].label}
                </span>
                <span className="metric-pill text-sm">
                  ระดับรวม: {pctToLabel(scores.pct[rankedFactors[0]])}
                </span>
              </div>
            </div>

            <div className="section-panel rounded-[1.75rem] p-5 sm:p-6 print-avoid-break">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                3 ด้านเด่นของคุณ
              </p>
              <div className="snapshot-list mt-4 grid gap-3">
                {rankedFactors.slice(0, 3).map(factor => {
                  const info = DIMENSION_INFO[factor]
                  const styles = DIMENSION_STYLES[factor]

                  return (
                    <div
                      key={factor}
                      className="snapshot-card rounded-[1.25rem] px-4 py-3.5"
                      style={{ background: `hsl(${styles.hue},55%,97%)` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{info.label}</p>
                          <p className="truncate text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>{info.sublabel}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums"
                          style={{ background: styles.chipBg, color: styles.chipText }}
                        >
                          {scores.pct[factor]}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="results-layout grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="results-main space-y-6">
            <div className="section-panel print-avoid-break rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    คะแนนรายมิติ
                  </p>
                  <h2 className="section-title mt-2 text-2xl">
                    คะแนนรายมิติ
                  </h2>
                </div>
                <p className="body-faint text-sm">
                  ใช้อ่านแนวโน้มของแต่ละมิติเทียบกัน
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {FACTOR_ORDER.map(factor => {
                  const info = DIMENSION_INFO[factor]
                  const pct = scores.pct[factor]
                  const styles = DIMENSION_STYLES[factor]

                  return (
                    <article
                      key={factor}
                      className="rounded-2xl p-4 sm:p-5"
                      style={{ background: `hsl(${styles.hue},55%,97%)` }}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className="factor-medallion shrink-0"
                            style={{ color: styles.chipText, background: `linear-gradient(145deg, white, hsl(${styles.hue},50%,93%))`, borderColor: `hsl(${styles.hue},40%,86%)` }}
                          >
                            <span>{factor}</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>{info.label}</h3>
                              <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>
                                {info.sublabel}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-[1.6]" style={{ color: 'var(--text-soft)' }}>
                              {info.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ background: styles.chipBg, color: styles.chipText }}
                          >
                            {pctToLabel(pct)}
                          </span>
                          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-main)' }}>{pct}%</span>
                        </div>
                      </div>

                      <div
                        className="mt-4 rounded-full overflow-hidden"
                        style={{ height: '6px', background: 'rgba(255,255,255,0.7)' }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${info.label} ${pct}%`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: styles.barColor,
                            boxShadow: `0 0 8px ${styles.barColor}`,
                          }}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="section-panel report-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    รายงานสรุป
                  </p>
                  <h2 className="section-title mt-2 text-2xl">
                    รายงานสรุปผลการประเมิน
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {loading && report ? (
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                      กำลังประเมินใหม่
                    </span>
                  ) : null}
                  {!loading && !error && report ? (
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                      พร้อมอ่าน
                    </span>
                  ) : null}
                  {report ? (
                    <button
                      onClick={handleReevaluate}
                      disabled={loading}
                      className="secondary-button min-h-0 px-4 py-2 text-xs"
                    >
                      {loading ? 'กำลังประเมินใหม่...' : 'ประเมินใหม่'}
                    </button>
                  ) : null}
                </div>
              </div>

              {loading && !report && (
                <div className="py-10 text-center sm:px-8">
                  <div className="loading-line" role="status" aria-label="กำลังโหลด" />
                  <p className="mt-4 text-base font-medium text-slate-700">
                    {loadingMessage}
                  </p>
                  <p className="body-faint mt-2 text-sm leading-[1.6]">
                    รายงานอาจใช้เวลาประมาณ 2-3 นาที
                  </p>
                  <div className="mx-auto mt-6 max-w-xl">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">ความคืบหน้าโดยประมาณ</span>
                      <span className="text-slate-500">{displayProgress}%</span>
                    </div>
                    <div
                      className="mt-3 rounded-full overflow-hidden"
                      style={{ height: '6px', background: 'rgba(69,98,118,0.12)' }}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-out"
                        style={{
                          width: `${displayProgress}%`,
                          background: 'var(--gradient-hero)',
                          boxShadow: '0 0 8px rgba(69,98,118,0.4)',
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>เวลาที่ผ่านไป {formatDuration(loadingSeconds)}</span>
                      <span>บางช่วงอาจค้างที่ 90%+ ชั่วคราว</span>
                    </div>
                  </div>
                </div>
              )}

              {loading && report && (
                <div className="mt-5 rounded-[1.5rem] border border-[rgba(95,116,130,0.16)] bg-[rgba(244,247,249,0.92)] px-5 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="loading-line soft shrink-0" aria-hidden="true" />
                    <p>กำลังสร้างรายงานฉบับใหม่ รายงานเดิมยังแสดงอยู่ด้านล่าง</p>
                  </div>
                </div>
              )}

              {error && !report && (
                <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50/90 p-5 text-sm text-red-700">
                  <p>{error}</p>
                  <button
                    onClick={handleReevaluate}
                    className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              )}

              {error && report && (
                <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-800">
                  <p>{error}</p>
                </div>
              )}

              {report && (
                <div className="report-markdown mt-6">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              )}
            </div>
            {renderActionsCard('lg:hidden')}
          </div>

          <aside className="results-side space-y-6">
            <div className="muted-panel print-avoid-break rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                คะแนนดิบ
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FACTOR_ORDER.map(factor => (
                  <div key={factor} className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{factor}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-800">{scores.raw[factor]}</div>
                    <div className="mt-1 text-xs text-slate-500">จาก 50</div>
                  </div>
                ))}
              </div>
            </div>

            {inviteCode && inviteShareStatus !== 'declined' && (
              <div className="section-panel no-print rounded-[1.75rem] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  คำเชิญแบ่งปันผล
                </p>
                {inviteShareStatus === 'done' ? (
                  <p className="mt-3 text-sm font-medium text-green-700">ส่งผลให้ {inviteOwner ?? 'ผู้เชิญ'} เรียบร้อยแล้ว</p>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-[1.6] text-slate-700">
                      <span className="font-medium">{inviteOwner ?? 'ผู้เชิญ'}</span> ต้องการรับผลคะแนน 5 มิติของคุณเพื่อเปรียบเทียบบุคลิกภาพ
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">คุณยังคงเห็นผลของตัวเองเสมอ · ผู้เชิญไม่เห็นคำตอบรายข้อ</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleInviteShare}
                        disabled={inviteShareStatus === 'sharing'}
                        className="primary-button flex-1 justify-center text-sm"
                      >
                        {inviteShareStatus === 'sharing' ? 'กำลังส่ง...' : 'แบ่งปันผล'}
                      </button>
                      <button
                        onClick={handleInviteDecline}
                        className="secondary-button px-4 text-sm"
                      >
                        ไม่แบ่งปัน
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {renderActionsCard('hidden lg:block')}

            <p className="body-faint no-print px-2 text-center text-xs leading-[1.5]">
              อ้างอิง: IPIP / ipip.ori.org · Thai translation by Panida Yomaboot &amp; Andrew J. Cooper · App by FARS-AI Cognitive Science Team
            </p>
          </aside>
        </section>

        <ReferenceNote className="print-avoid-break" />
      </div>
    </main>
  )
}
