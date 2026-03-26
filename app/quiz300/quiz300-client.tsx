'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { items300, items300new, getPageItems300, ITEMS_PER_PAGE_300, TOTAL_PAGES_300 } from '@/lib/items300'
import { items120 } from '@/lib/items120'
import { calcScores300 } from '@/lib/scoring120'
import QuizShell from '@/components/quiz-shell'

const DRAFT_SAVE_DEBOUNCE = 2000

export default function Quiz300Client() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers120, setAnswers120] = useState<Record<number, number>>({})
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth + payment + 120-completion gate
  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth?redirect=/quiz300')
        return
      }

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
        router.replace('/quiz120')
        return
      }

      setAnswers120(profile120.answers as Record<number, number>)
      setUserId(session.user.id)
      setAuthChecked(true)
    }

    void checkAccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      test_type: '300',
      answers: currentAnswers,
      current_page: currentPage,
      response_times: responseTimes,
      page_durations: pageDurations,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,test_type' })
  }, [userId])

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

  return (
    <QuizShell
      config={{
        eyebrowText: 'research level // +180 ข้อ',
        titleText: 'OCEAN ระดับวิจัย',
        subtitleText: 'ต่อจากการทดสอบ 120 ข้อ — แสดงเฉพาะข้อที่ยังไม่เคยตอบ',
        instructionText: 'ไม่มีคำตอบที่ถูกหรือผิด กรุณาตอบตามความเป็นจริงของคุณ ข้อเหล่านี้เป็นข้อที่ยังไม่เคยทำในชุด 120 ข้อ',
        draftStatusText: `บันทึกร่างอัตโนมัติทุก ${DRAFT_SAVE_DEBOUNCE / 1000} วินาที`,
        items: items300new,
        getPageItems: getPageItems300,
        itemsPerPage: ITEMS_PER_PAGE_300,
        totalPages: TOTAL_PAGES_300,
        premiumBadge: {
          title: 'Research Level',
          features: [
            '💾 บันทึกร่างอัตโนมัติ — กลับมาทำต่อได้ทุกเมื่อ',
            '🔬 วิเคราะห์ 30 facets ครบ 300 ข้อ',
            '📊 รายงาน AI ระดับนักวิจัย 3,000+ คำ',
          ],
        },

        restoreState: async () => {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return null

          const { data: draft } = await supabase
            .from('quiz_drafts')
            .select('answers, current_page, response_times, page_durations')
            .eq('user_id', session.user.id)
            .eq('test_type', '300')
            .maybeSingle()

          if (!draft) return { answers: {}, page: 1 }

          return {
            answers: (draft.answers as Record<number, number>) ?? {},
            page: typeof draft.current_page === 'number' && draft.current_page >= 1 ? draft.current_page : 1,
            responseTimes: (draft.response_times as Record<number, number>) ?? {},
            pageDurations: (draft.page_durations as Record<number, number>) ?? {},
          }
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
          // Merge 120 answers + 180 new answers for full 300-item scoring
          const mergedAnswers: Record<number, number> = { ...answers120, ...answers }
          const scores = calcScores300(mergedAnswers, items300)

          const supabase = createClient()
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

          await supabase.from('quiz_drafts')
            .delete()
            .eq('user_id', userId!)
            .eq('test_type', '300')

          sessionStorage.setItem('ocean_scores_300', JSON.stringify(scores))
          if (profileRow?.id) {
            sessionStorage.setItem('ocean_profile_id_300', profileRow.id)
          }

          void pageDurations
          void responseTimes

          router.push('/results300')
        },
      }}
    />
  )
}
