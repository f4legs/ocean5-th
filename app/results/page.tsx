'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { calcScores, DIMENSION_INFO, ScoreResult } from '@/lib/scoring'

const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

const DIMENSION_EMOJIS: Record<string, string> = {
  E: '🌟',
  A: '🤝',
  C: '📋',
  N: '🌊',
  O: '🔍',
}

const DIMENSION_COLORS: Record<string, string> = {
  E: 'bg-amber-400',
  A: 'bg-emerald-500',
  C: 'bg-blue-500',
  N: 'bg-violet-500',
  O: 'bg-red-400',
}

function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
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

  const fetchReport = useCallback((scoresPct: { E: number; A: number; C: number; N: number; O: number }, profileData: Record<string, string | null>) => {
    setLoading(true)
    setError(null)
    fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: scoresPct, profile: profileData }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.report) setReport(data.report)
        else setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
      })
      .catch(() => setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    try {
      const rawAnswers = localStorage.getItem('ocean_answers')
      if (!rawAnswers) { router.push('/'); return }

      const rawProfile = localStorage.getItem('ocean_profile')
      const rawSession = localStorage.getItem('ocean_session')
      const rawPageDur = localStorage.getItem('ocean_page_durations')
      const rawRT = localStorage.getItem('ocean_response_times')

      const parsedAnswers = JSON.parse(rawAnswers) as Record<number, number>
      const profileData = rawProfile ? JSON.parse(rawProfile) : {}
      const sessionData = rawSession ? JSON.parse(rawSession) : { sessionId: crypto.randomUUID(), startedAt: new Date().toISOString() }
      const pageDurData = rawPageDur ? JSON.parse(rawPageDur) : {}
      const rtData = rawRT ? JSON.parse(rawRT) : {}

      const result = calcScores(parsedAnswers)
      setScores(result)
      setProfile(profileData)
      setAnswers(parsedAnswers)
      setSession(sessionData)
      setPageDurations(pageDurData)
      setResponseTimes(rtData)

      fetchReport(result.pct, profileData)
    } catch {
      router.push('/')
    }
  }, [router, fetchReport])

  function handleRestart() {
    localStorage.removeItem('ocean_answers')
    localStorage.removeItem('ocean_profile')
    localStorage.removeItem('ocean_session')
    localStorage.removeItem('ocean_response_times')
    localStorage.removeItem('ocean_page_durations')
    localStorage.removeItem('ocean_answers_draft')
    router.push('/')
  }

  if (!scores) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p>กำลังโหลด...</p>
        </div>
      </main>
    )
  }

  const exportData = session
    ? buildExport(scores, profile, answers, session, pageDurations, responseTimes)
    : null

  return (
    <main id="main" className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">🎉</span>
          <h1 className="text-2xl font-bold text-slate-900">ผลการทดสอบบุคลิกภาพ</h1>
          {profile.age || profile.sex || profile.occupation ? (
            <p className="text-slate-400 text-sm mt-1">
              {[profile.age && `อายุ ${profile.age} ปี`, profile.sex, profile.occupation]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>

        {/* Score bars */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4 text-base">คะแนนแต่ละมิติ</h2>
          <div className="space-y-4">
            {FACTOR_ORDER.map(factor => {
              const info = DIMENSION_INFO[factor]
              const pct = scores.pct[factor]
              return (
                <div key={factor}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{DIMENSION_EMOJIS[factor]}</span>
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{info.label}</span>
                        <span className="text-xs text-slate-400 ml-1.5">{info.sublabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {pctToLabel(pct)}
                      </span>
                      <span className="text-sm font-bold text-slate-700 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div
                    className="h-3 bg-slate-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${info.label} ${pct}%`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${DIMENSION_COLORS[factor]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{info.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">🤖</span>
            <h2 className="font-bold text-slate-800 text-base">รายงานวิเคราะห์บุคลิกภาพโดย AI</h2>
          </div>

          {loading && (
            <div className="text-center py-10">
              <div
                className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"
                role="status"
                aria-label="กำลังโหลด"
              />
              <p className="text-slate-500 text-sm">AI กำลังวิเคราะห์บุคลิกภาพของคุณ...</p>
              <p className="text-slate-400 text-xs mt-1">อาจใช้เวลาสักครู่</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
              <p className="mb-3">{error}</p>
              <button
                onClick={() => fetchReport(scores.pct, profile)}
                className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}

          {!loading && !error && report && (
            <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Raw scores */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6">
          <p className="text-xs text-slate-400 mb-2 font-medium">คะแนนดิบ (จาก 50 คะแนน)</p>
          <div className="flex gap-4 flex-wrap">
            {FACTOR_ORDER.map(f => (
              <div key={f} className="text-center">
                <div className="text-xs text-slate-400">{f}</div>
                <div className="text-base font-bold text-slate-700">{scores.raw[f]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 no-print">
          <button
            onClick={handleRestart}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors text-sm"
          >
            ทำแบบทดสอบอีกครั้ง
          </button>
          {exportData && (
            <button
              onClick={() => downloadJSON(exportData)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-sm"
            >
              ดาวน์โหลด JSON
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            พิมพ์ / PDF
          </button>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          อ้างอิง: IPIP Big Five · Yomaboot &amp; Cooper · ipip.ori.org · Public Domain
        </p>
      </div>
    </main>
  )
}
