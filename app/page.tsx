import Link from 'next/link'
import { DIMENSION_INFO } from '@/lib/scoring'
import ReferenceNote from '@/components/reference-note'
import ImportJsonButton from '@/components/import-json-button'

const dimensions = [
  { key: 'O', note: 'การเปิดรับสิ่งใหม่และการคิดเชิงนามธรรม' },
  { key: 'C', note: 'วินัย ความรับผิดชอบ และการจัดการตนเอง' },
  { key: 'E', note: 'พลังทางสังคมและการแสดงออก' },
  { key: 'A', note: 'ความร่วมมือ ความอ่อนโยน และความไว้วางใจ' },
  { key: 'N', note: 'การรับมือกับความเครียดและอารมณ์' },
] as const

const notes = [
  '50 ข้อ · ใช้เวลา 5-8 นาที',
  'อ้างอิง IPIP ฉบับภาษาไทย',
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
              <p className="inline-note mt-4">ไม่มีการจัดเก็บข้อมูลส่วนบุคคลบนเซิร์ฟเวอร์</p>

              <div className="mt-10 section-panel rounded-[1.5rem] px-5 py-5">
                <p className="text-sm font-semibold text-slate-800">แนวทางการใช้งาน</p>
                <ul className="bullet-list body-soft mt-3 text-sm leading-[1.6]">
                  <li>ตอบตามพฤติกรรมปกติของผู้ประเมิน</li>
                  <li>ใช้เพื่อสะท้อนตนเองและประกอบการสนทนา</li>
                  <li>หากเปิดด้วย LINE Browser จะเซฟ PDF ไม่ได้ ให้กด Open Browser ที่ขวาล่าง</li>
                  <li>หากพบปัญหา โปรดติดต่อ (admin@fars-ai.tech)</li>
                </ul>
                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  <ImportJsonButton />
                </div>
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

              <ReferenceNote compact className="mt-5" />
            </aside>
          </div>

          <ReferenceNote className="mt-8" />
        </section>

        {/* Pricing section */}
        <section className="mt-6 section-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="text-center">
            <span className="eyebrow justify-center">
              <span className="accent-dot" aria-hidden="true" />
              เลือกระดับที่ต้องการ
            </span>
            <h2 className="display-title mt-5 text-3xl sm:text-4xl">แผนการทดสอบ</h2>
            <p className="body-soft mt-3 text-base">ทดสอบฟรีหรืออัปเกรดเพื่อรายงานเชิงลึก</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {/* Free tier */}
            <div className="muted-panel rounded-[1.75rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">ฟรี</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--text-main)]">฿0</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">ไม่มีค่าใช้จ่าย</p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>50 ข้อ · IPIP-NEO</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>คะแนน 5 มิติหลัก</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>รายงาน AI สรุปภาพรวม</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>ดาวน์โหลด PDF / JSON</li>
              </ul>
              <Link href="/quiz" className="secondary-button mt-6 w-full justify-center text-sm">
                เริ่มเลย →
              </Link>
            </div>

            {/* Deep 120 */}
            <div className="glass-panel rounded-[1.75rem] p-6 ring-1 ring-[var(--accent)] ring-offset-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">เชิงลึก</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--text-main)]">฿49</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">ครั้งเดียว ไม่มีรายเดือน</p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>120 ข้อ · IPIP-NEO-120</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>คะแนน 30 ลักษณะย่อย (Facets)</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>รายงาน AI เชิงลึก 2,000 คำ</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>Dashboard · เปรียบเทียบกับผู้อื่น</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>ต่อยอดเป็น 300 ข้อได้</li>
              </ul>
              <Link href="/checkout" className="primary-button mt-6 w-full justify-center text-base">
                ชำระเงิน ฿49 →
              </Link>
            </div>

            {/* Research 300 */}
            <div className="muted-panel rounded-[1.75rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">ระดับวิจัย</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--text-main)]">฿49</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">รวมอยู่ใน Deep 120</p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>300 ข้อ · IPIP-NEO-300</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>ทุกอย่างใน Deep 120</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>ความแม่นยำระดับวิจัย</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">✓</span>ใช้ในงานวิชาการได้</li>
              </ul>
              <Link href="/checkout" className="secondary-button mt-6 w-full justify-center text-sm">
                เริ่มด้วย Deep 120 →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
