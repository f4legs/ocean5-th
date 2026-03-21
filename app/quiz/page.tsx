'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { items, ITEMS_PER_PAGE, TOTAL_PAGES, getPageItems } from '@/lib/items'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItem, setItem, removeItem } from '@/lib/storage'

const LABELS = [
  { value: 1, th: 'ไม่ตรงกับฉันเลย' },
  { value: 2, th: 'ไม่ค่อยตรงกับฉัน' },
  { value: 3, th: 'เป็นกลาง' },           // was "ไม่แน่ใจ" — fixed to match IPIP neutral midpoint
  { value: 4, th: 'ค่อนข้างตรงกับฉัน' },
  { value: 5, th: 'ตรงกับฉันมาก' },
]

export default function QuizPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  // Per-item first-display timestamps for response-time tracking
  const itemShownAt = useRef<Record<number, number>>({})
  // Per-page entry timestamps for duration tracking
  const pageEnteredAt = useRef<number>(Date.now())
  const pageDurations = useRef<Record<number, number>>({})
  // Per-item response time in ms
  const responseTimes = useRef<Record<number, number>>({})

  // Restore draft answers and init session on mount
  useEffect(() => {
    const draft = getItem(STORAGE_KEYS.ANSWERS_DRAFT)
    if (draft) {
      try { setAnswers(JSON.parse(draft)) } catch { /* ignore corrupt draft */ }
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
    const now = Date.now()
    pageEnteredAt.current = now
    for (const item of pageItems) {
      if (itemShownAt.current[item.id] === undefined) {
        itemShownAt.current[item.id] = now
      }
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Save final answers and metadata to localStorage for results page
      setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers))
      setItem(STORAGE_KEYS.RESPONSE_TIMES, JSON.stringify(responseTimes.current))
      setItem(STORAGE_KEYS.PAGE_DURATIONS, JSON.stringify(pageDurations.current))
      // Update session with completion time
      const session = getItem(STORAGE_KEYS.SESSION)
      if (session) {
        const s = JSON.parse(session)
        setItem(STORAGE_KEYS.SESSION, JSON.stringify({
          ...s,
          quizCompletedAt: new Date().toISOString(),
        }))
      }
      removeItem(STORAGE_KEYS.ANSWERS_DRAFT)
      router.push('/profile')
    }
  }

  function handleBack() {
    pageDurations.current[page] = Date.now() - pageEnteredAt.current
    setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))
    if (page > 1) {
      setPage(p => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <main id="main" className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">
              หน้า {page} / {TOTAL_PAGES}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {totalAnswered} / {items.length} ข้อ
            </span>
          </div>
          <div
            className="h-2 bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`ความคืบหน้า ${progressPct}%`}
          >
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Instruction (first page only) */}
        {page === 1 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-800 leading-relaxed">
            <strong>คำชี้แจง:</strong> กรุณาอ่านแต่ละข้อความและเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด
            ไม่มีคำตอบที่ถูกหรือผิด ตอบตามความรู้สึกแรกของคุณ
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {pageItems.map((item, idx) => {
            const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx + 1
            const selected = answers[item.id]
            const qId = `q-${item.id}`

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-colors ${
                  selected !== undefined ? 'border-indigo-200' : 'border-slate-100'
                }`}
              >
                <p
                  id={qId}
                  className="font-medium text-slate-800 mb-4 leading-relaxed"
                >
                  <span className="text-indigo-400 font-bold mr-2">{globalIdx}.</span>
                  {item.th}
                </p>

                {/* Mobile: vertical stack; Desktop: horizontal row */}
                <div
                  role="radiogroup"
                  aria-labelledby={qId}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  {LABELS.map(label => (
                    <button
                      key={label.value}
                      role="radio"
                      aria-checked={selected === label.value}
                      onClick={() => handleAnswer(item.id, label.value)}
                      className={`flex sm:flex-col flex-row items-center sm:justify-center gap-2 sm:gap-0 flex-1 py-2 px-3 sm:px-1 rounded-xl text-xs font-medium border transition-all ${
                        selected === label.value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="font-bold text-sm">{label.value}</span>
                      <span className="leading-tight sm:mt-0.5 text-center">{label.th}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-4">
          <button
            onClick={handleBack}
            disabled={page === 1}
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium disabled:opacity-30 hover:bg-slate-100 transition-colors"
          >
            ← ย้อนกลับ
          </button>
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {page < TOTAL_PAGES ? 'ถัดไป →' : 'ดูผลลัพธ์ →'}
          </button>
        </div>

        {!allAnswered && (
          <p className="text-center text-sm text-amber-500 mt-3">
            กรุณาตอบให้ครบทุกข้อในหน้านี้ก่อน ({answeredOnPage}/{ITEMS_PER_PAGE})
          </p>
        )}
      </div>
    </main>
  )
}
