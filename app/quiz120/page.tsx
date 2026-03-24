'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { items120, getPageItems120, ITEMS_PER_PAGE_120, TOTAL_PAGES_120 } from '@/lib/items120'
import { calcScores120 } from '@/lib/scoring120'

const LABELS = [
  { value: 5, th: 'ตรงมาก' },
  { value: 4, th: 'ค่อนข้างตรง' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรง' },
  { value: 1, th: 'ไม่ตรงเลย' },
]

const DRAFT_SAVE_DEBOUNCE = 2000 // ms

export default function Quiz120Page() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const itemShownAt = useRef<Record<number, number>>({})
  const pageEnteredAt = useRef<number>(Date.now())
  const pageDurations = useRef<Record<number, number>>({})
  const responseTimes = useRef<Record<number, number>>({})
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredPage = useRef(false)

  // Auth + payment gate
  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) {
        router.replace('/auth?redirect=/quiz120')
        return
      }

      setUserId(session.user.id)
      setAccessToken(session.access_token)

      // Check payment
      const res = await fetch('/api/checkout/verify', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()

      if (!data.paid) {
        router.replace('/checkout')
        return
      }

      setAuthChecked(true)

      // Load draft from Supabase
      const { data: draft } = await supabaseBrowser
        .from('quiz_drafts')
        .select('answers, current_page, response_times, page_durations')
        .eq('user_id', session.user.id)
        .eq('test_type', '120')
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

  // Item shown timestamps
  const pageItems = getPageItems120(page)
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
        for (const item of getPageItems120(page)) {
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
    await supabaseBrowser.from('quiz_drafts').upsert({
      user_id: userId,
      test_type: '120',
      answers: currentAnswers,
      current_page: currentPage,
      response_times: responseTimes.current,
      page_durations: pageDurations.current,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,test_type' })
  }, [userId])

  function scheduleDraftSave(nextAnswers: Record<number, number>, currentPage: number) {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      void saveDraft(nextAnswers, currentPage)
    }, DRAFT_SAVE_DEBOUNCE)
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

    if (page < TOTAL_PAGES_120) {
      await saveDraft(answers, page + 1)
      setPage(p => p + 1)
    } else {
      // Completed — calculate scores and save result
      const scores = calcScores120(answers, items120)

      // Save to Supabase as ocean_profile
      await supabaseBrowser.from('ocean_profiles').insert({
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
        metadata: { testId: 'ipip-neo-120-th', completedAt: new Date().toISOString() },
        session_id: crypto.randomUUID(),
      })

      // Clear draft
      await supabaseBrowser.from('quiz_drafts')
        .delete()
        .eq('user_id', userId!)
        .eq('test_type', '120')

      // Store scores in sessionStorage for results page
      sessionStorage.setItem('ocean_scores_120', JSON.stringify(scores))
      sessionStorage.setItem('ocean_answers_120', JSON.stringify(answers))

      router.push('/results120')
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

  if (items120.length === 0) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-lg">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-2xl">⚙️</p>
            <p className="mt-3 font-semibold text-[var(--text-main)]">กำลังเตรียมข้อสอบ</p>
            <p className="body-soft mt-2 text-sm">
              รายการข้อสอบยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </main>
    )
  }

  const answeredOnPage = pageItems.filter(item => answers[item.id] !== undefined).length
  const allAnswered = answeredOnPage === ITEMS_PER_PAGE_120
  const totalAnswered = Object.keys(answers).length
  const progressPct = Math.round((totalAnswered / items120.length) * 100)
  const remaining = items120.length - totalAnswered

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="glass-panel rounded-[2rem] px-5 py-6 sm:px-6">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                deep assessment // 120 ข้อ
              </span>

              <h1 className="section-title mt-5 text-3xl">
                OCEAN เชิงลึก
              </h1>
              <p className="body-soft mt-3 text-sm leading-[1.6]">
                อ่านแต่ละข้อ แล้วเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด
              </p>

              <div className="mt-6 space-y-3">
                <div className="section-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    ความคืบหน้า
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold text-slate-900">{progressPct}%</p>
                      <p className="body-faint mt-1 text-sm">{totalAnswered} / {items120.length} ข้อ</p>
                    </div>
                    <div className="factor-medallion factor-medallion-number"><span>{page}</span></div>
                  </div>
                  <div
                    className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/70"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#284b5b,#78909b)] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">หน้านี้</span>
                    <span className="text-sm text-slate-500">{page} / {TOTAL_PAGES_120}</span>
                  </div>
                  <p className="body-soft mt-2 text-sm leading-[1.6]">
                    ตอบแล้ว {answeredOnPage} จาก {ITEMS_PER_PAGE_120} ข้อ
                    {remaining > 0 ? ` · เหลือทั้งหมด ${remaining} ข้อ` : ''}
                  </p>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-3">
                  <p className="text-xs text-[var(--text-soft)]">
                    💾 บันทึกร่างอัตโนมัติ — สามารถกลับมาทำต่อได้
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            {page === 1 && (
              <div className="section-panel rounded-[1.75rem] px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  คำแนะนำ
                </p>
                <p className="mt-3 text-sm leading-[1.65] text-slate-600">
                  ไม่มีคำตอบที่ถูกหรือผิด กรุณาตอบตามความเป็นจริงของคุณในชีวิตประจำวัน
                  ใช้ความรู้สึกแรกของคุณได้เลย
                </p>
              </div>
            )}

            <div className="space-y-4">
              {pageItems.map((item, idx) => {
                const globalIdx = (page - 1) * ITEMS_PER_PAGE_120 + idx + 1
                const selected = answers[item.id]
                const qId = `q-${item.id}`

                return (
                  <article
                    key={item.id}
                    className={`section-panel rounded-[1.75rem] px-5 py-5 sm:px-6 sm:py-6 ${
                      selected !== undefined ? 'ring-1 ring-[rgba(84,114,127,0.18)]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="factor-medallion factor-medallion-number h-10 w-10 shrink-0 font-[family-name:var(--font-body)] text-sm leading-none">
                        <span>{globalIdx}</span>
                      </div>
                      <div className="max-w-3xl">
                        <p id={qId} className="pt-1 text-base font-medium leading-8 text-slate-800 sm:text-lg">
                          {item.th}
                        </p>
                      </div>
                    </div>

                    <div role="radiogroup" aria-labelledby={qId} className="mt-5 grid gap-3 sm:grid-cols-5">
                      {LABELS.map(label => (
                        <button
                          key={label.value}
                          role="radio"
                          aria-checked={selected === label.value}
                          onClick={() => handleAnswer(item.id, label.value)}
                          className={`scale-button flex items-center gap-3 px-4 py-4 text-left sm:min-h-[9rem] sm:flex-col sm:justify-center sm:gap-2 sm:px-3 sm:text-center ${
                            selected === label.value ? 'active' : ''
                          }`}
                        >
                          <span className="text-lg font-semibold sm:text-xl">{label.value}</span>
                          <span className="scale-label text-sm leading-6 sm:text-xs sm:leading-5">{label.th}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="glass-panel rounded-[1.75rem] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {allAnswered ? 'ตอบครบแล้ว ไปหน้าถัดไปได้' : `กรุณาตอบให้ครบ (${answeredOnPage}/${ITEMS_PER_PAGE_120})`}
                  </p>
                  <p className="body-faint mt-1 text-sm">บันทึกร่างอัตโนมัติทุก {DRAFT_SAVE_DEBOUNCE / 1000} วินาที</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button onClick={handleBack} disabled={page === 1} className="secondary-button px-6">
                    <span aria-hidden="true">←</span> ย้อนกลับ
                  </button>
                  <button onClick={handleNext} disabled={!allAnswered} className="primary-button px-7">
                    {page < TOTAL_PAGES_120 ? 'ถัดไป' : 'ดูผลลัพธ์'}
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
