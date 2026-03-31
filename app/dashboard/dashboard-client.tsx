'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/utils/supabase/client'
import { DIMENSION_INFO } from '@/lib/scoring'
import { FACET_NAMES } from '@/lib/scoring120'
import {
  FACTOR_ORDER,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  buildDashboardStripGradient,
  type Factor,
} from '@/lib/ocean-constants'
import { computeGroupDynamics } from '@/lib/group-dynamics'
import { normalizeMarkdown } from '@/lib/markdown'
import { isPublicDevEmail } from '@/lib/dev-access'
import FacetAnalysisGrid from '@/components/results/facet-analysis-grid'
import {
  IconClose, IconHome, IconBarChart, IconUsers, IconUpload, IconMail,
  IconFileEdit, IconBot, IconBug, IconLogOut, IconPencil, IconTrash,
  IconCopy, IconCheck, IconUsersLg, IconDownload, IconChevronRight,
} from '@/components/icons'
import DashboardAboutContent from '@/components/dashboard/dashboard-about-content'
import CompareBarRow from '@/components/dashboard/compare-bar-row'

type Source = 'test' | 'upload' | 'shared'
type TestType = '50' | '120' | '300'
type DashboardView = 'default' | 'compare' | 'group-compare' | 'profile' | 'dev-mock-json'

type MockOceanPct = Record<Factor, number>

interface OceanProfile {
  id: string
  label: string
  source: Source
  test_type: TestType
  scores: {
    raw: Record<Factor, number>
    pct: Record<Factor, number>
    facets?: Record<string, { raw: number; pct: number }>
  }
  created_at: string
  ai_report?: string
}

const COMPARE_METHODS = [
  { value: 'general', label: 'ภาพรวม', shortLabel: 'ภาพรวม' },
  { value: 'relationship', label: 'ความสัมพันธ์', shortLabel: 'ความสัมพันธ์' },
  { value: 'teamwork', label: 'การทำงาน', shortLabel: 'การทำงาน' },
  { value: 'strengths', label: 'จุดแข็ง', shortLabel: 'จุดแข็ง' },
]
const GROUP_REPORT_METHODS = [
  { value: 'teamwork', label: 'Teamwork' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'risk', label: 'Risk & Blind Spots' },
]

const SOURCE_LABELS: Record<Source, string> = { test: 'ของฉัน', upload: 'อัปโหลด', shared: 'เพื่อน' }
const TIER_COLORS: Record<TestType, string> = {
  '50': 'bg-slate-100 text-slate-600',
  '120': 'bg-blue-50 text-blue-700',
  '300': 'bg-purple-50 text-purple-700',
}
const MIN_GROUP_MEMBERS = 3
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const DEV_MOCK_DEFAULT_PCT: MockOceanPct = { O: 50, C: 50, E: 50, A: 50, N: 50 }

