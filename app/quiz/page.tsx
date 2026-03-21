'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { items, ITEMS_PER_PAGE, TOTAL_PAGES, getPageItems } from '@/lib/items'

const LABELS = [
  { value: 1, th: 'ไม่ตรงกับฉันเลย' },
  { value: 2, th: 'ไม่ค่อยตรงกับฉัน' },
  { value: 3, th: 'ไม่แน่ใจ' },
  { value: 4, th: 'ค่อนข้างตรงกับฉัน' },
  { value: 5, th: 'ตรงกับฉันมาก' },
]

export default function QuizPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const pageItems = getPageItems(page)
  const answeredOnPage = pageItems.filter(item => answers[item.id] !== undefined).length
  const allAnswered = answeredOnPage === ITEMS_PER_PAGE
  const totalAnswered = Object.keys(answers).length
  const progressPct = Math.round((totalAnswered / items.length) * 100)

  function handleAnswer(itemId: number, value: number) {
    setAnswers(prev => ({ ...prev, [itemId]: value }))
  }

  function handleNext() {
    if (!allAnswered) return
    if (page < TOTAL_PAGES) {
      setPage(p => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      localStorage.setItem('ocean_answers', JSON.stringify(answers))
      router.push('/profile')
    }
  }

  function handleBack() {
    if (page > 1) {
      setPage(p => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
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
          {/* Progress bar */}
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-colors ${
                  selected !== undefined ? 'border-indigo-200' : 'border-slate-100'
                }`}
              >
                <p className="font-medium text-slate-800 mb-4 leading-relaxed">
                  <span className="text-indigo-400 font-bold mr-2">{globalIdx}.</span>
                  {item.th}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {LABELS.map(label => (
                    <button
                      key={label.value}
                      onClick={() => handleAnswer(item.id, label.value)}
                      className={`flex-1 min-w-[80px] py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                        selected === label.value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="block text-center">{label.value}</span>
                      <span className="block text-center leading-tight mt-0.5">{label.th}</span>
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
