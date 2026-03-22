import Link from 'next/link'
import { DIMENSION_INFO } from '@/lib/scoring'

const dimensions = [
  { key: 'O', note: 'การเปิดรับสิ่งใหม่และการคิดเชิงนามธรรม' },
  { key: 'C', note: 'วินัย ความรับผิดชอบ และการจัดการตนเอง' },
  { key: 'E', note: 'พลังทางสังคมและการแสดงออก' },
  { key: 'A', note: 'ความร่วมมือ ความอ่อนโยน และความไว้วางใจ' },
  { key: 'N', note: 'การรับมือกับความเครียดและอารมณ์' },
] as const

const notes = [
  '50 ข้อ · ใช้เวลา 5-8 นาที',
  'ใช้ภายใน · ห้ามเผยแพร่',
]

export default function Home() {
  return (
    <main id="main" className="page-shell">
      <div className="page-wrap max-w-5xl">
        <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                fars-ai // personality test
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                แบบประเมินบุคลิกภาพ
                5 มิติ (OCEAN)
              </h1>

              <p className="body-soft mt-5 text-base leading-8 sm:text-lg">
                ใช้ประเมินแนวโน้มบุคลิกภาพตามกรอบ Big Five
                เพื่อช่วยอ่านรูปแบบการคิด การทำงาน และการสื่อสารให้ชัดขึ้น
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {notes.map(note => (
                  <span key={note} className="metric-pill text-sm">
                    {note}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/quiz" className="primary-button px-7 text-base">
                  เริ่มการประเมิน
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p className="inline-note mt-4">ไม่มีการจัดเก็บข้อมูลหรือเผยแพร่</p>

              <div className="mt-10 section-panel rounded-[1.5rem] px-5 py-5">
                <p className="text-sm font-semibold text-slate-800">แนวทางการใช้งาน</p>
                <ul className="bullet-list body-soft mt-3 text-sm leading-[1.6]">
                  <li>ตอบตามพฤติกรรมปกติของผู้ประเมิน</li>
                  <li>ใช้เพื่อสะท้อนตนเองและประกอบการสนทนา</li>
                  <li>หากพบปัญหา โปรดติดต่อ คุณ F (admin@fars-ai.com)</li>
                </ul>
              </div>
            </div>

            <aside className="section-panel rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                5 มิติหลัก
              </p>
              <div className="mt-5 space-y-3">
                {dimensions.map(({ key, note }) => {
                  const info = DIMENSION_INFO[key]
                  return (
                    <article key={key} className="muted-panel rounded-[1.4rem] px-4 py-4">
                      <div className="flex items-start gap-4">
                        <div className="factor-medallion shrink-0"><span>{key}</span></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{info.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                            {info.sublabel}
                          </p>
                          <p className="mt-2 text-sm leading-[1.6] text-slate-600">
                            {note}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              <p className="body-faint mt-5 text-xs leading-[1.5]">
                อ้างอิงแบบประเมิน IPIP Big Five ฉบับภาษาไทย
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
