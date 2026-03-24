'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const OCEAN_DIM = [
  { letter: 'O', label: 'Openness',          hue: '210', facets: [82, 68, 91, 74, 58, 88] },
  { letter: 'C', label: 'Conscientiousness',  hue: '38',  facets: [76, 84, 62, 90, 71, 65] },
  { letter: 'E', label: 'Extraversion',       hue: '158', facets: [55, 79, 88, 44, 93, 67] },
  { letter: 'A', label: 'Agreeableness',      hue: '268', facets: [70, 60, 85, 78, 52, 94] },
  { letter: 'N', label: 'Neuroticism',        hue: '348', facets: [48, 87, 63, 71, 80, 56] },
]

const FEATURES = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4h12M2 8h10M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M12 12l.7.7 1.3-1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'รายงาน AI เชิงลึก 2,000–2,500 คำ',
    desc: 'วิเคราะห์ทุก Facet พร้อมแนวทางพัฒนาตนเองเฉพาะคุณ',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L4 4.5V9c0 2.5 2 4.5 4 5 2-.5 4-2.5 4-5V4.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M6 8.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'มาตรฐาน IPIP-NEO ระดับงานวิจัย',
    desc: 'แบบทดสอบที่นักจิตวิทยาใช้ทั่วโลก — แม่นกว่าทดสอบออนไลน์ทั่วไป',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M12 10.5c1.7.4 2.5 1.6 2.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    title: 'เปรียบเทียบ ต่อยอดได้ไม่จำกัด',
    desc: 'เก็บผลในระบบ เปรียบเทียบกับทีม และขยายเป็น 300 ข้อเมื่อพร้อม',
  },
]

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCheckingAuth(false)
      if (!session) router.replace('/auth?redirect=/checkout')
    })
  }, [router])

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth?redirect=/checkout')
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      return
    }

    window.location.href = data.url
  }

  if (checkingAuth) return null

  return (
    <main
      id="main"
      className="min-h-screen lg:flex lg:items-center lg:justify-center lg:p-8"
      style={{ background: '#e8ecef' }}
    >
      {/* ── Card shell: stacked on mobile/tablet, side-by-side on desktop ── */}
      <div className="w-full lg:max-w-5xl lg:rounded-[2rem] lg:overflow-hidden lg:shadow-[0_32px_80px_rgba(15,23,42,0.14)] lg:flex lg:min-h-[600px]">

        {/* ════ LEFT COLUMN — hero / value prop ════ */}
        <div
          className="px-7 pt-10 pb-9 sm:px-10 lg:flex-[3] lg:px-12 lg:py-14"
          style={{ background: 'linear-gradient(150deg, #456276 0%, #233643 100%)' }}
        >
          {/* eyebrow */}
          <div className="mb-7">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.72)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
                aria-hidden="true"
              />
              IPIP-NEO-120 · มาตรฐานวิจัยระดับโลก
            </span>
          </div>

          {/* headline */}
          <h1
            className="text-[2.2rem] sm:text-[2.6rem] leading-[1.1] font-bold tracking-[-0.03em] text-white mb-3"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            รู้จักตัวเอง<br />ใน 30 มิติ
          </h1>
          <p
            className="text-[13.5px] leading-relaxed max-w-xs"
            style={{ color: 'rgba(255,255,255,0.56)' }}
          >
            ไม่ใช่แค่ Big Five — แต่ทุก Facet ที่ทำให้คุณเป็นคุณ
            วิเคราะห์โดย AI เชิงลึก 2,500 คำ
          </p>

          {/* ── Biological facet bars ── */}
          <div className="mt-9 space-y-3.5">
            {OCEAN_DIM.map(d => (
              <div key={d.letter}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-bold tracking-[0.16em] uppercase w-3"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {d.letter}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{d.label}</span>
                  <span className="ml-auto text-[9px]" style={{ color: 'rgba(255,255,255,0.26)' }}>6 facets</span>
                </div>
                <div className="flex gap-1">
                  {d.facets.map((pct, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: '4px', background: 'rgba(255,255,255,0.09)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `hsl(${d.hue},60%,68%)`,
                          boxShadow: `0 0 5px hsl(${d.hue},60%,68%)`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Stats strip ── */}
          <div
            className="mt-8 grid grid-cols-3 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {[
              { value: '120', sub: 'คำถาม' },
              { value: '30',  sub: '30 Facets' },
              { value: '2,500', sub: 'คำ AI' },
            ].map((s, i) => (
              <div
                key={s.value}
                className="py-3.5 text-center"
                style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : undefined }}
              >
                <p className="text-[1.2rem] font-bold tabular-nums text-white leading-none">{s.value}</p>
                <p className="text-[9px] mt-0.5 tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Feature list — frosted glass on dark ── */}
          <div className="mt-7 space-y-2">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
                >
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.title}</p>
                  <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT COLUMN — checkout actions ════ */}
        <div
          className="px-7 pt-7 pb-9 sm:px-10 lg:flex-[2] lg:px-10 lg:py-14 flex flex-col justify-between gap-6"
          style={{ background: 'white' }}
        >
          <div className="space-y-5">

            {/* ── What's included (desktop accent) ── */}
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#96a8b2' }}>
                รวมอยู่ในราคา
              </p>
              <div className="space-y-2.5">
                {[
                  'รายงาน AI ส่วนตัว 2,500 คำ',
                  'ผล 30 Facets วิเคราะห์ละเอียด',
                  'บันทึกผลในระบบตลอดไป',
                  'เปรียบเทียบกับทีมและเพื่อน',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ color: '#456276', flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M4.5 7l1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px]" style={{ color: '#3d5a6a' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Price ── */}
            <div
              className="flex items-center justify-between px-5 py-4 rounded-2xl lg:rounded-xl"
              style={{ background: '#f4f7f9' }}
            >
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#1a3040' }}>ชำระครั้งเดียว</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#96a8b2' }}>ไม่มีค่าสมาชิกรายเดือน</p>
              </div>
              <p className="text-[2rem] font-bold tabular-nums leading-none" style={{ color: '#2c4350' }}>฿49</p>
            </div>

            {/* ── Notices ── */}
            {cancelled && (
              <div
                className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.07)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5" style={{ color: '#d97706' }} aria-hidden="true">
                  <path d="M7 2L13 12H1L7 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7 6v3M7 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="text-[12px]" style={{ color: '#92400e' }}>ยกเลิกการชำระเงิน — สามารถกลับมาชำระได้ทุกเมื่อ</p>
              </div>
            )}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.06)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 4.5V7.5M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="text-[12px]" style={{ color: '#b91c1c' }}>{error}</p>
              </div>
            )}

            {/* ── CTA ── */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold text-white rounded-2xl transition-all"
              style={{
                minHeight: '3.25rem',
                fontSize: '14px',
                background: loading
                  ? 'rgba(69,98,118,0.45)'
                  : 'linear-gradient(135deg, #456276 0%, #2c4350 100%)',
                boxShadow: loading ? 'none' : '0 10px 28px rgba(44,67,80,0.24)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3"/>
                      <path d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    กำลังนำไปชำระเงิน…
                  </>
                : 'ชำระเงิน ฿49 →'
              }
            </button>
          </div>

          {/* ── Bottom: trust + back ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-[10px]" style={{ color: '#96a8b2' }}>
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M5 1L2 2.5V5.5C2 7.5 3.5 9 5 9.5 6.5 9 8 7.5 8 5.5V2.5L5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                ปลอดภัย
              </span>
              <span>·</span>
              <span>ชำระผ่าน Stripe</span>
              <span>·</span>
              <span>ไม่มีค่ารายเดือน</span>
            </div>
            <div className="text-center">
              <Link
                href="/"
                className="text-[12px] transition-colors hover:opacity-80"
                style={{ color: '#7a9aaa' }}
              >
                ← กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center" style={{ background: '#e8ecef' }}>
        <div className="loading-line" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
