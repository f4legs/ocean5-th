import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'แบบทดสอบบุคลิกภาพ 5 มิติ (OCEAN)',
  description: 'ค้นพบบุคลิกภาพของคุณด้วยแบบทดสอบ Big Five ฉบับภาษาไทย พร้อมวิเคราะห์โดย AI',
  openGraph: {
    title: 'แบบทดสอบบุคลิกภาพ 5 มิติ (OCEAN)',
    description: 'ค้นพบบุคลิกภาพของคุณด้วยแบบทดสอบ Big Five มาตรฐานสากล 50 ข้อ พร้อมวิเคราะห์เชิงลึกโดย AI ในภาษาไทย',
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary',
    title: 'แบบทดสอบบุคลิกภาพ 5 มิติ (OCEAN)',
    description: 'ค้นพบบุคลิกภาพของคุณด้วยแบบทดสอบ Big Five มาตรฐานสากล ภาษาไทย',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-[family-name:var(--font-sarabun)] antialiased bg-slate-50 text-slate-800 min-h-screen`}>
        {/* Skip-to-content for keyboard / screen-reader users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        {children}
      </body>
    </html>
  )
}
