'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const OCEAN_DIM = [
  { letter: 'O', label: 'Openness', hue: '210', facets: [82, 68, 91, 74, 58, 88] },
  { letter: 'C', label: 'Conscientiousness', hue: '38', facets: [76, 84, 62, 90, 71, 65] },
  { letter: 'E', label: 'Extraversion', hue: '158', facets: [55, 79, 88, 44, 93, 67] },
  { letter: 'A', label: 'Agreeableness', hue: '268', facets: [70, 60, 85, 78, 52, 94] },
  { letter: 'N', label: 'Neuroticism', hue: '348', facets: [48, 87, 63, 71, 80, 56] },
]

const FEATURE_STORIES = [
  {
    title: 'ลงลึกถึงระดับ Facet',
    desc: 'จากคะแนน 5 ด้าน ไปสู่ 30 องค์ประกอบย่อยที่ช่วยอธิบายรูปแบบการคิด การทำงาน และการสื่อสารได้ละเอียดขึ้น',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 12.5h11M4 10V6.5M8 10V3.5M12 10V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="4" cy="5.5" r="1" fill="currentColor" />
        <circle cx="8" cy="2.5" r="1" fill="currentColor" />
        <circle cx="12" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'รายงานที่เชื่อมกับคะแนนจริง',
    desc: 'สรุปเชิงลึกภาษาไทยโดยอิงผลประเมินของคุณ เพื่อช่วยมองภาพรวม จุดเด่น ประเด็นเสี่ยง และแนวทางพัฒนาที่ชัดเจนขึ้น',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 2.5h5l3 3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 2.5v3h3M5.5 8h5M5.5 10.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'ใช้งานต่อได้ใน Dashboard',
    desc: 'จัดเก็บผล เปรียบเทียบโปรไฟล์ ส่งต่อ และดาวน์โหลด PDF ได้ในพื้นที่ทำงานเดียว ไม่จบแค่หน้า result ครั้งแรก',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="11.5" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 13c.3-2 2-3.5 4.1-3.5 1.7 0 3.1.8 3.8 2.1M9 12.7c.4-1.3 1.6-2.2 3.1-2.2 1 0 1.9.4 2.6 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const INCLUDED_NOW = [
  'แบบประเมิน 120 ข้อ พร้อมผลระดับ 30 facets',
  'สิทธิ์ทำแบบประเมิน 300 ข้อโดยไม่ซื้อเพิ่ม',
  'รายงาน AI ภาษาไทยเชิงลึกสำหรับแต่ละโปรไฟล์',
  'จัดเก็บผลและกลับมาเปิดดูได้ใน Dashboard',
  'เปรียบเทียบ 2 โปรไฟล์และส่งออก PDF',
  'แชร์ผลผ่านลิงก์ส่วนตัวเพื่อใช้คุยต่อกับผู้อื่น',
]

const PROFESSIONAL_USE_CASES = [
  'ใช้ทบทวนจุดแข็ง จุดเสี่ยง และสไตล์การทำงานของตนเองอย่างเป็นระบบ',
  'ใช้เป็นฐานสนทนาในการ feedback, coaching หรือการคุยเรื่องบทบาทในทีม',
  'ใช้เทียบโปรไฟล์ระหว่างบุคคลโดยมีบริบทมากกว่าการดูคะแนนรวมเพียงอย่างเดียว',
  'ใช้เก็บผลไว้ดูย้อนหลังเมื่อมีการประเมินรอบใหม่',
]

const FLOW_STEPS = [
  {
    step: '01',
    title: 'ชำระและยืนยันสิทธิ์',
    desc: 'ระบบปลดล็อกสิทธิ์ให้บัญชีของคุณผ่าน Stripe แบบครั้งเดียว ไม่มีค่ารายเดือน',
  },
  {
    step: '02',
    title: 'เลือกความลึกที่ต้องการ',
    desc: 'เริ่มจาก 120 ข้อ หรือไปต่อที่ 300 ข้อได้ทันทีภายใต้แพ็กเดียว',
  },
  {
    step: '03',
    title: 'นำผลไปใช้ต่อ',
    desc: 'รับรายงาน เก็บผล เปรียบเทียบ และแชร์ต่อได้จาก Dashboard เดียว',
  },
]

const VALUE_METRICS = [
  { value: '120', label: 'ข้อใน deep test' },
  { value: '30', label: 'facet scores' },
  { value: '300', label: 'ข้อใน research tier' },
  { value: '2,500', label: 'คำรายงานโดยประมาณ' },
]

function CheckIcon({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? 'rgba(255,255,255,0.88)' : '#5b7382'

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color, flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.1 8.1l1.8 1.8 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)

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
    setAlreadyPurchased(false)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        router.push('/auth?redirect=/checkout')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      const data = await res.json().catch(() => ({})) as { error?: string; url?: string }

      if (!res.ok) {
        if (data.error === 'Already purchased') {
          setAlreadyPurchased(true)
          setError('บัญชีนี้ปลดล็อกแพ็ก Deep แล้ว สามารถไปที่ Dashboard ได้เลย')
        } else {
          setError(data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
        setLoading(false)
        return
      }

      if (!data.url) {
        setError('ไม่พบลิงก์สำหรับชำระเงิน กรุณาลองใหม่')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('เชื่อมต่อระบบชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      setLoading(false)
    }
  }

  if (checkingAuth) return null

  return (
    <main
      id="main"
      className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8 lg:flex lg:items-center lg:justify-center lg:px-8"
      style={{
        background: `
          radial-gradient(circle at top left, rgba(120,150,168,0.22), transparent 28%),
          radial-gradient(circle at bottom right, rgba(35,54,67,0.18), transparent 30%),
          linear-gradient(180deg, #edf1f3 0%, #e3e8eb 100%)
        `,
      }}
    >
      <div className="relative w-full max-w-6xl">
        <div
          className="pointer-events-none absolute -left-14 top-10 h-44 w-44 rounded-full blur-3xl"
          style={{ background: 'rgba(69,98,118,0.18)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full blur-3xl"
          style={{ background: 'rgba(35,54,67,0.14)' }}
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-[0_36px_100px_rgba(15,23,42,0.12)] lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <section
            className="relative px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10 lg:px-12 lg:pb-12 lg:pt-12"
            style={{
              backgroundImage: `
                linear-gradient(145deg, rgba(18, 32, 41, 0.82) 0%, rgba(23, 43, 54, 0.76) 48%, rgba(17, 31, 40, 0.84) 100%),
                radial-gradient(circle at 15% 10%, rgba(133, 169, 188, 0.24), transparent 38%),
                radial-gradient(circle at 85% 80%, rgba(13, 24, 31, 0.35), transparent 48%),
                url('/checkoutBG.webp')
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)' }}
              aria-hidden="true"
            />

            <div className="relative">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.76)' }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#c7d6df', boxShadow: '0 0 10px rgba(199,214,223,0.8)' }}
                  aria-hidden="true"
                />
                Professional insight pack
              </span>

              <h1
                className="mt-6 max-w-3xl text-[2.3rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-[2.9rem] lg:text-[3.35rem]"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                อ่านบุคลิกภาพ
                <br />
                ให้ลึกกว่า
                <br />
                คะแนน 5 ด้าน
              </h1>

              <p
                className="mt-5 max-w-2xl text-[14px] leading-7 sm:text-[15px]"
                style={{ color: 'rgba(255,255,255,0.68)' }}
              >
                แพ็กนี้ออกแบบสำหรับผู้ที่ต้องการใช้ผลประเมินอย่างจริงจัง ทั้งเพื่อการพัฒนาตนเอง
                การคุยกับทีม หรือการเปรียบเทียบโปรไฟล์ระหว่างบุคคล โดยรวมแบบประเมินเชิงลึก
                รายงาน AI และเครื่องมือใช้งานต่อไว้ในที่เดียว
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  'โครงแบบอ้างอิง IPIP-NEO',
                  'มองเห็นรายละเอียดระดับ 30 facets',
                  'เหมาะกับ self-reflection และ team discussion',
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full px-3 py-1.5 text-[11px] font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.84)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {FEATURE_STORIES.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] px-4 py-4"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.88)' }}
                    >
                      {item.icon}
                    </div>
                    <h2 className="mt-4 text-[15px] font-semibold leading-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {item.title}
                    </h2>
                    <p className="mt-2 text-[12.5px] leading-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {item.desc}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
                <div
                  className="rounded-[1.75rem] px-5 py-5"
                  style={{
                    background: 'rgba(9,14,20,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                        Depth preview
                      </p>
                      <p className="mt-2 text-[1.45rem] font-semibold leading-tight text-white">
                        จากโดเมนหลัก
                        <br />
                        ไปสู่ 30 facets
                      </p>
                    </div>
                    <div
                      className="rounded-2xl px-3 py-2 text-right"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                      }}
                    >
                      <p className="flex items-baseline justify-end gap-1 whitespace-nowrap text-[1.1rem] font-bold tabular-nums text-white">
                        <span>5</span>
                        <span aria-hidden="true">→</span>
                        <span>30</span>
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>resolution</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {OCEAN_DIM.map((dimension) => (
                      <div key={dimension.letter}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className="w-3 text-[10px] font-bold uppercase tracking-[0.16em]"
                            style={{ color: 'rgba(255,255,255,0.52)' }}
                          >
                            {dimension.letter}
                          </span>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.34)' }}>
                            {dimension.label}
                          </span>
                          <span className="ml-auto text-[9px]" style={{ color: 'rgba(255,255,255,0.26)' }}>
                            6 facets
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {dimension.facets.map((pct, index) => (
                            <div
                              key={`${dimension.letter}-${index}`}
                              className="h-[4px] flex-1 overflow-hidden rounded-full"
                              style={{ background: 'rgba(255,255,255,0.09)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: `hsl(${dimension.hue}, 60%, 68%)`,
                                  boxShadow: `0 0 5px hsl(${dimension.hue}, 60%, 68%)`,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[1.75rem] px-5 py-5"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {VALUE_METRICS.map((metric) => (
                      <div
                        key={metric.value}
                        className="rounded-2xl px-4 py-4"
                        style={{
                          background: 'rgba(11,17,24,0.2)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <p className="text-[1.45rem] font-bold leading-none tabular-nums text-white">
                          {metric.value}
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                      การใช้งานที่เหมาะ
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {PROFESSIONAL_USE_CASES.map((item) => (
                        <div key={item} className="flex items-start gap-2.5">
                          <CheckIcon tone="dark" />
                          <p className="text-[13px] leading-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="relative bg-white px-6 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-8 lg:px-9 lg:pb-10 lg:pt-10">
            <div className="space-y-5">
              <div
                className="rounded-[1.75rem] px-5 py-5"
                style={{ background: 'linear-gradient(180deg, rgba(244,247,249,0.98), rgba(255,255,255,0.98))' }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ background: 'white', color: '#456276', border: '1px solid rgba(69,98,118,0.12)' }}
                >
                  One-time unlock
                </span>

                <h2
                  className="mt-4 text-[2rem] font-bold leading-[1.08] tracking-[-0.03em]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', color: '#1a3040' }}
                >
                  แพ็กเดียวสำหรับ
                  <br />
                  การประเมินเชิงลึก
                </h2>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-[1.4rem] font-medium" style={{ color: '#628092' }}>฿</span>
                  <span className="text-[4.4rem] font-bold leading-none tabular-nums" style={{ color: '#223845' }}>
                    49
                  </span>
                </div>

                <p className="mt-3 text-[13px] leading-6" style={{ color: '#55707f' }}>
                  ชำระครั้งเดียวเพื่อปลดล็อกสิทธิ์การใช้งานแบบประเมินเชิงลึก รายงาน AI
                  และเครื่องมือใช้งานต่อในระบบ
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    'ครอบคลุมทั้งแบบประเมิน 120 และ 300 ข้อ',
                    'ผลลัพธ์และประวัติการใช้งานอยู่ใน Dashboard เดียว',
                    'ชำระผ่าน Stripe พร้อมปลดล็อกสิทธิ์ทันทีหลังยืนยัน',
                  ].map((note) => (
                    <div
                      key={note}
                      className="rounded-2xl px-3.5 py-3 text-[12px] leading-5 font-medium"
                      style={{ background: 'white', color: '#355062', border: '1px solid rgba(69,98,118,0.1)' }}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[#f4f7f9] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#8aa0ad' }}>
                  รวมอยู่ในราคา
                </p>
                <div className="mt-3 space-y-2.5">
                  {INCLUDED_NOW.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckIcon tone="light" />
                      <p className="text-[13px] leading-6" style={{ color: '#3d5a6a' }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[#fbfcfd] px-5 py-5" style={{ border: '1px solid rgba(108,124,136,0.12)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#8aa0ad' }}>
                  หลังชำระเงิน
                </p>
                <div className="mt-3 space-y-3">
                  {FLOW_STEPS.map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: '#e7eef2', color: '#355062' }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: '#233845' }}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-[12px] leading-5" style={{ color: '#708896' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {cancelled && (
                <div className="flex items-start gap-2.5 rounded-[1.25rem] px-4 py-3.5" style={{ background: 'rgba(245,158,11,0.07)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" style={{ color: '#d97706' }} aria-hidden="true">
                    <path d="M7 2L13 12H1L7 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M7 6v3M7 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <p className="text-[12px] leading-5" style={{ color: '#92400e' }}>
                    คุณยกเลิกการชำระเงินไว้ก่อน สามารถกลับมาปลดล็อกเมื่อพร้อมได้ทุกเมื่อ
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-[1.25rem] px-4 py-3.5" style={{ background: alreadyPurchased ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)' }}>
                  <div className="flex items-start gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" style={{ color: alreadyPurchased ? '#059669' : '#ef4444' }} aria-hidden="true">
                      {alreadyPurchased ? (
                        <>
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M4.7 7.1l1.6 1.6 3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M7 4.5V7.5M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </>
                      )}
                    </svg>
                    <div className="min-w-0">
                      <p className="text-[12px] leading-5" style={{ color: alreadyPurchased ? '#047857' : '#b91c1c' }}>
                        {error}
                      </p>
                      {alreadyPurchased && (
                        <Link href="/dashboard" className="mt-2 inline-flex text-[12px] font-semibold" style={{ color: '#047857' }}>
                          ไปที่ Dashboard →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="primary-button w-full justify-center text-base"
                  style={{
                    minHeight: '3.55rem',
                    background: loading
                      ? 'rgba(69,98,118,0.45)'
                      : 'linear-gradient(135deg, #456276 0%, #2c4350 100%)',
                    boxShadow: loading ? 'none' : '0 14px 34px rgba(44,67,80,0.24)',
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                        <path d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      กำลังพาไปชำระเงิน...
                    </>
                  ) : (
                    <>
                      ปลดล็อกทั้งหมดในราคา ฿49
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                {alreadyPurchased ? (
                  <Link href="/dashboard" className="secondary-button w-full justify-center text-sm">
                    ไปที่ Dashboard
                  </Link>
                ) : (
                  <Link href="/" className="secondary-button w-full justify-center text-sm">
                    <span aria-hidden="true">←</span>
                    กลับไปดูหน้าหลัก
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-5" style={{ borderColor: 'rgba(108,124,136,0.12)' }}>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[11px]" style={{ color: '#8aa0ad' }}>
                <span>ปลอดภัย</span>
                <span>·</span>
                <span>Stripe Checkout</span>
                <span>·</span>
                <span>ไม่มีค่ารายเดือน</span>
                <span>·</span>
                <span>ปลดล็อกได้ทันทีหลังชำระ</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" style={{ background: '#e8ecef' }}>
          <div className="loading-line" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
