import path from 'node:path'
import PDFDocument from 'pdfkit'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

export interface GroupPdfMember {
  label: string
  testType: string
  scores: {
    pct: Record<Factor, number>
  }
}

export interface GroupPdfMetric {
  score: number
  label: string
}

export interface GroupPdfData {
  members: GroupPdfMember[]
  method: string
  generatedAt: string
  metrics: {
    teamBalanceIndex: GroupPdfMetric
    executionStrength: GroupPdfMetric
    innovationPivot: GroupPdfMetric
    socialCohesion: GroupPdfMetric
  }
}

const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']
const FACTOR_LABELS: Record<Factor, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism',
}
const METHOD_LABELS: Record<string, string> = {
  teamwork: 'Teamwork',
  leadership: 'Leadership',
  innovation: 'Innovation',
  risk: 'Risk & Blind Spots',
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

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + height <= bottom) return
  doc.addPage()
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
      doc.font('Sans').fontSize(11).fillColor('#22313a').text(block.text, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        lineGap: 2,
      })
      doc.moveDown(0.25)
      return
    }
    if (block.type === 'ul') {
      block.items.forEach(item => {
        doc.font('Sans').fontSize(11).fillColor('#22313a').text(`• ${item}`, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          indent: 14,
          lineGap: 2,
        })
        doc.moveDown(0.1)
      })
      doc.moveDown(0.2)
      return
    }
    block.items.forEach((item, i) => {
      doc.font('Sans').fontSize(11).fillColor('#22313a').text(`${i + 1}. ${item}`, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        indent: 14,
        lineGap: 2,
      })
      doc.moveDown(0.1)
    })
    doc.moveDown(0.2)
  })
}

function drawFooter(doc: PDFKit.PDFDocument, data: GroupPdfData) {
  const range = doc.bufferedPageRange()
  const methodLabel = METHOD_LABELS[data.method] ?? METHOD_LABELS.teamwork
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i)
    const label = `OCEAN Group Dynamics · ${methodLabel} · ${i + 1}/${range.count}`
    doc.font('Sans').fontSize(9).fillColor('#75858f')
    const labelWidth = doc.widthOfString(label)
    const labelX = (PAGE.width - labelWidth) / 2
    doc.text(label, labelX, PAGE.height - 34, { lineBreak: false })
  }
}

function avg(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export async function createGroupPdf(data: GroupPdfData, report: string): Promise<Buffer> {
  const fontPaths = getFontPaths()
  const chunks: Buffer[] = []

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin },
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `OCEAN Group Dynamics (${data.members.length} members)`,
      Author: 'FARS-AI Cognitive Science Team',
      Subject: 'OCEAN group dynamics report',
      Keywords: 'OCEAN, Big Five, team, group dynamics',
    },
  })

  doc.registerFont('Sans', fontPaths.sans)
  doc.registerFont('Serif', fontPaths.serif)
  doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
  doc.addPage()

  const methodLabel = METHOD_LABELS[data.method] ?? METHOD_LABELS.teamwork
  doc.rect(0, 0, PAGE.width, 120).fill('#edf3f6')
  doc.font('Sans').fontSize(10).fillColor('#32505d').text('OCEAN / BIG FIVE · GROUP DYNAMICS', PAGE.margin, PAGE.margin, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Serif').fontSize(22).fillColor('#17313d').text('รายงานวิเคราะห์พลวัตกลุ่ม', PAGE.margin, PAGE.margin + 18, {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.font('Sans').fontSize(11).fillColor('#5d6f79').text(
    `${data.members.length} members · Focus: ${methodLabel}`,
    PAGE.margin,
    PAGE.margin + 55,
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.y = 138
  doc.font('Sans').fontSize(10.5).fillColor('#22313a').text(
    `สร้างเมื่อ ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.generatedAt))}`,
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.moveDown(0.9)

  doc.font('Serif').fontSize(16).fillColor('#18303d').text('1. Team Metrics Snapshot', {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.moveDown(0.35)

  const metrics = [
    { title: 'Team Balance Index', value: data.metrics.teamBalanceIndex },
    { title: 'Execution Strength', value: data.metrics.executionStrength },
    { title: 'Innovation Pivot', value: data.metrics.innovationPivot },
    { title: 'Social Cohesion', value: data.metrics.socialCohesion },
  ]
  metrics.forEach(metric => {
    ensureSpace(doc, 58)
    const left = PAGE.margin
    const width = PAGE.width - PAGE.margin * 2
    const top = doc.y
    const score = Math.max(0, Math.min(100, Math.round(metric.value.score)))
    doc.save()
    doc.roundedRect(left, top, width, 48, 12).fillAndStroke('#f7fafc', '#dbe4e8')
    doc.restore()
    doc.font('Sans').fontSize(11).fillColor('#2a4655').text(metric.title, left + 14, top + 8, { width: width - 120 })
    doc.font('Sans').fontSize(10).fillColor('#6b7a84').text(metric.value.label, left + 14, top + 25, { width: width - 120 })
    doc.font('Sans').fontSize(14).fillColor('#1f3340').text(`${score}%`, left + width - 84, top + 15, {
      width: 68,
      align: 'right',
    })
    doc.save()
    doc.roundedRect(left + 14, top + 38, width - 28, 5, 3).fill('#e4ecf0')
    doc.roundedRect(left + 14, top + 38, Math.max(12, (width - 28) * (score / 100)), 5, 3).fill('#4d6775')
    doc.restore()
    doc.y = top + 58
  })

  ensureSpace(doc, 130)
  doc.moveDown(0.3)
  doc.font('Serif').fontSize(16).fillColor('#18303d').text('2. Team Composition', {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.moveDown(0.25)

  data.members.forEach((member, index) => {
    const summary = FACTOR_ORDER.map(factor => `${factor}: ${Math.round(member.scores.pct[factor] ?? 0)}%`).join('  |  ')
    doc.font('Sans').fontSize(10.5).fillColor('#22313a').text(
      `${index + 1}. ${member.label} (${member.testType})`,
      { width: PAGE.width - PAGE.margin * 2 }
    )
    doc.font('Sans').fontSize(9.5).fillColor('#6b7a84').text(summary, {
      width: PAGE.width - PAGE.margin * 2,
    })
    doc.moveDown(0.15)
  })

  ensureSpace(doc, 95)
  doc.moveDown(0.35)
  doc.font('Sans').fontSize(10).fillColor('#6b7a84').text('Average group domain scores', {
    width: PAGE.width - PAGE.margin * 2,
  })
  FACTOR_ORDER.forEach(factor => {
    const score = Math.round(avg(data.members.map(member => member.scores.pct[factor] ?? 0)))
    doc.font('Sans').fontSize(10.5).fillColor('#2a4655').text(`${FACTOR_LABELS[factor]} (${factor}): ${score}%`, {
      width: PAGE.width - PAGE.margin * 2,
    })
  })

  doc.addPage()
  doc.font('Serif').fontSize(16).fillColor('#18303d').text('3. AI Group Narrative', {
    width: PAGE.width - PAGE.margin * 2,
  })
  doc.moveDown(0.2)
  doc.font('Sans').fontSize(10.5).fillColor('#6b7a84').text(
    'รายงานนี้เป็นการวิเคราะห์เชิงภาษาจาก AI โดยอิงจากคะแนน OCEAN ของสมาชิกทั้งหมดในกลุ่ม',
    { width: PAGE.width - PAGE.margin * 2 }
  )
  doc.moveDown(0.55)
  drawAiReport(doc, report)

  drawFooter(doc, data)
  doc.end()

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
