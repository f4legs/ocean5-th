import {
  IconCardSelf,
  IconCardShield,
  IconCardTeam,
  IconCardTrend,
} from '@/components/icons'

const ABOUT_SECTIONS = [
  {
    title: 'การเข้าใจตนเอง',
    description:
      'OCEAN ช่วยให้คุณเข้าใจแนวโน้มตามธรรมชาติของตัวเองใน 5 มิติสำคัญ ได้แก่ การเปิดรับประสบการณ์ (Openness), ความมีวินัยรับผิดชอบ (Conscientiousness), การแสดงตัว (Extraversion), ความเป็นมิตรเห็นอกเห็นใจ (Agreeableness), และความไม่มั่นคงทางอารมณ์ (Neuroticism)',
    accentClassName: 'text-blue-500',
    accentBackground: 'rgba(59,130,246,0.08)',
    icon: <IconCardSelf />,
  },
  {
    title: 'พลวัตของทีม',
    description:
      'เปรียบเทียบโปรไฟล์ของคุณกับผู้อื่นเพื่อทำความเข้าใจศักยภาพในการทำงานร่วมกันและจุดที่อาจเกิดความขัดแย้ง ทั้งในบริบทการทำงานหรือชีวิตส่วนตัว',
    accentClassName: 'text-violet-500',
    accentBackground: 'rgba(139,92,246,0.08)',
    icon: <IconCardTeam />,
  },
  {
    title: 'การเติบโตส่วนบุคคล',
    description:
      'ใช้แบบทดสอบ 120 และ 300 ข้อเพื่อความแม่นยำระดับงานวิจัย พร้อมรายงานเชิงลึกที่ขับเคลื่อนด้วย AI ซึ่งแนะนำจุดที่ควรพัฒนา',
    accentClassName: 'text-emerald-500',
    accentBackground: 'rgba(16,185,129,0.08)',
    icon: <IconCardTrend />,
  },
  {
    title: 'ทำไมต้องใช้ OCEAN?',
    description:
      'นี่คือกรอบแนวคิดด้านจิตวิทยาบุคลิกภาพที่ได้รับการยืนยันทางวิทยาศาสตร์มากที่สุด โดยให้ภาษากลางสำหรับอธิบายพฤติกรรมมนุษย์',
    accentClassName: 'text-amber-500',
    accentBackground: 'rgba(245,158,11,0.08)',
    icon: <IconCardShield />,
  },
] as const

export default function DashboardAboutContent() {
  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {ABOUT_SECTIONS.map(section => (
          <section key={section.title} className="rounded-2xl bg-white p-5 transition-all hover:shadow-sm space-y-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${section.accentClassName}`}
              style={{ background: section.accentBackground }}
            >
              {section.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
            <p className="text-[13px] leading-relaxed text-slate-500">{section.description}</p>
          </section>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-2xl bg-white p-5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--accent)]"
          style={{ background: 'rgba(95,116,130,0.08)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h4 className="mb-1 text-xs font-semibold text-slate-800">เริ่มต้นใช้งาน</h4>
          <p className="text-[13px] leading-relaxed text-slate-500">
            เลือกแท็บ <strong className="font-semibold text-slate-700">เปรียบเทียบ</strong> แล้วเลือก 2 โปรไฟล์เพื่อเริ่มต้น ยังไม่มีโปรไฟล์ใช่ไหม? กด <strong className="font-semibold text-slate-700">เชิญ</strong> เพื่อชวนเพื่อนเข้ามาได้เลย
          </p>
        </div>
      </div>
    </>
  )
}
