import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { sharePayloadSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

// POST: anonymous friend shares their test results to the invite owner's library
// Called automatically when friend's results page detects a FRIEND_INVITE_CODE
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = sharePayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }

  const { inviteCode, scores: friendScores, profile, sessionId, testType } = parsed.data

  // Look up invite
  const { data: invite } = await supabaseAdmin
    .from('friend_invites')
    .select('owner_id, status, expires_at')
    .eq('code', inviteCode)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.status === 'completed') {
    return NextResponse.json({ error: 'Invite already used' }, { status: 409 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  // Insert profile into owner's library
  const { error: insertError } = await supabaseAdmin.from('ocean_profiles').insert({
    owner_id: invite.owner_id,
    label: `เพื่อน · ${new Date().toLocaleDateString('th-TH')}`,
    source: 'shared',
    test_type: testType ?? '50',
    scores: {
      pct: friendScores.pct,
      ...(friendScores.facets ? { facets: friendScores.facets } : {}),
    },
    answers: null,
    profile: profile ?? null,
    metadata: {
      sharedAt: new Date().toISOString(),
      inviteCode,
    },
    session_id: sessionId ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // Mark invite as completed — only after successful insert
  await supabaseAdmin
    .from('friend_invites')
    .update({ status: 'completed' })
    .eq('code', inviteCode)

  return NextResponse.json({ ok: true })
}
