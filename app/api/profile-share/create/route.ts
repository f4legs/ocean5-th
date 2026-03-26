import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { profileShareCreatePayloadSchema } from '@/lib/schemas'
import {
  getAuthenticatedUserFromToken,
  getBearerToken,
} from '@/utils/api/auth'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return randomBytes(6).toString('hex')
}

async function isPaidMember(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_status', 'paid')
    .limit(1)
    .maybeSingle()

  return Boolean(data)
}

export async function POST(req: NextRequest) {
  const accessToken = getBearerToken(req)
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getAuthenticatedUserFromToken(accessToken)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isPaidMember(user.id))) {
    return NextResponse.json({ error: 'ต้องเป็นสมาชิกแบบชำระเงินเท่านั้น' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = profileShareCreatePayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }

  const { profileId } = parsed.data

  const { data: sourceProfile } = await supabaseAdmin
    .from('ocean_profiles')
    .select('id, label, test_type, source')
    .eq('id', profileId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!sourceProfile) {
    return NextResponse.json({ error: 'ไม่พบโปรไฟล์ที่ต้องการแชร์' }, { status: 404 })
  }

  if (sourceProfile.source !== 'test') {
    return NextResponse.json(
      { error: 'แชร์ได้เฉพาะผลที่ทดสอบด้วยตนเองเท่านั้น (ไม่รองรับ upload/shared)' },
      { status: 400 }
    )
  }

  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const ownerLabel = userProfile?.display_name ?? user.email?.split('@')[0] ?? 'สมาชิก'

  let code = generateCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabaseAdmin
      .from('profile_share_links')
      .select('code')
      .eq('code', code)
      .maybeSingle()
    if (!existing) break
    code = generateCode()
  }

  const { error } = await supabaseAdmin.from('profile_share_links').insert({
    code,
    owner_id: user.id,
    owner_label: ownerLabel,
    profile_id: sourceProfile.id,
    profile_label: sourceProfile.label,
    test_type: sourceProfile.test_type,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin

  return NextResponse.json({
    code,
    url: `${baseUrl}/share/${code}`,
  })
}
