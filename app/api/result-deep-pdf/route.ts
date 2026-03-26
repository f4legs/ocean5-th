import { NextResponse } from 'next/server'
import { createResultDeepPdf, ResultDeepPdfData } from '@/lib/result-deep-pdf'

export const runtime = 'nodejs'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

function isValidFactorRecord(v: unknown): v is Record<Factor, number> {
  if (!v || typeof v !== 'object') return false
  return (['O', 'C', 'E', 'A', 'N'] as Factor[]).every(k => typeof (v as Record<string, unknown>)[k] === 'number')
}

function isValidData(v: unknown): v is ResultDeepPdfData {
  if (!v || typeof v !== 'object') return false
  const d = v as Partial<ResultDeepPdfData>
  return (
    (d.testType === '120' || d.testType === '300') &&
    typeof d.testId === 'string' &&
    typeof d.completedAt === 'string' &&
    typeof d.label === 'string' &&
    !!d.scores &&
    isValidFactorRecord(d.scores.raw) &&
    isValidFactorRecord(d.scores.pct)
  )
}

export async function POST(request: Request) {
  let body: { data?: unknown; report?: unknown }
  try {
    body = (await request.json()) as { data?: unknown; report?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isValidData(body.data) || typeof body.report !== 'string' || !body.report.trim()) {
    return NextResponse.json({ error: 'ข้อมูลสำหรับสร้าง PDF ไม่ครบถ้วน' }, { status: 400 })
  }

  try {
    const pdfBuffer = await createResultDeepPdf(body.data, body.report)
    const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 20)
    const fileName = `ocean-result-${body.data.testType}-${safe(body.data.label)}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Result PDF generation failed:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้' }, { status: 500 })
  }
}
