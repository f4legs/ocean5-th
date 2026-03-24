'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/utils/supabase/client'
import { FACET_NAMES, FACET_DOMAIN, type FullScoreResult } from '@/lib/scoring120'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

const DOMAIN_LABELS: Record<string, { label: string; sublabel: string; description: string }> = {
  O: { label: 'การเปิดรับประสบการณ์', sublabel: 'OPENNESS', description: 'จินตนาการ ความคิดสร้างสรรค์ และความอยากรู้อยากเห็น' },
  C: { label: 'ความรับผิดชอบ', sublabel: 'CONSCIENTIOUSNESS', description: 'ความเป็นระเบียบ ความมุ่งมั่น และวินัยในตนเอง' },
  E: { label: 'ความเปิดเผย', sublabel: 'EXTRAVERSION', description: 'ความกระตือรือร้น ความชอบสังคม และความร่าเริง' },
  A: { label: 'ความเป็นมิตร', sublabel: 'AGREEABLENESS', description: 'ความร่วมมือ ความไว้วางใจ และความเห็นอกเห็นใจ' },
  N: { label: 'ความไม่มั่นคงทางอารมณ์', sublabel: 'NEUROTICISM', description: 'ความวิตกกังวล ความอ่อนไหว และการรับมือกับความเครียด' },
}

const DOMAIN_COLORS: Record<string, string> = {
  O: 'bg-[linear-gradient(90deg,#516673,#8ea0aa)]',
  C: 'bg-[linear-gradient(90deg,#485f6d,#8a9da8)]',
  E: 'bg-[linear-gradient(90deg,#49606d,#8d9fa9)]',
  A: 'bg-[linear-gradient(90deg,#50656a,#90a2a7)]',
  N: 'bg-[linear-gradient(90deg,#566570,#95a3ac)]',
}

const FACET_DOMAIN_ORDER = ['N', 'E', 'O', 'A', 'C'] as const

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

