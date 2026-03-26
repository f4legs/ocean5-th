'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { items120, getPageItems120, ITEMS_PER_PAGE_120, TOTAL_PAGES_120 } from '@/lib/items120'
import { calcScores120 } from '@/lib/scoring120'
import QuizShell from '@/components/quiz-shell'

const DRAFT_SAVE_DEBOUNCE = 2000

export default function Quiz120Client() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth + payment gate
  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth?redirect=/quiz120')
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
      test_type: '120',
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

          const { data: draft } = await supabase
            .from('quiz_drafts')
            .select('answers, current_page, response_times, page_durations')
            .eq('user_id', session.user.id)
            .eq('test_type', '120')
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
            metadata: { testId: 'ipip-neo-120-th', completedAt: new Date().toISOString() },
            session_id: crypto.randomUUID(),
          }).select('id').single()

          await supabase.from('quiz_drafts')
            .delete()
            .eq('user_id', userId!)
            .eq('test_type', '120')

          sessionStorage.setItem('ocean_scores_120', JSON.stringify(scores))
          sessionStorage.setItem('ocean_answers_120', JSON.stringify(answers))
          if (profileRow?.id) {
            sessionStorage.setItem('ocean_profile_id_120', profileRow.id)
          }

          void pageDurations // used by Supabase draft save above
          void responseTimes

          router.push('/results120')
        },
      }}
    />
  )
}
