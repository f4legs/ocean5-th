import { NextResponse } from 'next/server'
import { createGroupPdf, GroupPdfData } from '@/lib/group-pdf'

export const runtime = 'nodejs'

type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

function isValidPctScores(value: unknown): value is Record<Factor, number> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const factors: Factor[] = ['O', 'C', 'E', 'A', 'N']
  return factors.every(factor => typeof candidate[factor] === 'number' && Number.isFinite(candidate[factor] as number))
}

function isValidMetric(value: unknown): value is { score: number; label: string } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.score === 'number' && Number.isFinite(candidate.score) && typeof candidate.label === 'string'
}

function isValidData(value: unknown): value is GroupPdfData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GroupPdfData>
  return (
    Array.isArray(candidate.members) &&
    candidate.members.length >= 3 &&
    candidate.members.length <= 12 &&
    candidate.members.every(member => (
      !!member &&
      typeof member.label === 'string' &&
      typeof member.testType === 'string' &&
      !!member.scores &&
      isValidPctScores(member.scores.pct)
    )) &&
    typeof candidate.method === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    !!candidate.metrics &&
    isValidMetric(candidate.metrics.teamBalanceIndex) &&
    isValidMetric(candidate.metrics.executionStrength) &&
    isValidMetric(candidate.metrics.innovationPivot) &&
    isValidMetric(candidate.metrics.socialCohesion)
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
    const pdfBuffer = await createGroupPdf(body.data, body.report)
    const fileName = `ocean-group-dynamics-${body.data.members.length}-members.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Group PDF generation failed:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้' }, { status: 500 })
  }
}
