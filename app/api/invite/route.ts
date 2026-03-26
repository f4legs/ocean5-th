import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/utils/supabase/admin'
import { randomBytes } from 'crypto'
import {
  createAuthenticatedSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
} from '@/utils/api/auth'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return randomBytes(4).toString('hex') // 8-char hex code
}

async function isPaidMember(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_status', 'paid')
    .limit(1)
    .maybeSingle()

  return Boolean(data)
}

// POST: paid user creates a friend invite link
export async function POST(req: NextRequest) {
  const accessToken = getBearerToken(req)
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createAuthenticatedSupabaseClient(accessToken)
  const user = await getAuthenticatedUser(userClient)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await isPaidMember(user.id))) {
    return NextResponse.json({ error: 'Paid membership required' }, { status: 403 })
  }

  // Get owner display name
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const ownerLabel = userProfile?.display_name ?? user.email?.split('@')[0] ?? 'เพื่อน'

  // Generate unique code (retry on collision)
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('friend_invites')
      .select('code')
      .eq('code', code)
      .maybeSingle()
    if (!existing) break
    code = generateCode()
    attempts++
  }

  const { error } = await supabase.from('friend_invites').insert({
    code,
    owner_id: user.id,
    owner_label: ownerLabel,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  return NextResponse.json({ code, url: `${baseUrl}/invite/${code}` })
}
