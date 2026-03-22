'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { calcScores, DIMENSION_INFO, ScoreResult } from '@/lib/scoring'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItem, removeItem, setItem } from '@/lib/storage'

const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

const DIMENSION_STYLES: Record<string, { bar: string; chip: string; wash: string }> = {
  O: {
    bar: 'bg-[linear-gradient(90deg,#516673,#8ea0aa)]',
    chip: 'bg-[#eef3f5] text-[#47606d]',
    wash: 'from-[#f8fafb] to-[#f2f5f7]',
  },
  C: {
    bar: 'bg-[linear-gradient(90deg,#485f6d,#8a9da8)]',
    chip: 'bg-[#eef3f5] text-[#48606e]',
    wash: 'from-[#f8fafb] to-[#f2f5f7]',
  },
  E: {
    bar: 'bg-[linear-gradient(90deg,#49606d,#8d9fa9)]',
    chip: 'bg-[#eef3f5] text-[#4a6270]',
    wash: 'from-[#f8fafb] to-[#f2f5f7]',
  },
  A: {
    bar: 'bg-[linear-gradient(90deg,#50656a,#90a2a7)]',
    chip: 'bg-[#eef3f5] text-[#50686d]',
    wash: 'from-[#f8fafb] to-[#f2f5f7]',
  },
  N: {
    bar: 'bg-[linear-gradient(90deg,#566570,#95a3ac)]',
    chip: 'bg-[#eef3f5] text-[#51656f]',
    wash: 'from-[#f8fafb] to-[#f2f5f7]',
  },
}

function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

interface ExportData {
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
    scale: string
    totalItems: number
    durationSeconds: number | null
    pageDurations: Record<string, number>
    responseTimes: Record<string, number>
    replacedItems: string[]
  }
}

interface ProfileData {
  age?: string | null
  sex?: string | null
  occupation?: string | null
  goal?: string | null
}

interface ExportProfile {
  age: string | null
  sex: string | null
  occupation: string | null
  goal: string | null
}

interface SessionData {
  sessionId: string
  startedAt: string
  quizCompletedAt?: string
}

interface CachedReport {
  sessionId: string
  signature: string
  report: string
  generatedAt: string
}

