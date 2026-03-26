import Link from 'next/link'
import ShareClient from './share-client'
import { supabaseAdmin } from '@/utils/supabase/admin'

interface Props {
  params: Promise<{ code: string }>
}

export default async function SharePage({ params }: Props) {
  const { code } = await params

  const { data: link } = await supabaseAdmin
    .from('profile_share_links')
    .select('code, owner_label, profile_label, test_type, status, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!link) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-md">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-3xl">🔍</p>
            <h1 className="section-title mt-4">ไม่พบลิงก์แชร์นี้</h1>
            <p className="body-soft mt-2 text-sm">ลิงก์อาจไม่ถูกต้องหรือถูกลบไปแล้ว</p>
            <Link href="/" className="primary-button mt-6 inline-flex">กลับหน้าหลัก</Link>
          </div>
        </div>
      </main>
    )
  }

  if (new Date(link.expires_at) < new Date()) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-md">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-3xl">⏰</p>
            <h1 className="section-title mt-4">ลิงก์หมดอายุแล้ว</h1>
            <p className="body-soft mt-2 text-sm">กรุณาขอลิงก์ใหม่จากผู้แชร์</p>
            <Link href="/" className="primary-button mt-6 inline-flex">กลับหน้าหลัก</Link>
          </div>
        </div>
      </main>
    )
  }

  if (link.status === 'claimed') {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-md">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-3xl">✅</p>
            <h1 className="section-title mt-4">ลิงก์นี้ถูกใช้งานแล้ว</h1>
            <p className="body-soft mt-2 text-sm">ลิงก์แชร์นี้ใช้ได้เพียง 1 ครั้ง</p>
            <Link href="/dashboard" className="primary-button mt-6 inline-flex">ไปที่ Dashboard</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ShareClient
      code={link.code}
      ownerLabel={link.owner_label ?? 'สมาชิก'}
      profileLabel={link.profile_label ?? 'โปรไฟล์บุคลิกภาพ'}
      testType={link.test_type ?? '120'}
    />
  )
}
