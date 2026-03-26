import type { Metadata } from 'next'
import { Noto_Sans_Thai, Noto_Serif_Thai, Outfit } from 'next/font/google'
import StorageBootstrap from '@/components/storage-bootstrap'
import './globals.css'

const bodyFont = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

const brandFont = Outfit({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-brand',
})

const displayFont = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  title: 'แบบประเมินบุคลิกภาพ 5 มิติ (OCEAN)',
  description: 'ระบบประเมินบุคลิกภาพ Big Five สำหรับการใช้งานภายในองค์กร พร้อมรายงานสรุปภาษาไทย',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
  openGraph: {
    title: 'แบบประเมินบุคลิกภาพ 5 มิติ (OCEAN)',
    description: 'ระบบประเมินบุคลิกภาพ Big Five สำหรับการใช้งานภายในองค์กร พร้อมรายงานสรุปภาษาไทย',
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary',
    title: 'แบบประเมินบุคลิกภาพ 5 มิติ (OCEAN)',
    description: 'ระบบประเมินบุคลิกภาพ Big Five สำหรับการใช้งานภายในองค์กร',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${bodyFont.variable} ${displayFont.variable} ${brandFont.variable}`} data-scroll-behavior="smooth">
      <body className="font-[family-name:var(--font-body)] antialiased text-slate-800 min-h-screen">
        <StorageBootstrap />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent-strong)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        {children}

      </body>
    </html>
  )
}
