'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPageItems, items, ITEMS_PER_PAGE, TOTAL_PAGES } from '@/lib/items'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItemAsync, setItem } from '@/lib/storage'

const LABELS = [
  { value: 5, th: 'ตรงมาก' },
  { value: 4, th: 'ค่อนข้างตรง' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรง' },
  { value: 1, th: 'ไม่ตรงเลย' },
]

export default function QuizPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const restoredPage = useRef(false)

  // Per-item first-display timestamps for response-time tracking
  const itemShownAt = useRef<Record<number, number>>({})
  // Per-page entry timestamps for duration tracking
  const pageEnteredAt = useRef<number>(Date.now())
  const pageDurations = useRef<Record<number, number>>({})
  // Per-item response time in ms
  const responseTimes = useRef<Record<number, number>>({})

  // Restore draft answers and init session on mount
  useEffect(() => {
    let cancelled = false

    async function restoreState() {
      const savedAnswers = await getItemAsync(STORAGE_KEYS.ANSWERS_DRAFT) ?? await getItemAsync(STORAGE_KEYS.ANSWERS)
      if (!cancelled && savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers))
        } catch {
          /* ignore corrupt draft */
        }
      }

      const savedPage = await getItemAsync(STORAGE_KEYS.QUIZ_PAGE)
      if (!cancelled && savedPage) {
        const parsedPage = Number.parseInt(savedPage, 10)
        if (Number.isFinite(parsedPage) && parsedPage >= 1 && parsedPage <= TOTAL_PAGES) {
          setPage(parsedPage)
        }
      }

      const existing = await getItemAsync(STORAGE_KEYS.SESSION)
      if (!existing) {
        setItem(STORAGE_KEYS.SESSION, JSON.stringify({
          sessionId: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
        }))
      }
    }

    void restoreState()

    return () => {
      cancelled = true
    }
  }, [])

  // Track when each item on the current page is first shown
  const pageItems = getPageItems(page)
  useEffect(() => {
    setItem(STORAGE_KEYS.QUIZ_PAGE, String(page))

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

    // Reset item timestamps when tab becomes visible again to avoid inflated response times
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const resetTime = Date.now()
        for (const item of getPageItems(page)) {
          if (responseTimes.current[item.id] === undefined) {
            itemShownAt.current[item.id] = resetTime
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depends only on `page`; pageItems is derived from page
  }, [page])

  const answeredOnPage = pageItems.filter(item => answers[item.id] !== undefined).length
  const allAnswered = answeredOnPage === ITEMS_PER_PAGE
  const totalAnswered = Object.keys(answers).length
  const progressPct = Math.round((totalAnswered / items.length) * 100)
  const remaining = items.length - totalAnswered

  function handleAnswer(itemId: number, value: number) {
    // Record response time on first answer to this item
    if (responseTimes.current[itemId] === undefined && itemShownAt.current[itemId] !== undefined) {
      responseTimes.current[itemId] = Date.now() - itemShownAt.current[itemId]
    }

    const next = { ...answers, [itemId]: value }
    setAnswers(next)
    setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(next))
  }

  async function handleNext() {
    if (!allAnswered) return

    // Record page duration
    pageDurations.current[page] = Date.now() - pageEnteredAt.current
    setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))

    if (page < TOTAL_PAGES) {
      setPage(p => p + 1)
    } else {
      // Save final answers and metadata to localStorage for results page
      setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers))
      setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))
      setItem(STORAGE_KEYS.RESPONSE_TIMES, JSON.stringify(responseTimes.current))
      setItem(STORAGE_KEYS.PAGE_DURATIONS, JSON.stringify(pageDurations.current))
      setItem(STORAGE_KEYS.QUIZ_PAGE, String(page))

      // Update session with completion time
      const session = await getItemAsync(STORAGE_KEYS.SESSION)
      if (session) {
        const s = JSON.parse(session)
        setItem(STORAGE_KEYS.SESSION, JSON.stringify({
          ...s,
          quizCompletedAt: new Date().toISOString(),
        }))
      }

      router.push('/profile')
    }
  }

  function handleBack() {
    pageDurations.current[page] = Date.now() - pageEnteredAt.current
    setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))

    if (page > 1) {
      setPage(p => p - 1)
    }
  }

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="glass-panel rounded-[2rem] px-5 py-6 sm:px-6">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                assessment // B5
              </span>

              <h1 className="section-title mt-5 text-3xl">
                แบบประเมินบุคลิกภาพ
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
                      <p className="body-faint mt-1 text-sm">{totalAnswered} / {items.length} ข้อ</p>
                    </div>
                    <div className="factor-medallion factor-medallion-number"><span>{page}</span></div>
                  </div>
                  <div
                    className="mt-4 rounded-full overflow-hidden"
                    style={{ height: '6px', background: 'rgba(69,98,118,0.12)' }}
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`ความคืบหน้า ${progressPct}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        background: 'var(--gradient-hero)',
                        boxShadow: '0 0 8px rgba(69,98,118,0.4)',
                      }}
                    />
                  </div>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">หน้านี้</span>
                    <span className="text-sm text-slate-500">{page} / {TOTAL_PAGES}</span>
                  </div>
                  <p className="body-soft mt-2 text-sm leading-[1.6]">
                    ตอบแล้ว {answeredOnPage} จาก {ITEMS_PER_PAGE} ข้อ
                    {remaining > 0 ? ` · เหลือทั้งหมด ${remaining} ข้อ` : ''}
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
                  ไม่มีคำตอบที่ถูกหรือผิด ตอบตามความเป็นจริงในชีวิตประจำวัน ใช้ความรู้สึกแรกได้เลย
                </p>
              </div>
            )}

            {/* ── Inline question table ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white' }}>
              {/* Column header — directional label */}
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
                const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx + 1
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
                    {/* Number */}
                    <span
                      className="text-[11px] font-bold tabular-nums text-center"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      {globalIdx}
                    </span>

                    {/* Question text */}
                    <p
                      id={qId}
                      className="text-[13.5px] leading-relaxed"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {item.th}
                    </p>

                    {/* Inline choice buttons */}
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
                          boxShadow: selected === label.value
                            ? '0 4px 12px rgba(44,67,80,0.22)'
                            : 'none',
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
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {allAnswered
                      ? 'ตอบครบแล้ว ไปหน้าถัดไปได้'
                      : `กรุณาตอบให้ครบ (${answeredOnPage}/${ITEMS_PER_PAGE})`}
                  </p>
                  <p className="body-faint mt-1 text-sm">
                    ระบบบันทึกคำตอบแบบร่างให้อัตโนมัติ
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleBack}
                    disabled={page === 1}
                    className="secondary-button px-6"
                  >
                    <span aria-hidden="true">←</span>
                    ย้อนกลับ
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!allAnswered}
                    className="primary-button px-7"
                  >
                    {page < TOTAL_PAGES ? 'ถัดไป' : 'ดูผลลัพธ์'}
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
