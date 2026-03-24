'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { STORAGE_KEYS } from '@/lib/storage-keys'

interface Props {
  code: string
  ownerLabel: string
}

export default function InviteClient({ code, ownerLabel }: Props) {
  // Store invite code so results page can auto-share after test completion
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIEND_INVITE_CODE, code)
  }, [code])

  return (
    <main className="page-shell">
      <div className="page-wrap max-w-md">
        <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
          <span className="eyebrow justify-center">
            <span className="accent-dot" aria-hidden="true" />
            คำเชิญ
          </span>

          <p className="mt-6 text-4xl">🤝</p>
          <h1 className="section-title mt-4 text-2xl">
            {ownerLabel} เชิญให้คุณทำ
            <br />แบบทดสอบ OCEAN
          </h1>
          <p className="body-soft mt-3 text-sm leading-6">
            ทำแบบทดสอบบุคลิกภาพ 50 ข้อ (ฟรี) เพื่อให้ {ownerLabel}
            สามารถเปรียบเทียบบุคลิกภาพระหว่างคุณกับเขาได้
          </p>

          <div className="mt-5 section-panel rounded-xl px-4 py-4 text-left space-y-2">
            <p className="text-xs font-semibold text-[var(--text-main)]">ผลของคุณจะถูกส่งให้ {ownerLabel}</p>
            <ul className="bullet-list body-soft text-xs space-y-1">
              <li>คะแนน 5 มิติหลัก (O, C, E, A, N)</li>
              <li>ไม่มีการเก็บข้อมูลส่วนตัวของคุณบนระบบ</li>
              <li>คุณยังคงเห็นผลลัพธ์ของตนเองบนหน้าผล</li>
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-amber-800">ลิงก์นี้ใช้ได้ครั้งเดียว</p>
            <p className="mt-1 text-xs text-amber-700 leading-[1.6]">
              เมื่อคุณทำแบบทดสอบเสร็จ ผลจะถูกส่งให้ {ownerLabel} โดยอัตโนมัติ
              และลิงก์นี้จะหมดอายุทันที ไม่สามารถยกเลิกหรือเลือกใหม่ได้
            </p>
          </div>

          <Link href="/quiz" className="primary-button mt-6 w-full justify-center text-base">
            เริ่มทดสอบ (ฟรี) →
          </Link>

          <p className="mt-4 text-xs text-[var(--text-faint)]">
            50 ข้อ · ใช้เวลาประมาณ 5-8 นาที
          </p>
        </div>
      </div>
    </main>
  )
}
