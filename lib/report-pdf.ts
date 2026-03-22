import path from 'node:path'
import PDFDocument from 'pdfkit'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

export interface ReportPdfData {
  version: string
  testId: string
  sessionId: string
  startedAt: string
  completedAt: string
  profile: {
    age: string | null
    sex: string | null
    occupation: string | null
    goal: string | null
  }
  scores: {
    raw: Record<Factor, number>
    pct: Record<Factor, number>
    maxPerDimension: number
    minPerDimension: number
  }
  answers: Record<string, number>
  metadata: {
    itemSource: string
    adaptation: string
    copyrightNotice: string
    scale: string
    totalItems: number
    durationSeconds: number | null
    pageDurations: Record<string, number>
    responseTimes: Record<string, number>
    replacedItems: string[]
  }
}

const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']

const DIMENSION_INFO: Record<Factor, { label: string; summary: string; accent: string }> = {
  O: {
    label: 'การเปิดรับประสบการณ์',
    summary: 'ความสนใจต่อไอเดียใหม่ จินตนาการ และการเรียนรู้สิ่งที่แตกต่าง',
    accent: '#4d6775',
  },
  C: {
    label: 'ความรับผิดชอบ',
    summary: 'การวางแผน ระเบียบวินัย และความสม่ำเสมอในการทำสิ่งต่าง ๆ',
    accent: '#3f5664',
  },
  E: {
    label: 'ความเปิดเผย',
    summary: 'ระดับพลังงานทางสังคม ความกล้าแสดงออก และความคึกคักในการปฏิสัมพันธ์',
    accent: '#516a77',
  },
  A: {
    label: 'ความเป็นมิตร',
    summary: 'แนวโน้มความร่วมมือ ความเห็นอกเห็นใจ และการคำนึงถึงผู้อื่น',
    accent: '#597175',
  },
  N: {
    label: 'ความไม่มั่นคงทางอารมณ์',
    summary: 'ความไวต่อความเครียด อารมณ์เชิงลบ และความผันผวนทางอารมณ์',
    accent: '#5b6874',
  },
}

const PAGE = {
  margin: 48,
  width: 595.28,
  height: 841.89,
}

