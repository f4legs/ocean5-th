import path from 'node:path'
import PDFDocument from 'pdfkit'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

export interface ResultDeepPdfData {
  testId: string
  testType: '120' | '300'
  completedAt: string
  label: string
  profile: {
    age?: string | null
    sex?: string | null
    occupation?: string | null
    goal?: string | null
  } | null
  scores: {
    raw: Record<Factor, number>
    pct: Record<Factor, number>
    facets?: Record<string, { raw: number; pct: number }>
  }
}

const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']

const DIMENSION_INFO: Record<Factor, { label: string; summary: string; accent: string }> = {
  O: { label: 'การเปิดรับประสบการณ์', summary: 'Openness', accent: '#4d6775' },
  C: { label: 'ความรับผิดชอบ', summary: 'Conscientiousness', accent: '#3f5664' },
  E: { label: 'ความเปิดเผย', summary: 'Extraversion', accent: '#516a77' },
  A: { label: 'ความเป็นมิตร', summary: 'Agreeableness', accent: '#597175' },
  N: { label: 'ความไม่มั่นคงทางอารมณ์', summary: 'Neuroticism', accent: '#5b6874' },
}

const PAGE = { margin: 48, width: 595.28, height: 841.89 }

function getFontPaths() {
  return {
    sans: path.join(process.cwd(), 'public/fonts/sarabun-regular.ttf'),
    serif: path.join(process.cwd(), 'public/fonts/maitree-regular.ttf'),
  }
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function parseMarkdown(markdown: string) {
  type Block =
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] }
  const blocks: Block[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paraLines: string[] = []
  let ulItems: string[] = []
  let olItems: string[] = []

  const flushPara = () => { if (paraLines.length) { blocks.push({ type: 'p', text: stripInlineMarkdown(paraLines.join(' ')) }); paraLines = [] } }
  const flushUl = () => { if (ulItems.length) { blocks.push({ type: 'ul', items: ulItems.map(stripInlineMarkdown) }); ulItems = [] } }
  const flushOl = () => { if (olItems.length) { blocks.push({ type: 'ol', items: olItems.map(stripInlineMarkdown) }); olItems = [] } }
  const flushAll = () => { flushPara(); flushUl(); flushOl() }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || /^-{3,}$/.test(line)) { flushAll(); continue }
    if (/^###\s*/.test(line)) { flushAll(); blocks.push({ type: 'h3', text: stripInlineMarkdown(line.replace(/^###\s*/, '')) }); continue }
    if (/^##\s*/.test(line)) { flushAll(); blocks.push({ type: 'h2', text: stripInlineMarkdown(line.replace(/^##\s*/, '')) }); continue }
    if (/^#\s*/.test(line)) { flushAll(); blocks.push({ type: 'h2', text: stripInlineMarkdown(line.replace(/^#\s*/, '')) }); continue }
    if (/^[-*]\s+/.test(line)) { flushPara(); flushOl(); ulItems.push(line.replace(/^[-*]\s+/, '')); continue }
    if (/^\d+\.\s+/.test(line)) { flushPara(); flushUl(); olItems.push(line.replace(/^\d+\.\s+/, '')); continue }
    paraLines.push(line)
  }
  flushAll()
  return blocks
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage()
}

function drawParagraph(doc: PDFKit.PDFDocument, text: string, opts?: { size?: number; color?: string }) {
  doc.font('Sans').fontSize(opts?.size ?? 11).fillColor(opts?.color ?? '#22313a')
    .text(text, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, lineGap: 2 })
  doc.moveDown(0.25)
}

