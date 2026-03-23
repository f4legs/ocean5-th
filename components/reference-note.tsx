import Image from "next/image";

interface ReferenceNoteProps {
  compact?: boolean;
  className?: string;
}

export default function ReferenceNote({
  compact = false,
  className = "",
}: ReferenceNoteProps) {
  if (compact) {
    return (
      <p className={`body-faint text-xs leading-[1.6] ${className}`.trim()}>
        แบบประเมินนี้อ้างอิง IPIP และฉบับภาษาไทยของ Panida Yomaboot กับ Andrew
        J. Cooper จาก{" "}
        <a
          href="https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--accent-strong)] underline underline-offset-4"
        >
          ipip.ori.org
        </a>
        . เนื้อหา IPIP อยู่ใน public domain ตามแหล่งต้นทาง ส่วนซอฟต์แวร์ หน้าตา
        คำอธิบาย และรายงานของแอปนี้เป็นผลงานของ FARS-AI Cognitive Science Team ©
        2026 fars-ai เฉพาะในส่วนที่กฎหมายคุ้มครองได้
      </p>
    );
  }

  return (
    <section className={`px-2 pt-6 sm:px-3 ${className}`.trim()}>
      <div className="border-t border-[rgba(95,116,130,0.14)] pt-5 sm:grid sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-8 sm:pt-6">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Reference
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            ที่มาและสิทธิการใช้งาน
          </p>

          <a
            href="https://fars-ai.tech/"
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center gap-2"
          >
            <Image src="/logo_nobg.svg" alt="FARS-AI logo" width={28} height={28} />
            <span className="font-[family-name:var(--font-brand)] font-light tracking-wide text-slate-800">
              FARS-AI
            </span>
          </a>
        </div>

        <div className="mt-4 space-y-3 sm:mt-0">
          <p className="body-faint text-sm leading-[1.8]">
            แบบประเมินนี้พัฒนาต่อยอดจาก International Personality Item Pool
            (IPIP) และอ้างอิงรายการคำถาม IPIP NEO Domains ฉบับภาษาไทยของ Panida
            Yomaboot และ Andrew J. Cooper ที่เผยแพร่ผ่าน{" "}
            <a
              href="https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--text-soft)] underline decoration-[rgba(95,116,130,0.36)] underline-offset-3"
            >
              ipip.ori.org
            </a>
            .
          </p>

          <p className="body-faint text-sm leading-[1.8]">
            ตามคำอธิบายของเว็บไซต์ IPIP รายการคำถามและสเกลของ IPIP อยู่ใน public
            domain จึงสามารถอ้างอิง ใช้ ดัดแปลง
            หรือแปลต่อได้ตามเงื่อนไขของแหล่งต้นทาง ส่วนซอฟต์แวร์
            งานออกแบบการใช้งาน ข้อความอธิบาย การจัดวางผลลัพธ์
            และองค์ประกอบรายงานที่ไม่ใช่เนื้อหา IPIP ต้นฉบับ เป็นผลงานของ
            FARS-AI Cognitive Science Team © 2026 fars-ai
            ในส่วนที่กฎหมายคุ้มครองได้
          </p>

          <p className="text-xs leading-[1.75] text-slate-400">
            หมายเหตุ: เวอร์ชันในแอปนี้เป็น implementation ของ fars-ai
            และมีการปรับข้อความบางข้อเพื่อให้เหมาะกับบริบทการใช้งาน
            จึงไม่ใช่หน้าเว็บทางการของ IPIP หรือ Oregon Research Institute
          </p>
        </div>
      </div>
    </section>
  );
}
