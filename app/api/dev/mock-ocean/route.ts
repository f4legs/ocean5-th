import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { buildMockExportData } from '@/lib/dev-mock-export'
import { isServerDevEmail } from '@/lib/dev-access'
import { supabaseAdmin as supabase } from '@/utils/supabase/admin'
import {
  createAuthenticatedSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
} from '@/utils/api/auth'

export const dynamic = 'force-dynamic'

const devMockRequestSchema = z.object({
  action: z.enum(['generate', 'import']),
  testType: z.enum(['50', '120', '300']),
  pct: z.object({
    O: z.number(),
    C: z.number(),
    E: z.number(),
    A: z.number(),
    N: z.number(),
  }),
})

export async function POST(req: NextRequest) {
  const accessToken = getBearerToken(req)
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createAuthenticatedSupabaseClient(accessToken)
  const user = await getAuthenticatedUser(userClient)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isServerDevEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = devMockRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', details: parsed.error.format() }, { status: 400 })
  }

  const exportData = buildMockExportData({
    testType: parsed.data.testType,
    pct: parsed.data.pct,
  })

  if (parsed.data.action === 'generate') {
    return NextResponse.json({ exportData })
  }

  const filename = exportData.metadata?.exportedAt
    ? new Date(exportData.metadata.exportedAt).toLocaleDateString('th-TH')
    : new Date().toLocaleDateString('th-TH')

  const { data, error } = await supabase.from('ocean_profiles').insert({
    owner_id: user.id,
    label: `Dev Mock · ${parsed.data.testType} ข้อ · ${filename}`,
    source: 'upload',
    test_type: parsed.data.testType,
    scores: {
      raw: exportData.scores.raw,
      pct: exportData.scores.pct,
    },
    answers: null,
    profile: null,
    metadata: {
      testId: exportData.testId,
      uploadedAt: new Date().toISOString(),
      source: 'dev-mock',
    },
    session_id: exportData.session.sessionId,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exportData, profile: data })
}
