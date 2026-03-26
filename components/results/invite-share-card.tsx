'use client'

interface Props {
  inviteCode: string
  inviteOwner: string | null
  status: 'idle' | 'sharing' | 'done' | 'declined'
  shareDescription: string
  onShare: () => void
  onDecline: () => void
}

export default function InviteShareCard({
  inviteOwner, status, shareDescription, onShare, onDecline,
}: Props) {
  if (status === 'declined') return null

  return (
    <div className="section-panel rounded-[1.75rem] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        คำเชิญแบ่งปันผล
      </p>
      {status === 'done' ? (
        <p className="mt-3 text-sm font-medium text-green-700">
          ส่งผลให้ {inviteOwner ?? 'ผู้เชิญ'} เรียบร้อยแล้ว
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-[1.6] text-slate-700">
            <span className="font-medium">{inviteOwner ?? 'ผู้เชิญ'}</span>{' '}
            ต้องการรับผลคะแนน{shareDescription}ของคุณเพื่อเปรียบเทียบบุคลิกภาพ
          </p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            คุณยังคงเห็นผลของตัวเองเสมอ · ผู้เชิญไม่เห็นคำตอบรายข้อ
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={onShare}
              disabled={status === 'sharing'}
              className="primary-button flex-1 justify-center text-sm"
            >
              {status === 'sharing' ? 'กำลังส่ง...' : 'แบ่งปันผล'}
            </button>
            <button
              onClick={onDecline}
              className="secondary-button px-4 text-sm"
            >
              ไม่แบ่งปัน
            </button>
          </div>
        </>
      )}
    </div>
  )
}
