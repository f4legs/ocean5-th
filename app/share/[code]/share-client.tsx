'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type AcceptState = 'checking' | 'need-login' | 'accepting' | 'done' | 'not-paid' | 'error'

interface Props {
  code: string
  ownerLabel: string
  profileLabel: string
  testType: string
}

export default function ShareClient({ code, ownerLabel, profileLabel, testType }: Props) {
  const [state, setState] = useState<AcceptState>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loginHref = useMemo(() => `/auth?redirect=${encodeURIComponent(`/share/${code}`)}`, [code])

  useEffect(() => {
    let cancelled = false

    async function claimLink() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session) {
        setState('need-login')
        return
      }

      setState('accepting')

      const res = await fetch('/api/profile-share/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }

      if (cancelled) return

      if (res.ok) {
        setState('done')
        return
      }

      if (res.status === 401) {
        setState('need-login')
        return
      }

      if (res.status === 403) {
        setState('not-paid')
        setErrorMessage(data.error ?? 'ต้องเป็นสมาชิกแบบชำระเงินจึงจะรับโปรไฟล์ได้')
        return
      }

      setState('error')
      setErrorMessage(data.error ?? 'ไม่สามารถรับโปรไฟล์ได้ในขณะนี้')
    }

    void claimLink()

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <main className="page-shell">
      <div className="page-wrap max-w-lg">
        <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
          <span className="eyebrow justify-center">
            <span className="accent-dot" aria-hidden="true" />
            Shared Profile
          </span>

          <p className="mt-6 text-4xl">🔗</p>
          <h1 className="section-title mt-4 text-2xl">
            {ownerLabel} แชร์ผลทดสอบให้คุณ
          </h1>
          <p className="body-soft mt-3 text-sm leading-6">
            โปรไฟล์ <strong>{profileLabel}</strong> ({testType} ข้อ)
            จะถูกเพิ่มเข้า Dashboard ของคุณโดยอัตโนมัติ
          </p>

          {state === 'checking' || state === 'accepting' ? (
            <div className="mt-6 section-panel rounded-xl px-4 py-5">
              <div className="loading-line soft mx-auto" aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-700">
                {state === 'checking' ? 'กำลังตรวจสอบสถานะบัญชี...' : 'กำลังเพิ่มโปรไฟล์เข้า Dashboard...'}
              </p>
            </div>
          ) : null}

          {state === 'done' ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50/80 px-4 py-5">
              <p className="text-sm font-semibold text-green-700">เพิ่มโปรไฟล์เรียบร้อยแล้ว</p>
              <p className="mt-1 text-xs text-green-700">ตรวจสอบได้ทันทีในหน้า Dashboard</p>
              <Link href="/dashboard" className="primary-button mt-4 inline-flex">
                ไปที่ Dashboard
              </Link>
            </div>
          ) : null}

          {state === 'need-login' ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-5">
              <p className="text-sm font-semibold text-amber-800">กรุณาเข้าสู่ระบบก่อนรับโปรไฟล์</p>
              <p className="mt-1 text-xs text-amber-700">หลังล็อกอิน ระบบจะเพิ่มโปรไฟล์ให้อัตโนมัติ</p>
              <Link href={loginHref} className="primary-button mt-4 inline-flex">
                เข้าสู่ระบบ
              </Link>
            </div>
          ) : null}

          {state === 'not-paid' ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-5">
              <p className="text-sm font-semibold text-amber-800">ลิงก์นี้รับได้เฉพาะสมาชิกชำระเงิน</p>
              {errorMessage ? <p className="mt-1 text-xs text-amber-700">{errorMessage}</p> : null}
              <Link href="/checkout" className="primary-button mt-4 inline-flex">
                อัปเกรดสมาชิก
              </Link>
            </div>
          ) : null}

          {state === 'error' ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-5">
              <p className="text-sm font-semibold text-red-700">ไม่สามารถรับโปรไฟล์ได้</p>
              {errorMessage ? <p className="mt-1 text-xs text-red-600">{errorMessage}</p> : null}
              <Link href="/dashboard" className="secondary-button mt-4 inline-flex">
                กลับไป Dashboard
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
