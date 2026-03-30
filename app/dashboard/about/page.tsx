import Link from 'next/link'
import DashboardAboutContent from '@/components/dashboard/dashboard-about-content'
import { IconChevronLeft } from '@/components/icons'

export default function DashboardAboutPage() {
  return (
    <main className="page-shell dashboard-unified-bg dashboard-page min-h-dvh">
      <div className="page-wrap max-w-4xl py-4">
        <div className="glass-panel rounded-[2rem] border border-[var(--line)] bg-transparent px-6 py-8 shadow-none sm:px-8 sm:py-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] transition-colors hover:bg-white"
          >
            <IconChevronLeft />
            กลับไป Dashboard
          </Link>

          <div className="mt-5">
            <span className="eyebrow">
              <span className="accent-dot" aria-hidden="true" />
              OCEAN GUIDE
            </span>
            <h1 className="display-title mt-4 text-3xl sm:text-4xl">คำอธิบาย OCEAN Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              รวมคำอธิบายของระบบไว้ในหน้าเดียว เพื่อให้หน้ามือถือกลับมาโฟกัสที่การเริ่มต้นใช้งานและคลังโปรไฟล์
            </p>
          </div>

          <DashboardAboutContent />
        </div>
      </div>
    </main>
  )
}
