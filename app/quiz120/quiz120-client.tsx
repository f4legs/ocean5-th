'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { items120, getPageItems120, ITEMS_PER_PAGE_120, TOTAL_PAGES_120 } from '@/lib/items120'
import { calcScores120 } from '@/lib/scoring120'
import QuizShell from '@/components/quiz-shell'
import { IconHome, IconChevronRight, IconFileEdit } from '@/components/icons'

const DRAFT_SAVE_DEBOUNCE = 2000
const PROFILE_STORAGE_KEY = 'ocean_profile_paid'
const GOALS = ['รู้จักตัวเองมากขึ้น', 'พัฒนาตนเอง', 'วางแผนอาชีพ', 'ปรับปรุงความสัมพันธ์', 'ความอยากรู้อยากเห็น', 'อื่นๆ']

type Phase = 'loading' | 'profile' | 'check-existing' | 'quiz'

interface SavedProfile {
  age: string
  sex: string
  occupation: string
  goal: string
}

export default function Quiz120Client() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null)
  const [existingDate, setExistingDate] = useState<string | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Profile form state
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal] = useState('')

  // Auth + payment gate
  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth?redirect=/quiz120'); return }

      const res = await fetch('/api/checkout/verify', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!data.paid) { router.replace('/checkout'); return }

      setUserId(session.user.id)

      // Restore saved profile from localStorage
      try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
        if (saved) {
          const p = JSON.parse(saved) as SavedProfile
          setAge(p.age ?? '')
          setSex(p.sex ?? '')
          setOccupation(p.occupation ?? '')
          setGoal(p.goal ?? '')
        }
      } catch { /* ignore */ }

      // ?resume=1 → skip profile + existing-check, go straight to quiz
      if (searchParams.get('resume') === '1') {
        setPhase('quiz')
      } else {
        setPhase('profile')
      }
    }
    void checkAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleProfileContinue() {
    // Save profile to localStorage for persistence
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ age, sex, occupation, goal }))
    } catch { /* ignore */ }

    setPhase('check-existing')

    // Check for existing completed 120 result
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('ocean_profiles')
      .select('id, created_at')
      .eq('owner_id', userId!)
      .eq('test_type', '120')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      setExistingProfileId(existing.id)
      setExistingDate(new Date(existing.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' }))
      // Stay in 'check-existing' phase → show modal
    } else {
      setPhase('quiz')
    }
  }

  const saveDraftToSupabase = useCallback(async (
    currentAnswers: Record<number, number>,
    currentPage: number,
    responseTimes: Record<number, number>,
    pageDurations: Record<number, number>,
  ) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('quiz_drafts').upsert({
      user_id: userId,
      test_type: '120',
      answers: currentAnswers,
      current_page: currentPage,
      response_times: responseTimes,
      page_durations: pageDurations,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,test_type' })
  }, [userId])

  // ── Phase: loading ──
  if (phase === 'loading') {
    return (
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </main>
    )
  }

  // ── Phase: profile ──
  if (phase === 'profile') {
    return (
      <main id="main" className="page-shell">
        <div className="page-wrap max-w-2xl">
          <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
            <span className="eyebrow">
              <span className="accent-dot" aria-hidden="true" />
              ขั้นตอน 1/2 • ข้อมูลส่วนตัว
            </span>

            <h1 className="display-title mt-6 text-3xl sm:text-4xl">ข้อมูลประกอบการสรุปผล</h1>
            <p className="body-soft mt-4 text-base leading-8">
              กรอกเท่าที่สะดวก ข้อมูลนี้ช่วยให้รายงาน AI อ่านได้ตรงบริบทมากขึ้น
              ใช้เวลาประมาณ <strong>35–45 นาที</strong>
            </p>

            <div className="mt-8 section-panel rounded-[1.75rem] p-5 sm:p-6 space-y-5">
              <div>
                <label htmlFor="age120" className="field-label">อายุ</label>
                <input id="age120" type="number" min={10} max={120} value={age}
                  onChange={e => setAge(e.target.value)} placeholder="เช่น 28" className="field-input" />
              </div>

              <div>
                <p className="field-label">เพศ</p>
                <div className="grid gap-3 sm:grid-cols-4" role="group" aria-label="เพศ">
                  {['ชาย', 'หญิง', 'ไม่ระบุ', 'อื่นๆ'].map(opt => (
                    <button key={opt} type="button" aria-pressed={sex === opt}
                      onClick={() => setSex(sex === opt ? '' : opt)}
                      className={`choice-chip min-h-[3rem] px-4 text-sm font-medium ${sex === opt ? 'active' : ''}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="occ120" className="field-label">อาชีพ หรือ ความเชี่ยวชาญ</label>
                <input id="occ120" type="text" value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="เช่น นักศึกษา วิศวกร ที่ปรึกษา ฯลฯ" className="field-input" />
              </div>

              <div>
                <p className="field-label">วัตถุประสงค์ในการทำแบบทดสอบ</p>
                <div className="flex flex-wrap gap-3" role="group" aria-label="วัตถุประสงค์">
                  {GOALS.map(opt => (
                    <button key={opt} type="button" aria-pressed={goal === opt}
                      onClick={() => setGoal(goal === opt ? '' : opt)}
                      className={`choice-chip px-4 py-3 text-sm font-medium ${goal === opt ? 'active' : ''}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button onClick={() => void handleProfileContinue()} className="primary-button w-full text-base flex items-center justify-center gap-2">
                ดำเนินการต่อ
                <IconChevronRight />
              </button>
              <Link href="/dashboard" className="secondary-button w-full text-sm justify-center flex items-center gap-2">
                <IconHome />
                กลับ Dashboard
              </Link>
            </div>
            <p className="body-faint mt-4 text-center text-xs">ไม่บังคับกรอก — สามารถข้ามได้</p>
          </section>
        </div>
      </main>
    )
  }

  // ── Phase: check-existing — show existing result modal ──
  if (phase === 'check-existing' && existingProfileId) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="page-wrap max-w-lg">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <div className="flex justify-center mb-4 text-[var(--accent-strong)]">
              <IconFileEdit />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-main)]">คุณมีผลลัพธ์อยู่แล้ว</h2>
            <p className="body-soft mt-3 text-sm leading-[1.7]">
              มีผล 120 ข้อที่บันทึกไว้<strong>{existingDate ? ` เมื่อ ${existingDate}` : ''}</strong><br />
              จะดูผลเดิม หรือต้องการทำใหม่?
            </p>
            <p className="mt-2 text-xs text-[var(--text-faint)]">หากทำใหม่ ผลเดิมจะยังคงอยู่ใน Dashboard</p>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => router.push(`/results120?id=${existingProfileId}`)}
                className="primary-button w-full justify-center text-sm flex items-center gap-2"
              >
                ดูผลลัพธ์เดิม
                <IconChevronRight />
              </button>
              <button
                onClick={() => setPhase('quiz')}
                className="secondary-button w-full justify-center text-sm"
              >
                ทำใหม่ (ผลเดิมยังอยู่ใน Dashboard)
              </button>
              <Link href="/dashboard" className="block text-xs text-center text-[var(--text-faint)] hover:underline mt-2 flex items-center justify-center gap-1">
                <IconHome />
                กลับ Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Phase: check-existing loading (no existing found yet) ──
  if (phase === 'check-existing') {
    return (
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังตรวจสอบข้อมูล...</p>
        </div>
      </main>
    )
  }

  // ── Phase: quiz ──
  if (items120.length === 0) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-lg">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-2xl">⚙️</p>
            <p className="mt-3 font-semibold text-[var(--text-main)]">กำลังเตรียมข้อสอบ</p>
            <p className="body-soft mt-2 text-sm">รายการข้อสอบยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      </main>
    )
  }

  const profile = { age: age || null, sex: sex || null, occupation: occupation.trim() || null, goal: goal || null }

  return (
    <QuizShell
      config={{
        eyebrowText: 'deep assessment // 120 ข้อ',
        titleText: 'OCEAN เชิงลึก',
        subtitleText: 'อ่านแต่ละข้อ แล้วเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด',
        instructionText: 'ไม่มีคำตอบที่ถูกหรือผิด กรุณาตอบตามความเป็นจริงของคุณในชีวิตประจำวัน ใช้ความรู้สึกแรกได้เลย',
        draftStatusText: `บันทึกร่างอัตโนมัติทุก ${DRAFT_SAVE_DEBOUNCE / 1000} วินาที`,
        items: items120,
        getPageItems: getPageItems120,
        itemsPerPage: ITEMS_PER_PAGE_120,
        totalPages: TOTAL_PAGES_120,
        premiumBadge: {
          title: 'Premium',
          features: [
            '💾 บันทึกร่างอัตโนมัติ — กลับมาทำต่อได้ทุกเมื่อ',
            '🔬 วิเคราะห์ 30 facets เชิงลึก',
            '📄 รายงาน AI ส่วนตัว 2,000+ คำ',
          ],
        },

        restoreState: async () => {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return null

          // First try the active draft (in-progress test)
          const { data: draft } = await supabase
            .from('quiz_drafts')
            .select('answers, current_page, response_times, page_durations')
            .eq('user_id', session.user.id)
            .eq('test_type', '120')
            .maybeSingle()

          if (draft?.answers && Object.keys(draft.answers as object).length > 0) {
            return {
              answers: (draft.answers as Record<number, number>) ?? {},
              page: typeof draft.current_page === 'number' && draft.current_page >= 1 ? draft.current_page : 1,
              responseTimes: (draft.response_times as Record<number, number>) ?? {},
              pageDurations: (draft.page_durations as Record<number, number>) ?? {},
            }
          }

          // Fallback: load answers from the last completed ocean_profiles record
          // (draft was deleted after completion — used when returning from results page)
          const { data: completed } = await supabase
            .from('ocean_profiles')
            .select('answers')
            .eq('owner_id', session.user.id)
            .eq('test_type', '120')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (completed?.answers && Object.keys(completed.answers as object).length > 0) {
            return {
              answers: (completed.answers as Record<number, number>),
              page: TOTAL_PAGES_120, // open at the last page so they can review
              responseTimes: {},
              pageDurations: {},
            }
          }

          return { answers: {}, page: 1 }
        },

        onAnswer: (_itemId, _value, nextAnswers, currentPage, responseTimes, pageDurations) => {
          if (draftTimer.current) clearTimeout(draftTimer.current)
          draftTimer.current = setTimeout(() => {
            void saveDraftToSupabase(nextAnswers, currentPage, responseTimes, pageDurations)
          }, DRAFT_SAVE_DEBOUNCE)
        },

        onPageChange: (newPage, answers, responseTimes, pageDurations) => {
          void saveDraftToSupabase(answers, newPage, responseTimes, pageDurations)
        },

        onComplete: async ({ answers, responseTimes, pageDurations }) => {
          const scores = calcScores120(answers, items120)
          const supabase = createClient()

          const { data: profileRow } = await supabase.from('ocean_profiles').insert({
            owner_id: userId,
            label: `ฉัน · 120 ข้อ · ${new Date().toLocaleDateString('th-TH')}`,
            source: 'test',
            test_type: '120',
            scores: {
              raw: scores.domains.raw,
              pct: scores.domains.pct,
              facets: scores.facets,
            },
            answers,
            profile,
            metadata: { testId: 'ipip-neo-120-th', completedAt: new Date().toISOString() },
            session_id: crypto.randomUUID(),
          }).select('id').single()

          await supabase.from('quiz_drafts')
            .delete()
            .eq('user_id', userId!)
            .eq('test_type', '120')

          sessionStorage.setItem('ocean_scores_120', JSON.stringify(scores))
          sessionStorage.setItem('ocean_answers_120', JSON.stringify(answers))
          sessionStorage.setItem('ocean_profile_paid', JSON.stringify(profile))
          if (profileRow?.id) {
            sessionStorage.setItem('ocean_profile_id_120', profileRow.id)
          }

          void pageDurations
          void responseTimes

          router.push(profileRow?.id ? `/results120?id=${profileRow.id}` : '/results120')
        },
      }}
    />
  )
}
