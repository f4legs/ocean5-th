import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return randomBytes(4).toString('hex') // 8-char hex code
}

// POST: paid user creates a friend invite link
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
