import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'แบบทดสอบบุคลิกภาพ 5 มิติ (OCEAN)',
  description: 'ค้นพบบุคลิกภาพของคุณด้วยแบบทดสอบ Big Five ฉบับภาษาไทย พร้อมวิเคราะห์โดย AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-[family-name:var(--font-sarabun)] antialiased bg-slate-50 text-slate-800 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
