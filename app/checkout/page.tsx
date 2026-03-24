'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

const features = [
  '120 ข้อ · IPIP-NEO มาตรฐานสากล',
  'ผลลัพธ์ 30 ลักษณะย่อย (Facets) ใน 5 มิติหลัก',
  'รายงาน AI เชิงลึก 2,000-2,500 คำ',
  'บันทึกผลและเปรียบเทียบกับผู้อื่นได้',
  'สามารถต่อยอดเป็น 300 ข้อ (ระดับวิจัย)',
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setCheckingAuth(false)
      if (!session) {
        router.replace('/auth?redirect=/checkout')
      }
    })
  }, [router])

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabaseBrowser.auth.getSession()
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

    // Redirect to Stripe Checkout
    window.location.href = data.url
  }

  if (checkingAuth) return null

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap max-w-lg">
        <div className="glass-panel rounded-[2rem] px-6 py-10 sm:px-10">
          <span className="eyebrow">
            <span className="accent-dot" aria-hidden="true" />
            ทดสอบเชิงลึก
          </span>

          <h1 className="display-title mt-5 text-3xl sm:text-4xl">
            OCEAN ระดับ Facet
          </h1>
          <p className="body-soft mt-3 text-sm leading-6">
            เจาะลึก 30 ลักษณะย่อยด้วย IPIP-NEO-120 มาตรฐานสากล
            พร้อมรายงาน AI วิเคราะห์เฉพาะคุณ
          </p>

          <ul className="mt-8 space-y-3">
            {features.map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-[var(--text-main)]">
                <span className="mt-0.5 text-[var(--accent)]" aria-hidden="true">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 section-panel rounded-xl px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[var(--text-soft)]">ราคา</span>
            <span className="text-2xl font-semibold text-[var(--text-main)]">฿49</span>
          </div>

          {cancelled && (
            <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ยกเลิกการชำระเงิน — คุณสามารถกลับมาชำระได้ทุกเมื่อ
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="primary-button mt-6 w-full justify-center text-base"
          >
            {loading ? 'กำลังนำไปชำระเงิน...' : 'ชำระเงิน ฿49 →'}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--text-faint)]">
            ชำระผ่าน Stripe · ปลอดภัย · ไม่มีค่าสมาชิกรายเดือน
          </p>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