function drawAiReport(doc: PDFKit.PDFDocument, report: string) {
  const blocks = parseMarkdown(report)
  for (const block of blocks) {
    if (block.type === 'h2') {
      ensureSpace(doc, 48); doc.moveDown(0.25)
      doc.font('Serif').fontSize(14).fillColor('#1b3440').text(block.text, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right })
      doc.moveDown(0.15); continue
    }
    if (block.type === 'h3') {
      ensureSpace(doc, 36); doc.moveDown(0.15)
      doc.font('Sans').fontSize(12).fillColor('#27414d').text(block.text, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right })
      doc.moveDown(0.1); continue
    }
    if (block.type === 'p') { drawParagraph(doc, block.text); continue }
    const items = block.items
    const ordered = block.type === 'ol'
    items.forEach((item, i) => {
      doc.font('Sans').fontSize(11).fillColor('#22313a')
        .text(`${ordered ? `${i + 1}.` : '•'} ${item}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, indent: 14, lineGap: 2 })
      doc.moveDown(0.1)
    })
    doc.moveDown(0.2)
  }
}

function drawFooter(doc: PDFKit.PDFDocument, data: ResultDeepPdfData) {
  const range = doc.bufferedPageRange()
  const testLabel = data.testType === '120' ? 'IPIP-NEO-120' : 'IPIP-NEO-300'
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const label = `OCEAN ${testLabel} · ${data.label.slice(0, 30)} · ${i + 1}/${range.count}`
    doc.font('Sans').fontSize(9).fillColor('#75858f')
    const lw = doc.widthOfString(label)
    doc.text(label, (PAGE.width - lw) / 2, PAGE.height - 34, { lineBreak: false })
  }
}

export async function createResultDeepPdf(data: ResultDeepPdfData, report: string): Promise<Buffer> {
  const fontPaths = getFontPaths()
  const chunks: Buffer[] = []

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin },
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `OCEAN ${data.testType}-item: ${data.label}`,
      Author: 'OCEAN Platform',
      Subject: `OCEAN ${data.testType}-item personality report`,
      Keywords: 'OCEAN, Big Five, personality',
    },
  })

  doc.registerFont('Sans', fontPaths.sans)
  doc.registerFont('Serif', fontPaths.serif)
  doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
  doc.addPage()

  // ── Cover / Header ──
  const testLabel = data.testType === '120' ? 'IPIP-NEO-120 · วิเคราะห์เชิงลึก' : 'IPIP-NEO-300 · ระดับวิจัย'
  doc.rect(0, 0, PAGE.width, 112).fill('#edf3f6')
  doc.font('Sans').fontSize(10).fillColor('#32505d').text(`OCEAN / BIG FIVE · ${testLabel}`, PAGE.margin, PAGE.margin, { width: PAGE.width - PAGE.margin * 2 })
  doc.font('Serif').fontSize(24).fillColor('#17313d').text('รายงานผลการประเมินบุคลิกภาพ', PAGE.margin, PAGE.margin + 18, { width: PAGE.width - PAGE.margin * 2 })
  doc.font('Sans').fontSize(11).fillColor('#5d6f79').text(
    `แบบทดสอบ OCEAN ${data.testType} ข้อ — วิเคราะห์ 30 ลักษณะย่อยใน 5 มิติหลัก`,
    PAGE.margin, PAGE.margin + 54, { width: PAGE.width - PAGE.margin * 2 }
  )

  doc.y = 130
  const profileMeta = [
    data.profile?.age ? `อายุ ${data.profile.age} ปี` : null,
    data.profile?.sex ?? null,
    data.profile?.occupation ?? null,
  ].filter(Boolean).join(' · ')

  const completedDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.completedAt))
  doc.font('Sans').fontSize(10.5).fillColor('#22313a').text(
    [`สร้างเมื่อ ${completedDate}`, data.label, profileMeta].filter(Boolean).join(' · '),
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.moveDown(0.8)

  // ── Section 1: Domain Scores ──
  doc.font('Serif').fontSize(16).fillColor('#18303d').text('1. คะแนน OCEAN หลัก 5 มิติ', { width: PAGE.width - PAGE.margin * 2 })
  doc.moveDown(0.5)

  const left = PAGE.margin
  const cardWidth = PAGE.width - PAGE.margin * 2
  const barWidth = cardWidth - 36

  for (const factor of FACTOR_ORDER) {
    const info = DIMENSION_INFO[factor]
    const pct = data.scores.pct[factor]
    const raw = data.scores.raw[factor]
    const cardHeight = 76

    ensureSpace(doc, cardHeight + 12)
    const top = doc.y

    doc.save()
    doc.roundedRect(left, top, cardWidth, cardHeight, 14).fillAndStroke('#f7fafc', '#dbe4e8')
    doc.restore()

    doc.font('Sans').fontSize(12).fillColor(info.accent).text(`${factor} · ${info.label}`, left + 18, top + 14, { width: cardWidth - 140 })
    doc.font('Sans').fontSize(9.5).fillColor('#6b7a84').text(info.summary, left + 18, top + 31, { width: cardWidth - 160 })
    doc.font('Sans').fontSize(13).fillColor('#20313a').text(`${Math.round(pct)}%`, left + cardWidth - 100, top + 16, { width: 82, align: 'right' })
    doc.font('Sans').fontSize(9.5).fillColor('#6b7a84').text(`คะแนนดิบ: ${raw}`, left + cardWidth - 104, top + 34, { width: 86, align: 'right' })

    const barTop = top + 52
    doc.save()
    doc.roundedRect(left + 18, barTop, barWidth, 8, 4).fill('#e6edf1')
    doc.roundedRect(left + 18, barTop, Math.max(14, barWidth * (pct / 100)), 8, 4).fill(info.accent)
    doc.restore()

    doc.y = top + cardHeight + 8
  }

  // ── Section 2: Facets (if available) ──
  if (data.scores.facets && Object.keys(data.scores.facets).length > 0) {
    doc.addPage()
    doc.font('Serif').fontSize(16).fillColor('#18303d').text('2. คะแนนลักษณะย่อย 30 ด้าน', { width: PAGE.width - PAGE.margin * 2 })
    doc.moveDown(0.5)

    const facets = data.scores.facets
    for (const [code, val] of Object.entries(facets)) {
      ensureSpace(doc, 22)
      const pct = Math.round(val.pct)
      const barH = 6
      const top = doc.y
      const labelW = 200
      const barW = cardWidth - labelW - 60

      doc.font('Sans').fontSize(10).fillColor('#22313a').text(code, left, top, { width: 36 })
      doc.font('Sans').fontSize(10).fillColor('#384d58').text(code, left + 36, top, { width: labelW - 36 })
      const bLeft = left + labelW
      doc.save()
      doc.roundedRect(bLeft, top + 3, barW, barH, 3).fill('#e6edf1')
      doc.roundedRect(bLeft, top + 3, Math.max(8, barW * (pct / 100)), barH, 3).fill('#4d6775')
      doc.restore()
      doc.font('Sans').fontSize(10).fillColor('#22313a').text(`${pct}%`, bLeft + barW + 8, top, { width: 40, align: 'right' })

      doc.y = top + 16
    }
  }

  // ── Section 3: AI Report ──
  doc.addPage()
  const aiSectionNum = data.scores.facets ? 3 : 2
  doc.font('Serif').fontSize(16).fillColor('#18303d').text(`${aiSectionNum}. รายงาน AI เชิงลึก`, { width: PAGE.width - PAGE.margin * 2 })
  doc.moveDown(0.15)
  doc.font('Sans').fontSize(10.5).fillColor('#6b7a84').text(
    'รายงานนี้เป็นการวิเคราะห์เชิงภาษาจาก AI โดยอ้างอิงจากลักษณะย่อย 30 ด้าน',
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.moveDown(0.5)
  drawAiReport(doc, report)

  drawFooter(doc, data)
  doc.end()

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
