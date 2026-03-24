'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        // @ts-expect-error: flowType is not in the base types but allowed by Supabase SDK
        flowType: 'pkce',
      },
    })

    if (error) {
      setLoading(false)
      setError(error.message)
    }
  }

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap max-w-md">
        <div className="glass-panel rounded-[2rem] px-6 py-10 sm:px-10">
          <span className="eyebrow">
            <span className="accent-dot" aria-hidden="true" />
            fars-ai // เข้าสู่ระบบ
          </span>

          <h1 className="display-title mt-5 text-3xl">เข้าสู่ระบบ</h1>
          <p className="body-soft mt-3 text-sm leading-6">
            สำหรับผู้ใช้ที่ต้องการทดสอบเชิงลึก 120/300 ข้อ
            และบันทึกผลการทดสอบในระยะยาว
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-medium text-[var(--text-main)] hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <hr className="flex-1 border-[var(--line)]" />
            <span className="text-xs text-[var(--text-faint)]">หรือ</span>
            <hr className="flex-1 border-[var(--line)]" />
          </div>

          {sent ? (
            <div className="section-panel rounded-xl px-5 py-5 text-center">
              <p className="text-2xl">📬</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                ส่งลิงก์เข้าสู่ระบบแล้ว
              </p>
              <p className="body-soft mt-1 text-sm">
                กรุณาตรวจสอบอีเมล <strong>{email}</strong> และคลิกลิงก์เพื่อเข้าสู่ระบบ
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-[var(--accent)] hover:underline"
              >
                ส่งใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
                  อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="primary-button w-full justify-center"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งลิงก์เข้าสู่ระบบ'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-[var(--text-faint)]">
            ไม่ต้องสร้างรหัสผ่าน · ลิงก์หมดอายุใน 1 ชั่วโมง
          </p>
        </div>
      </div>
    </main>
  )
}
