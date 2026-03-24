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

        {/* Upgrade section */}
        <section className="mt-8">
          <div className="glass-panel rounded-[2rem] overflow-hidden border border-[var(--line)] shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-12">
                <span className="eyebrow">
                  <span className="accent-dot" aria-hidden="true" />
                  PREMIUM ANALYSIS
                </span>
                <h2 className="display-title mt-5 text-3xl sm:text-4xl">
                  การวิเคราะห์เชิงลึกขั้นสูง
                </h2>
                <p className="body-soft mt-4 text-base leading-relaxed sm:text-lg">
                  ยกระดับการรู้จักตนเองด้วยผลวิเคราะห์ 30 ลักษณะย่อย พร้อมฟีเจอร์เครื่องมือเปรียบเทียบและที่ปรึกษา AI ส่วนตัว
                </p>
                
                <ul className="mt-8 space-y-4 text-sm sm:text-base text-[var(--text-soft)]">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)] text-lg mt-[-2px]">✓</span>
                    <span><strong>Deep Analysis</strong> - รายงาน AI สรุปเชิงลึกแบบละเอียด ครอบคลุมชุดคำถาม 120 ข้อ และ 300 ข้อระดับวิจัย</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)] text-lg mt-[-2px]">✓</span>
                    <span><strong>Comparing</strong> - Dashboard เปรียบเทียบผลลัพธ์กับเพื่อน หรือกลุ่มผู้ทดสอบเพื่อวิเคราะห์การเข้ากัน</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)] text-lg mt-[-2px]">✓</span>
                    <span><strong>Advance Feature</strong> - AI Impersonating Consult: โหมด AI จำลองบุคลิกภาพเพื่อให้คำปรึกษาเจาะจงตามผล OCEAN ของคุณ (Phase 3)</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8 sm:p-10 lg:p-12 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-[var(--line)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)] mb-4">
                  ปลดล็อกครั้งเดียว
                </p>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-3xl font-medium text-[var(--text-soft)]">฿</span>
                  <span className="text-6xl sm:text-7xl font-semibold tracking-tight text-[var(--text-main)]">49</span>
                </div>
                <p className="mt-4 text-sm text-[var(--text-soft)]">
                  ไม่มีค่าใช้จ่ายรายเดือน ใช้งานได้กับทุกข้อสอบทั้ง 120 และ 300 ข้อ
                </p>
                
                <div className="w-full mt-8 space-y-3">
                  <Link href="/checkout" className="primary-button w-full justify-center py-4 text-base sm:text-lg shadow-sm hover:shadow-md transition-all">
                    เริ่มการวิเคราะห์เชิงลึก →
                  </Link>
                  <Link href="/auth" className="secondary-button w-full justify-center py-3 text-sm">
                    เข้าสู่ระบบ (สำหรับสมาชิก)
                  </Link>
                </div>
                
                <p className="mt-6 text-xs text-[var(--text-soft)]">
                  ชำระเงินปลอดภัยผ่าน Stripe รองรับ PromptPay / บัตรเครดิต
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
