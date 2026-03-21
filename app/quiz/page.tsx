'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPageItems, items, ITEMS_PER_PAGE, TOTAL_PAGES } from '@/lib/items'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItem, setItem } from '@/lib/storage'

const LABELS = [
  { value: 5, th: 'ตรงกับฉันมาก' },
  { value: 4, th: 'ค่อนข้างตรงกับฉัน' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรงกับฉัน' },
  { value: 1, th: 'ไม่ตรงกับฉันเลย' },
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
    const savedAnswers = getItem(STORAGE_KEYS.ANSWERS_DRAFT) ?? getItem(STORAGE_KEYS.ANSWERS)
    if (savedAnswers) {
      try { setAnswers(JSON.parse(savedAnswers)) } catch { /* ignore corrupt draft */ }
    }

    const savedPage = getItem(STORAGE_KEYS.QUIZ_PAGE)
    if (savedPage) {
      const parsedPage = Number.parseInt(savedPage, 10)
      if (Number.isFinite(parsedPage) && parsedPage >= 1 && parsedPage <= TOTAL_PAGES) {
        setPage(parsedPage)
      }
    }

    // Create session if not exists
    const existing = getItem(STORAGE_KEYS.SESSION)
    if (!existing) {
      setItem(STORAGE_KEYS.SESSION, JSON.stringify({
        sessionId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
      }))
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

  function handleNext() {
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
      const session = getItem(STORAGE_KEYS.SESSION)
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
                Assessment Flow
              </span>

              <h1 className="section-title mt-5 text-3xl">
                ประเมินบุคลิกภาพอย่างเป็นจังหวะ
              </h1>
              <p className="body-soft mt-3 text-sm leading-7">
                อ่านข้อความแต่ละข้อ แล้วเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด
                ใช้ความรู้สึกแรกของตัวเองเป็นหลักเพื่อให้ผลลัพธ์สะท้อนธรรมชาติจริงมากขึ้น
              </p>

              <div className="mt-6 space-y-3">
                <div className="section-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Progress
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold text-slate-900">{progressPct}%</p>
                      <p className="body-faint mt-1 text-sm">ตอบแล้ว {totalAnswered} จาก {items.length} ข้อ</p>
                    </div>
                    <div className="factor-medallion factor-medallion-number"><span>{page}</span></div>
                  </div>
                  <div
                    className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/70"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`ความคืบหน้า ${progressPct}%`}
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#284b5b,#78909b)] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">หน้าปัจจุบัน</span>
                    <span className="text-sm text-slate-500">{page} / {TOTAL_PAGES}</span>
                  </div>
                  <p className="body-soft mt-2 text-sm leading-7">
                    หน้านี้ตอบแล้ว {answeredOnPage} จาก {ITEMS_PER_PAGE} ข้อ
                    {remaining > 0 ? ` และเหลืออีก ${remaining} ข้อในแบบทดสอบทั้งหมด` : ''}
                  </p>
                </div>

                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">ระดับคำตอบ</p>
                  <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                    {LABELS.map(label => (
                      <div key={label.value} className="rounded-2xl bg-white/80 px-2 py-3">
                        <div className="text-base font-semibold text-slate-800">{label.value}</div>
                        <div className="mt-1 text-[11px] leading-4 text-slate-500">{label.th}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            {page === 1 && (
              <div className="section-panel rounded-[1.75rem] px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  Instructions
                </p>
                <p className="mt-3 text-sm leading-8 text-slate-600">
                  ไม่มีคำตอบที่ถูกหรือผิด กรุณาตอบตามความเป็นจริงของคุณในชีวิตประจำวัน
                  ไม่ต้องพยายามเลือกคำตอบที่ “ดูดี” ที่สุด เพราะคุณภาพของผลลัพธ์ขึ้นอยู่กับความตรงไปตรงมาในการตอบ
                </p>
              </div>
            )}

            <div className="space-y-4">
              {pageItems.map((item, idx) => {
                const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx + 1
                const selected = answers[item.id]
                const qId = `q-${item.id}`

                return (
                  <article
                    key={item.id}
                    className={`section-panel rounded-[1.75rem] px-5 py-5 sm:px-6 sm:py-6 ${
                      selected !== undefined ? 'ring-1 ring-[rgba(84,114,127,0.18)]' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-3">
                          <div className="factor-medallion factor-medallion-number h-10 w-10 font-[family-name:var(--font-body)] text-sm leading-none">
                            <span>{globalIdx}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Question
                            </p>
                            <p
                              id={qId}
                              className="mt-1 text-base font-medium leading-8 text-slate-800 sm:text-lg"
                            >
                              {item.th}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent-strong)]">
                        เลือก 1 ตัวเลือก
                      </div>
                    </div>

                    <div
                      role="radiogroup"
                      aria-labelledby={qId}
                      className="mt-5 grid gap-3 sm:grid-cols-5"
                    >
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
                          <span className="text-sm leading-6 sm:text-xs sm:leading-5">{label.th}</span>
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
                    {allAnswered
                      ? 'หน้านี้ตอบครบแล้ว สามารถไปต่อได้'
                      : `กรุณาตอบให้ครบทุกข้อในหน้านี้ (${answeredOnPage}/${ITEMS_PER_PAGE})`}
                  </p>
                  <p className="body-faint mt-1 text-sm">
                    ระบบจะบันทึกคำตอบแบบร่างให้โดยอัตโนมัติในอุปกรณ์ของคุณ
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
