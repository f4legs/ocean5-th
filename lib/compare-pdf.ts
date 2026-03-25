import path from 'node:path'
import PDFDocument from 'pdfkit'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

export interface ComparePdfProfile {
  label: string
  scores: {
    raw: Record<Factor, number>
    pct: Record<Factor, number>
  }
}

export interface ComparePdfData {
  profileA: ComparePdfProfile
  profileB: ComparePdfProfile
  method: string
  generatedAt: string
}

const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']

const DIMENSION_INFO: Record<Factor, { label: string; summary: string }> = {
  O: { label: 'การเปิดรับประสบการณ์', summary: 'Openness' },
  C: { label: 'ความรับผิดชอบ', summary: 'Conscientiousness' },
  E: { label: 'ความเปิดเผย', summary: 'Extraversion' },
  A: { label: 'ความเป็นมิตร', summary: 'Agreeableness' },
  N: { label: 'ความไม่มั่นคงทางอารมณ์', summary: 'Neuroticism' },
}

const A_COLOR = '#60a5fa' // blue-400
const B_COLOR = '#c084fc' // purple-400

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
    if (!line) { flushAll(); continue }
    if (/^-{3,}$/.test(line)) { flushAll(); continue }
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
      flushParagraph(); flushOrderedList()
      unorderedItems.push(line.replace(/^[-*]\s+/, ''))
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph(); flushUnorderedList()
      orderedItems.push(line.replace(/^\d+\.\s+/, ''))
      continue
    }
    paragraphLines.push(line)
  }
  flushAll()
  return blocks
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + height <= bottom) return
  doc.addPage()
}

function drawParagraph(doc: PDFKit.PDFDocument, text: string, options?: { color?: string; size?: number }) {
  doc.font('Sans')
    .fontSize(options?.size ?? 11)
    .fillColor(options?.color ?? '#22313a')
    .text(text, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, lineGap: 2 })
  doc.moveDown(0.25)
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
    if (block.type === 'p') { drawParagraph(doc, block.text); return }
    if (block.type === 'ul') {
      block.items.forEach(item => {
        doc.font('Sans').fontSize(11).fillColor('#22313a').text(`• ${item}`, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          indent: 14, lineGap: 2,
        })
        doc.moveDown(0.1)
      })
      doc.moveDown(0.2)
      return
    }
    block.items.forEach((item, i) => {
      doc.font('Sans').fontSize(11).fillColor('#22313a').text(`${i + 1}. ${item}`, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        indent: 14, lineGap: 2,
      })
      doc.moveDown(0.1)
    })
    doc.moveDown(0.2)
  })
}

function drawFooter(doc: PDFKit.PDFDocument, data: ComparePdfData) {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i)
    const label = `OCEAN Compare · ${data.profileA.label} vs ${data.profileB.label} · ${i + 1}/${range.count}`
    doc.font('Sans').fontSize(9).fillColor('#75858f')
    const labelWidth = doc.widthOfString(label)
    const labelX = (PAGE.width - labelWidth) / 2
    doc.text(label, labelX, PAGE.height - 34, { lineBreak: false })
  }
}

