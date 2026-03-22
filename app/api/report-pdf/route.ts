import { NextResponse } from 'next/server'
import { createReportPdf, ReportPdfData } from '@/lib/report-pdf'

export const runtime = 'nodejs'

interface ReportPdfRequestBody {
  data?: ReportPdfData
  report?: string
}

function isValidFactorRecord(value: unknown): value is Record<'O' | 'C' | 'E' | 'A' | 'N', number> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return ['O', 'C', 'E', 'A', 'N'].every(key => typeof candidate[key] === 'number' && Number.isFinite(candidate[key]))
}

function isValidPdfData(value: unknown): value is ReportPdfData {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ReportPdfData>
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.testId === 'string' &&
    typeof candidate.startedAt === 'string' &&
    typeof candidate.completedAt === 'string' &&
    !!candidate.profile &&
    !!candidate.scores &&
    !!candidate.metadata &&
    isValidFactorRecord(candidate.scores.raw) &&
    isValidFactorRecord(candidate.scores.pct) &&
    typeof candidate.scores.maxPerDimension === 'number' &&
    typeof candidate.scores.minPerDimension === 'number' &&
    typeof candidate.metadata.itemSource === 'string' &&
    typeof candidate.metadata.adaptation === 'string' &&
    typeof candidate.metadata.copyrightNotice === 'string' &&
    typeof candidate.metadata.scale === 'string' &&
    typeof candidate.metadata.totalItems === 'number' &&
    Array.isArray(candidate.metadata.replacedItems)
  )
}

export async function POST(request: Request) {
  let body: ReportPdfRequestBody

  try {
    body = (await request.json()) as ReportPdfRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isValidPdfData(body.data) || typeof body.report !== 'string' || !body.report.trim()) {
    return NextResponse.json({ error: 'ข้อมูลสำหรับสร้าง PDF ไม่ครบถ้วน' }, { status: 400 })
  }

  try {
    const pdfBuffer = await createReportPdf(body.data, body.report)
    const fileName = `ocean-result-${body.data.sessionId.slice(0, 8)}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้' }, { status: 500 })
  }
}
