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

export default function Results120Client() {
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
      if (!raw) { router.replace('/quiz120'); return }

      try {
        const parsed = JSON.parse(raw) as FullScoreResult
        setScores(parsed)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token ?? null
        setAccessToken(token)

        if (token) {
          const verifyRes = await fetch('/api/checkout/verify', {
            headers: { Authorization: `Bearer ${token}` },
          })
          const verifyData = await verifyRes.json()
          if (verifyData.paid) setCanUpgrade(true)
        }

        const storedCode = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        const storedOwner = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        if (storedCode) { setInviteCode(storedCode); setInviteOwner(storedOwner) }

        const profileId = sessionStorage.getItem('ocean_profile_id_120')
        triggerStreamReport(parsed, token, profileId)
      } catch {
        router.replace('/quiz120')
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
        testType: '120',
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
              <Link href="/quiz300" className="primary-button inline-flex text-sm">
                ต่อยอด 300 ข้อ (ระดับวิจัย) →
              </Link>
              <p className="mt-2 text-xs text-[var(--text-faint)]">+180 ข้อ · IPIP-NEO-300 · ครอบคลุมทุกมิติลึกขึ้น</p>
            </div>
          )}
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
              eyebrowText="รายงาน AI เชิงลึก"
              titleText="รายงานวิเคราะห์บุคลิกภาพ"
              loadingMessage={loadingMessage}
              estimatedTime="2-4 นาที"
              onRetry={() => triggerStreamReport(scores, accessToken, sessionStorage.getItem('ocean_profile_id_120'))}
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
