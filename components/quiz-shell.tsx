'use client'

import { useEffect, useRef, useState } from 'react'
import { LABELS } from '@/lib/ocean-constants'

export interface QuizItem {
  id: number
  th: string
}

export interface QuizShellConfig {
  // Header text
  eyebrowText: string
  titleText: string
  subtitleText: string
  // Instructions shown on page 1
  instructionText: string
  // Draft save status text in footer
  draftStatusText: string

  // Items and pagination
  items: QuizItem[]
  getPageItems: (page: number) => QuizItem[]
  itemsPerPage: number
  totalPages: number

  // Optional premium badge section in sidebar
  premiumBadge?: {
    title: string
    features: string[]
  } | null

  // Storage/persistence callbacks
  restoreState: () => Promise<{
    answers: Record<number, number>
    page: number
    responseTimes?: Record<number, number>
    pageDurations?: Record<number, number>
  } | null>
  onAnswer: (
    itemId: number,
    value: number,
    currentAnswers: Record<number, number>,
    currentPage: number,
    responseTimes: Record<number, number>,
    pageDurations: Record<number, number>,
  ) => void
  onPageChange: (
    newPage: number,
    answers: Record<number, number>,
    responseTimes: Record<number, number>,
    pageDurations: Record<number, number>,
  ) => void
  onComplete: (data: {
    answers: Record<number, number>
    responseTimes: Record<number, number>
    pageDurations: Record<number, number>
  }) => void | Promise<void>
}

interface Props {
  config: QuizShellConfig
}

export default function QuizShell({ config }: Props) {
  const {
    eyebrowText, titleText, subtitleText, instructionText, draftStatusText,
    items, getPageItems, itemsPerPage, totalPages,
    premiumBadge,
    restoreState, onAnswer, onPageChange, onComplete,
  } = config

  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const itemShownAt = useRef<Record<number, number>>({})
  const pageEnteredAt = useRef<number>(Date.now())
  const pageDurations = useRef<Record<number, number>>({})
  const responseTimes = useRef<Record<number, number>>({})
  const restoredPage = useRef(false)

  // Restore state on mount
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const saved = await restoreState()
      if (cancelled || !saved) return

      if (saved.answers && Object.keys(saved.answers).length > 0) {
        setAnswers(saved.answers)
      }
      if (typeof saved.page === 'number' && saved.page >= 1 && saved.page <= totalPages) {
        setPage(saved.page)
      }
      if (saved.responseTimes) responseTimes.current = saved.responseTimes
      if (saved.pageDurations) pageDurations.current = saved.pageDurations
    }

    void restore()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track item-shown timestamps and handle visibility changes
  const pageItems = getPageItems(page)
  useEffect(() => {
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
        for (const item of getPageItems(page)) {
          if (responseTimes.current[item.id] === undefined) {
            itemShownAt.current[item.id] = resetTime
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const answeredOnPage = pageItems.filter(item => answers[item.id] !== undefined).length
  const allAnswered = answeredOnPage === itemsPerPage
  const totalAnswered = Object.keys(answers).length
  const progressPct = Math.round((totalAnswered / items.length) * 100)
  const remaining = items.length - totalAnswered

  function handleAnswer(itemId: number, value: number) {
    if (responseTimes.current[itemId] === undefined && itemShownAt.current[itemId] !== undefined) {
      responseTimes.current[itemId] = Date.now() - itemShownAt.current[itemId]
    }
    const next = { ...answers, [itemId]: value }
    setAnswers(next)
    onAnswer(itemId, value, next, page, responseTimes.current, pageDurations.current)
  }

  async function handleNext() {
    if (!allAnswered) return
    pageDurations.current[page] = Date.now() - pageEnteredAt.current

    if (page < totalPages) {
      const nextPage = page + 1
      onPageChange(nextPage, answers, responseTimes.current, pageDurations.current)
      setPage(nextPage)
    } else {
      await onComplete({
        answers,
        responseTimes: responseTimes.current,
        pageDurations: pageDurations.current,
      })
    }
  }

  function handleBack() {
    pageDurations.current[page] = Date.now() - pageEnteredAt.current
    if (page > 1) {
      const prevPage = page - 1
      onPageChange(prevPage, answers, responseTimes.current, pageDurations.current)
      setPage(prevPage)
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
                {eyebrowText}
              </span>

              <h1 className="section-title mt-5 text-3xl">
                {titleText}
              </h1>
              <p className="body-soft mt-3 text-sm leading-[1.6]">
                {subtitleText}
              </p>

              <div className="mt-6 space-y-3">
                {/* Progress panel */}
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

                {/* Page info panel */}
                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">หน้านี้</span>
                    <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                  </div>
                  <p className="body-soft mt-2 text-sm leading-[1.6]">
                    ตอบแล้ว {answeredOnPage} จาก {itemsPerPage} ข้อ
                    {remaining > 0 ? ` · เหลือทั้งหมด ${remaining} ข้อ` : ''}
                  </p>
                </div>

                {/* Answer scale legend */}
                <div className="muted-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-faint)' }}>
                    สเกลคำตอบ
                  </p>
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

                {/* Optional premium badge */}
                {premiumBadge && (
                  <div
                    className="rounded-[1.5rem] px-4 py-4 space-y-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(69,98,118,0.10) 0%, rgba(44,67,80,0.06) 100%)',
                      border: '1px solid rgba(69,98,118,0.15)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-strong)' }}>
                      ✦ {premiumBadge.title}
                    </p>
                    <div className="space-y-1.5">
                      {premiumBadge.features.map((feature, i) => (
                        <p key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          {feature}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-3">
            {/* Instruction note on page 1 */}
            {page === 1 && (
              <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--page-surface)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                  คำแนะนำ
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {instructionText}
                </p>
              </div>
            )}

            {/* Question table */}
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
                const globalIdx = (page - 1) * itemsPerPage + idx + 1
                const selected = answers[item.id]
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
                    <span
                      className="text-[11px] font-bold tabular-nums text-center"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      {globalIdx}
                    </span>
                    <p
                      id={`q-${item.id}`}
                      className="text-[13.5px] leading-relaxed"
                      style={{ color: 'var(--text-main)' }}
                    >
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

            {/* Navigation footer */}
            <div className="glass-panel rounded-[1.75rem] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {allAnswered
                      ? 'ตอบครบแล้ว ไปหน้าถัดไปได้'
                      : `กรุณาตอบให้ครบ (${answeredOnPage}/${itemsPerPage})`}
                  </p>
                  <p className="body-faint mt-1 text-sm">{draftStatusText}</p>
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
                    {page < totalPages ? 'ถัดไป' : 'ดูผลลัพธ์'}
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
