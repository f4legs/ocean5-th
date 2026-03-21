import Link from 'next/link'
import { DIMENSION_INFO } from '@/lib/scoring'

const dimensions = [
  { key: 'O', note: 'ความคิดสร้างสรรค์และการเปิดรับสิ่งใหม่' },
  { key: 'C', note: 'วินัย การจัดการตนเอง และความสม่ำเสมอ' },
  { key: 'E', note: 'พลังทางสังคม การแสดงออก และความกระตือรือร้น' },
  { key: 'A', note: 'ความร่วมมือ ความเห็นอกเห็นใจ และความไว้วางใจ' },
  { key: 'N', note: 'การตอบสนองต่อความเครียดและอารมณ์เชิงลบ' },
] as const

const highlights = [
  'แบบประเมิน Big Five 50 ข้อ ฉบับภาษาไทย',
  'ใช้เวลาทำประมาณ 5-8 นาที',
  'สรุปผลพร้อมรายงานวิเคราะห์โดย AI',
]

export default function Home() {
  return (
    <main id="main" className="page-shell flex items-center">
      <div className="page-wrap">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(84,114,127,0.16),transparent_68%)]" />
          <div className="pointer-events-none absolute -right-24 top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(217,228,232,0.9),transparent_70%)] blur-2xl" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
            <div className="max-w-2xl">
              <span className="eyebrow mb-6">
                <span className="accent-dot" aria-hidden="true" />
                Psychometric Assessment
              </span>

              <h1 className="display-title max-w-xl text-4xl sm:text-5xl lg:text-6xl">
                แบบทดสอบบุคลิกภาพที่ดูน่าเชื่อถือ
                และเข้าใจมนุษย์มากขึ้น
              </h1>

              <p className="body-soft mt-5 max-w-xl text-base leading-8 sm:text-lg">
                ประเมินบุคลิกภาพของคุณผ่านกรอบ <strong className="text-slate-800">OCEAN / Big Five</strong>
                {' '}ซึ่งเป็นหนึ่งในโมเดลทางจิตวิทยาที่ได้รับการใช้งานแพร่หลายที่สุด
                พร้อมสรุปผลเป็นภาษาไทยในโทนที่ชัดเจน สุภาพ และนำไปใช้ต่อได้จริง
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {highlights.map(highlight => (
                  <span key={highlight} className="metric-pill text-sm">
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/quiz" className="primary-button px-7 text-base">
                  เริ่มทำแบบทดสอบ
                  <span aria-hidden="true">→</span>
                </Link>
                <div className="secondary-button px-6 text-sm sm:text-base">
                  ไม่มีการเก็บข้อมูลส่วนตัวบนเซิร์ฟเวอร์
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="section-panel rounded-[1.5rem] px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Scientific Base
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    ใช้โครงสร้างคำถามจาก IPIP Big Five เพื่อให้การประเมินมีพื้นฐานทางวิชาการที่ชัดเจน
                  </p>
                </div>
                <div className="section-panel rounded-[1.5rem] px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Focused Experience
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    อินเทอร์เฟซถูกออกแบบให้ลดความล้าในการตอบแบบสอบถามและช่วยให้ตัดสินใจได้ง่ายขึ้น
                  </p>
                </div>
                <div className="section-panel rounded-[1.5rem] px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Thai-first
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    การนำเสนอทั้งหมดเน้นภาษาไทยเป็นหลัก เพื่อให้ความหมายทางบุคลิกภาพไม่คลาดเคลื่อน
                  </p>
                </div>
              </div>
            </div>

            <div className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    Five Dimensions
                  </p>
                  <h2 className="section-title mt-2 text-2xl">
                    แผนภาพบุคลิกภาพหลัก
                  </h2>
                </div>
                <div className="factor-medallion"><span>5</span></div>
              </div>

              <div className="mt-6 space-y-3">
                {dimensions.map(({ key, note }) => {
                  const info = DIMENSION_INFO[key]

                  return (
                    <article
                      key={key}
                      className="muted-panel rounded-[1.5rem] px-4 py-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="factor-medallion shrink-0"><span>{key}</span></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="text-base font-semibold text-slate-800">{info.label}</h3>
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              {info.sublabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {note}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              <p className="body-faint mt-5 text-xs leading-6">
                อ้างอิง: IPIP Big Five (Yomaboot &amp; Cooper) · ipip.ori.org · Public Domain
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
