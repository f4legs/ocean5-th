import Link from 'next/link'
import { DIMENSION_INFO } from '@/lib/scoring'
import ReferenceNote from '@/components/reference-note'
import ImportJsonButton from '@/components/import-json-button'

const dimensions = [
  { key: 'O', hue: '210', note: 'การเปิดรับสิ่งใหม่และการคิดเชิงนามธรรม' },
  { key: 'C', hue: '38',  note: 'วินัย ความรับผิดชอบ และการจัดการตนเอง' },
  { key: 'E', hue: '158', note: 'พลังทางสังคมและการแสดงออก' },
  { key: 'A', hue: '268', note: 'ความร่วมมือ ความอ่อนโยน และความไว้วางใจ' },
  { key: 'N', hue: '348', note: 'การรับมือกับความเครียดและอารมณ์' },
] as const

export default function Home() {
  return (
    <main id="main" className="page-shell">
      <div className="page-wrap max-w-5xl">

        {/* ── Hero card ── */}
        <section
          className="rounded-[2rem] overflow-hidden"
          style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="grid lg:grid-cols-[1fr_340px] lg:items-stretch">

            {/* Left: headline + CTA */}
            <div className="px-7 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                fars-ai // personality test
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                แบบประเมินบุคลิกภาพ<br />5 มิติ (OCEAN)
              </h1>

              <p className="mt-5 text-base leading-8 sm:text-lg" style={{ color: 'var(--text-soft)' }}>
                ใช้ประเมินแนวโน้มบุคลิกภาพตามกรอบ Big Five
                เพื่อช่วยอ่านรูปแบบการคิด การทำงาน และการสื่อสารให้ชัดขึ้น
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {['50 ข้อ · ใช้เวลา 5-8 นาที', 'อ้างอิง IPIP ฉบับภาษาไทย'].map(note => (
                  <span
                    key={note}
                    className="metric-pill text-sm"
                  >
                    {note}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/quiz" className="primary-button px-7 text-base">
                  เริ่มการประเมิน
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <p className="mt-4 text-[12px]" style={{ color: 'var(--text-faint)' }}>
                ไม่มีการจัดเก็บข้อมูลส่วนบุคคลบนเซิร์ฟเวอร์
              </p>

              {/* Usage notes */}
              <div
                className="mt-9 rounded-2xl px-5 py-5"
                style={{ background: 'var(--page-surface)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>แนวทางการใช้งาน</p>
                <ul className="mt-3 space-y-1.5 text-sm leading-[1.65]" style={{ paddingLeft: '1rem', color: 'var(--text-soft)' }}>
                  <li>ตอบตามพฤติกรรมปกติของผู้ประเมิน</li>
                  <li>ใช้เพื่อสะท้อนตนเองและประกอบการสนทนา</li>
                  <li>หากเปิดด้วย LINE Browser จะเซฟ PDF ไม่ได้ ให้กด Open Browser ที่ขวาล่าง</li>
                  <li>หากพบปัญหา โปรดติดต่อ (admin@fars-ai.tech)</li>
                </ul>
                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: '1px solid var(--line)' }}
                >
                  <ImportJsonButton />
                </div>
              </div>
            </div>

            {/* Right: 5 dimensions */}
            <aside
              className="px-6 py-8 sm:px-7 lg:border-l"
              style={{ background: 'var(--page-surface)', borderColor: 'var(--line)' }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.20em]"
                style={{ color: 'var(--accent)' }}
              >
                5 มิติหลัก
              </p>
              <div className="mt-5 space-y-3">
                {dimensions.map(({ key, hue, note }) => {
                  const info = DIMENSION_INFO[key]
                  return (
                    <article
                      key={key}
                      className="rounded-[1.25rem] px-4 py-4"
                      style={{ background: 'white' }}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className="factor-medallion shrink-0"
                          style={{ color: `hsl(${hue},55%,42%)`, background: `linear-gradient(145deg, hsl(${hue},80%,96%), hsl(${hue},60%,91%))`, border: `1px solid hsl(${hue},50%,86%)` }}
                        >
                          <span>{key}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{info.label}</p>
                          <p
                            className="mt-0.5 text-[10px] uppercase tracking-[0.14em]"
                            style={{ color: 'var(--text-faint)' }}
                          >
                            {info.sublabel}
                          </p>
                          <p className="mt-1.5 text-xs leading-[1.6]" style={{ color: 'var(--text-soft)' }}>
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
        </section>

        {/* ── Upgrade / Premium section — split screen ── */}
        <section className="mt-7">
          <div
            className="rounded-[2rem] overflow-hidden lg:flex"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {/* Left: gradient value-prop */}
            <div
              className="px-8 pt-10 pb-9 sm:px-10 sm:pt-12 lg:flex-[3] lg:px-12 lg:py-14"
              style={{ background: 'var(--gradient-hero)' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.20em] uppercase px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
                  aria-hidden="true"
                />
                PREMIUM ANALYSIS
              </span>

              <h2
                className="mt-6 text-3xl sm:text-4xl font-bold leading-[1.12] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                การวิเคราะห์<br />เชิงลึกขั้นสูง
              </h2>
              <p className="mt-4 text-[13.5px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
                ยกระดับการรู้จักตนเองด้วยผลวิเคราะห์ 30 ลักษณะย่อย
                พร้อมฟีเจอร์เปรียบเทียบและที่ปรึกษา AI ส่วนตัว
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    label: 'Deep Analysis',
                    desc: 'รายงาน AI สรุปเชิงลึก ครอบคลุมชุดคำถาม 120 ข้อ และ 300 ข้อระดับวิจัย',
                  },
                  {
                    label: 'Comparing',
                    desc: 'Dashboard เปรียบเทียบผลกับเพื่อนหรือกลุ่มผู้ทดสอบ',
                  },
                  {
                    label: 'Advanced AI',
                    desc: 'AI Consult จำลองบุคลิกภาพให้คำปรึกษาตาม OCEAN ของคุณ (Phase 3)',
                  },
                ].map(f => (
                  <div
                    key={f.label}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }} aria-hidden="true">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M4.5 7l1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{f.label}</strong>
                      {' — '}{f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: price + CTA */}
            <div
              className="px-8 py-10 sm:px-10 lg:flex-[2] lg:px-10 lg:py-14 flex flex-col justify-center gap-6"
              style={{ background: 'white' }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.20em] mb-4"
                  style={{ color: 'var(--text-faint)' }}
                >
                  ปลดล็อกครั้งเดียว
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-medium" style={{ color: 'var(--text-soft)' }}>฿</span>
                  <span
                    className="text-6xl sm:text-7xl font-bold tracking-tight tabular-nums"
                    style={{ color: 'var(--text-main)', lineHeight: 1 }}
                  >
                    49
                  </span>
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--text-soft)' }}>
                  ไม่มีค่าใช้จ่ายรายเดือน ใช้งานได้กับทุกข้อสอบทั้ง 120 และ 300 ข้อ
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/checkout" className="primary-button w-full justify-center text-base">
                  เริ่มการวิเคราะห์เชิงลึก →
                </Link>
                <Link href="/auth" className="secondary-button w-full justify-center text-sm">
                  เข้าสู่ระบบ (สำหรับสมาชิก)
                </Link>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
                ชำระเงินปลอดภัยผ่าน Stripe · รองรับ PromptPay / บัตรเครดิต
              </p>
            </div>
          </div>
        </section>

        <ReferenceNote className="mt-8" />
      </div>
    </main>
  )
}