export async function createComparePdf(data: ComparePdfData, report: string): Promise<Buffer> {
  const fontPaths = getFontPaths()
  const chunks: Buffer[] = []

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin },
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `OCEAN Compare: ${data.profileA.label} vs ${data.profileB.label}`,
      Author: 'FARS-AI Cognitive Science Team',
      Subject: 'OCEAN personality comparison report',
      Keywords: 'OCEAN, Big Five, comparison',
    },
  })

  doc.registerFont('Sans', fontPaths.sans)
  doc.registerFont('Serif', fontPaths.serif)
  doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
  doc.addPage()

  // ── Header ──
  doc.rect(0, 0, PAGE.width, 112).fill('#edf3f6')
  doc.font('Sans').fontSize(10).fillColor('#32505d').text('OCEAN / BIG FIVE · COMPARISON', PAGE.margin, PAGE.margin, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Serif').fontSize(22).fillColor('#17313d').text('รายงานผลเปรียบเทียบบุคลิกภาพ', PAGE.margin, PAGE.margin + 18, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Sans').fontSize(11).fillColor('#5d6f79').text(
    `${data.profileA.label}  vs  ${data.profileB.label}`,
    PAGE.margin, PAGE.margin + 54,
    { width: PAGE.width - PAGE.margin * 2 }
  )

  doc.y = 130
  doc.font('Sans').fontSize(10.5).fillColor('#22313a').text(
    `สร้างเมื่อ ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.generatedAt))}`,
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.moveDown(0.8)

  // ── Legend ──
  const left = PAGE.margin
  const legendY = doc.y
  doc.save()
  doc.roundedRect(left, legendY, 12, 12, 3).fill(A_COLOR)
  doc.restore()
  doc.font('Sans').fontSize(10).fillColor('#22313a').text(data.profileA.label, left + 18, legendY + 1, { continued: true })
  doc.text('   ')
  const bLegendX = left + 18 + doc.widthOfString(data.profileA.label) + 30
  doc.save()
  doc.roundedRect(bLegendX, legendY, 12, 12, 3).fill(B_COLOR)
  doc.restore()
  doc.font('Sans').fontSize(10).fillColor('#22313a').text(data.profileB.label, bLegendX + 18, legendY + 1)
  doc.moveDown(1)

  // ── Section 1: Score Comparison ──
  doc.font('Serif').fontSize(16).fillColor('#18303d').text('1. คะแนนเปรียบเทียบ OCEAN', {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.moveDown(0.5)

  const cardWidth = PAGE.width - PAGE.margin * 2
  const barWidth = cardWidth - 36

  for (const factor of FACTOR_ORDER) {
    const info = DIMENSION_INFO[factor]
    const aScore = data.profileA.scores.pct[factor]
    const bScore = data.profileB.scores.pct[factor]
    const delta = aScore - bScore
    const cardHeight = 90

    ensureSpace(doc, cardHeight + 12)
    const top = doc.y

    doc.save()
    doc.roundedRect(left, top, cardWidth, cardHeight, 14).fillAndStroke('#f7fafc', '#dbe4e8')
    doc.restore()

    doc.font('Sans').fontSize(12).fillColor('#2a4655').text(`${factor} · ${info.label}`, left + 18, top + 12, {
      width: cardWidth - 160,
    })
    doc.font('Sans').fontSize(9.5).fillColor('#6b7a84').text(info.summary, left + 18, top + 30, {
      width: cardWidth - 160,
    })

    // Scores on right
    doc.font('Sans').fontSize(11).fillColor(A_COLOR).text(`A: ${Math.round(aScore)}%`, left + cardWidth - 130, top + 10, { width: 55, align: 'right' })
    doc.font('Sans').fontSize(11).fillColor(B_COLOR).text(`B: ${Math.round(bScore)}%`, left + cardWidth - 70, top + 10, { width: 55, align: 'right' })
    const deltaStr = `Δ${delta > 0 ? '+' : ''}${Math.round(delta)}`
    doc.font('Sans').fontSize(10).fillColor(Math.abs(delta) >= 20 ? '#ef4444' : '#94a3b8').text(deltaStr, left + cardWidth - 100, top + 30, { width: 85, align: 'right' })

    // Bar A
    const barATop = top + 50
    doc.save()
    doc.roundedRect(left + 18, barATop, barWidth, 8, 4).fill('#e6edf1')
    doc.roundedRect(left + 18, barATop, Math.max(14, barWidth * (aScore / 100)), 8, 4).fill(A_COLOR)
    doc.restore()

    // Bar B
    const barBTop = top + 64
    doc.save()
    doc.roundedRect(left + 18, barBTop, barWidth, 8, 4).fill('#e6edf1')
    doc.roundedRect(left + 18, barBTop, Math.max(14, barWidth * (bScore / 100)), 8, 4).fill(B_COLOR)
    doc.restore()

    doc.y = top + cardHeight + 8
  }

  // ── Section 2: AI Comparison Report ──
  doc.addPage()
  doc.font('Serif').fontSize(16).fillColor('#18303d').text('2. รายงาน AI เปรียบเทียบ', {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.moveDown(0.15)
  doc.font('Sans').fontSize(10.5).fillColor('#6b7a84').text(
    'รายงานนี้เป็นการวิเคราะห์เชิงภาษาจาก AI โดยอิงจากรูปแบบคะแนน OCEAN ของทั้งสองโปรไฟล์',
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
