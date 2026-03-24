'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { supabaseBrowser } from '@/lib/supabase-browser'
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
  const [paid, setPaid] = useState(false)
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

  // Upload/invite state
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) return

      setUserId(session.user.id)
      setAccessToken(session.access_token)

      // Check payment
      const res = await fetch('/api/checkout/verify', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payData = await res.json()
      setPaid(payData.paid)

      // Load profiles
      const { data } = await supabaseBrowser
        .from('ocean_profiles')
        .select('id, label, source, test_type, scores, created_at')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      setProfiles((data ?? []) as OceanProfile[])
      setLoading(false)
    }
    void init()
  }, [])

  const profileA = profiles.find(p => p.id === selectedA)
  const profileB = profiles.find(p => p.id === selectedB)

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
    await supabaseBrowser
      .from('ocean_profiles')
      .update({ label: newLabel.trim() })
      .eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, label: newLabel.trim() } : p))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await supabaseBrowser.from('ocean_profiles').delete().eq('id', id)
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

      const testType: TestType = json.testId.includes('300') ? '300' : json.testId.includes('120') ? '120' : '50'

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
    await supabaseBrowser.auth.signOut()
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
                dashboard
              </span>
              <h1 className="section-title mt-4 text-2xl">โปรไฟล์ของฉัน</h1>

              {loading ? (
                <p className="body-soft mt-4 text-sm">กำลังโหลด...</p>
              ) : (
                <div className="mt-5 space-y-5">
                  {/* My Tests */}
                  {myTests.length > 0 && (
                    <ProfileGroup
                      title="การทดสอบของฉัน"
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

                  {/* Uploaded */}
                  {uploaded.length > 0 && (
                    <ProfileGroup
                      title="อัปโหลด"
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

                  {/* Shared */}
                  {shared.length > 0 && (
                    <ProfileGroup
                      title="เพื่อนที่แชร์มา"
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

                  {profiles.length === 0 && (
                    <p className="body-soft text-sm">ยังไม่มีโปรไฟล์ เริ่มต้นด้วยการทดสอบหรืออัปโหลดผลที่มีอยู่</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-2 border-t border-[var(--line)] pt-5">
                {/* Upload JSON */}
                <label className="secondary-button w-full cursor-pointer justify-center text-sm">
                  <span>+ อัปโหลด JSON</span>
                  <input ref={fileInputRef} type="file" accept=".json" className="sr-only" onChange={handleUpload} />
                </label>
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

                {/* Invite friend */}
                <button onClick={handleInvite} disabled={inviteLoading} className="secondary-button w-full justify-center text-sm">
                  {inviteLoading ? 'กำลังสร้าง...' : '+ เชิญเพื่อนทดสอบ'}
                </button>
                {inviteLink && (
                  <div className="section-panel rounded-xl px-3 py-3">
                    <p className="text-xs text-[var(--text-soft)] mb-1">คัดลอกลิงก์นี้</p>
                    <div className="flex gap-2">
                      <input readOnly value={inviteLink} className="flex-1 rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs" />
                      <button
                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                        className="rounded-lg bg-[var(--accent)] px-2 py-1 text-xs text-white"
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>
                )}

                {/* Paid quiz links */}
                {paid ? (
                  <div className="space-y-2">
                    <Link href="/quiz120" className="secondary-button w-full justify-center text-sm">
                      + ทดสอบ 120 ข้อ
                    </Link>
                    <Link href="/quiz300" className="secondary-button w-full justify-center text-sm">
                      + ต่อยอด 300 ข้อ
                    </Link>
                  </div>
                ) : (
                  <Link href="/checkout" className="primary-button w-full justify-center text-sm">
                    ซื้อแผน Deep ฿49 →
                  </Link>
                )}

                <button onClick={handleSignOut} className="w-full text-center text-xs text-[var(--text-faint)] hover:text-[var(--text-soft)] mt-2">
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </aside>

          {/* ── Right Panel ──────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Selection + Compare Controls */}
            <div className="glass-panel rounded-[2rem] px-6 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <ProfileSelector
                  label="โปรไฟล์ A"
                  profile={profileA}
                  color="blue"
                  onClear={() => setSelectedA(null)}
                />
                <span className="text-[var(--text-faint)] text-lg">vs</span>
                <ProfileSelector
                  label="โปรไฟล์ B"
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
                  className="primary-button"
                >
                  {comparing ? 'กำลังวิเคราะห์...' : 'เปรียบเทียบ'}
                </button>
              </div>

              {!profileA && !profileB && (
                <p className="body-soft mt-4 text-sm">เลือกโปรไฟล์ 2 คนจากแถบซ้ายเพื่อเปรียบเทียบ</p>
              )}
            </div>

            {/* Score bars */}
            {(profileA || profileB) && (
              <div className="glass-panel rounded-[2rem] px-6 py-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                  คะแนน 5 มิติหลัก
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
                      แสดง 30 ลักษณะย่อย (Facets)
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

            {/* AI Comparison Report */}
            {(comparing || aiReport) && (
              <div className="glass-panel rounded-[2rem] px-6 py-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-4">
                  รายงาน AI
                </h2>
                {comparing && !aiReport && (
                  <p className="body-soft text-sm animate-pulse">กำลังวิเคราะห์...</p>
                )}
                {aiReport && (
                  <div className="prose prose-sm max-w-none text-[var(--text-main)]">
                    <ReactMarkdown>{aiReport}</ReactMarkdown>
                  </div>
                )}
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
