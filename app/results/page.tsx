'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { calcScores, DIMENSION_INFO, ScoreResult } from '@/lib/scoring'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItem, removeItem } from '@/lib/storage'

const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

const DIMENSION_STYLES: Record<string, { bar: string; chip: string; wash: string }> = {
  O: {
    bar: 'bg-[linear-gradient(90deg,#7b6852,#c6ad90)]',
    chip: 'bg-[#f3ede4] text-[#6a5844]',
    wash: 'from-[#faf6ef] to-[#f4ede4]',
  },
  C: {
    bar: 'bg-[linear-gradient(90deg,#445f78,#95acc0)]',
    chip: 'bg-[#eaf0f6] text-[#425d76]',
    wash: 'from-[#eff5fa] to-[#e7eef5]',
  },
  E: {
    bar: 'bg-[linear-gradient(90deg,#496775,#92aab5)]',
    chip: 'bg-[#ebf2f5] text-[#456270]',
    wash: 'from-[#eff5f7] to-[#e7eef1]',
  },
  A: {
    bar: 'bg-[linear-gradient(90deg,#5c7466,#9cb2a1)]',
    chip: 'bg-[#edf3ee] text-[#536b5d]',
    wash: 'from-[#f1f6f2] to-[#e8efea]',
  },
  N: {
    bar: 'bg-[linear-gradient(90deg,#755f72,#b9a4b5)]',
    chip: 'bg-[#f3edf2] text-[#6b5766]',
    wash: 'from-[#f8f3f7] to-[#efe7ee]',
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
  profile: Record<string, string | null>
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

function buildExport(
  scores: ScoreResult,
  profile: Record<string, string | null>,
  answers: Record<number, number>,
  session: { sessionId: string; startedAt: string; quizCompletedAt?: string },
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
    profile,
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
  const [profile, setProfile] = useState<Record<string, string | null>>({})
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [session, setSession] = useState<{ sessionId: string; startedAt: string; quizCompletedAt?: string } | null>(null)
  const [pageDurations, setPageDurations] = useState<Record<number, number>>({})
  const [responseTimes, setResponseTimes] = useState<Record<number, number>>({})
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fakeProgress, setFakeProgress] = useState(7)
  const [loadingSeconds, setLoadingSeconds] = useState(0)

  const fetchReport = useCallback((scoresPct: { E: number; A: number; C: number; N: number; O: number }, profileData: Record<string, string | null>) => {
    setFakeProgress(7)
    setLoadingSeconds(0)
    setLoading(true)
    setError(null)
    setReport('')

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
        if (data.report) setReport(data.report)
        else setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ'))
      .finally(() => setLoading(false))
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
  }, [loading, report])

  useEffect(() => {
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
      const profileData = rawProfile ? JSON.parse(rawProfile) : {}
      const sessionData = rawSession
        ? JSON.parse(rawSession)
        : { sessionId: crypto.randomUUID(), startedAt: new Date().toISOString() }
      const pageDurData = rawPageDur ? JSON.parse(rawPageDur) : {}
      const rtData = rawRT ? JSON.parse(rawRT) : {}

      const result = calcScores(parsedAnswers)
      startTransition(() => {
        setScores(result)
        setProfile(profileData)
        setAnswers(parsedAnswers)
        setSession(sessionData)
        setPageDurations(pageDurData)
        setResponseTimes(rtData)
      })

      queueMicrotask(() => {
        fetchReport(result.pct, profileData)
      })
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
    router.push('/')
  }

  if (!scores) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="page-wrap max-w-xl">
          <div className="section-panel rounded-[1.75rem] px-6 py-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[var(--accent-strong)]" />
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

  return (
    <main id="main" className="page-shell results-page">
      <div className="page-wrap space-y-6">
        <section className="glass-panel results-hero overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                Personality Report
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                รายงานบุคลิกภาพ OCEAN ของคุณ
              </h1>

              <p className="body-soft mt-4 max-w-2xl text-base leading-8">
                ผลลัพธ์นี้สะท้อนแนวโน้มบุคลิกภาพจากคำตอบทั้ง 50 ข้อ
                ช่วยให้มองเห็นรูปแบบการคิด การทำงาน การเข้าสังคม และการรับมือกับอารมณ์ของคุณชัดเจนขึ้น
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
                Snapshot
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
                          <div className="factor-medallion"><span>{factor}</span></div>
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
                    Dimension Scores
                  </p>
                  <h2 className="section-title mt-2 text-2xl">
                    โปรไฟล์คะแนนแต่ละมิติ
                  </h2>
                </div>
                <p className="body-faint text-sm">
                  ยิ่งเปอร์เซ็นต์สูง ยิ่งสะท้อนแนวโน้มของมิตินั้นมากขึ้น
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
                            <p className="mt-2 text-sm leading-7 text-slate-600">
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
                    AI Interpretation
                  </p>
                  <h2 className="section-title mt-2 text-2xl">
                    รายงานวิเคราะห์บุคลิกภาพ
                  </h2>
                </div>
                {!loading && !error && report ? (
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                    พร้อมอ่าน
                  </span>
                ) : null}
              </div>

              {loading && (
                <div className="py-10 text-center sm:px-8">
                  <div
                    className="loading-orbit"
                    role="status"
                    aria-label="กำลังโหลด"
                  >
                    <span className="loading-orbit-track" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-base font-medium text-slate-700">
                    {loadingMessage}
                  </p>
                  <p className="body-faint mt-2 text-sm leading-7">
                    รายงานฉบับละเอียดอาจใช้เวลาประมาณ 2-3 นาที
                    ระหว่างนี้เราจะแสดงความคืบหน้าโดยประมาณให้คุณเห็น
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
                      <span>บางช่วงอาจค้างที่ 90%+ จนกว่ารายงานจะเสร็จสมบูรณ์</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50/90 p-5 text-sm text-red-700">
                  <p>{error}</p>
                  <button
                    onClick={() => fetchReport(scores.pct, profile)}
                    className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              )}

              {!loading && !error && report && (
                <div className="report-markdown mt-6">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          <aside className="results-side space-y-6">
            <div className="muted-panel print-avoid-break rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Raw Scores
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
                Actions
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

            <p className="body-faint no-print px-2 text-center text-xs leading-6">
              อ้างอิง: IPIP Big Five · Yomaboot &amp; Cooper · ipip.ori.org · Public Domain
            </p>
          </aside>
        </section>
      </div>
    </main>
  )
}
