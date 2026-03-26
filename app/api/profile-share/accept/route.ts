import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { profileShareAcceptPayloadSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

async function resolveUserFromToken(accessToken: string) {
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  return user
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
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await resolveUserFromToken(accessToken)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isPaidMember(user.id))) {
    return NextResponse.json({ error: 'ลิงก์นี้สำหรับสมาชิกแบบชำระเงินเท่านั้น' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = profileShareAcceptPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }

  const { code } = parsed.data

  const { data: link } = await supabaseAdmin
    .from('profile_share_links')
    .select('code, owner_id, profile_id, status, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!link) {
    return NextResponse.json({ error: 'ไม่พบลิงก์แชร์นี้' }, { status: 404 })
  }

  if (link.owner_id === user.id) {
    return NextResponse.json({ error: 'ไม่สามารถกดรับลิงก์ของตัวเองได้' }, { status: 409 })
  }

  if (link.status === 'claimed') {
    return NextResponse.json({ error: 'ลิงก์นี้ถูกใช้งานแล้ว' }, { status: 409 })
  }

  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'ลิงก์นี้หมดอายุแล้ว' }, { status: 410 })
  }

  const { data: sourceProfile } = await supabaseAdmin
    .from('ocean_profiles')
    .select('id, owner_id, label, source, test_type, scores')
    .eq('id', link.profile_id)
    .eq('owner_id', link.owner_id)
    .maybeSingle()

  if (!sourceProfile) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลต้นทางสำหรับการแชร์' }, { status: 404 })
  }

  if (sourceProfile.source !== 'test') {
    return NextResponse.json(
      { error: 'โปรไฟล์นี้ไม่ใช่ผลที่เจ้าของทดสอบเอง จึงไม่สามารถแชร์ได้' },
      { status: 400 }
    )
  }

  const claimTime = new Date().toISOString()
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('profile_share_links')
    .update({
      status: 'claimed',
      claimed_by: user.id,
      claimed_at: claimTime,
    })
    .eq('code', code)
    .eq('status', 'pending')
    .select('code')
    .maybeSingle()

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 })
  }
  if (!claimed) {
    return NextResponse.json({ error: 'ลิงก์นี้ถูกใช้งานแล้วหรือหมดอายุ' }, { status: 409 })
  }

  const sharedLabel = `${sourceProfile.label} · แชร์`

  const { data: insertedProfile, error: insertError } = await supabaseAdmin
    .from('ocean_profiles')
    .insert({
      owner_id: user.id,
      label: sharedLabel,
      source: 'shared',
      test_type: sourceProfile.test_type,
      scores: sourceProfile.scores,
      answers: null,
      profile: null,
      metadata: {
        sharedAt: claimTime,
        sharedFromOwnerId: sourceProfile.owner_id,
        sharedSourceProfileId: sourceProfile.id,
        shareCode: code,
        shareMode: 'paid-member-link',
      },
      session_id: null,
    })
    .select('id')
    .single()

  if (insertError) {
    await supabaseAdmin
      .from('profile_share_links')
      .update({
        status: 'pending',
        claimed_by: null,
        claimed_at: null,
      })
      .eq('code', code)
      .eq('claimed_by', user.id)

    return NextResponse.json({ error: 'ไม่สามารถเพิ่มโปรไฟล์ได้ในขณะนี้' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profileId: insertedProfile.id })
}
