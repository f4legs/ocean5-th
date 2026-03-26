'use client'

import { useRouter } from 'next/navigation'
import { getPageItems, items, ITEMS_PER_PAGE, TOTAL_PAGES } from '@/lib/items'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItemAsync, setItem } from '@/lib/storage'
import QuizShell from '@/components/quiz-shell'

export default function QuizClient() {
  const router = useRouter()

  return (
    <QuizShell
      config={{
        eyebrowText: 'assessment // B5',
        titleText: 'แบบประเมินบุคลิกภาพ',
        subtitleText: 'อ่านแต่ละข้อ แล้วเลือกคำตอบที่ตรงกับตัวคุณมากที่สุด',
        instructionText: 'ไม่มีคำตอบที่ถูกหรือผิด ตอบตามความเป็นจริงในชีวิตประจำวัน ใช้ความรู้สึกแรกได้เลย',
        draftStatusText: 'ระบบบันทึกคำตอบแบบร่างให้อัตโนมัติ',
        items,
        getPageItems,
        itemsPerPage: ITEMS_PER_PAGE,
        totalPages: TOTAL_PAGES,
        premiumBadge: null,

        restoreState: async () => {
          const savedAnswers = await getItemAsync(STORAGE_KEYS.ANSWERS_DRAFT) ?? await getItemAsync(STORAGE_KEYS.ANSWERS)
          const savedPage = await getItemAsync(STORAGE_KEYS.QUIZ_PAGE)

          // Ensure session exists
          const existing = await getItemAsync(STORAGE_KEYS.SESSION)
          if (!existing) {
            setItem(STORAGE_KEYS.SESSION, JSON.stringify({
              sessionId: crypto.randomUUID(),
              startedAt: new Date().toISOString(),
            }))
          }

          const answers = savedAnswers ? (() => {
            try { return JSON.parse(savedAnswers) as Record<number, number> } catch { return {} }
          })() : {}

          const page = savedPage
            ? (() => {
              const p = Number.parseInt(savedPage, 10)
              return Number.isFinite(p) && p >= 1 && p <= TOTAL_PAGES ? p : 1
            })()
            : 1

          return { answers, page }
        },

        onAnswer: (_itemId, _value, nextAnswers) => {
          setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(nextAnswers))
        },

        onPageChange: (newPage, answers) => {
          setItem(STORAGE_KEYS.QUIZ_PAGE, String(newPage))
          setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))
        },

        onComplete: async ({ answers, responseTimes, pageDurations }) => {
          setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers))
          setItem(STORAGE_KEYS.ANSWERS_DRAFT, JSON.stringify(answers))
          setItem(STORAGE_KEYS.RESPONSE_TIMES, JSON.stringify(responseTimes))
          setItem(STORAGE_KEYS.PAGE_DURATIONS, JSON.stringify(pageDurations))

          const session = await getItemAsync(STORAGE_KEYS.SESSION)
          if (session) {
            const s = JSON.parse(session)
            setItem(STORAGE_KEYS.SESSION, JSON.stringify({
              ...s,
              quizCompletedAt: new Date().toISOString(),
            }))
          }

          router.push('/profile')
        },
      }}
    />
  )
}
