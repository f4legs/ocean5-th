import { NextResponse } from 'next/server'
import { createComparePdf, ComparePdfData } from '@/lib/compare-pdf'

export const runtime = 'nodejs'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

function isValidScores(value: unknown): value is { raw: Record<Factor, number>; pct: Record<Factor, number> } {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const factors: Factor[] = ['O', 'C', 'E', 'A', 'N']
  const isRecord = (r: unknown) => !!r && typeof r === 'object' && factors.every(k => typeof (r as Record<string, unknown>)[k] === 'number')
  return isRecord(v.raw) && isRecord(v.pct)
}

function isValidData(value: unknown): value is ComparePdfData {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<ComparePdfData>
  return (
    !!v.profileA && typeof v.profileA.label === 'string' && isValidScores(v.profileA.scores) &&
    !!v.profileB && typeof v.profileB.label === 'string' && isValidScores(v.profileB.scores) &&
    typeof v.method === 'string' &&
    typeof v.generatedAt === 'string'
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
    const pdfBuffer = await createComparePdf(body.data, body.report)
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 12)
    const fileName = `ocean-compare-${sanitize(body.data.profileA.label)}-vs-${sanitize(body.data.profileB.label)}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Compare PDF generation failed:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้' }, { status: 500 })
  }
}
