'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { type FullScoreResult } from '@/lib/scoring120'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { startStreamReport } from '@/lib/stream-report'
import DomainScores from '@/components/results/domain-scores'
import FacetScores from '@/components/results/facet-scores'
import ReportPanel from '@/components/results/report-panel'
import InviteShareCard from '@/components/results/invite-share-card'
import SidebarScores from '@/components/results/sidebar-scores'

export default function Results300Client() {
  const router = useRouter()
  const [scores, setScores] = useState<FullScoreResult | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fakeProgress, setFakeProgress] = useState(7)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const activeRequestId = useRef(0)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteOwner, setInviteOwner] = useState<string | null>(null)
  const [inviteShareStatus, setInviteShareStatus] = useState<'idle' | 'sharing' | 'done' | 'declined'>('idle')

  useEffect(() => {
    async function init() {
      const raw = sessionStorage.getItem('ocean_scores_300')
      if (!raw) { router.replace('/quiz300'); return }

      try {
        const parsed = JSON.parse(raw) as FullScoreResult
        setScores(parsed)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token ?? null
        setAccessToken(token)

        const storedCode = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        const storedOwner = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        if (storedCode) { setInviteCode(storedCode); setInviteOwner(storedOwner) }

        const profileId = sessionStorage.getItem('ocean_profile_id_300')
        triggerStreamReport(parsed, token, profileId)
      } catch {
        router.replace('/quiz300')
      }
    }
    void init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function triggerStreamReport(result: FullScoreResult, token: string | null, profileId: string | null = null) {
    startStreamReport({
      url: '/api/interpret-deep',
      body: {
        domainScores: result.domains.pct,
        facetScores: result.facets,
        testType: '300',
        profileId: profileId ?? undefined,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      activeRequestId,
      setReport,
      setLoading,
      setError,
      setFakeProgress,
      setLoadingSeconds,
    })
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
        testType: '300',
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

  const loadingMessage =
    loadingSeconds < 30 ? 'AI กำลังวิเคราะห์ข้อมูลระดับวิจัย 300 ข้อ' :
    loadingSeconds < 70 ? 'AI กำลังสังเคราะห์รูปแบบบุคลิกภาพเชิงลึก' :
    'AI กำลังเรียบเรียงรายงานฉบับสมบูรณ์'

  return (
    <main id="main" className="page-shell results-page">
      <div className="page-wrap space-y-6">

        {/* Hero */}
        <section className="glass-panel results-hero overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <span className="eyebrow">
            <span className="accent-dot" aria-hidden="true" />
            results // research-grade · 300 ข้อ
          </span>
          <h1 className="display-title mt-6 text-4xl sm:text-5xl">รายงานระดับวิจัย OCEAN</h1>
          <p className="body-soft mt-4 max-w-2xl text-base leading-8">
            ผลจากแบบทดสอบ IPIP-NEO-300 วิเคราะห์บุคลิกภาพ 30 ลักษณะย่อยด้วยความแม่นยำระดับวิจัย
          </p>
        </section>

        <div className="results-layout grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="results-main space-y-6">
            <DomainScores pct={scores.domains.pct} />
            <FacetScores facets={scores.facets} />
            <ReportPanel
              report={report}
              loading={loading}
              error={error}
              fakeProgress={fakeProgress}
              loadingSeconds={loadingSeconds}
              eyebrowText="รายงาน AI ระดับวิจัย"
              titleText="รายงานวิเคราะห์บุคลิกภาพ"
              loadingMessage={loadingMessage}
              estimatedTime="3-5 นาที"
              onRetry={() => triggerStreamReport(scores, accessToken, sessionStorage.getItem('ocean_profile_id_300'))}
            />
          </div>

          <aside className="results-side space-y-6">
            <SidebarScores pct={scores.domains.pct} />

            {inviteCode && inviteShareStatus !== 'declined' && (
              <InviteShareCard
                inviteCode={inviteCode}
                inviteOwner={inviteOwner}
                status={inviteShareStatus}
                shareDescription="30 ลักษณะย่อย"
                onShare={handleInviteShare}
                onDecline={handleInviteDecline}
              />
            )}

            <div className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">การใช้งาน</p>
              <div className="mt-4 space-y-3">
                <Link href="/dashboard" className="primary-button w-full justify-center text-sm">
                  ไปที่ Dashboard →
                </Link>
              </div>
            </div>

            <p className="body-faint px-2 text-center text-xs leading-[1.5]">
              อ้างอิง: IPIP-NEO-300 · Goldberg et al. (2006) · ipip.ori.org
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
