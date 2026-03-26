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

  async function handleMagicLink(e: React.SyntheticEvent<HTMLFormElement>) {
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
    <main
      id="main"
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--page-base)' }}
    >
      <div className="w-full max-w-[420px]">
        <div
          className="rounded-[2rem] px-7 py-10 sm:px-10"
          style={{ background: 'white' }}
        >
          <span className="eyebrow">
            <span className="accent-dot" aria-hidden="true" />
            fars-ai // เข้าสู่ระบบ
          </span>

          <h1 className="display-title mt-5 text-3xl">เข้าสู่ระบบ</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-soft)' }}>
            สำหรับผู้ใช้ที่ต้องการทดสอบเชิงลึก 120/300 ข้อ
            และบันทึกผลการทดสอบในระยะยาว
          </p>

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--page-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--line-strong)',
            }}
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
            <hr className="flex-1" style={{ borderColor: 'var(--line)' }} />
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>หรือ</span>
            <hr className="flex-1" style={{ borderColor: 'var(--line)' }} />
          </div>

          {sent ? (
            <div
              className="rounded-2xl px-5 py-6 text-center"
              style={{ background: 'var(--page-surface)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(69,98,118,0.1)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ color: 'var(--accent)' }}>
                  <rect x="1.5" y="4" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M1.5 7l7.5 4.5L16.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                ส่งลิงก์เข้าสู่ระบบแล้ว
              </p>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-soft)' }}>
                กรุณาตรวจสอบอีเมล <strong>{email}</strong> และคลิกลิงก์เพื่อเข้าสู่ระบบ
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                ส่งใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="field-label">
                  อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="field-input"
                />
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-3 text-sm"
                  style={{ background: 'rgba(239,68,68,0.06)', color: '#b91c1c' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M7 4.5V7.5M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
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

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            ไม่ต้องสร้างรหัสผ่าน · ลิงก์หมดอายุใน 1 ชั่วโมง
          </p>
        </div>
      </div>
    </main>
  )
}
