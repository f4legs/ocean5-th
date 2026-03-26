import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/utils/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import { uploadPayloadSchema } from '@/lib/schemas'
import { extractExportDataFromPdf, PDF_UPLOAD_MAX_BYTES } from '@/lib/pdf-import'

export const dynamic = 'force-dynamic'

class UploadRequestError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

async function parseUploadPayload(req: NextRequest): Promise<unknown> {
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase()

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      throw new UploadRequestError('Invalid form data')
    }

    const fileEntry = formData.get('file')
    if (!(fileEntry instanceof File)) {
      throw new UploadRequestError('ไม่พบไฟล์สำหรับอัปโหลด')
    }

    const fileName = fileEntry.name.toLowerCase()
    const isPdf = fileEntry.type === 'application/pdf' || fileName.endsWith('.pdf')
    if (!isPdf) {
      throw new UploadRequestError('รองรับเฉพาะไฟล์ PDF ที่ส่งออกจากระบบนี้เท่านั้น')
    }

    if (fileEntry.size > PDF_UPLOAD_MAX_BYTES) {
      throw new UploadRequestError('ไฟล์ใหญ่เกินกำหนด (สูงสุด 2 MB)', 413)
    }

    const rawBuffer = Buffer.from(await fileEntry.arrayBuffer())
    let exportData: unknown
    try {
      exportData = extractExportDataFromPdf(rawBuffer)
    } catch {
      throw new UploadRequestError('ไฟล์ PDF นี้ไม่ใช่ไฟล์ที่ส่งออกจากระบบนี้ หรือข้อมูลภายในไม่ถูกต้อง')
    }

    return { exportData }
  }

  try {
    return await req.json()
  } catch {
    throw new UploadRequestError('Invalid request body')
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: unknown
  try {
    payload = await parseUploadPayload(req)
  } catch (error) {
    if (error instanceof UploadRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = uploadPayloadSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid OCEAN export data', details: parsed.error.format() }, { status: 400 })
  }

  const { exportData } = parsed.data

  const testType: '50' | '120' | '300' =
    exportData.testId.includes('300') ? '300' :
    exportData.testId.includes('120') ? '120' : '50'

  // Build scores object — include facets if present
  const scores: Record<string, unknown> = {
    raw: exportData.scores.raw ?? {},
    pct: exportData.scores.pct,
  }
  if (exportData.scores.facets) {
    scores.facets = exportData.scores.facets
  }

  const filename = exportData.metadata?.exportedAt
    ? new Date(exportData.metadata.exportedAt).toLocaleDateString('th-TH')
    : new Date().toLocaleDateString('th-TH')

  const { data, error } = await supabase.from('ocean_profiles').insert({
    owner_id: user.id,
    label: `อัปโหลด · ${testType} ข้อ · ${filename}`,
    source: 'upload',
    test_type: testType,
    scores,
    answers: exportData.answers ?? null,
    profile: exportData.profile ?? null,
    metadata: { testId: exportData.testId, uploadedAt: new Date().toISOString() },
    session_id: exportData.session?.sessionId ?? null,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