function getFontPaths() {
  return {
    // Google Fonts TTFs embed correctly with PDFKit for Thai + Latin text in the generated PDF.
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
  const blocks: Array<
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] }
  > = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraphLines: string[] = []
  let unorderedItems: string[] = []
  let orderedItems: string[] = []

  function flushParagraph() {
    if (paragraphLines.length === 0) return
    blocks.push({ type: 'p', text: stripInlineMarkdown(paragraphLines.join(' ')) })
    paragraphLines = []
  }

  function flushUnorderedList() {
    if (unorderedItems.length === 0) return
    blocks.push({ type: 'ul', items: unorderedItems.map(stripInlineMarkdown) })
    unorderedItems = []
  }

  function flushOrderedList() {
    if (orderedItems.length === 0) return
    blocks.push({ type: 'ol', items: orderedItems.map(stripInlineMarkdown) })
    orderedItems = []
  }

  function flushAll() {
    flushParagraph()
    flushUnorderedList()
    flushOrderedList()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushAll()
      continue
    }

    if (/^-{3,}$/.test(line)) {
      flushAll()
      continue
    }

    if (/^###\s*/.test(line)) {
      flushAll()
      blocks.push({ type: 'h3', text: stripInlineMarkdown(line.replace(/^###\s*/, '')) })
      continue
    }

    if (/^##\s*/.test(line)) {
      flushAll()
      blocks.push({ type: 'h2', text: stripInlineMarkdown(line.replace(/^##\s*/, '')) })
      continue
    }

    if (/^#\s*/.test(line)) {
      flushAll()
      blocks.push({ type: 'h2', text: stripInlineMarkdown(line.replace(/^#\s*/, '')) })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph()
      flushOrderedList()
      unorderedItems.push(line.replace(/^[-*]\s+/, ''))
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph()
      flushUnorderedList()
      orderedItems.push(line.replace(/^\d+\.\s+/, ''))
      continue
    }

    paragraphLines.push(line)
  }

  flushAll()

  return blocks
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + height <= bottom) return
  doc.addPage()
}

function drawSectionTitle(doc: PDFKit.PDFDocument, index: number, title: string, subtitle?: string) {
  ensureSpace(doc, 72)
  doc.moveDown(0.4)
  doc.font('Serif').fontSize(16).fillColor('#18303d').text(`${index}. ${title}`, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
  })

  if (subtitle) {
    doc.moveDown(0.15)
    doc.font('Sans').fontSize(10.5).fillColor('#6b7a84').text(subtitle, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    })
  }

  doc.moveDown(0.5)
}

function drawScoreCard(doc: PDFKit.PDFDocument, factor: Factor, data: ReportPdfData) {
  const cardHeight = 76
  const cardWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  ensureSpace(doc, cardHeight + 12)

  const top = doc.y
  const left = doc.page.margins.left
  const pct = data.scores.pct[factor]
  const raw = data.scores.raw[factor]
  const info = DIMENSION_INFO[factor]
  const barLeft = left + 18
  const barTop = top + 52
  const barWidth = cardWidth - 36

  doc.save()
  doc.roundedRect(left, top, cardWidth, cardHeight, 14).fillAndStroke('#f7fafc', '#dbe4e8')
  doc.restore()

  doc.font('Sans').fontSize(12).fillColor(info.accent).text(`${factor} · ${info.label}`, left + 18, top + 14, {
    width: cardWidth - 140,
  })
  doc.font('Sans').fontSize(10).fillColor('#6b7a84').text(info.summary, left + 18, top + 31, {
    width: cardWidth - 160,
  })
  doc.font('Sans').fontSize(12).fillColor('#20313a').text(`${pct}%`, left + cardWidth - 100, top + 16, {
    width: 82,
    align: 'right',
  })
  doc.font('Sans').fontSize(9.5).fillColor('#6b7a84').text(`${raw}/${data.scores.maxPerDimension} · ${pctToLabel(pct)}`, left + cardWidth - 104, top + 34, {
    width: 86,
    align: 'right',
  })

  doc.save()
  doc.roundedRect(barLeft, barTop, barWidth, 8, 4).fill('#e6edf1')
  doc.roundedRect(barLeft, barTop, Math.max(14, barWidth * (pct / 100)), 8, 4).fill(info.accent)
  doc.restore()

  doc.y = top + cardHeight + 8
}

function drawParagraph(doc: PDFKit.PDFDocument, text: string, options?: { indent?: number; color?: string; size?: number }) {
  doc.font('Sans')
    .fontSize(options?.size ?? 11)
    .fillColor(options?.color ?? '#22313a')
    .text(text, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - (options?.indent ?? 0),
      indent: options?.indent ?? 0,
      lineGap: 2,
    })
  doc.moveDown(0.25)
}

function drawBulletList(doc: PDFKit.PDFDocument, items: string[], ordered = false) {
  items.forEach((item, index) => {
    const bullet = ordered ? `${index + 1}.` : '•'
    doc.font('Sans').fontSize(11).fillColor('#22313a').text(`${bullet} ${item}`, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      indent: 14,
      continued: false,
      lineGap: 2,
    })
    doc.moveDown(0.1)
  })
  doc.moveDown(0.2)
}

function drawAiReport(doc: PDFKit.PDFDocument, report: string) {
  const blocks = parseMarkdown(report)

  blocks.forEach(block => {
    if (block.type === 'h2') {
      ensureSpace(doc, 48)
      doc.moveDown(0.25)
      doc.font('Serif').fontSize(14).fillColor('#1b3440').text(block.text, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      })
      doc.moveDown(0.15)
      return
    }

    if (block.type === 'h3') {
      ensureSpace(doc, 36)
      doc.moveDown(0.15)
      doc.font('Sans').fontSize(12).fillColor('#27414d').text(block.text, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      })
      doc.moveDown(0.1)
      return
    }

    if (block.type === 'p') {
      drawParagraph(doc, block.text)
      return
    }

    if (block.type === 'ul') {
      drawBulletList(doc, block.items)
      return
    }

    drawBulletList(doc, block.items, true)
  })
}

function drawFooter(doc: PDFKit.PDFDocument, data: ReportPdfData) {
  const range = doc.bufferedPageRange()

  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i)
    const label = `OCEAN Report · ${data.sessionId.slice(0, 8)} · ${i + 1}/${range.count}`
    doc.font('Sans').fontSize(9).fillColor('#75858f')
    const labelWidth = doc.widthOfString(label)
    const labelX = (PAGE.width - labelWidth) / 2
    doc.text(label, labelX, PAGE.height - 34, { lineBreak: false })
  }
}

export async function createReportPdf(data: ReportPdfData, report: string) {
  const fontPaths = getFontPaths()
  const topFactors = [...FACTOR_ORDER].sort((a, b) => data.scores.pct[b] - data.scores.pct[a]).slice(0, 3)
  const chunks: Buffer[] = []

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin },
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `OCEAN Result ${data.sessionId.slice(0, 8)}`,
      Author: 'FARS-AI Cognitive Science Team',
      Subject: 'OCEAN personality report',
      Keywords: 'OCEAN, Big Five, personality',
    },
  })

  doc.registerFont('Sans', fontPaths.sans)
  doc.registerFont('Serif', fontPaths.serif)
  doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
  doc.addPage()

  doc.rect(0, 0, PAGE.width, 112).fill('#edf3f6')
  doc.font('Sans').fontSize(10).fillColor('#32505d').text('OCEAN / BIG FIVE', PAGE.margin, PAGE.margin, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Serif').fontSize(24).fillColor('#17313d').text('รายงานผลการประเมินบุคลิกภาพ', PAGE.margin, PAGE.margin + 18, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Sans').fontSize(11).fillColor('#5d6f79').text(
    'เอกสารฉบับย่อสำหรับการอ่านและบันทึกผล ประกอบด้วยคะแนน OCEAN รายงาน AI และข้อมูลที่มา/สิทธิการใช้งาน',
    PAGE.margin,
    PAGE.margin + 54,
    {
      width: PAGE.width - PAGE.margin * 2,
    },
  )

  doc.y = 138
  doc.font('Sans').fontSize(10.5).fillColor('#22313a').text(
    [
      `สร้างเอกสารเมื่อ ${formatTimestamp(data.completedAt)}`,
      data.profile.age ? `อายุ ${data.profile.age} ปี` : null,
      data.profile.sex,
      data.profile.occupation,
    ].filter(Boolean).join(' · '),
    {
      width: PAGE.width - PAGE.margin * 2,
    },
  )
  doc.moveDown(0.15)
  drawParagraph(
    doc,
    `มิติเด่น: ${topFactors.map(factor => `${factor} ${DIMENSION_INFO[factor].label} (${data.scores.pct[factor]}%)`).join(' · ')}`,
    { color: '#32505d', size: 10.5 }
  )

  drawSectionTitle(
    doc,
    1,
    'คะแนน OCEAN',
    'สรุปคะแนนดิบ คะแนนร้อยละ และระดับของแต่ละมิติในรูปแบบที่อ่านง่ายบนเอกสาร'
  )
  FACTOR_ORDER.forEach(factor => drawScoreCard(doc, factor, data))

  doc.addPage()
  drawSectionTitle(
    doc,
    2,
    'รายงาน AI',
    'รายงานนี้เป็นการสรุปเชิงภาษาจากรูปแบบคะแนนทั้ง 5 มิติ เพื่อใช้สะท้อนตนเองและอ่านประกอบผลเชิงตัวเลข'
  )
  drawAiReport(doc, report)

  drawSectionTitle(
    doc,
    3,
    'ที่มาและสิทธิการใช้งาน',
    'สรุปต้นทางของแบบประเมิน การดัดแปลงที่เกิดขึ้น และขอบเขตสิทธิของเนื้อหาแต่ละส่วน'
  )
  drawParagraph(doc, `ต้นทางแบบประเมิน: ${data.metadata.itemSource}`)
  drawParagraph(doc, `หมายเหตุการดัดแปลง: ${data.metadata.adaptation}`)
  drawParagraph(
    doc,
    'สถานะสิทธิของ IPIP: รายการคำถามและสเกลของ IPIP อยู่ใน public domain ตามคำอธิบายของแหล่งต้นทางที่ ipip.ori.org'
  )
  drawParagraph(doc, `ลิขสิทธิ์ส่วนที่แอปสร้างขึ้นเอง: ${data.metadata.copyrightNotice}`)
  drawParagraph(doc, 'ข้อที่มีการปรับข้อความในแอปนี้:')
  drawBulletList(doc, data.metadata.replacedItems)

  drawParagraph(
    doc,
    `Session ID: ${data.sessionId} · Test ID: ${data.testId} · Scale: ${data.metadata.scale}`,
    { color: '#6b7a84', size: 10 }
  )

  drawFooter(doc, data)
  doc.end()

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
