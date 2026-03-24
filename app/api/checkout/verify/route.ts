import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET /api/checkout/verify — check if authenticated user has a paid payment
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ paid: false })
  }

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ paid: false })
  }

  const { data } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', user.id)
    .eq('stripe_status', 'paid')
    .maybeSingle()

  return NextResponse.json({ paid: !!data, userId: user.id })
}
