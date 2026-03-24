'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/utils/supabase/client'
import { DIMENSION_INFO } from '@/lib/scoring'
import { FACET_NAMES } from '@/lib/scoring120'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'
type Source = 'test' | 'upload' | 'shared'
type TestType = '50' | '120' | '300'

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
  { value: 'general', label: 'ภาพรวม (General)' },
  { value: 'relationship', label: 'ความสัมพันธ์ (Relationship)' },
  { value: 'teamwork', label: 'การทำงาน (Teamwork)' },
  { value: 'strengths', label: 'จุดแข็ง-จุดอ่อน (Strengths)' },
]

const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']
const SOURCE_LABELS: Record<Source, string> = { test: 'ของฉัน', upload: 'อัปโหลด', shared: 'เพื่อน' }
const TIER_COLORS: Record<TestType, string> = {
  '50': 'bg-slate-100 text-slate-600',
  '120': 'bg-blue-50 text-blue-700',
  '300': 'bg-purple-50 text-purple-700',
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<OceanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Selection state
  const [selectedA, setSelectedA] = useState<string | null>(null)
  const [selectedB, setSelectedB] = useState<string | null>(null)
  const [compareMethod, setCompareMethod] = useState('general')

  // Comparison state
  const [comparing, setComparing] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const [activeView, setActiveView] = useState<'default' | 'compare' | 'group-compare'>('default')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUserId(session.user.id)
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

      setProfiles((data ?? []) as OceanProfile[])
      setLoading(false)
    }
    void init()
  }, [])

  const profileA = profiles.find(p => p.id === selectedA)
  const profileB = profiles.find(p => p.id === selectedB)

  useEffect(() => {
    async function loadComparison() {
      if (profileA && profileB && userId && !comparing) {
        const supabase = createClient()
        const { data } = await supabase
          .from('comparisons')
          .select('ai_report')
          .eq('user_id', userId)
          .eq('target_profile_id', profileB.id)
          .maybeSingle()
        if (data?.ai_report) {
          setAiReport(data.ai_report)
        }
      }
    }
    void loadComparison()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedA, selectedB, userId])

  function handleSelectProfile(id: string) {
    if (selectedA === id) {
      setSelectedA(null)
      return
    }
    if (selectedB === id) {
      setSelectedB(null)
      return
    }
    if (!selectedA) {
      setSelectedA(id)
    } else if (!selectedB) {
      setSelectedB(id)
    } else {
      // Replace A, shift B→A
      setSelectedA(selectedB)
      setSelectedB(id)
    }
    setAiReport('')
  }

  async function handleCompare() {
    if (!profileA || !profileB) return
    setComparing(true)
    setAiReport('')

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
    } finally {
      setComparing(false)
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
    await supabase.from('ocean_profiles').delete().eq('id', id)
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (selectedA === id) setSelectedA(null)
    if (selectedB === id) setSelectedB(null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      // Validate basic structure
      if (!json.scores?.pct || typeof json.testId !== 'string') {
        throw new Error('ไฟล์ JSON ไม่ถูกต้อง — ต้องเป็นผลการทดสอบ OCEAN ที่ส่งออกจากระบบนี้')
      }

      const res = await fetch('/api/profiles/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ exportData: json }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'เกิดข้อผิดพลาด')
      }

      const { profile } = await res.json()
      setProfiles(prev => [profile as OceanProfile, ...prev])
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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const myTests = profiles.filter(p => p.source === 'test')
  const uploaded = profiles.filter(p => p.source === 'upload')
  const shared = profiles.filter(p => p.source === 'shared')

  const navActive = 'bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold'
  const navIdle = 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">

          {/* ── Left Sidebar ────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="glass-panel rounded-[2rem] px-5 py-6">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                OCEAN DASHBOARD
              </span>

              <nav className="mt-6 flex flex-col gap-0.5">
                <button
                  onClick={() => setActiveView('default')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'default' ? navActive : navIdle}`}
                >
                  <IconHome />
                  <span>หน้าแรก (Overview)</span>
                </button>

                <button
                  onClick={() => setActiveView('compare')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'compare' ? navActive : navIdle}`}
                >
                  <IconBarChart />
                  <span>เปรียบเทียบ (Compare)</span>
                </button>

                <button
                  onClick={() => setActiveView('group-compare')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm ${activeView === 'group-compare' ? navActive : navIdle}`}
                >
                  <IconUsers />
                  <span>กลุ่ม (Group Dynamics)</span>
                </button>

                <div className="pt-4 pb-1 px-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">TOOLS</span>
                </div>

                <label className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-sm ${navIdle}`}>
                  <IconUpload />
                  <span>อัปโหลด JSON (PDF เร็วๆ นี้)</span>
                  <input ref={fileInputRef} type="file" accept=".json" className="sr-only" onChange={handleUpload} />
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
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">โปรไฟล์ของคุณ ({profiles.length})</p>
                {loading ? (
                  <p className="px-3.5 body-soft text-xs italic">กำลังโหลด...</p>
                ) : (
                  <div className="space-y-4">
                    {myTests.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.test}
                        profiles={myTests}
                        selectedA={selectedA}
                        selectedB={selectedB}
                        editingId={editingId}
                        editLabel={editLabel}
                        onSelect={handleSelectProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDelete}
                      />
                    )}
                    {uploaded.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.upload}
                        profiles={uploaded}
                        selectedA={selectedA}
                        selectedB={selectedB}
                        editingId={editingId}
                        editLabel={editLabel}
                        onSelect={handleSelectProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDelete}
                      />
                    )}
                    {shared.length > 0 && (
                      <ProfileGroup
                        title={SOURCE_LABELS.shared}
                        profiles={shared}
                        selectedA={selectedA}
                        selectedB={selectedB}
                        editingId={editingId}
                        editLabel={editLabel}
                        onSelect={handleSelectProfile}
                        onStartEdit={(id, label) => { setEditingId(id); setEditLabel(label) }}
                        onSaveEdit={handleRename}
                        onEditChange={setEditLabel}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Right Panel ──────────────────────────────────────── */}
          <div className="space-y-5">
            {activeView === 'default' && (
              <div className="glass-panel rounded-[2rem] px-8 py-10">
                <span className="eyebrow">
                  <span className="accent-dot" aria-hidden="true" />
                  guidelines & overview
                </span>
                <h2 className="display-title mt-6 text-3xl">ยินดีต้อนรับสู่ OCEAN Dashboard</h2>
                <p className="mt-2 text-slate-500 text-sm">เครื่องมือวิเคราะห์บุคลิกภาพระดับสากล เพื่อความเข้าใจตนเองและทีมงาน</p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <section className="p-5 rounded-2xl border border-[var(--line)] bg-white/50 hover:bg-white hover:border-[var(--line-strong)] hover:shadow-sm transition-all space-y-3 cursor-default">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500" style={{ background: 'rgba(59,130,246,0.08)' }}>
                      <IconCardSelf />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">Self-Understanding</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      OCEAN helps you understand your natural tendencies in five key areas: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
                    </p>
                  </section>

                  <section className="p-5 rounded-2xl border border-[var(--line)] bg-white/50 hover:bg-white hover:border-[var(--line-strong)] hover:shadow-sm transition-all space-y-3 cursor-default">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-500" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <IconCardTeam />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">Team Dynamics</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      Compare your profile with others to understand potential synergies and friction points in a professional or personal setting.
                    </p>
                  </section>

                  <section className="p-5 rounded-2xl border border-[var(--line)] bg-white/50 hover:bg-white hover:border-[var(--line-strong)] hover:shadow-sm transition-all space-y-3 cursor-default">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-500" style={{ background: 'rgba(16,185,129,0.08)' }}>
                      <IconCardTrend />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">Personal Growth</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      Use the 120 and 300-item tests for research-grade accuracy and deep AI-driven reports that suggest areas for development.
                    </p>
                  </section>

                  <section className="p-5 rounded-2xl border border-[var(--line)] bg-white/50 hover:bg-white hover:border-[var(--line-strong)] hover:shadow-sm transition-all space-y-3 cursor-default">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-500" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <IconCardShield />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">Why Use OCEAN?</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">
                      It is the most scientifically validated framework for personality psychology, providing a common language for human behavior.
                    </p>
                  </section>
                </div>

                <div className="mt-6 flex items-start gap-4 p-5 rounded-2xl border border-[var(--line)] bg-white/50">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[var(--accent)]" style={{ background: 'rgba(95,116,130,0.08)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 mb-1">Getting Started</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      Select <strong className="text-slate-700 font-semibold">Comparing OCEAN</strong> from the sidebar and pick two profiles to start. No profiles yet? Use <strong className="text-slate-700 font-semibold">Send Invite</strong> to bring a friend in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'compare' && (
              <>
                {/* ── Profile Selection ── */}
                <div className="glass-panel rounded-2xl relative z-10">
                  <div className="px-6 pt-5 pb-4 border-b border-[var(--line)] flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--text-main)]">Compare Profiles</h2>
                      <p className="text-[11px] text-[var(--text-faint)] mt-0.5">เลือกสองโปรไฟล์จากแถบซ้ายเพื่อเปรียบเทียบ</p>
                    </div>
                    <select
                      value={compareMethod}
                      onChange={e => { setCompareMethod(e.target.value); setAiReport('') }}
                      className="rounded-lg border border-[var(--line-strong)] bg-white px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shrink-0"
                    >
                      {COMPARE_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-3">
                      <ProfileCombobox
                        slot="A"
                        profile={profileA}
                        profiles={profiles}
                        otherSelectedId={selectedB}
                        color="blue"
                        onSelect={(id: string) => { setSelectedA(id); setAiReport('') }}
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
                        onSelect={(id: string) => { setSelectedB(id); setAiReport('') }}
                        onClear={() => setSelectedB(null)}
                      />
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      {(!profileA || !profileB) && (
                        <p className="text-xs text-[var(--text-faint)] flex-1">
                          {!profileA && !profileB ? 'Click a slot above to search and pick a profile.' : 'Pick one more profile to compare.'}
                        </p>
                      )}
                      <button
                        onClick={handleCompare}
                        disabled={!profileA || !profileB || comparing}
                        className="primary-button ml-auto"
                        style={{ minHeight: '2.4rem', padding: '0.55rem 1.4rem', fontSize: '0.82rem', borderRadius: '0.75rem' }}
                      >
                        {comparing ? 'Analyzing…' : 'Run Comparison'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Score Bars ── */}
                {(profileA || profileB) && (
                  <div className="glass-panel rounded-2xl px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Five Factor Scores</h2>
                      <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--text-soft)]">
                        {profileA && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                            {profileA.label}
                          </span>
                        )}
                        {profileB && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                            {profileB.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-5">
                      {FACTOR_ORDER.map(factor => {
                        const info = DIMENSION_INFO[factor]
                        const aScore = profileA?.scores.pct[factor]
                        const bScore = profileB?.scores.pct[factor]
                        const delta = aScore !== undefined && bScore !== undefined ? aScore - bScore : null

                        return (
                          <div key={factor} className="flex items-start gap-3">
                            <span className="factor-medallion shrink-0 mt-0.5"><span>{factor}</span></span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[var(--text-main)]">{info.label}</span>
                                <div className="flex items-center gap-2.5 text-[11px]">
                                  {aScore !== undefined && <span className="text-blue-600 font-semibold tabular-nums">{Math.round(aScore)}%</span>}
                                  {bScore !== undefined && <span className="text-purple-600 font-semibold tabular-nums">{Math.round(bScore)}%</span>}
                                  {delta !== null && (
                                    <span className={`font-semibold tabular-nums ${Math.abs(delta) >= 20 ? 'text-red-500' : 'text-[var(--text-faint)]'}`}>
                                      Δ{delta > 0 ? '+' : ''}{Math.round(delta)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                {aScore !== undefined && (
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${aScore}%` }} />
                                  </div>
                                )}
                                {bScore !== undefined && (
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${bScore}%` }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {profileA?.scores.facets && profileB?.scores.facets && (
                      <details className="mt-6 border-t border-[var(--line)] pt-4">
                        <summary className="cursor-pointer text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors select-none">
                          Show 30 Facets
                        </summary>
                        <div className="mt-4 space-y-1">
                          {Object.entries(FACET_NAMES).map(([code, name]) => {
                            const aFacet = profileA.scores.facets?.[code]
                            const bFacet = profileB?.scores.facets?.[code]
                            return (
                              <div key={code} className="flex items-center gap-3 text-xs py-0.5">
                                <span className="flex-1 text-[var(--text-soft)] truncate">{name}</span>
                                {aFacet && <span className="w-10 text-right text-blue-600 font-medium tabular-nums">{Math.round(aFacet.pct)}%</span>}
                                {bFacet && <span className="w-10 text-right text-purple-600 font-medium tabular-nums">{Math.round(bFacet.pct)}%</span>}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {profileA && !profileB && profileA.ai_report && (
                  <div className="glass-panel rounded-2xl px-6 py-6">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] mb-4">Deep AI Report</h2>
                    <div className="prose prose-sm max-w-none text-[var(--text-main)]">
                      <ReactMarkdown>{profileA.ai_report}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {profileA && profileB && (comparing || aiReport) && (
                  <div className="glass-panel rounded-2xl px-6 py-6">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] mb-4">AI Comparison Report</h2>
                    {comparing && !aiReport && <p className="body-soft text-sm animate-pulse">Analyzing…</p>}
                    {aiReport && (
                      <div className="prose prose-sm max-w-none text-[var(--text-main)]">
                        <ReactMarkdown>{aiReport}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeView === 'group-compare' && (
              <div className="glass-panel rounded-[2rem] px-8 py-10 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent)]" style={{ background: 'rgba(95,116,130,0.09)' }}>
                  <IconUsersLg />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">Group Dynamics Analysis</h2>
                <p className="mt-4 text-slate-500 max-w-md mx-auto leading-relaxed text-sm">
                  Analyze how multiple people interact within a group. Identify collective strengths, potential blind spots, and cultural alignment.
                </p>

                {/* Mockup visualization */}
                <div className="mt-10 max-w-lg mx-auto p-6 rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-50" />
                  <div className="relative z-10 text-left">
                    <div className="flex justify-between items-end mb-8">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview: Engineering Team</p>
                        <h4 className="text-lg font-bold text-slate-800 tracking-tight">Team Balance Index</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-purple-600">84%</span>
                        <p className="text-[10px] font-medium text-slate-500 uppercase">Alignment</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Execution Strength</span>
                          <span>High</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(69,98,118,0.12)' }}>
                          <div className="h-full w-[90%] rounded-full" style={{ background: 'hsl(210,55%,52%)', boxShadow: '0 0 6px hsl(210,55%,52%)' }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Innovation Pivot</span>
                          <span>Moderate</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(69,98,118,0.12)' }}>
                          <div className="h-full w-[65%] rounded-full" style={{ background: 'hsl(268,45%,55%)', boxShadow: '0 0 6px hsl(268,45%,55%)' }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Social Cohesion</span>
                          <span>Very High</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(69,98,118,0.12)' }}>
                          <div className="h-full w-[95%] rounded-full" style={{ background: 'hsl(158,50%,42%)', boxShadow: '0 0 6px hsl(158,50%,42%)' }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200/60 flex -space-x-2">
                       {[1,2,3,4,5].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                           {String.fromCharCode(64 + i)}
                         </div>
                       ))}
                       <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                         +3
                       </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl">
                      Coming Soon in Phase 3
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-xs text-slate-400 font-medium italic">
                  * ฟีเจอร์วิเคราะห์กลุ่มจะเปิดให้ใช้งานเร็ว ๆ นี้ พร้อมรวบรวมผลลัพธ์จากคนในทีมได้ไม่จำกัด
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProfileGroup({
  title, profiles, selectedA, selectedB, editingId, editLabel,
  onSelect, onStartEdit, onSaveEdit, onEditChange, onDelete,
}: {
  title: string
  profiles: OceanProfile[]
  selectedA: string | null
  selectedB: string | null
  editingId: string | null
  editLabel: string
  onSelect: (id: string) => void
  onStartEdit: (id: string, label: string) => void
  onSaveEdit: (id: string, label: string) => void
  onEditChange: (v: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)] mb-2 px-1">{title}</p>
      <div className="space-y-0.5">
        {profiles.map(p => {
          const isA = selectedA === p.id
          const isB = selectedB === p.id
          const isEditing = editingId === p.id

          return (
            <div
              key={p.id}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                isA ? 'bg-blue-50 ring-1 ring-blue-200' :
                isB ? 'bg-purple-50 ring-1 ring-purple-200' :
                'hover:bg-slate-50'
              }`}
              onClick={() => !isEditing && onSelect(p.id)}
            >
              {/* Selection indicator */}
              <span className={`text-xs font-bold w-4 shrink-0 ${isA ? 'text-blue-500' : isB ? 'text-purple-500' : 'text-transparent'}`}>
                {isA ? 'A' : isB ? 'B' : '○'}
              </span>

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
                  className="flex-1 rounded-md border border-[var(--line)] bg-white px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ) : (
                <span className="flex-1 text-sm text-[var(--text-main)] truncate">{p.label}</span>
              )}

              {/* Tier badge */}
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${TIER_COLORS[p.test_type]}`}>
                {p.test_type}ข้อ
              </span>

              {/* Edit/Delete buttons */}
              {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
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
        className={`w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-4 px-4 text-center min-h-[84px] transition-all ${open ? 'border-[var(--accent)] bg-white' : 'border-[var(--line-strong)] bg-slate-50/60 hover:bg-white hover:border-slate-300'}`}
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
                      <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium shrink-0 ${TIER_COLORS[p.test_type]}`}>{p.test_type}ข้อ</span>
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

// ── SVG Icon Components ────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Nav icons — 16×16, stroke-based

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2 7L8 2L14 7V13.5C14 13.78 13.78 14 13.5 14H10.5V10H5.5V14H2.5C2.22 14 2 13.78 2 13.5V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
}

function IconBarChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="6.5" y="5.5" width="3" height="8.5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="11" y="2.5" width="3" height="11.5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M12 10.5c1.7.4 2.5 1.7 2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5.5 10.5L8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 8V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M13 10.5A3 3 0 0 0 10 5a4.5 4.5 0 1 0-6.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4" width="12" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 6L8 10L14 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconFileEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 2l3 3-5 5H6v-3l5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
}

function IconBot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="3" y="6.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="6" cy="10.25" r="1" fill="currentColor"/>
      <circle cx="10" cy="10.25" r="1" fill="currentColor"/>
      <path d="M8 2v4M6.5 5.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M3 9.5H1.5M14.5 9.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconBug() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5.5 6c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v4c0 1.38-1.12 2.5-2.5 2.5S5.5 11.38 5.5 10V6z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 9h3.5M10.5 9H14M2 6.5l2.5 1.5M13.5 6.5l-2.5 1.5M2 11.5L4.5 10M13.5 11.5L11 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6.5 3.5L5 2M9.5 3.5L11 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// Profile item actions — 12×12
function IconPencil() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 3h8M4.5 3V2h3v1M5 5.5V9M7 5.5V9M3 3l.5 7.5h5L9 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Feature card icons — 20×20
function IconCardSelf() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconCardTeam() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 12.5c2 .5 3.5 2.1 3.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconCardTrend() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 14.5L8 9L11.5 12.5L17.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 5.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCardShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L4 4.5V10c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4.5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7.5" height="7.5" rx="1.25" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 4V2.5A1 1 0 0 0 8 1.5H2A1 1 0 0 0 1 2.5v6A1 1 0 0 0 2 9.5H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Group view hero icon — 28×28
function IconUsersLg() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="10" cy="9" r="4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="21" cy="9" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M21 18c3 .8 5 3.2 5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
