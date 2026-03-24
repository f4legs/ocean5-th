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
              
              <nav className="mt-6 flex flex-col gap-1">
                <button 
                  onClick={() => setActiveView('default')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeView === 'default' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">🏠</span>
                  <span>หน้าแรก (Overview)</span>
                </button>

                <button 
                  onClick={() => setActiveView('compare')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeView === 'compare' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">📊</span>
                  <span>เปรียบเทียบ (Compare)</span>
                </button>

                <button 
                  onClick={() => setActiveView('group-compare')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeView === 'group-compare' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">👥</span>
                  <span>กลุ่ม (Group Dynamics)</span>
                </button>

                <hr className="my-2 border-[var(--line)]" />

                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">TOOLS</div>
                
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm text-slate-600">
                  <span className="text-lg">📂</span>
                  <span>อัปโหลด JSON (PDF เร็วๆ นี้)</span>
                  <input ref={fileInputRef} type="file" accept=".json" className="sr-only" onChange={handleUpload} />
                </label>

                <button 
                  onClick={handleInvite}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600"
                >
                  <span className="text-lg">✉️</span>
                  <span>{inviteLoading ? 'กำลังสร้าง...' : 'เชิญเพื่อนทดสอบ'}</span>
                </button>

                {inviteLink && (
                  <div className="mx-4 mt-2 p-3 rounded-xl bg-green-50 border border-green-100 animate-in fade-in slide-in-from-top-1">
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
                          alert('คัดลอกลงคลิปบอร์ดแล้ว!')
                        }}
                        className="text-[10px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mx-4 mt-2 p-3 rounded-xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1">
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600"
                >
                  <span className="text-lg">📝</span>
                  <span>ทดสอบ 120/300 ข้อ</span>
                </Link>

                <button 
                  disabled
                  className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-40 cursor-not-allowed text-sm text-slate-600"
                >
                  <span className="text-lg">🤖</span>
                  <span>AI Consult (Soon)</span>
                </button>

                <button 
                  disabled
                  className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-40 cursor-not-allowed text-sm text-slate-600"
                >
                  <span className="text-lg">🪲</span>
                  <span>แจ้งบั๊ก (Report Bug)</span>
                </button>

                <hr className="my-2 border-[var(--line)]" />

                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-sm text-slate-600"
                >
                  <span className="text-lg">🚪</span>
                  <span>ออกจากระบบ</span>
                </button>
              </nav>

              <div className="mt-8">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">โปรไฟล์ของคุณ ({profiles.length})</p>
                {loading ? (
                  <p className="px-4 body-soft text-xs italic">กำลังโหลด...</p>
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
                
                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  <section className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">🧘‍♂️</div>
                    <h3 className="text-lg font-semibold text-slate-800">Self-Understanding</h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      OCEAN helps you understand your natural tendencies in five key areas: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-xl">🤝</div>
                    <h3 className="text-lg font-semibold text-slate-800">Team Dynamics</h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Compare your profile with others to understand potential synergies and friction points in a professional or personal setting.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl">📈</div>
                    <h3 className="text-lg font-semibold text-slate-800">Personal Growth</h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Use the 120 and 300-item tests for research-grade accuracy and deep AI-driven reports that suggest areas for development.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">💡</div>
                    <h3 className="text-lg font-semibold text-slate-800">Why Use OCEAN?</h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      It is the most scientifically validated framework for personality psychology, providing a common language for human behavior.
                    </p>
                  </section>
                </div>

                <div className="mt-12 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Getting Started</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Select <strong className="text-slate-900">Comparing OCEAN</strong> from the sidebar and pick two profiles from your list to start a comparison. If you don&apos;t have enough profiles, use the <strong className="text-slate-900">Send Invite</strong> tool to invite a friend.
                  </p>
                </div>
              </div>
            )}

            {activeView === 'compare' && (
              <>
                <div className="glass-panel rounded-[2rem] px-6 py-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <ProfileSelector
                      label="Profile A"
                      profile={profileA}
                      color="blue"
                      onClear={() => setSelectedA(null)}
                    />
                    <span className="text-[var(--text-faint)] text-lg">vs</span>
                    <ProfileSelector
                      label="Profile B"
                      profile={profileB}
                      color="purple"
                      onClear={() => setSelectedB(null)}
                    />

                    <select
                      value={compareMethod}
                      onChange={e => { setCompareMethod(e.target.value); setAiReport('') }}
                      className="ml-auto rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      {COMPARE_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleCompare}
                      disabled={!profileA || !profileB || comparing}
                      className="primary-button pr-6 pl-6"
                    >
                      {comparing ? 'Analyzing...' : 'Compare'}
                    </button>
                  </div>

                  {!profileA && !profileB && (
                    <p className="body-soft mt-4 text-sm">Select 2 profiles from your list below to begin comparison. If you don&apos;t have any, you can take a test or invite a friend.</p>
                  )}
                </div>

                {/* Score bars & Reports */}
                {(profileA || profileB) && (
                  <div className="glass-panel rounded-[2rem] px-6 py-6">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                      Five Factor Scores
                    </h2>
                    <div className="mt-5 space-y-4">
                      {FACTOR_ORDER.map(factor => {
                        const info = DIMENSION_INFO[factor]
                        const aScore = profileA?.scores.pct[factor]
                        const bScore = profileB?.scores.pct[factor]
                        const delta = aScore !== undefined && bScore !== undefined ? aScore - bScore : null

                        return (
                          <div key={factor}>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium text-[var(--text-main)]">{info.label}</span>
                              <div className="flex gap-3">
                                {aScore !== undefined && <span className="text-blue-600 font-semibold">{Math.round(aScore)}%</span>}
                                {bScore !== undefined && <span className="text-purple-600 font-semibold">{Math.round(bScore)}%</span>}
                                {delta !== null && (
                                  <span className={`font-semibold ${Math.abs(delta) >= 20 ? 'text-red-500' : 'text-[var(--text-faint)]'}`}>
                                    Δ{delta > 0 ? '+' : ''}{Math.round(delta)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                              {aScore !== undefined && (
                                <div
                                  className="absolute top-0 left-0 h-1.5 rounded-full bg-blue-400"
                                  style={{ width: `${aScore}%` }}
                                />
                              )}
                              {bScore !== undefined && (
                                <div
                                  className="absolute bottom-0 left-0 h-1.5 rounded-full bg-purple-400"
                                  style={{ width: `${bScore}%` }}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Facets — only if both profiles have facet data */}
                    {profileA?.scores.facets && profileB?.scores.facets && (
                      <details className="mt-6">
                        <summary className="cursor-pointer text-xs font-semibold text-[var(--accent)] hover:underline">
                          Show 30 Facets
                        </summary>
                        <div className="mt-4 space-y-2">
                          {Object.entries(FACET_NAMES).map(([code, name]) => {
                            const aFacet = profileA.scores.facets?.[code]
                            const bFacet = profileB?.scores.facets?.[code]
                            return (
                              <div key={code} className="flex items-center gap-3 text-xs">
                                <span className="w-28 shrink-0 text-[var(--text-soft)]">{name}</span>
                                {aFacet && <span className="w-10 text-right text-blue-600 font-medium">{Math.round(aFacet.pct)}%</span>}
                                {bFacet && <span className="w-10 text-right text-purple-600 font-medium">{Math.round(bFacet.pct)}%</span>}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {profileA && !profileB && profileA.ai_report && (
                  <div className="glass-panel rounded-[2rem] px-6 py-6 mt-6">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-4">Deep AI Report</h2>
                    <div className="prose prose-sm max-w-none text-[var(--text-main)]">
                      <ReactMarkdown>{profileA.ai_report}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {profileA && profileB && (comparing || aiReport) && (
                  <div className="glass-panel rounded-[2rem] px-6 py-6 mt-6">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-4">AI Comparison Report</h2>
                    {comparing && !aiReport && <p className="body-soft text-sm animate-pulse">Analyzing...</p>}
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
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-6">👥</div>
                <h2 className="text-2xl font-semibold text-slate-800">Group Dynamics Analysis</h2>
                <p className="mt-4 text-slate-600 max-w-md mx-auto leading-relaxed text-sm">
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
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full w-[90%] bg-blue-500 rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Innovation Pivot</span>
                          <span>Moderate</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full w-[65%] bg-purple-500 rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Social Cohesion</span>
                          <span>Very High</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full w-[95%] bg-green-500 rounded-full" />
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
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)] mb-2">{title}</p>
      <div className="space-y-1.5">
        {profiles.map(p => {
          const isA = selectedA === p.id
          const isB = selectedB === p.id
          const isEditing = editingId === p.id

          return (
            <div
              key={p.id}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
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
                <div className="hidden group-hover:flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onStartEdit(p.id, p.label)}
                    className="text-[var(--text-faint)] hover:text-[var(--accent)] text-xs p-0.5"
                    title="แก้ไขชื่อ"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-[var(--text-faint)] hover:text-red-500 text-xs p-0.5"
                    title="ลบ"
                  >
                    🗑
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

function ProfileSelector({
  label, profile, color, onClear,
}: {
  label: string
  profile: OceanProfile | undefined
  color: 'blue' | 'purple'
  onClear: () => void
}) {
  const colorClass = color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'

  if (!profile) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--line-strong)] px-3 py-2 text-sm text-[var(--text-faint)]">
        {label}: เลือกจากแถบซ้าย
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${colorClass}`}>
      <span className="font-semibold">{label}:</span>
      <span className="truncate max-w-[140px]">{profile.label}</span>
      <span className="text-xs opacity-60">({profile.test_type}ข้อ)</span>
      <button onClick={onClear} className="ml-1 opacity-60 hover:opacity-100 text-xs">✕</button>
    </div>
  )
}