export default function Results120Page() {
  const router = useRouter()
  const [scores, setScores] = useState<FullScoreResult | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fakeProgress, setFakeProgress] = useState(7)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [canUpgrade, setCanUpgrade] = useState(false)
  const activeRequestId = useRef(0)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteOwner, setInviteOwner] = useState<string | null>(null)
  const [inviteShareStatus, setInviteShareStatus] = useState<'idle' | 'sharing' | 'done' | 'declined'>('idle')

  useEffect(() => {
    async function init() {
      const raw = sessionStorage.getItem('ocean_scores_120')
      if (!raw) {
        router.replace('/quiz120')
        return
      }

      try {
        const parsed = JSON.parse(raw) as FullScoreResult
        setScores(parsed)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token ?? null
        setAccessToken(token)

        // Check if 300-item test is available (already paid)
        if (token) {
          const verifyRes = await fetch('/api/checkout/verify', {
            headers: { Authorization: `Bearer ${token}` },
          })
          const verifyData = await verifyRes.json()
          if (verifyData.paid) setCanUpgrade(true)
        }

        const storedCode = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        const storedOwner = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        if (storedCode) {
          setInviteCode(storedCode)
          setInviteOwner(storedOwner)
        }

        // Stream AI report
        const profileId = sessionStorage.getItem('ocean_profile_id_120')
        streamReport(parsed, token, profileId)
      } catch {
        router.replace('/quiz120')
      }
    }

    void init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) return
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
    return () => window.clearInterval(interval)
  }, [loading])

  function streamReport(result: FullScoreResult, token: string | null, profileId: string | null = null) {
    const requestId = activeRequestId.current + 1
    activeRequestId.current = requestId
    setFakeProgress(7)
    setLoadingSeconds(0)
    setLoading(true)
    setError(null)

    async function run() {
      try {
        const body = {
          domainScores: result.domains.pct,
          facetScores: result.facets,
          testType: '120',
          profileId: profileId ?? undefined,
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/interpret-deep', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error || 'ไม่สามารถสร้างรายงานได้ในขณะนี้')
        }
        if (!res.body) throw new Error('ไม่สามารถสร้างรายงานได้')

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

        const normalized = accumulated
          .trim()
          .replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim()
          .replace(/^(#{1,6})([^\s#\n])/gm, '$1 $2')
          .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')

        setReport(normalized)
        if (!normalized) setError('ไม่สามารถสร้างรายงานได้ในขณะนี้')

      } catch (err) {
        if (requestId !== activeRequestId.current) return
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ')
      } finally {
        if (requestId === activeRequestId.current) setLoading(false)
      }
    }

    void run()
  }

  function handleInviteDecline() {
    localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
    localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
    setInviteShareStatus('declined')
  }

  function handleInviteShare() {
    if (!inviteCode || !scores) return
    setInviteShareStatus('sharing')
    void fetch('/api/profiles/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode,
        scores: { pct: scores.domains.pct, facets: scores.facets },
        testType: '120',
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

  if (!scores) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="page-wrap max-w-xl">
          <div className="section-panel rounded-[1.75rem] px-6 py-10 text-center">
            <div className="loading-line soft" aria-hidden="true" />
            <p className="mt-4 text-base font-medium text-slate-700">กำลังเตรียมรายงาน</p>
          </div>
        </div>
      </main>
    )
  }

  const displayProgress = loading ? fakeProgress : report ? 100 : 0
  const loadingMessage =
    loadingSeconds < 30 ? 'AI กำลังวิเคราะห์ลักษณะย่อย 30 ด้าน' :
    loadingSeconds < 70 ? 'AI กำลังเชื่อมโยงรูปแบบบุคลิกภาพเชิงลึก' :
    'AI กำลังเรียบเรียงรายงานฉบับเต็ม'

  return (
    <main id="main" className="page-shell results-page">
      <div className="page-wrap space-y-6">

        {/* Hero */}
        <section className="glass-panel results-hero overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <span className="eyebrow">
            <span className="accent-dot" aria-hidden="true" />
            results // facet-level · 120 ข้อ
          </span>
          <h1 className="display-title mt-6 text-4xl sm:text-5xl">รายงานเชิงลึก OCEAN</h1>
          <p className="body-soft mt-4 max-w-2xl text-base leading-8">
            ผลจากแบบทดสอบ IPIP-NEO-120 วิเคราะห์บุคลิกภาพ 30 ลักษณะย่อยใน 5 มิติหลัก
          </p>
          {canUpgrade && (
            <div className="mt-6">
              <Link
                href="/quiz300"
                className="primary-button inline-flex text-sm"
              >
                ต่อยอด 300 ข้อ (ระดับวิจัย) →
              </Link>
              <p className="mt-2 text-xs text-[var(--text-faint)]">+180 ข้อ · IPIP-NEO-300 · ครอบคลุมทุกมิติลึกขึ้น</p>
            </div>
          )}
        </section>

        <div className="results-layout grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="results-main space-y-6">

            {/* Domain scores */}
            <section className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                มิติหลัก 5 ด้าน
              </p>
              <h2 className="section-title mt-2 text-2xl">คะแนนรายมิติ</h2>
              <div className="mt-6 space-y-4">
                {FACTOR_ORDER.map(factor => {
                  const info = DOMAIN_LABELS[factor]
                  const pct = scores.domains.pct[factor]
                  return (
                    <article key={factor} className="rounded-[1.6rem] bg-gradient-to-r from-[#f8fafb] to-[#f2f5f7] p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="factor-medallion shrink-0"><span>{factor}</span></div>
                          <div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="text-base font-semibold text-slate-800">{info.label}</h3>
                              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{info.sublabel}</span>
                            </div>
                            <p className="mt-2 text-sm leading-[1.6] text-slate-600">{info.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#eef3f5] px-3 py-1 text-xs font-semibold text-[#47606d]">
                            {pctToLabel(pct)}
                          </span>
                          <span className="text-lg font-semibold text-slate-800">{pct}%</span>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80"
                        role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className={`h-full rounded-full ${DOMAIN_COLORS[factor]} transition-all duration-700`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Facet scores */}
            <section className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                ลักษณะย่อย 30 ด้าน
              </p>
              <h2 className="section-title mt-2 text-2xl">คะแนนรายลักษณะย่อย</h2>
              <div className="mt-6 space-y-8">
                {FACET_DOMAIN_ORDER.map(domain => {
                  const facetCodes = Object.entries(FACET_DOMAIN)
                    .filter(([, d]) => d === domain)
                    .map(([code]) => code)
                  return (
                    <div key={domain}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="factor-medallion factor-medallion-sm shrink-0"><span>{domain}</span></div>
                        <p className="text-sm font-semibold text-slate-700">{DOMAIN_LABELS[domain].label}</p>
                      </div>
                      <div className="space-y-2">
                        {facetCodes.map(code => {
                          const name = FACET_NAMES[code as keyof typeof FACET_NAMES]
                          const facet = scores.facets[code as keyof typeof scores.facets]
                          const pct = facet?.pct ?? 0
                          return (
                            <div key={code} className="flex items-center gap-3">
                              <span className="w-6 shrink-0 text-xs font-mono text-slate-400">{code}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-600">{name}</span>
                                  <span className="text-xs font-semibold text-slate-700">{Math.round(pct)}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${DOMAIN_COLORS[domain]} transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* AI report */}
            <section className="section-panel report-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">รายงาน AI เชิงลึก</p>
                  <h2 className="section-title mt-2 text-2xl">รายงานวิเคราะห์บุคลิกภาพ</h2>
                </div>
                {report && !loading && (
                  <button
                    onClick={() => scores && streamReport(scores, accessToken, sessionStorage.getItem('ocean_profile_id_120'))}
                    className="secondary-button min-h-0 px-4 py-2 text-xs"
                  >
                    ประเมินใหม่
                  </button>
                )}
              </div>

              {loading && !report && (
                <div className="py-10 text-center sm:px-8">
                  <div className="loading-line" role="status" aria-label="กำลังโหลด" />
                  <p className="mt-4 text-base font-medium text-slate-700">{loadingMessage}</p>
                  <p className="body-faint mt-2 text-sm">รายงานเชิงลึกอาจใช้เวลา 2-4 นาที</p>
                  <div className="mx-auto mt-6 max-w-xl">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">ความคืบหน้าโดยประมาณ</span>
                      <span className="text-slate-500">{displayProgress}%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#284b5b,#8ba0ab)] transition-[width] duration-1000 ease-out"
                        style={{ width: `${displayProgress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>เวลาที่ผ่านไป {formatDuration(loadingSeconds)}</span>
                      <span>บางช่วงอาจค้างที่ 90%+ ชั่วคราว</span>
                    </div>
                  </div>
                </div>
              )}

              {error && !report && (
                <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50/90 p-5 text-sm text-red-700">
                  <p>{error}</p>
                  <button
                    onClick={() => scores && streamReport(scores, accessToken, sessionStorage.getItem('ocean_profile_id_120'))}
                    className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              )}

              {report && (
                <div className="report-markdown mt-6">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="results-side space-y-6">
            <div className="muted-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                คะแนนมิติหลัก
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FACTOR_ORDER.map(factor => (
                  <div key={factor} className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{factor}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-800">{scores.domains.pct[factor]}%</div>
                  </div>
                ))}
              </div>
            </div>

            {inviteCode && inviteShareStatus !== 'declined' && (
              <div className="section-panel rounded-[1.75rem] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  คำเชิญแบ่งปันผล
                </p>
                {inviteShareStatus === 'done' ? (
                  <p className="mt-3 text-sm font-medium text-green-700">ส่งผลให้ {inviteOwner ?? 'ผู้เชิญ'} เรียบร้อยแล้ว</p>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-[1.6] text-slate-700">
                      <span className="font-medium">{inviteOwner ?? 'ผู้เชิญ'}</span> ต้องการรับผลคะแนน 30 ลักษณะย่อยของคุณเพื่อเปรียบเทียบบุคลิกภาพ
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

            <div className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">การใช้งาน</p>
              <div className="mt-4 space-y-3">
                <Link href="/dashboard" className="primary-button w-full justify-center text-sm">
                  ไปที่ Dashboard →
                </Link>
                {canUpgrade && (
                  <Link href="/quiz300" className="secondary-button w-full justify-center text-sm">
                    ต่อยอด 300 ข้อ
                  </Link>
                )}
              </div>
            </div>

            <p className="body-faint px-2 text-center text-xs leading-[1.5]">
              อ้างอิง: IPIP-NEO-120 · Johnson (2014) · ipip.ori.org
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