function buildReportSignature(scoresPct: ScoreResult['pct'], profileData: ProfileData): string {
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

function normalizeProfile(profileData: ProfileData): ExportProfile {
  return {
    age: profileData.age ?? null,
    sex: profileData.sex ?? null,
    occupation: profileData.occupation ?? null,
    goal: profileData.goal ?? null,
  }
}

function readCachedReport(sessionId: string, signature: string): string | null {
  const raw = getItem(STORAGE_KEYS.AI_REPORT)
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

function buildExport(
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

  // Convert numeric keys to string for JSON clarity
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
      itemSource: 'IPIP NEO-PI-R Thai (Yomaboot & Cooper) — ipip.ori.org',
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

function downloadJSON(data: ExportData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ocean-result-${data.sessionId.slice(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResultsPage() {
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
  const hasInitialized = useRef(false)
  const activeRequestId = useRef(0)

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

    fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: scoresPct, profile: profileData }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'ไม่สามารถสร้างรายงานได้ในขณะนี้')
        }
        return data
      })
      .then(data => {
        if (requestId !== activeRequestId.current) return

        if (data.report) {
          setReport(data.report)
          if (cacheContext) {
            setItem(
              STORAGE_KEYS.AI_REPORT,
              JSON.stringify({
                sessionId: cacheContext.sessionId,
                signature: cacheContext.signature,
                report: data.report,
                generatedAt: new Date().toISOString(),
              } satisfies CachedReport)
            )
          }
        } else {
          setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
        }
      })
      .catch(err => {
        if (requestId !== activeRequestId.current) return
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ')
      })
      .finally(() => {
        if (requestId === activeRequestId.current) {
          setLoading(false)
        }
      })
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
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      const rawAnswers = getItem(STORAGE_KEYS.ANSWERS)
      if (!rawAnswers) {
        router.push('/')
        return
      }

      const rawProfile = getItem(STORAGE_KEYS.PROFILE)
      const rawSession = getItem(STORAGE_KEYS.SESSION)
      const rawPageDur = getItem(STORAGE_KEYS.PAGE_DURATIONS)
      const rawRT = getItem(STORAGE_KEYS.RESPONSE_TIMES)

      const parsedAnswers = JSON.parse(rawAnswers) as Record<number, number>
      const profileData = (rawProfile ? JSON.parse(rawProfile) : {}) as ProfileData
      const sessionData = rawSession
        ? (JSON.parse(rawSession) as SessionData)
        : { sessionId: crypto.randomUUID(), startedAt: new Date().toISOString() }
      const pageDurData = rawPageDur ? JSON.parse(rawPageDur) : {}
      const rtData = rawRT ? JSON.parse(rawRT) : {}

      const result = calcScores(parsedAnswers)
      const reportSignature = buildReportSignature(result.pct, profileData)
      const cachedReport = readCachedReport(sessionData.sessionId, reportSignature)

      startTransition(() => {
        setScores(result)
        setProfile(profileData)
        setAnswers(parsedAnswers)
        setSession(sessionData)
        setPageDurations(pageDurData)
        setResponseTimes(rtData)
        setReport(cachedReport ?? '')
        setLoading(!cachedReport)
        setError(null)
      })

      if (!cachedReport) {
        queueMicrotask(() => {
          fetchReport(result.pct, profileData, {
            sessionId: sessionData.sessionId,
            signature: reportSignature,
          })
        })
      }
    } catch {
      router.push('/')
    }
  }, [router, fetchReport])

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

  function handleReevaluate() {
    if (!scores || !session) return

    fetchReport(scores.pct, profile, {
      sessionId: session.sessionId,
      signature: buildReportSignature(scores.pct, profile),
    })
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
                สามารถเซฟเป็น PDF ได้ สำหรับการใช้งานทั่วไป หรือดาวน์โหลดไฟล์ JSON หาก ADMIN แจ้ง (ในกรณีที่ต้องการวิเคราะห์เชิงลึกหรือเก็บเป็นข้อมูลส่วนตัว)
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
                      className={`snapshot-card rounded-[1.4rem] bg-gradient-to-r ${styles.wash} px-4 py-4`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{info.label}</p>
                            <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-400">{info.sublabel}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${styles.chip}`}>
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
                      className={`rounded-[1.6rem] bg-gradient-to-r ${styles.wash} p-4 sm:p-5`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="factor-medallion shrink-0"><span>{factor}</span></div>
                          <div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="text-base font-semibold text-slate-800">{info.label}</h3>
                              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                {info.sublabel}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-[1.6] text-slate-600">
                              {info.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.chip}`}>
                            {pctToLabel(pct)}
                          </span>
                          <span className="text-lg font-semibold text-slate-800">{pct}%</span>
                        </div>
                      </div>

                      <div
                        className="mt-4 h-3 overflow-hidden rounded-full bg-white/80"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${info.label} ${pct}%`}
                      >
                        <div
                          className={`h-full rounded-full ${styles.bar} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
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
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#284b5b,#8ba0ab)] transition-[width] duration-1000 ease-out"
                        style={{ width: `${displayProgress}%` }}
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

            <div className="section-panel no-print rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                การใช้งาน
              </p>
              <div className="mt-4 space-y-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="primary-button w-full text-sm"
                >
                  พิมพ์ / PDF
                </button>

                {exportData && (
                  <button
                    onClick={() => downloadJSON(exportData)}
                    className="secondary-button w-full text-sm"
                  >
                    ดาวน์โหลด JSON
                  </button>
                )}

                <button
                  onClick={handleRestart}
                  className="tertiary-button w-full text-sm"
                >
                  ทำแบบทดสอบอีกครั้ง
                </button>
              </div>
            </div>

            <p className="body-faint no-print px-2 text-center text-xs leading-[1.5]">
              อ้างอิง: IPIP Big Five · Yomaboot &amp; Cooper · ipip.ori.org · Public Domain
            </p>
          </aside>
        </section>
      </div>
    </main>
  )
}
