'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calcScores, DIMENSION_INFO, ScoreResult } from '@/lib/scoring'

const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

const DIMENSION_EMOJIS: Record<string, string> = {
  E: '🌟',
  A: '🤝',
  C: '📋',
  N: '🧘',
  O: '🔍',
}

function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
}

function pctToColor(pct: number): string {
  if (pct >= 70) return 'bg-emerald-500'
  if (pct >= 40) return 'bg-amber-400'
  return 'bg-slate-300'
}

// Simple markdown-to-HTML renderer (headings + bold + paragraphs)
function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 mt-6 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-700 mt-4 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc leading-relaxed">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="my-2 space-y-1">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="leading-relaxed text-slate-700 mt-3">')
    .replace(/^(?!<[h|u|l])(.+)$/gm, (m) =>
      m.trim() && !m.startsWith('<') ? `<p class="leading-relaxed text-slate-700">${m}</p>` : m
    )
}

export default function ResultsPage() {
  const router = useRouter()
  const [scores, setScores] = useState<ScoreResult | null>(null)
  const [profile, setProfile] = useState<Record<string, string | null>>({})
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const rawAnswers = localStorage.getItem('ocean_answers')
    const rawProfile = localStorage.getItem('ocean_profile')

    if (!rawAnswers) {
      router.push('/')
      return
    }

    const answers = JSON.parse(rawAnswers) as Record<number, number>
    const profileData = rawProfile ? JSON.parse(rawProfile) : {}

    const result = calcScores(answers)
    setScores(result)
    setProfile(profileData)

    // Call AI interpretation
    fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: result.pct, profile: profileData }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.report) {
          setReport(data.report)
        } else {
          setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')
        }
      })
      .catch(() => setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'))
      .finally(() => setLoading(false))
  }, [router])

  function handleRestart() {
    localStorage.removeItem('ocean_answers')
    localStorage.removeItem('ocean_profile')
    router.push('/')
  }

  if (!scores) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p>กำลังโหลด...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-10">
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
                      <span>{DIMENSION_EMOJIS[factor]}</span>
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{info.label}</span>
                        <span className="text-xs text-slate-400 ml-1.5">{info.sublabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        pct >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        pct >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {pctToLabel(pct)}
                      </span>
                      <span className="text-sm font-bold text-slate-700 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pctToColor(pct)}`}
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
            <span className="text-xl">🤖</span>
            <h2 className="font-bold text-slate-800 text-base">รายงานวิเคราะห์บุคลิกภาพโดย AI</h2>
          </div>

          {loading && (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-sm">AI กำลังวิเคราะห์บุคลิกภาพของคุณ...</p>
              <p className="text-slate-400 text-xs mt-1">อาจใช้เวลาสักครู่</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && report && (
            <div
              className="prose-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
            />
          )}
        </div>

        {/* Raw scores summary */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6">
          <p className="text-xs text-slate-400 mb-2 font-medium">คะแนนดิบ (จาก 50 คะแนน)</p>
          <div className="flex gap-3 flex-wrap">
            {FACTOR_ORDER.map(f => (
              <div key={f} className="text-center">
                <div className="text-xs text-slate-400">{f}</div>
                <div className="text-base font-bold text-slate-700">{scores.raw[f]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors text-sm"
          >
            ทำแบบทดสอบอีกครั้ง
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            พิมพ์ / บันทึก PDF
          </button>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          อ้างอิง: IPIP Big Five · Yomaboot &amp; Cooper · ipip.ori.org · Public Domain
        </p>
      </div>
    </main>
  )
}
