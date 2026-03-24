import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { uploadPayloadSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = uploadPayloadSchema.safeParse(body)

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
