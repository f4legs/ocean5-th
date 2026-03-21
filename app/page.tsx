import Link from 'next/link'
import { DIMENSION_INFO } from '@/lib/scoring'

const dimensions = [
  { key: 'O', emoji: '🔍' },
  { key: 'C', emoji: '📋' },
  { key: 'E', emoji: '🌟' },
  { key: 'A', emoji: '🤝' },
  { key: 'N', emoji: '🌊' },
] as const

export default function Home() {
  return (
    <main id="main" className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <span className="text-5xl mb-4 block">🧠</span>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            แบบทดสอบบุคลิกภาพ 5 มิติ
          </h1>
          <p className="text-lg text-slate-500 font-medium">OCEAN Personality Test</p>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-base leading-relaxed mb-10 max-w-lg mx-auto">
          ค้นพบตัวเองผ่านแบบทดสอบบุคลิกภาพ Big Five มาตรฐานสากล
          ประกอบด้วย <strong>50 คำถาม</strong> ใช้เวลาประมาณ <strong>5–8 นาที</strong>
          และรับรายงานวิเคราะห์บุคลิกภาพเชิงลึกโดย AI ในภาษาไทย
        </p>

        {/* Dimensions preview */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-10">
          {dimensions.map(({ key, emoji }) => {
            const info = DIMENSION_INFO[key]
            return (
              <div
                key={key}
                className="flex flex-col items-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm"
              >
                <span className="text-2xl mb-1">{emoji}</span>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight">
                  {info.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{key}</span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <Link
          href="/quiz"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-md transition-colors"
        >
          เริ่มทำแบบทดสอบ →
        </Link>

        <p className="mt-6 text-sm text-slate-400">
          ข้อมูลทั้งหมดถูกประมวลผลในอุปกรณ์ของคุณ ไม่มีการจัดเก็บข้อมูลส่วนตัว
        </p>

        {/* Credit */}
        <p className="mt-8 text-xs text-slate-300">
          อ้างอิง: IPIP Big Five (Yomaboot &amp; Cooper) · ipip.ori.org · Public Domain
        </p>
      </div>
    </main>
  )
}
