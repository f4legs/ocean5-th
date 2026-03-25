'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { items300, items300new, getPageItems300, ITEMS_PER_PAGE_300, TOTAL_PAGES_300 } from '@/lib/items300'
import { items120 } from '@/lib/items120'
import { calcScores300 } from '@/lib/scoring120'

const LABELS = [
  { value: 5, th: 'ตรงมาก' },
  { value: 4, th: 'ค่อนข้างตรง' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรง' },
  { value: 1, th: 'ไม่ตรงเลย' },
]

const DRAFT_SAVE_DEBOUNCE = 2000

export default function Quiz300Page() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers120, setAnswers120] = useState<Record<number, number>>({})

  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({}) // only the 180 new answers

  const itemShownAt = useRef<Record<number, number>>({})
  const pageEnteredAt = useRef<number>(Date.now())
  const pageDurations = useRef<Record<number, number>>({})
  const responseTimes = useRef<Record<number, number>>({})
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredPage = useRef(false)

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth?redirect=/quiz300')
        return
      }

      setUserId(session.user.id)

      // Check payment
      const res = await fetch('/api/checkout/verify', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!data.paid) {
        router.replace('/checkout')
        return
      }

      // Must have completed 120-item test first
      const { data: profile120 } = await supabase
        .from('ocean_profiles')
        .select('answers')
        .eq('owner_id', session.user.id)
        .eq('test_type', '120')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!profile120?.answers) {
        // No 120-item test completed — redirect to quiz120
        router.replace('/quiz120')
        return
      }

      setAnswers120(profile120.answers as Record<number, number>)
      setAuthChecked(true)

      // Load 300-item draft
      const { data: draft } = await supabase
        .from('quiz_drafts')
        .select('answers, current_page, response_times, page_durations')
        .eq('user_id', session.user.id)
        .eq('test_type', '300')
        .maybeSingle()

      if (draft) {
        if (draft.answers) setAnswers(draft.answers as Record<number, number>)
        if (typeof draft.current_page === 'number' && draft.current_page >= 1) {
          setPage(draft.current_page)
        }
        if (draft.response_times) responseTimes.current = draft.response_times as Record<number, number>
        if (draft.page_durations) pageDurations.current = draft.page_durations as Record<number, number>
      }
    }

    void checkAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pageItems = getPageItems300(page)
  useEffect(() => {
    if (!authChecked) return
    const now = Date.now()
    pageEnteredAt.current = now
    for (const item of pageItems) {
      if (itemShownAt.current[item.id] === undefined) {
        itemShownAt.current[item.id] = now
      }
    }

    if (restoredPage.current) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      restoredPage.current = true
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const resetTime = Date.now()
        for (const item of getPageItems300(page)) {
          if (responseTimes.current[item.id] === undefined) {
            itemShownAt.current[item.id] = resetTime
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, authChecked])

  const saveDraft = useCallback(async (
    currentAnswers: Record<number, number>,
    currentPage: number
  ) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('quiz_drafts').upsert({
      user_id: userId,
      test_type: '300',
      answers: currentAnswers,
      current_page: currentPage,
      response_times: responseTimes.current,
      page_durations: pageDurations.current,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,test_type' })
  }, [userId])

  function scheduleDraftSave(nextAnswers: Record<number, number>, currentPage: number) {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => void saveDraft(nextAnswers, currentPage), DRAFT_SAVE_DEBOUNCE)
  }

  function handleAnswer(itemId: number, value: number) {
    if (responseTimes.current[itemId] === undefined && itemShownAt.current[itemId] !== undefined) {
      responseTimes.current[itemId] = Date.now() - itemShownAt.current[itemId]
    }
    const next = { ...answers, [itemId]: value }
    setAnswers(next)
    scheduleDraftSave(next, page)
  }

  async function handleNext() {
    if (!allAnswered) return
    pageDurations.current[page] = Date.now() - pageEnteredAt.current

    if (page < TOTAL_PAGES_300) {
      await saveDraft(answers, page + 1)
      setPage(p => p + 1)
    } else {
      // Merge 120 answers + 180 new answers for full 300-item scoring
      const mergedAnswers: Record<number, number> = { ...answers120, ...answers }
      const scores = calcScores300(mergedAnswers, items300)

      const supabase = createClient()
      // Save to Supabase
      const { data: profileRow } = await supabase.from('ocean_profiles').insert({
        owner_id: userId,
        label: `ฉัน · 300 ข้อ · ${new Date().toLocaleDateString('th-TH')}`,
        source: 'test',
        test_type: '300',
        scores: {
          raw: scores.domains.raw,
          pct: scores.domains.pct,
          facets: scores.facets,
        },
        answers: mergedAnswers,
        metadata: { testId: 'ipip-neo-300-th', completedAt: new Date().toISOString() },
        session_id: crypto.randomUUID(),
      }).select('id').single()

      // Clear draft
      await supabase.from('quiz_drafts')
        .delete()
        .eq('user_id', userId!)
        .eq('test_type', '300')

      sessionStorage.setItem('ocean_scores_300', JSON.stringify(scores))
      if (profileRow?.id) {
        sessionStorage.setItem('ocean_profile_id_300', profileRow.id)
      }
      
      router.push('/results300')
    }
  }

  function handleBack() {
    pageDurations.current[page] = Date.now() - pageEnteredAt.current
    if (page > 1) {
      void saveDraft(answers, page - 1)
      setPage(p => p - 1)
    }
  }

  if (!authChecked) {
    return (
      <main className="page-shell">
        <div className="page-wrap flex items-center justify-center min-h-[40vh]">
          <p className="body-soft">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </main>
    )
  }

  if (items300new.length === 0) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-lg">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-2xl">⚙️</p>
            <p className="mt-3 font-semibold">กำลังเตรียมข้อสอบ</p>
            <p className="body-soft mt-2 text-sm">รายการข้อสอบยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      </main>
    )
  }

  const answeredOnPage = pageItems.filter(item => answers[item.id] !== undefined).length
  const allAnswered = answeredOnPage === ITEMS_PER_PAGE_300
  const totalAnswered = Object.keys(answers).length
  const progressPct = Math.round((totalAnswered / items300new.length) * 100)
  const remaining = items300new.length - totalAnswered

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="glass-panel rounded-[2rem] px-5 py-6 sm:px-6">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                research level // +180 ข้อ
              </span>
              <h1 className="section-title mt-5 text-3xl">OCEAN ระดับวิจัย</h1>
              <p className="body-soft mt-3 text-sm leading-[1.6]">
                ต่อจากการทดสอบ 120 ข้อ — แสดงเฉพาะข้อที่ยังไม่เคยตอบ
              </p>

              <div className="mt-6 space-y-3">
                <div className="section-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">ความคืบหน้า</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold text-slate-900">{progressPct}%</p>
                      <p className="body-faint mt-1 text-sm">{totalAnswered} / {items300new.length} ข้อ</p>
                    </div>
                    <div className="factor-medallion factor-medallion-number"><span>{page}</span></div>
                  </div>
                  <div className="mt-4 rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(69,98,118,0.12)' }} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: 'var(--gradient-hero)', boxShadow: '0 0 8px rgba(69,98,118,0.4)' }} />
                  </div>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">หน้านี้</span>
                    <span className="text-sm text-slate-500">{page} / {TOTAL_PAGES_300}</span>
                  </div>
                  <p className="body-soft mt-2 text-sm">
                    ตอบแล้ว {answeredOnPage} จาก {ITEMS_PER_PAGE_300} ข้อ
                    {remaining > 0 ? ` · เหลือ ${remaining} ข้อ` : ''}
                  </p>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-faint)' }}>สเกลคำตอบ</p>
                  <div className="space-y-1.5">
                    {LABELS.map(label => (
                      <div key={label.value} className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'white', color: 'var(--accent-strong)' }}
                        >
                          {label.value}
                        </div>
                        <span className="text-[12px]" style={{ color: 'var(--text-soft)' }}>{label.th}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-3">
            {page === 1 && (
              <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--page-surface)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                  คำแนะนำ
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  ไม่มีคำตอบที่ถูกหรือผิด กรุณาตอบตามความเป็นจริงของคุณในชีวิตประจำวัน ใช้ความรู้สึกแรกได้เลย
                </p>
              </div>
            )}

            {/* ── Inline question table ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white' }}>
              {/* Column header */}
              <div
                className="sticky top-0 z-10 grid items-center px-4 py-2"
                style={{
                  gridTemplateColumns: '2rem 1fr repeat(5, 2.75rem)',
                  gap: '0.5rem',
                  background: 'white',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div />
                <div className="text-[10px] font-bold" style={{ color: 'var(--text-faint)' }}>คำถาม</div>
                <div
                  className="flex items-center justify-between text-[10px] font-bold"
                  style={{ gridColumn: 'span 5', color: 'var(--text-faint)' }}
                >
                  <span>← มาก</span>
                  <span>น้อย →</span>
                </div>
              </div>

              {/* Question rows */}
              {pageItems.map((item, idx) => {
                const globalIdx = (page - 1) * ITEMS_PER_PAGE_300 + idx + 1
                const selected = answers[item.id]
                const qId = `q-${item.id}`
                const isAnswered = selected !== undefined

                return (
                  <div
                    key={item.id}
                    className="grid items-center px-4 py-3.5 transition-colors"
                    style={{
                      gridTemplateColumns: '2rem 1fr repeat(5, 2.75rem)',
                      gap: '0.5rem',
                      borderTop: idx > 0 ? '1px solid var(--line)' : undefined,
                      background: idx % 2 === 1
                        ? isAnswered ? 'rgba(69,98,118,0.13)' : 'rgba(69,98,118,0.05)'
                        : isAnswered ? 'rgba(69,98,118,0.06)' : 'white',
                    }}
                  >
                    <span className="text-[11px] font-bold tabular-nums text-center" style={{ color: 'var(--text-faint)' }}>
                      {globalIdx}
                    </span>
                    <p id={qId} className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-main)' }}>
                      {item.th}
                    </p>
                    {LABELS.map(label => (
                      <button
                        key={label.value}
                        role="radio"
                        aria-checked={selected === label.value}
                        aria-label={`${label.th} (${label.value})`}
                        onClick={() => handleAnswer(item.id, label.value)}
                        className="flex items-center justify-center rounded-xl text-sm font-bold transition-all"
                        style={{
                          height: '2.75rem',
                          background: selected === label.value
                            ? 'linear-gradient(135deg, #456276 0%, #2c4350 100%)'
                            : 'var(--page-surface)',
                          color: selected === label.value ? 'white' : 'var(--text-soft)',
                          boxShadow: selected === label.value ? '0 4px 12px rgba(44,67,80,0.22)' : 'none',
                          transform: selected === label.value ? 'translateY(-1px)' : undefined,
                        }}
                      >
                        {label.value}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            <div className="glass-panel rounded-[1.75rem] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  {allAnswered ? 'ตอบครบแล้ว' : `กรุณาตอบให้ครบ (${answeredOnPage}/${ITEMS_PER_PAGE_300})`}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button onClick={handleBack} disabled={page === 1} className="secondary-button px-6">
                    <span aria-hidden="true">←</span> ย้อนกลับ
                  </button>
                  <button onClick={handleNext} disabled={!allAnswered} className="primary-button px-7">
                    {page < TOTAL_PAGES_300 ? 'ถัดไป' : 'ดูผลลัพธ์'}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
