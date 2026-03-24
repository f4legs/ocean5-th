import Link from 'next/link'
import InviteClient from './invite-client'
import { supabaseAdmin } from '@/utils/supabase/admin'

interface Props {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params

  const { data: invite } = await supabaseAdmin
    .from('friend_invites')
    .select('code, owner_label, status, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!invite) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-md">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-3xl">🔍</p>
            <h1 className="section-title mt-4">ไม่พบลิงก์นี้</h1>
            <p className="body-soft mt-2 text-sm">ลิงก์อาจหมดอายุหรือไม่ถูกต้อง</p>
            <Link href="/" className="primary-button mt-6 inline-flex">กลับหน้าหลัก</Link>
          </div>
        </div>
      </main>
    )
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <main className="page-shell">
        <div className="page-wrap max-w-md">
          <div className="glass-panel rounded-[2rem] px-6 py-10 text-center">
            <p className="text-3xl">⏰</p>
            <h1 className="section-title mt-4">ลิงก์หมดอายุแล้ว</h1>
            <p className="body-soft mt-2 text-sm">กรุณาขอลิงก์ใหม่จากเพื่อนของคุณ</p>
            <Link href="/" className="primary-button mt-6 inline-flex">กลับหน้าหลัก</Link>
          </div>
        </div>
      </main>
    )
  }

  return <InviteClient code={invite.code} ownerLabel={invite.owner_label ?? 'เพื่อน'} />
}