export default function DashboardClient() {
  const [profiles, setProfiles] = useState<OceanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDevUser, setIsDevUser] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Selection state
  const [selectedA, setSelectedA] = useState<string | null>(null)
  const [selectedB, setSelectedB] = useState<string | null>(null)
  const [compareMethod, setCompareMethod] = useState('general')

  // Comparison state
  const [comparing, setComparing] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [compareError, setCompareError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const [activeView, setActiveView] = useState<DashboardView>('default')
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)
  const [groupSelectedIds, setGroupSelectedIds] = useState<string[]>([])
  const [groupReportMethod, setGroupReportMethod] = useState('teamwork')
  const [generatingGroupReport, setGeneratingGroupReport] = useState(false)
  const [groupReport, setGroupReport] = useState('')
  const [groupReportError, setGroupReportError] = useState<string | null>(null)
  const [groupExportingPdf, setGroupExportingPdf] = useState(false)
  const [groupExportError, setGroupExportError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [profileShareProfileId, setProfileShareProfileId] = useState<string | null>(null)
  const [profileShareLinkProfileId, setProfileShareLinkProfileId] = useState<string | null>(null)
  const [profileShareLink, setProfileShareLink] = useState<string | null>(null)
  const [profileShareCopiedProfileId, setProfileShareCopiedProfileId] = useState<string | null>(null)
  const [profileShareLoading, setProfileShareLoading] = useState(false)
  const [profileShareError, setProfileShareError] = useState<string | null>(null)
  const [profileShareNotice, setProfileShareNotice] = useState<string | null>(null)
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<OceanProfile | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null)
  const [analyzingProfileId, setAnalyzingProfileId] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [devMockPct, setDevMockPct] = useState<MockOceanPct>(DEV_MOCK_DEFAULT_PCT)
  const [devMockTestType, setDevMockTestType] = useState<TestType>('50')
  const [devMockBusy, setDevMockBusy] = useState(false)
  const [devMockError, setDevMockError] = useState<string | null>(null)
  const [devMockJsonPreview, setDevMockJsonPreview] = useState('')
  const [devMockCopied, setDevMockCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUserId(session.user.id)
      setUserEmail(session.user.email ?? null)
      setIsDevUser(isPublicDevEmail(session.user.email ?? null))
      setAccessToken(session.access_token)

      // Check payment
      await fetch('/api/checkout/verify', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      // Load profiles
      const { data } = await supabase
        .from('ocean_profiles')
        .select('id, label, source, test_type, scores, created_at, ai_report')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      const normalizedProfiles = ((data ?? []) as OceanProfile[]).map(profile => ({
        ...profile,
        ai_report: profile.ai_report ? normalizeMarkdown(profile.ai_report) : undefined,
      }))
      setProfiles(normalizedProfiles)
      setLoading(false)

      // Handle ?compareWith=<profileId> from results120 CTA
      const compareWithId = new URLSearchParams(window.location.search).get('compareWith')
      if (compareWithId && normalizedProfiles.some(p => p.id === compareWithId)) {
        setSelectedA(compareWithId)
        setActiveView('compare')
      }
    }
    void init()
  }, [])

  const profileA = profiles.find(p => p.id === selectedA)
  const profileB = profiles.find(p => p.id === selectedB)

  // Top-3 factors by absolute score delta (used for highlight bands in compare view)
  const topDeltaFactors = useMemo(() => new Set(
    profileA && profileB
      ? FACTOR_ORDER
        .map(f => ({ f, d: Math.abs((profileA.scores.pct[f] ?? 0) - (profileB.scores.pct[f] ?? 0)) }))
        .sort((a, b) => b.d - a.d)
        .slice(0, 3)
        .map(({ f }) => f)
      : []
  ), [profileA, profileB])

  useEffect(() => {
    async function loadComparison() {
      if (profileA && profileB && userId) {
        const supabase = createClient()
        const { data } = await supabase
          .from('comparisons')
          .select('ai_report')
          .eq('owner_id', userId)
          .eq('profile_a_id', profileA.id)
          .eq('profile_b_id', profileB.id)
          .eq('method', compareMethod)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data?.ai_report) {
          const normalizedReport = normalizeMarkdown(data.ai_report)
          if (normalizedReport) {
            setAiReport(normalizedReport)
          } else {
            setAiReport('')
          }
          setCompareError(null)
        } else {
          setAiReport('')
        }
      }
    }
    void loadComparison()
  }, [profileA, profileB, userId, compareMethod])

  function handleViewProfile(id: string) {
    setViewingProfileId(id)
    setActiveView('profile')
    setAnalyzeError(null)
  }

  async function handleGenerateProfileAnalysis(profileId: string) {
    if (!accessToken || analyzingProfileId) return

    setAnalyzeError(null)
    setAnalyzingProfileId(profileId)

    try {
      const res = await fetch('/api/profiles/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ profileId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'ไม่สามารถสร้างรายงานได้ในขณะนี้')
      }

      if (!res.body) {
        throw new Error('ไม่สามารถสร้างรายงานได้ในขณะนี้')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk

        setProfiles(prev => prev.map(profile => (
          profile.id === profileId
            ? { ...profile, ai_report: full }
            : profile
        )))
      }

      const normalizedReport = normalizeMarkdown(full)
      if (!normalizedReport) {
        throw new Error('ไม่สามารถสร้างรายงานได้ในขณะนี้')
      }

      setProfiles(prev => prev.map(profile => (
        profile.id === profileId
          ? { ...profile, ai_report: normalizedReport }
          : profile
      )))
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'ไม่สามารถสร้างรายงานได้ในขณะนี้')
    } finally {
      setAnalyzingProfileId(null)
    }
  }

  async function handleCompare() {
    if (!profileA || !profileB || !accessToken) return
    setComparing(true)
    setAiReport('')
    setCompareError(null)

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profileAId: profileA.id,
          profileBId: profileB.id,
          method: compareMethod,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'ไม่สามารถสร้างรายงานเปรียบเทียบได้ในขณะนี้')
      }

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setAiReport(full)
      }

      const normalizedReport = normalizeMarkdown(full)
      if (!normalizedReport) {
        throw new Error('ไม่สามารถสร้างรายงานเปรียบเทียบได้ในขณะนี้')
      }
      setAiReport(normalizedReport)
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'ไม่สามารถสร้างรายงานเปรียบเทียบได้ในขณะนี้')
    } finally {
      setComparing(false)
    }
  }

  async function handleSavePdf() {
    if (!profileA || !profileB || !aiReport) return
    setExportingPdf(true)
    setExportError(null)
    try {
      const res = await fetch('/api/compare-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            profileA: { label: profileA.label, scores: profileA.scores },
            profileB: { label: profileB.label, scores: profileB.scores },
            method: compareMethod,
            generatedAt: new Date().toISOString(),
          },
          report: aiReport,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ocean-compare-${profileA.label.slice(0, 12)}-vs-${profileB.label.slice(0, 12)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleRename(id: string, newLabel: string) {
    if (!newLabel.trim()) return
    const supabase = createClient()
    await supabase
      .from('ocean_profiles')
      .update({ label: newLabel.trim() })
      .eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, label: newLabel.trim() } : p))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('ocean_profiles').delete().eq('id', id)
    if (error) throw new Error('ไม่สามารถลบโปรไฟล์ได้ในขณะนี้')
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (selectedA === id) setSelectedA(null)
    if (selectedB === id) setSelectedB(null)
    setGroupSelectedIds(prev => prev.filter(existingId => existingId !== id))
  }

  function handleDeleteRequest(id: string) {
    const targetProfile = profiles.find(profile => profile.id === id)
    if (!targetProfile) return
    setDeleteError(null)
    setPendingDeleteProfile(targetProfile)
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteProfile) return
    setDeleteError(null)
    setDeletingProfileId(pendingDeleteProfile.id)
    try {
      await handleDelete(pendingDeleteProfile.id)
      setPendingDeleteProfile(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'ไม่สามารถลบโปรไฟล์ได้ในขณะนี้')
    } finally {
      setDeletingProfileId(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    try {
      if (!accessToken) {
        throw new Error('กรุณาเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง')
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('ไฟล์ใหญ่เกินกำหนด (สูงสุด 2 MB)')
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      let res: Response

      if (isPdf) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch('/api/profiles/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        })
      } else {
        const text = await file.text()
        const json = JSON.parse(text)

        // Validate basic structure
        if (!json.scores?.pct || typeof json.testId !== 'string') {
          throw new Error('ไฟล์ JSON ไม่ถูกต้อง — ต้องเป็นผลการทดสอบ OCEAN ที่ส่งออกจากระบบนี้')
        }

        res = await fetch('/api/profiles/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ exportData: json }),
        })
      }

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'เกิดข้อผิดพลาด')
      }

      const { profile } = await res.json()
      const normalizedProfile = profile as OceanProfile
      setProfiles(prev => [{
        ...normalizedProfile,
        ai_report: normalizedProfile.ai_report ? normalizeMarkdown(normalizedProfile.ai_report) : undefined,
      }, ...prev])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ได้')
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleInvite() {
    setInviteLoading(true)
    setInviteLink(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (res.ok) setInviteLink(data.url)
    } finally {
      setInviteLoading(false)
    }
  }

  function handleOpenUploadPicker() {
    fileInputRef.current?.click()
  }

  async function handleSharePortal() {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      return
    }

    await handleInvite()
  }

  async function handleCreateProfileShareLink(profileId: string) {
    if (!accessToken) return

    setProfileShareLoading(true)
    setProfileShareError(null)
    setProfileShareNotice(null)
    setProfileShareLink(null)
    setProfileShareLinkProfileId(null)
    setProfileShareProfileId(profileId)
    setProfileShareCopiedProfileId(null)

    try {
      const res = await fetch('/api/profile-share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ profileId }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string; url?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'ไม่สามารถสร้างลิงก์แชร์ได้ในขณะนี้')
      }
      if (!data.url) {
        throw new Error('ไม่สามารถสร้างลิงก์แชร์ได้ในขณะนี้')
      }

      setProfileShareLink(data.url)
      setProfileShareLinkProfileId(profileId)

      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
        await navigator.clipboard.writeText(data.url)
        setProfileShareCopiedProfileId(profileId)
        setProfileShareNotice('คัดลอกลิงก์แล้ว ส่งต่อให้เพื่อนได้ทันที')
        setTimeout(() => setProfileShareCopiedProfileId(current => current === profileId ? null : current), 2200)
      } catch {
        setProfileShareNotice('สร้างลิงก์แล้ว แต่เบราว์เซอร์ยังไม่คัดลอกให้ แตะปุ่มคัดลอกหรือคัดลอกเองจากช่องด้านล่างได้')
      }
    } catch (err) {
      setProfileShareLink(null)
      setProfileShareLinkProfileId(null)
      setProfileShareNotice(null)
      setProfileShareError(err instanceof Error ? err.message : 'ไม่สามารถสร้างลิงก์แชร์ได้ในขณะนี้')
    } finally {
      setProfileShareLoading(false)
    }
  }

  async function handleCopyProfileShareLink(url: string, profileId: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setProfileShareCopiedProfileId(profileId)
      setProfileShareNotice('คัดลอกลิงก์แล้ว ส่งต่อให้เพื่อนได้ทันที')
      setTimeout(() => setProfileShareCopiedProfileId(current => current === profileId ? null : current), 2200)
    } catch {
      setProfileShareCopiedProfileId(null)
      setProfileShareNotice('คัดลอกอัตโนมัติไม่สำเร็จ คัดลอกจากช่องลิงก์ด้านล่างได้เลย')
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function toggleGroupMember(id: string) {
    setGroupSelectedIds(prev => (
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    ))
  }

  function removeGroupMember(id: string) {
    setGroupSelectedIds(prev => prev.filter(existingId => existingId !== id))
  }

  function clearGroupSelection() {
    setGroupSelectedIds([])
  }

  async function handleGenerateGroupReport() {
    if (!accessToken || !canAnalyzeGroup) return

    setGeneratingGroupReport(true)
    setGroupReport('')
    setGroupReportError(null)
    setGroupExportError(null)

    try {
      const res = await fetch('/api/group-compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profileIds: groupMembers.map(member => member.id),
          method: groupReportMethod,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'ไม่สามารถสร้างรายงานกลุ่มได้ในขณะนี้')
      }
      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setGroupReport(full)
      }

      const normalizedReport = normalizeMarkdown(full)
      if (!normalizedReport) {
        throw new Error('ไม่สามารถสร้างรายงานกลุ่มได้ในขณะนี้')
      }
      setGroupReport(normalizedReport)
    } catch (err) {
      setGroupReportError(err instanceof Error ? err.message : 'ไม่สามารถสร้างรายงานกลุ่มได้ในขณะนี้')
    } finally {
      setGeneratingGroupReport(false)
    }
  }

  async function handleSaveGroupPdf() {
    if (!groupDynamics || !groupReport || groupMembers.length < MIN_GROUP_MEMBERS) return
    setGroupExportingPdf(true)
    setGroupExportError(null)

    try {
      const res = await fetch('/api/group-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            members: groupMembers.map(member => ({
              label: member.label,
              testType: member.test_type,
              scores: { pct: member.scores.pct },
            })),
            method: groupReportMethod,
            generatedAt: new Date().toISOString(),
            metrics: {
              teamBalanceIndex: groupDynamics.teamBalanceIndex,
              executionStrength: groupDynamics.executionStrength,
              innovationPivot: groupDynamics.innovationPivot,
              socialCohesion: groupDynamics.socialCohesion,
            },
          },
          report: groupReport,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ocean-group-dynamics-${groupMembers.length}-members.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setGroupExportError(err instanceof Error ? err.message : 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้')
    } finally {
      setGroupExportingPdf(false)
    }
  }

  function handleDevMockSliderChange(factor: Factor, value: number) {
    setDevMockPct(prev => ({ ...prev, [factor]: value }))
  }

  function randomizeDevMockPct() {
    const randomized = FACTOR_ORDER.reduce((acc, factor) => {
      acc[factor] = Math.floor(Math.random() * 101)
      return acc
    }, {} as MockOceanPct)
    setDevMockPct(randomized)
  }

  async function requestDevMock(action: 'generate' | 'import') {
    if (!accessToken) {
      throw new Error('กรุณาเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง')
    }

    const res = await fetch('/api/dev/mock-ocean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action,
        testType: devMockTestType,
        pct: devMockPct,
      }),
    })

    const body = await res.json().catch(() => ({})) as {
      error?: string
      exportData?: unknown
      profile?: OceanProfile
    }

    if (!res.ok) {
      throw new Error(body.error ?? 'ไม่สามารถสร้าง mock JSON ได้ในขณะนี้')
    }

    if (!body.exportData) {
      throw new Error('ไม่พบข้อมูล mock JSON จากเซิร์ฟเวอร์')
    }

    const exportDataText = JSON.stringify(body.exportData, null, 2)
    setDevMockJsonPreview(exportDataText)
    return { exportData: body.exportData, profile: body.profile ?? null }
  }

  function downloadDevMockJson(exportData: unknown) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocean-mock-${devMockTestType}-${ts}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDevMockDownload() {
    setDevMockBusy(true)
    setDevMockError(null)
    try {
      const { exportData } = await requestDevMock('generate')
      downloadDevMockJson(exportData)
    } catch (err) {
      setDevMockError(err instanceof Error ? err.message : 'ไม่สามารถดาวน์โหลด mock JSON ได้')
    } finally {
      setDevMockBusy(false)
    }
  }

  async function handleDevMockGenerateImport() {
    setDevMockBusy(true)
    setDevMockError(null)
    try {
      const { profile } = await requestDevMock('import')
      if (profile) {
        const normalizedProfile = profile as OceanProfile
        setProfiles(prev => [{
          ...normalizedProfile,
          ai_report: normalizedProfile.ai_report ? normalizeMarkdown(normalizedProfile.ai_report) : undefined,
        }, ...prev])
      }
    } catch (err) {
      setDevMockError(err instanceof Error ? err.message : 'ไม่สามารถสร้างและนำเข้า mock JSON ได้')
    } finally {
      setDevMockBusy(false)
    }
  }

  async function handleCopyDevMockJson() {
    if (!devMockJsonPreview) return
    try {
      await navigator.clipboard.writeText(devMockJsonPreview)
      setDevMockCopied(true)
      setTimeout(() => setDevMockCopied(false), 1800)
    } catch {
      window.prompt('คัดลอก JSON นี้', devMockJsonPreview)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const myTests = profiles.filter(p => p.source === 'test')
  const uploaded = profiles.filter(p => p.source === 'upload')
  const shared = profiles.filter(p => p.source === 'shared')
  const groupMembers = useMemo(
    () => groupSelectedIds
      .map(id => profiles.find(profile => profile.id === id))
      .filter((profile): profile is OceanProfile => Boolean(profile)),
    [groupSelectedIds, profiles]
  )
  const groupDynamics = useMemo(
    () => computeGroupDynamics(groupMembers.map(member => ({
      id: member.id,
      label: member.label,
      pct: member.scores.pct,
    }))),
    [groupMembers]
  )
  const groupMetrics = groupDynamics ? [
    {
      key: 'execution',
      title: 'Execution Strength',
      score: groupDynamics.executionStrength.score,
      label: groupDynamics.executionStrength.label,
      color: 'hsl(210,55%,52%)',
    },
    {
      key: 'innovation',
      title: 'Innovation Pivot',
      score: groupDynamics.innovationPivot.score,
      label: groupDynamics.innovationPivot.label,
      color: 'hsl(268,45%,55%)',
    },
    {
      key: 'social',
      title: 'Social Cohesion',
      score: groupDynamics.socialCohesion.score,
      label: groupDynamics.socialCohesion.label,
      color: 'hsl(158,50%,42%)',
    },
  ] : []
  const canAnalyzeGroup = groupMembers.length >= MIN_GROUP_MEMBERS && Boolean(groupDynamics)
  const groupSelectionSignature = groupMembers.map(member => member.id).join('|')

  useEffect(() => {
    setGroupReport('')
    setGroupReportError(null)
    setGroupExportError(null)
  }, [groupSelectionSignature])

  useEffect(() => {
    setGroupReport('')
    setGroupReportError(null)
    setGroupExportError(null)
  }, [groupReportMethod])

  const navActive = 'bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold'
  const navIdle = 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'

  return (
    <main id="main" className="page-shell dashboard-unified-bg dashboard-page lg:h-dvh lg:overflow-hidden lg:!p-0">

      {/* ── Mobile tab navigation (hidden on desktop) ─────────── */}
      <div className="lg:hidden sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur-sm">
        <div className="relative">
        <div className="flex overflow-x-auto scrollbar-hidden pr-10">
          <button
            onClick={() => { setActiveView('default'); setViewingProfileId(null) }}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm shrink-0 border-b-2 transition-colors font-medium ${activeView === 'default' || activeView === 'profile' ? 'border-[var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-slate-400'}`}
          >
            <IconHome />
            <span>โปรไฟล์</span>
          </button>
          <button
            onClick={() => { setActiveView('compare'); setViewingProfileId(null) }}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm shrink-0 border-b-2 transition-colors font-medium ${activeView === 'compare' ? 'border-[var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-slate-400'}`}
          >
            <IconBarChart />
            <span>เปรียบเทียบ</span>
          </button>
          <button
            onClick={() => { setActiveView('group-compare'); setViewingProfileId(null) }}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm shrink-0 border-b-2 transition-colors font-medium ${activeView === 'group-compare' ? 'border-[var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-slate-400'}`}
          >
            <IconUsers />
            <span>กลุ่ม</span>
          </button>
          <label className={`flex items-center gap-1.5 px-4 py-3 text-sm shrink-0 border-b-2 border-transparent text-slate-400 cursor-pointer`}>
            <IconUpload />
            <span>นำเข้า</span>
            <input ref={fileInputRef} type="file" accept=".json,.pdf,application/json,application/pdf" className="sr-only" onChange={handleUpload} />
          </label>
          <button
            onClick={handleInvite}
            className="flex items-center gap-1.5 px-4 py-3 text-sm shrink-0 border-b-2 border-transparent text-slate-400"
          >
            <IconMail />
            <span>เชิญ</span>
          </button>
        </div>
        {/* Scroll-more hint: right fade + chevron */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 flex items-center justify-end pr-2.5 text-slate-300"
          style={{ background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.97) 55%)' }}>
          <IconChevronRight />
        </div>
        </div>
        {/* Invite link inline display for mobile */}
        {inviteLink && (
          <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
            <input readOnly value={inviteLink} className="flex-1 bg-white border border-green-200 rounded px-2 py-1 text-[11px] text-green-800 focus:outline-none" />
            <button
              onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className={`flex items-center justify-center w-7 h-7 rounded shrink-0 ${copied ? 'bg-green-100 text-green-600' : 'bg-green-600 text-white'}`}
            >
              {copied ? <IconCheck /> : <IconCopy />}
            </button>
          </div>
        )}
        {uploadError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between gap-2">
            <p className="text-[11px] text-red-600 leading-tight">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="text-[11px] text-red-400 underline shrink-0">ปิด</button>
          </div>
        )}
      </div>

      <div className="page-wrap max-w-7xl lg:max-w-none lg:h-full">
        <div className="grid gap-4 lg:gap-3 lg:h-full lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">

          {/* ── Left Sidebar (desktop only) ─────────────────────── */}
          <aside className="hidden lg:block space-y-4 lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:py-3 lg:pl-3 scrollbar-hidden">
            <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-6 shadow-none">
              <Image
                src="/logo_b5.png"
                alt="B5 logo"
                width={404}
                height={393}
                className="mb-3 h-auto w-11"
              />
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                OCEAN DASHBOARD
              </span>

              <nav className="mt-6 flex flex-col gap-0.5">
                <button
                  onClick={() => { setActiveView('default'); setViewingProfileId(null) }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'default' || activeView === 'profile' ? navActive : navIdle}`}
                >
                  <IconHome />
                  <span>โปรไฟล์</span>
                </button>

                <button
                  onClick={() => { setActiveView('compare'); setViewingProfileId(null) }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'compare' ? navActive : navIdle}`}
                >
                  <IconBarChart />
                  <span>เปรียบเทียบ</span>
                </button>

                <button
                  onClick={() => { setActiveView('group-compare'); setViewingProfileId(null) }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'group-compare' ? navActive : navIdle}`}
                >
                  <IconUsers />
                  <span>พลวัตกลุ่ม</span>
                </button>

                <div className="pt-4 pb-1 px-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">เครื่องมือ</span>
                </div>

                <label className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-sm ${navIdle}`}>
                  <IconUpload />
                  <span>อัปโหลด JSON/PDF</span>
                  <input ref={fileInputRef} type="file" accept=".json,.pdf,application/json,application/pdf" className="sr-only" onChange={handleUpload} />
                </label>

                <button
                  onClick={handleInvite}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${navIdle}`}
                >
                  <IconMail />
                  <span>{inviteLoading ? 'กำลังสร้าง...' : 'เชิญเพื่อนทดสอบ'}</span>
                </button>

                {inviteLink && (
                  <div className="mx-1 mt-1 p-3 rounded-xl bg-green-50 border border-green-100 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-green-700 uppercase mb-1">ลิ้งก์คำเชิญ</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteLink}
                        className="flex-1 bg-white border border-green-200 rounded px-2 py-1 text-[10px] text-green-800 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLink)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className={`flex items-center justify-center w-7 h-7 rounded transition-colors shrink-0 ${copied ? 'bg-green-100 text-green-600' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        title="คัดลอก"
                      >
                        {copied ? <IconCheck /> : <IconCopy />}
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mx-1 mt-1 p-3 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold text-red-700 uppercase mb-1">เกิดข้อผิดพลาด</p>
                    <p className="text-[10px] text-red-600 leading-tight">{uploadError}</p>
                    <button
                      onClick={() => setUploadError(null)}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-700 underline"
                    >
                      ปิด
                    </button>
                  </div>
                )}

                <Link
                  href="/quiz120"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${navIdle}`}
                >
                  <IconFileEdit />
                  <span>ทดสอบ 120/300 ข้อ</span>
                </Link>

                {isDevUser && (
                  <button
                    onClick={() => { setActiveView('dev-mock-json'); setViewingProfileId(null) }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'dev-mock-json' ? navActive : navIdle}`}
                  >
                    <IconBug />
                    <span>Dev: Mock JSON</span>
                  </button>
                )}

                <button
                  disabled
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl opacity-35 cursor-not-allowed text-sm text-slate-500"
                >
                  <IconBot />
                  <span>AI Consult (Soon)</span>
                </button>

                <button
                  disabled
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl opacity-35 cursor-not-allowed text-sm text-slate-500"
                >
                  <IconBug />
                  <span>แจ้งบั๊ก (Report Bug)</span>
                </button>

                <div className="pt-3 pb-1">
                  <hr className="border-[var(--line)]" />
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-sm text-slate-500"
                >
                  <IconLogOut />
                  <span>ออกจากระบบ</span>
                </button>
              </nav>

              <div className="mt-8">
                <div className="mb-3 px-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-slate-600">คลังโปรไฟล์</p>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {profiles.length} รายการ
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">เลือกรายการเพื่อเปิดดูผลวิเคราะห์</p>
                </div>
                {loading ? (
                  <p className="px-3.5 body-soft text-xs italic">กำลังโหลด...</p>
                ) : (
                  <div className="space-y-2.5">
                    {myTests.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.test}
                        profiles={myTests}
                        viewingProfileId={viewingProfileId}
                        editingId={editingId}
                        editLabel={editLabel}
                        onView={handleViewProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDeleteRequest}
                      />
                    )}
                    {uploaded.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.upload}
                        profiles={uploaded}
                        viewingProfileId={viewingProfileId}
                        editingId={editingId}
                        editLabel={editLabel}
                        onView={handleViewProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDeleteRequest}
                      />
                    )}
                    {shared.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.shared}
                        profiles={shared}
                        viewingProfileId={viewingProfileId}
                        editingId={editingId}
                        editLabel={editLabel}
                        onView={handleViewProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDeleteRequest}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Right Panel ──────────────────────────────────────── */}
          <div className="space-y-5 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:py-3 lg:pr-3 scrollbar-hidden">
            {activeView === 'default' && (
              <div className="hidden lg:block glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none sm:px-8 sm:py-10">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="display-title text-3xl sm:text-4xl">OCEAN Dashboard</h2>
                  {profiles.length > 0 && (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-faint)]">{profiles.length} โปรไฟล์</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--text-soft)]">เครื่องมือวิเคราะห์บุคลิกภาพระดับสากล เพื่อความเข้าใจตนเองและทีมงาน</p>
                <DashboardAboutContent />
              </div>
            )}

            {activeView === 'default' && (
              <div className="lg:hidden glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="display-title text-3xl">OCEAN Dashboard</h2>
                  {profiles.length > 0 && (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-faint)]">{profiles.length} โปรไฟล์</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--text-soft)]">เริ่มต้นจากทางลัดด้านล่าง แล้วค่อยกลับมาจัดการคลังโปรไฟล์ของคุณ</p>

                <div className="mt-6 space-y-3">
                  <section className="rounded-[1.75rem] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-[var(--accent-strong)]"
                        style={{ background: 'rgba(23,49,61,0.08)' }}
                      >
                        <IconFileEdit />
                      </div>
                      <Link
                        href="/dashboard/about"
                        className="text-[11px] font-semibold text-[var(--accent-strong)] underline underline-offset-4"
                      >
                        ดูคำอธิบาย
                      </Link>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-800">Take Test</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      เริ่มทำแบบทดสอบฟรี หรือไปยังเวอร์ชันเชิงลึกสำหรับสมาชิกได้จากตรงนี้
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href="/quiz" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-xs font-semibold text-white">
                        50 ฟรี
                      </Link>
                      <Link href="/quiz120" className="rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-main)]">
                        120 ข้อ
                      </Link>
                      <Link href="/quiz300" className="rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-main)]">
                        300 ข้อ
                      </Link>
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={handleOpenUploadPicker}
                    className="w-full rounded-[1.75rem] bg-white p-5 text-left transition-all hover:shadow-sm"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-emerald-600"
                      style={{ background: 'rgba(16,185,129,0.08)' }}
                    >
                      <IconUpload />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-800">Upload</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      อัปโหลดผลลัพธ์ JSON หรือ PDF ที่มีอยู่แล้วเข้าคลังโปรไฟล์ได้ทันที
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { void handleSharePortal() }}
                    className="w-full rounded-[1.75rem] bg-white p-5 text-left transition-all hover:shadow-sm"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-violet-500"
                      style={{ background: 'rgba(139,92,246,0.08)' }}
                    >
                      <IconMail />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-800">Share</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      {inviteLink
                        ? 'คัดลอกลิงก์เชิญเพื่อแชร์ให้เพื่อนทำแบบทดสอบและส่งผลกลับมาได้เลย'
                        : 'สร้างลิงก์เชิญแล้วแชร์ให้เพื่อนเข้ามาทำแบบทดสอบเพื่อเปรียบเทียบกัน'}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-[var(--accent-strong)]">
                      {inviteLoading ? 'กำลังสร้างลิงก์...' : inviteLink ? 'คัดลอกลิงก์เชิญ' : 'สร้างลิงก์เชิญ'}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Mobile profile card grid (default view, desktop uses sidebar) ── */}
            {activeView === 'default' && (
              <div className="lg:hidden">
                {loading ? (
                  <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none text-center">
                    <p className="body-soft text-sm">กำลังโหลด...</p>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none text-center">
                    <p className="text-sm font-medium text-slate-700">ยังไม่มีโปรไฟล์</p>
                    <p className="body-soft mt-1 text-xs">ทำแบบทดสอบหรือเชิญเพื่อนเพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  <div>
                    <hr className="fold-divider mb-5" />
                    <div className="grid grid-cols-1 gap-3">
                      {profiles.map(p => {
                        const dominantFactor = FACTOR_ORDER.reduce((best, f) => p.scores.pct[f] > p.scores.pct[best] ? f : best, FACTOR_ORDER[0])
                        const sourceLabel = SOURCE_LABELS[p.source]
                        const date = new Date(p.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                        const isEditing = editingId === p.id
                        const dominantColor = DOMAIN_COLORS[dominantFactor as Factor].barColor
                        const cardBg = (() => {
                          if (p.test_type === '50') return dominantColor
                          return buildDashboardStripGradient(p.scores.pct, dominantFactor)
                        })()
                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl p-5 transition-all overflow-hidden"
                            style={{ background: cardBg }}
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <span className="pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                                {DOMAIN_LABELS[dominantFactor as Factor].sublabel}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white">
                                  {p.test_type} ข้อ
                                </span>
                                {!isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setEditingId(p.id)
                                        setEditLabel(p.label)
                                      }}
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/16 text-white/90 transition-colors hover:bg-white/24"
                                      title="แก้ไขชื่อ"
                                      aria-label={`แก้ไขชื่อ ${p.label}`}
                                    >
                                      <IconPencil />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleDeleteRequest(p.id)
                                      }}
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/16 text-white/90 transition-colors hover:bg-white/24"
                                      title="ลบ"
                                      aria-label={`ลบ ${p.label}`}
                                    >
                                      <IconTrash />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="space-y-3">
                                <input
                                  autoFocus
                                  value={editLabel}
                                  onChange={(event) => setEditLabel(event.target.value)}
                                  onBlur={() => void handleRename(p.id, editLabel)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') void handleRename(p.id, editLabel)
                                    if (event.key === 'Escape') {
                                      setEditingId(null)
                                      setEditLabel(p.label)
                                    }
                                  }}
                                  className="w-full rounded-xl border border-white/30 bg-white/14 px-3 py-2.5 text-sm font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-white/45"
                                  placeholder="ตั้งชื่อโปรไฟล์"
                                />
                                <p className="text-[11px] text-white/60">{sourceLabel} · {date}</p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleViewProfile(p.id)}
                                className="block w-full text-left active:scale-[0.99]"
                              >
                                <p className="font-semibold text-white truncate" style={{ fontSize: 'clamp(0.9rem, 3vw, 1.05rem)' }}>{p.label}</p>
                                <p className="mt-1.5 text-[11px] text-white/60">{sourceLabel} · {date}</p>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'compare' && (
              <>
                {/* ── Profile Selection ── */}
                <div className="glass-panel relative z-10 rounded-2xl border border-[var(--line)] bg-transparent shadow-none">
                  <div className="px-6 pt-5 pb-4 border-b border-[var(--line)]">
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">เปรียบเทียบโปรไฟล์</h2>
                    <p className="text-[11px] text-[var(--text-faint)] mt-0.5">เลือกสองโปรไฟล์เพื่อเปรียบเทียบบุคลิกภาพ</p>
                    {/* Method chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {COMPARE_METHODS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => { setCompareMethod(m.value); setAiReport(''); setCompareError(null) }}
                          className={`choice-chip text-xs ${compareMethod === m.value ? 'active' : ''}`}
                        >
                          {m.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-3">
                      <ProfileCombobox
                        slot="A"
                        profile={profileA}
                        profiles={profiles}
                        otherSelectedId={selectedB}
                        color="blue"
                        onSelect={(id: string) => { setSelectedA(id); setAiReport(''); setCompareError(null) }}
                        onClear={() => setSelectedA(null)}
                      />
                      <div className="flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">VS</span>
                      </div>
                      <ProfileCombobox
                        slot="B"
                        profile={profileB}
                        profiles={profiles}
                        otherSelectedId={selectedA}
                        color="purple"
                        onSelect={(id: string) => { setSelectedB(id); setAiReport(''); setCompareError(null) }}
                        onClear={() => setSelectedB(null)}
                      />
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      {(!profileA || !profileB) && (
                        <p className="text-xs text-[var(--text-faint)] flex-1">
                          {!profileA && !profileB ? 'เลือกโปรไฟล์ทั้งสองช่องเพื่อเริ่มต้น' : 'เลือกอีกหนึ่งโปรไฟล์เพื่อเปรียบเทียบ'}
                        </p>
                      )}
                      <button
                        onClick={handleCompare}
                        disabled={!profileA || !profileB || comparing}
                        className="primary-button ml-auto text-sm"
                      >
                        {comparing ? 'กำลังวิเคราะห์…' : 'เปรียบเทียบ'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Score Bars ── */}
                {(profileA || profileB) && (
                  <div className="glass-panel rounded-2xl border border-[var(--line)] bg-transparent px-6 py-6 shadow-none">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">คะแนน 5 มิติ</h2>
                      <div className="flex flex-wrap items-center justify-end gap-3 text-[10px] font-medium text-[var(--text-soft)]">
                        {profileA && (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-1.5 w-5 rounded-full"
                              style={{ background: 'rgba(69,98,118,0.82)' }}
                            />
                            สีเข้ม = {profileA.label}
                          </span>
                        )}
                        {profileB && (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-1.5 w-5 rounded-full"
                              style={{ background: 'rgba(69,98,118,0.38)' }}
                            />
                            สีอ่อน = {profileB.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {FACTOR_ORDER.map(factor => {
                        const info = DIMENSION_INFO[factor]
                        const aScore = profileA?.scores.pct[factor]
                        const bScore = profileB?.scores.pct[factor]
                        const delta = aScore !== undefined && bScore !== undefined ? aScore - bScore : null
                        const isTopDelta = topDeltaFactors.has(factor)

                        return (
                          <CompareBarRow
                            key={factor}
                            factor={factor}
                            label={info.label}
                            scoreA={aScore}
                            scoreB={bScore}
                            delta={delta}
                            highlighted={isTopDelta}
                            showMedallion
                          />
                        )
                      })}
                    </div>

                    {profileA?.scores.facets && profileB?.scores.facets && (
                      <div className="mt-4 border-t border-[var(--line)] pt-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>ลักษณะย่อย 30 ด้าน</p>
                        {FACTOR_ORDER.map(factor => {
                          const facetEntries = Object.entries(FACET_NAMES).filter(([code]) => code.startsWith(factor))
                          if (facetEntries.length === 0) return null
                          const factorInfo = DIMENSION_INFO[factor]
                          return (
                            <details key={factor} className="rounded-xl border border-[var(--line)] overflow-hidden">
                              <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold select-none flex items-center gap-2" style={{ color: 'var(--text-main)', background: 'var(--page-surface)' }}>
                                <span className="factor-medallion shrink-0" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.6rem' }}><span>{factor}</span></span>
                                {factorInfo.label}
                              </summary>
                              <div className="px-4 py-2 space-y-1 bg-white">
                                {facetEntries.map(([code, name]) => {
                                  const aFacet = profileA.scores.facets?.[code]
                                  const bFacet = profileB?.scores.facets?.[code]
                                  return (
                                    <CompareBarRow
                                      key={code}
                                      factor={factor}
                                      code={code}
                                      label={name}
                                      scoreA={aFacet?.pct}
                                      scoreB={bFacet?.pct}
                                      compact
                                    />
                                  )
                                })}
                              </div>
                            </details>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {profileA && !profileB && profileA.ai_report && (
                  <div className="glass-panel rounded-2xl border border-[var(--line)] bg-transparent px-6 py-6 shadow-none">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] mb-4">รายงาน AI เชิงลึก</h2>
                    <div className="report-markdown">
                      <ReactMarkdown>{profileA.ai_report}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {profileA && profileB && (comparing || aiReport || compareError) && (
                  <div className="glass-panel rounded-2xl border border-[var(--line)] bg-transparent px-6 py-6 shadow-none">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">รายงาน AI เปรียบเทียบ</h2>
                      {aiReport && !comparing && (
                        <button
                          onClick={handleSavePdf}
                          disabled={exportingPdf}
                          className="secondary-button min-h-0 px-4 py-2 text-xs"
                        >
                          {exportingPdf ? 'กำลังสร้าง PDF…' : 'บันทึก PDF'}
                        </button>
                      )}
                    </div>
                    {exportError && <p className="text-xs text-red-500 mb-3">{exportError}</p>}
                    {compareError && <p className="text-xs text-red-500 mb-3">{compareError}</p>}
                    {comparing && !aiReport && <p className="body-soft text-sm animate-pulse">กำลังวิเคราะห์…</p>}
                    {aiReport && (
                      <div className="report-markdown">
                        <ReactMarkdown>{aiReport}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeView === 'group-compare' && (
              <div className="space-y-5">
                <div className="glass-panel relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-transparent px-8 py-10 text-center shadow-none">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)]" style={{ background: 'rgba(95,116,130,0.09)' }}>
                    <IconUsersLg />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-800">Group Dynamics Analysis</h2>
                  <p className="mt-4 text-slate-500 max-w-md mx-auto leading-relaxed text-sm">
                    Analyze how multiple people interact within a group. Identify collective strengths, potential blind spots, and cultural alignment.
                  </p>
                </div>

                <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-6 shadow-none sm:px-8 sm:py-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Select Group Members</h3>
                      <p className="mt-1 text-xs text-slate-500">Choose profiles from your library to compute team dynamics.</p>
                    </div>
                    {groupSelectedIds.length > 0 && (
                      <button
                        onClick={clearGroupSelection}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-white"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {profiles.length === 0 ? (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-xs text-slate-500">
                      No profiles available yet. Complete or upload a test result first.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {profiles.map(profile => {
                        const selected = groupSelectedIds.includes(profile.id)
                        const { primary, secondary } = getProfileDisplayText(profile)
                        return (
                          <button
                            key={profile.id}
                            onClick={() => toggleGroupMember(profile.id)}
                            aria-pressed={selected}
                            className={`rounded-xl border px-3 py-3 text-left transition-all ${
                              selected
                                ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_2px_rgba(69,98,118,0.18)]'
                                : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-[var(--text-main)]">{primary}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {selected && (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                                    <IconCheck />
                                  </span>
                                )}
                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${TIER_COLORS[profile.test_type]}`}>
                                  {profile.test_type}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">{SOURCE_LABELS[profile.source]} • {secondary}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-6 shadow-none sm:px-8 sm:py-7">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {groupMembers.length > 0 ? `Preview: ${groupMembers.length} Members` : 'Preview'}
                      </p>
                      <h4 className="text-2xl font-bold text-slate-800 tracking-tight">Team Balance Index</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-purple-600 tabular-nums">
                        {canAnalyzeGroup && groupDynamics ? `${groupDynamics.teamBalanceIndex.score}%` : '--'}
                      </span>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Alignment</p>
                    </div>
                  </div>

                  {groupMembers.length > 0 && (
                    <div className="mt-6 border-t border-slate-200/70 pt-5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-wide">Selected Members</span>
                        <span>{groupMembers.length} คน</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center -space-x-2">
                          {groupMembers.slice(0, 6).map(member => (
                            <div
                              key={member.id}
                              className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600"
                              title={member.label}
                            >
                              {getProfileInitials(member.label)}
                            </div>
                          ))}
                          {groupMembers.length > 6 && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold border-2 border-slate-100">
                              +{groupMembers.length - 6}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {groupMembers.map(member => (
                            <button
                              key={member.id}
                              onClick={() => removeGroupMember(member.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                              title={`Remove ${member.label}`}
                            >
                              <span className="max-w-[120px] truncate">{member.label}</span>
                              <IconClose />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profiles.length > 0 && groupMembers.length < MIN_GROUP_MEMBERS && (
                    <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
                      Select at least {MIN_GROUP_MEMBERS} profiles to unlock group analysis. Currently selected: {groupMembers.length}
                    </div>
                  )}

                  {canAnalyzeGroup && (
                    <>
                      <div className="mt-7 space-y-4">
                        {groupMetrics.map(metric => (
                          <div key={metric.key} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              <span>{metric.title}</span>
                              <span>{metric.label}</span>
                            </div>
                            <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(69,98,118,0.12)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${metric.score}%`,
                                  background: metric.color,
                                  boxShadow: `0 0 6px ${metric.color}`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="mt-7 text-xs text-slate-400 font-medium italic">
                        * Metrics are computed deterministically from selected OCEAN profiles and update in real-time as your group changes.
                      </p>

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 sm:px-5 sm:py-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h5 className="text-sm font-bold text-slate-800">AI Group Narrative</h5>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Generate an actionable team report tailored to your selected members.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              value={groupReportMethod}
                              onChange={e => setGroupReportMethod(e.target.value)}
                              disabled={generatingGroupReport}
                              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none"
                            >
                              {GROUP_REPORT_METHODS.map(method => (
                                <option key={method.value} value={method.value}>{method.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleGenerateGroupReport}
                              disabled={generatingGroupReport || !accessToken}
                              className="primary-button"
                              style={{ minHeight: '2.25rem', padding: '0.45rem 0.9rem', fontSize: '0.75rem', borderRadius: '0.7rem' }}
                            >
                              {generatingGroupReport ? 'Analyzing Group…' : 'Generate Report'}
                            </button>
                            {groupReport && !generatingGroupReport && (
                              <button
                                onClick={handleSaveGroupPdf}
                                disabled={groupExportingPdf}
                                className="primary-button"
                                style={{ minHeight: '2.25rem', padding: '0.45rem 0.9rem', fontSize: '0.75rem', borderRadius: '0.7rem' }}
                              >
                                {groupExportingPdf ? 'กำลังสร้าง PDF…' : 'Save PDF'}
                              </button>
                            )}
                          </div>
                        </div>

                        {groupReportError && (
                          <p className="mt-3 text-xs text-red-500">{groupReportError}</p>
                        )}
                        {groupExportError && (
                          <p className="mt-3 text-xs text-red-500">{groupExportError}</p>
                        )}

                        {generatingGroupReport && !groupReport && (
                          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-center">
                            <p className="text-xs text-slate-500 mb-2">AI กำลังวิเคราะห์ทีมของคุณ…</p>
                            <div className="loading-line soft" />
                          </div>
                        )}

                        {groupReport && (
                          <div className="mt-4 rounded-xl border border-slate-100 bg-white px-4 py-4">
                            <div className="report-markdown text-sm">
                              <ReactMarkdown>{groupReport}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeView === 'dev-mock-json' && isDevUser && (
              <div className="space-y-5">
                <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none sm:px-8 sm:py-10">
                  <span className="eyebrow">
                    <span className="accent-dot" aria-hidden="true" />
                    developer tools
                  </span>
                  <h2 className="display-title mt-5 text-3xl">Mock OCEAN JSON Generator</h2>
                  <p className="mt-2 text-slate-500 text-sm">
                    สร้างไฟล์ mock export สำหรับทดสอบระบบนำเข้า โดยกำหนดค่า O/C/E/A/N ได้เอง
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Signed in as {userEmail ?? 'unknown user'}
                  </p>
                </div>

                <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-7 shadow-none sm:px-8 sm:py-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-800">Input Controls</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={randomizeDevMockPct}
                        disabled={devMockBusy}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                      >
                        Randomize
                      </button>
                      <button
                        onClick={() => setDevMockPct(DEV_MOCK_DEFAULT_PCT)}
                        disabled={devMockBusy}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                      >
                        Reset 50
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {FACTOR_ORDER.map((factor) => (
                      <div key={factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{factor} • {DIMENSION_INFO[factor].label}</span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums">{devMockPct[factor]}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={devMockPct[factor]}
                          onChange={(e) => handleDevMockSliderChange(factor, Number(e.target.value))}
                          disabled={devMockBusy}
                          className="w-full accent-[var(--accent)]"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600">Test Type</label>
                    <select
                      value={devMockTestType}
                      onChange={(e) => setDevMockTestType(e.target.value as TestType)}
                      disabled={devMockBusy}
                      className="rounded-lg border border-[var(--line-strong)] bg-white px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none"
                    >
                      <option value="50">50 Items</option>
                      <option value="120">120 Items</option>
                      <option value="300">300 Items</option>
                    </select>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <button
                      onClick={handleDevMockGenerateImport}
                      disabled={devMockBusy}
                      className="primary-button"
                    >
                      {devMockBusy ? 'Working…' : 'Generate & Import'}
                    </button>
                    <button
                      onClick={handleDevMockDownload}
                      disabled={devMockBusy}
                      className="secondary-button"
                    >
                      <IconDownload />
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={handleCopyDevMockJson}
                      disabled={!devMockJsonPreview || devMockBusy}
                      className="secondary-button"
                    >
                      {devMockCopied ? <IconCheck /> : <IconCopy />}
                      <span>{devMockCopied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  {devMockError && (
                    <p className="mt-4 text-xs font-medium text-red-600">{devMockError}</p>
                  )}
                </div>

                <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-7 shadow-none sm:px-8 sm:py-8">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-800">JSON Preview</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {devMockJsonPreview ? `${devMockJsonPreview.length.toLocaleString()} chars` : 'No JSON yet'}
                    </span>
                  </div>
                  <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-100 bg-slate-950/95 p-4 text-[11px] leading-relaxed text-slate-100">
                    {devMockJsonPreview || '{\n  "hint": "Use Generate & Import or Download JSON"\n}'}
                  </pre>
                </div>
              </div>
            )}

            {activeView === 'profile' && viewingProfileId && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {(() => {
                  const p = profiles.find(prof => prof.id === viewingProfileId)
                  if (!p) return <p className="p-8 text-center text-slate-400">ไม่พบโปรไฟล์</p>

                  return (
                    <>
                      {/* Header Card */}
                      <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-7 shadow-none sm:px-8 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div>
                            <span className="eyebrow">
                              <span className="accent-dot" aria-hidden="true" />
                              Profile Details • {SOURCE_LABELS[p.source]}
                            </span>
                            <h2 className="display-title mt-4 text-3xl">{p.label}</h2>
                            <div className="mt-3 flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_COLORS[p.test_type]}`}>
                                {p.test_type} Items
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ทดสอบเมื่อ {new Date(p.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-stretch gap-2">
                            <button
                              onClick={() => void handleGenerateProfileAnalysis(p.id)}
                              disabled={Boolean(analyzingProfileId)}
                              className="secondary-button min-h-0 px-5 py-2.5 text-xs"
                            >
                              {analyzingProfileId === p.id
                                ? 'กำลังสร้างรายงาน...'
                                : p.ai_report
                                  ? 'สร้างรายงานใหม่'
                                  : 'สร้างรายงาน AI'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedA(p.id)
                                setActiveView('compare')
                                setViewingProfileId(null)
                              }}
                              className="primary-button min-h-0 px-5 py-2.5 text-xs"
                            >
                              <IconBarChart />
                              <span>เปรียบเทียบโปรไฟล์นี้</span>
                            </button>

                            {p.source === 'test' && (
                              <button
                                onClick={() => void handleCreateProfileShareLink(p.id)}
                                disabled={profileShareLoading}
                                className="secondary-button min-h-0 px-5 py-2.5 text-xs"
                              >
                                {profileShareCopiedProfileId === p.id || profileShareLinkProfileId === p.id ? <IconCheck /> : null}
                                {profileShareLoading && profileShareProfileId === p.id
                                  ? 'กำลังสร้างลิงก์...'
                                  : profileShareCopiedProfileId === p.id
                                    ? 'คัดลอกลิงก์แล้ว'
                                    : profileShareLinkProfileId === p.id
                                      ? 'ลิงก์พร้อมแชร์'
                                      : 'แชร์ให้สมาชิก'}
                              </button>
                            )}

                            {profileShareLinkProfileId === p.id && profileShareLink && (
                              <div className={`rounded-xl border px-3 py-3 ${
                                profileShareCopiedProfileId === p.id
                                  ? 'border-green-100 bg-green-50'
                                  : 'border-amber-100 bg-amber-50'
                              }`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                                  profileShareCopiedProfileId === p.id ? 'text-green-700' : 'text-amber-700'
                                }`}>
                                  {profileShareCopiedProfileId === p.id ? 'คัดลอกลิงก์แล้ว' : 'สร้างลิงก์แล้ว'}
                                </p>
                                {profileShareNotice && (
                                  <p className={`mt-1 text-[11px] leading-relaxed ${
                                    profileShareCopiedProfileId === p.id ? 'text-green-700' : 'text-amber-700'
                                  }`}>
                                    {profileShareNotice}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    readOnly
                                    value={profileShareLink}
                                    onFocus={event => event.currentTarget.select()}
                                    className="min-w-0 flex-1 rounded-lg border border-white/80 bg-white px-2.5 py-2 text-[11px] text-slate-700 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => void handleCopyProfileShareLink(profileShareLink, p.id)}
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                      profileShareCopiedProfileId === p.id
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-slate-800 text-white hover:bg-slate-900'
                                    }`}
                                    title="คัดลอกลิงก์แชร์"
                                  >
                                    {profileShareCopiedProfileId === p.id ? <IconCheck /> : <IconCopy />}
                                  </button>
                                </div>
                                <a
                                  href={profileShareLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex text-[11px] font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                                >
                                  เปิดลิงก์แชร์
                                </a>
                              </div>
                            )}

                            {profileShareProfileId === p.id && profileShareError && (
                              <p className="text-[11px] font-medium text-red-600">{profileShareError}</p>
                            )}

                            {analyzingProfileId === p.id && (
                              <p className="text-[11px] font-medium text-slate-500">AI กำลังวิเคราะห์โปรไฟล์นี้...</p>
                            )}
                            {analyzeError && viewingProfileId === p.id && (
                              <p className="text-[11px] font-medium text-red-600">{analyzeError}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Scores Card */}
                      <div className="glass-panel rounded-2xl border border-[var(--line)] bg-transparent px-6 py-7 shadow-none sm:px-8 sm:py-8">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Personality Dimensions</h3>
                          <div className="h-px flex-1 mx-6 bg-slate-100" />
                        </div>
                        
                        <div className="grid gap-x-12 gap-y-8 md:grid-cols-1">
                          {FACTOR_ORDER.map(factor => {
                            const info = DIMENSION_INFO[factor]
                            const score = p.scores.pct[factor]
                            
                            return (
                              <div key={factor} className="group">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                                      {factor}
                                    </span>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{info.label}</p>
                                      <p className="text-[11px] text-slate-400">{info.sublabel}</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-black text-slate-900 tabular-nums">{Math.round(score)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden relative">
                                  <div 
                                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000 ease-out" 
                                    style={{ 
                                      width: `${score}%`,
                                      background: `linear-gradient(90deg, var(--accent) 0%, var(--accent-strong) 100%)`
                                    }} 
                                  />
                                </div>
                                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                                  {info.description}
                                </p>
                              </div>
                            )
                          })}
                        </div>

                        {p.scores.facets && (
                          <details className="mt-10 pt-6 border-t border-slate-100 group/details">
                            <summary className="cursor-pointer flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors list-none select-none">
                              <span className="w-4 h-4 rounded border border-slate-200 flex items-center justify-center group-open/details:rotate-90 transition-transform">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2.5 1.5L5 4L2.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </span>
                              Detailed Analysis (30 Facets)
                            </summary>
                            <div className="mt-6">
                              <FacetAnalysisGrid facets={p.scores.facets} />
                            </div>
                          </details>
                        )}
                      </div>

                      {/* AI Report Card */}
                      {p.ai_report ? (
                        <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none sm:px-8 sm:py-10">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                              <IconBot />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">Deep AI Personality Analysis</h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">Generative AI Insight based on your unique profile</p>
                            </div>
                          </div>
                          <div className="report-markdown">
                            <ReactMarkdown>{p.ai_report}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-10 text-center shadow-none sm:px-8 sm:py-12">
                          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <IconBot />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">No Deep Report Available</h3>
                          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                            You haven&apos;t generated analysis for this profile yet. Click &quot;Generate Analysis&quot; to create and save it.
                          </p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

          </div>

        </div>
      </div>
      {pendingDeleteProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-800">ยืนยันการลบโปรไฟล์</h3>
            <p className="mt-2 text-sm text-slate-600">
              ต้องการลบ <span className="font-medium text-slate-800">{pendingDeleteProfile.label}</span> ใช่ไหม?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              เมื่อลบแล้วจะไม่สามารถกู้คืนจากคลังโปรไฟล์ได้
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{deleteError}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => { setPendingDeleteProfile(null); setDeleteError(null) }}
                disabled={deletingProfileId === pendingDeleteProfile.id}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                disabled={deletingProfileId === pendingDeleteProfile.id}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deletingProfileId === pendingDeleteProfile.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProfileGroup({
  title, profiles, viewingProfileId, editingId, editLabel,
  onView, onStartEdit, onSaveEdit, onEditChange, onDelete,
}: {
  title: string
  profiles: OceanProfile[]
  viewingProfileId: string | null
  editingId: string | null
  editLabel: string
  onView: (id: string) => void
  onStartEdit: (id: string, label: string) => void
  onSaveEdit: (id: string, label: string) => void
  onEditChange: (v: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold text-slate-500">{title}</p>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
          {profiles.length}
        </span>
      </div>

      <div className="space-y-1">
        {profiles.map(p => {
          const isActive = viewingProfileId === p.id
          const isEditing = editingId === p.id
          const { primary, secondary } = getProfileDisplayText(p)

          return (
            <div
              key={p.id}
              className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                isActive
                  ? 'border-blue-200 bg-[var(--accent-soft)]'
                  : 'border-transparent hover:border-slate-200 hover:bg-white'
              }`}
              onClick={() => !isEditing && onView(p.id)}
            >
              <div className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />

              {/* Label (editable) */}
              {isEditing ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={e => onEditChange(e.target.value)}
                  onBlur={() => onSaveEdit(p.id, editLabel)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') onSaveEdit(p.id, editLabel)
                    if (e.key === 'Escape') onEditChange(p.label)
                  }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 rounded-md border border-[var(--line)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-main)]">{primary}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">{secondary}</p>
                </div>
              )}

              {/* Tier badge */}
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${TIER_COLORS[p.test_type]}`}>
                {p.test_type}
              </span>

              {/* Edit/Delete buttons */}
              {!isEditing && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onStartEdit(p.id, p.label)}
                    className="text-[var(--text-faint)] hover:text-[var(--accent)] p-1 rounded transition-colors"
                    title="แก้ไขชื่อ"
                  >
                    <IconPencil />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-[var(--text-faint)] hover:text-red-500 p-1 rounded transition-colors"
                    title="ลบ"
                  >
                    <IconTrash />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getProfileDisplayText(profile: OceanProfile) {
  const parts = profile.label.split('·').map(part => part.trim()).filter(Boolean)
  const primary = parts[0] || profile.label
  const formattedDate = new Date(profile.created_at).toLocaleDateString('th-TH')
  return {
    primary,
    secondary: formattedDate,
  }
}

function getProfileInitials(label: string) {
  const words = label
    .replace(/[·•]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(Boolean)

  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase()
}

function ProfileCombobox({
  slot, profile, profiles, otherSelectedId, color, onSelect, onClear,
}: {
  slot: 'A' | 'B'
  profile: OceanProfile | undefined
  profiles: OceanProfile[]
  otherSelectedId: string | null
  color: 'blue' | 'purple'
  onSelect: (id: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const available = profiles.filter(p => p.id !== otherSelectedId)
  const filtered = query.trim()
    ? available.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : available

  const groups: { source: Source; label: string }[] = [
    { source: 'test', label: 'ของฉัน' },
    { source: 'upload', label: 'อัปโหลด' },
    { source: 'shared', label: 'เพื่อน' },
  ]

  const s = color === 'blue'
    ? { filled: 'border-blue-200 bg-blue-50', badge: 'bg-blue-500 text-white', name: 'text-blue-900', sub: 'text-blue-500', close: 'text-blue-400 hover:text-blue-700' }
    : { filled: 'border-purple-200 bg-purple-50', badge: 'bg-purple-500 text-white', name: 'text-purple-900', sub: 'text-purple-500', close: 'text-purple-400 hover:text-purple-700' }

  if (profile) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border ${s.filled} px-4 py-3 min-h-[84px]`}>
        <div className={`w-7 h-7 rounded-full ${s.badge} flex items-center justify-center text-[10px] font-bold shrink-0`}>{slot}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${s.name} truncate`}>{profile.label}</p>
          <p className={`text-[10px] ${s.sub} mt-0.5`}>{profile.test_type} items</p>
        </div>
        <button onClick={onClear} className={`${s.close} shrink-0 p-1 transition-colors`} title="Remove"><IconClose /></button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 px-4 text-center min-h-[84px] transition-all ${open ? 'border-[var(--accent)] bg-white' : 'border-[var(--line-strong)] bg-[var(--page-surface)] hover:bg-white hover:border-slate-300'}`}
      >
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">{slot}</div>
        <p className="text-[11px] font-medium text-[var(--text-soft)]">Profile {slot}</p>
        <p className="text-[10px] text-[var(--text-faint)]">Click to search…</p>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-[var(--line-strong)] bg-white overflow-hidden"
          style={{ boxShadow: '0 8px 28px rgba(15,23,42,0.12)' }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--line)]">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" className="text-slate-400 shrink-0">
              <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
              placeholder="Search profiles…"
              className="flex-1 py-0.5 text-xs bg-transparent focus:outline-none text-[var(--text-main)] placeholder:text-[var(--text-faint)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconClose />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {groups.map(({ source, label }) => {
              const group = filtered.filter(p => p.source === source)
              if (!group.length) return null
              return (
                <div key={source}>
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-faint)]">{label}</p>
                  {group.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onSelect(p.id); setOpen(false); setQuery('') }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="flex-1 text-xs text-[var(--text-main)] truncate">{p.label}</span>
                      <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium shrink-0 ${TIER_COLORS[p.test_type]}`}>{p.test_type}</span>
                    </button>
                  ))}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-5 text-xs text-center text-[var(--text-faint)]">
                {profiles.length === 0 ? 'No profiles yet — take a test first.' : 'No results'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
