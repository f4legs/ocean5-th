'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { type FullScoreResult } from '@/lib/scoring120'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { startStreamReport } from '@/lib/stream-report'
import { exportAsJSON, exportAsPDF } from '@/lib/export-result'
import { normalizeMarkdown } from '@/lib/markdown'
import DomainScores from '@/components/results/domain-scores'
import FacetScores from '@/components/results/facet-scores'
import ReportPanel from '@/components/results/report-panel'
import InviteShareCard from '@/components/results/invite-share-card'
import SidebarScores from '@/components/results/sidebar-scores'
import {
  IconHome, IconChevronLeft,
  IconDownload, IconFilePDF, IconAlert
} from '@/components/icons'

export default function Results120Client() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Normalise the DB-stored flat format {raw,pct,facets} → FullScoreResult {domains:{raw,pct},facets}
  function normalizeScores(raw: unknown): FullScoreResult {
    const s = raw as Record<string, unknown>
    if (s.domains) return s as unknown as FullScoreResult
    return { domains: { raw: s.raw, pct: s.pct } as FullScoreResult['domains'], facets: (s.facets ?? {}) as FullScoreResult['facets'] }
  }

  const [scores, setScores] = useState<FullScoreResult | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<Record<string, string | null> | null>(null)
  const [label, setLabel] = useState('ฉัน · 120 ข้อ')
  const [userId, setUserId] = useState<string | null>(null)
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
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [retakeConfirm, setRetakeConfirm] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? null
      setAccessToken(token)
      if (session?.user.id) setUserId(session.user.id)

      if (token) {
        const verifyRes = await fetch('/api/checkout/verify', { headers: { Authorization: `Bearer ${token}` } })
        const verifyData = await verifyRes.json()
        if (verifyData.paid) setCanUpgrade(true)
      }

      // Try URL param id first, then sessionStorage
      const urlId = searchParams.get('id')
      let resolvedScores: FullScoreResult | null = null
      let resolvedProfileId: string | null = urlId
      let hasStoredReport = false

      if (urlId) {
        // Load from Supabase by profile id
        const { data: prof } = await supabase
          .from('ocean_profiles')
          .select('scores, profile, label, ai_report')
          .eq('id', urlId)
          .maybeSingle()

        if (prof?.scores) {
          resolvedScores = normalizeScores(prof.scores)
          setLabel(prof.label ?? label)
          if (prof.profile) setProfileData(prof.profile as Record<string, string | null>)
          if (prof.ai_report) {
            const normalizedReport = normalizeMarkdown(prof.ai_report)
            if (normalizedReport) {
              setReport(normalizedReport)
              setLoading(false)
              hasStoredReport = true
            }
          }
        }
      }

      if (!resolvedScores) {
        // Fallback: sessionStorage
        const raw = sessionStorage.getItem('ocean_scores_120')
        if (!raw) { router.replace('/quiz120'); return }
        try { resolvedScores = JSON.parse(raw) as FullScoreResult } catch { router.replace('/quiz120'); return }
        resolvedProfileId = sessionStorage.getItem('ocean_profile_id_120')
      }

      if (!resolvedScores) { router.replace('/quiz120'); return }

      setScores(resolvedScores)
      setProfileId(resolvedProfileId)
      if (!profileData) {
        try {
          const saved = sessionStorage.getItem('ocean_profile_paid')
          if (saved) setProfileData(JSON.parse(saved))
        } catch { /* ignore */ }
      }

      const storedCode = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
      const storedOwner = localStorage.getItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
      if (storedCode) { setInviteCode(storedCode); setInviteOwner(storedOwner) }

      // Only trigger AI report if not already loaded from DB
      if (!hasStoredReport) {
        triggerStreamReport(resolvedScores, token, resolvedProfileId)
      }
    }
    void init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function triggerStreamReport(result: FullScoreResult, token: string | null, pid: string | null = null) {
    startStreamReport({
      url: '/api/interpret-deep',
      body: {
        domainScores: result.domains.pct,
        facetScores: result.facets,
        testType: '120',
        profileId: pid ?? undefined,
        profile: profileData ?? undefined,
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
      body: JSON.stringify({ inviteCode, scores: { pct: scores.domains.pct, facets: scores.facets }, testType: '120' }),
    }).then(res => {
      if (res.ok) {
        localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_CODE)
        localStorage.removeItem(STORAGE_KEYS.FRIEND_INVITE_OWNER)
        setInviteShareStatus('done')
      } else { setInviteShareStatus('idle') }
    }).catch(() => setInviteShareStatus('idle'))
  }

  async function handleRetake() {
    if (!retakeConfirm) { setRetakeConfirm(true); return }
    if (!userId) return
    const supabase = createClient()
    await supabase.from('quiz_drafts').delete().eq('user_id', userId).eq('test_type', '120')
    sessionStorage.removeItem('ocean_scores_120')
    sessionStorage.removeItem('ocean_profile_id_120')
    router.push('/quiz120')
  }

  async function handleExportPDF() {
    if (!scores || !report || exportingPDF) return
    setExportingPDF(true)
    setExportError(null)
    try {
      await exportAsPDF({
        testId: 'ipip-neo-120-th',
        testType: '120',
        completedAt: new Date().toISOString(),
        label,
        profile: profileData ?? null,
        scores: { raw: scores.domains.raw, pct: scores.domains.pct, facets: scores.facets },
      }, report)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'ไม่สามารถสร้าง PDF ได้')
    } finally {
      setExportingPDF(false)
    }
  }

  function handleExportJSON() {
    if (!scores) return
    exportAsJSON({
      testId: 'ipip-neo-120-th',
      testType: '120',
      completedAt: new Date().toISOString(),
      label,
      profile: profileData ?? null,
      scores: { raw: scores.domains.raw, pct: scores.domains.pct, facets: scores.facets },
    })
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
  const isReportComplete = Boolean(report) && !loading

  function renderActionsCard(className = '') {
    return (
      <div className={`section-panel rounded-[1.75rem] p-5 sm:p-6 ${className}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">การใช้งาน</p>
        <div className="mt-4 space-y-2">
          <Link href="/dashboard" className="primary-button w-full justify-center text-sm flex items-center gap-2">
            <IconHome />
            ไปที่ Dashboard
          </Link>
          {canUpgrade && (
            <Link href="/quiz300" className="secondary-button w-full justify-center text-sm">
              ต่อยอด 300 ข้อ
            </Link>
          )}
          <Link href="/quiz120?resume=1" className="secondary-button w-full justify-center text-sm flex items-center gap-2">
            <IconChevronLeft />
            กลับหน้าทดสอบ
          </Link>
          <button
            onClick={() => void handleRetake()}
            className={`w-full justify-center text-sm rounded-xl px-4 py-3 font-medium transition-all border flex items-center gap-2 ${
              retakeConfirm
                ? 'border-red-400 bg-red-50 text-red-600 hover:bg-red-100'
                : 'secondary-button opacity-60'
            }`}
          >
            {retakeConfirm ? <IconAlert /> : null}
            {retakeConfirm ? 'ยืนยัน — ข้อมูลจะถูกลบ กดอีกครั้ง' : 'ทำใหม่ 120 ข้อ'}
          </button>
          {retakeConfirm && (
            <p className="text-xs text-center text-red-500 -mt-1">
              ผลเดิมยังอยู่ใน Dashboard · Draft ของการทดสอบนี้จะถูกล้าง
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">ส่งออก</p>
          <button
            onClick={handleExportJSON}
            disabled={!isReportComplete}
            className="secondary-button w-full justify-center text-sm flex items-center gap-2"
          >
            <IconDownload />
            ดาวน์โหลด JSON
          </button>
          <button
            onClick={() => void handleExportPDF()}
            disabled={exportingPDF || !isReportComplete}
            className="secondary-button w-full justify-center text-sm flex items-center gap-2"
          >
            <IconFilePDF />
            {exportingPDF ? 'กำลังสร้าง PDF...' : loading ? 'รอรายงาน AI...' : 'ดาวน์โหลด PDF'}
          </button>
          {exportError && <p className="text-xs text-red-500 mt-1">{exportError}</p>}
        </div>
      </div>
    )
  }

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
              onRetry={() => triggerStreamReport(scores, accessToken, profileId)}
            />
            {renderActionsCard('lg:hidden')}
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

            {renderActionsCard('hidden lg:block')}

            <p className="body-faint px-2 text-center text-xs leading-[1.5]">
              อ้างอิง: IPIP-NEO-120 · Johnson (2014) · ipip.ori.org
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
