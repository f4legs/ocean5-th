import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import {
  createAuthenticatedSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
} from '@/utils/api/auth'

export const dynamic = 'force-dynamic'

// GET /api/checkout/verify — check if authenticated user has a paid payment
export async function GET(req: NextRequest) {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    return NextResponse.json({ paid: false })
  }

  const userClient = createAuthenticatedSupabaseClient(accessToken)
  const user = await getAuthenticatedUser(userClient)

  if (!user) {
    return NextResponse.json({ paid: false })
  }

  const { data } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('user_id', user.id)
    .eq('stripe_status', 'paid')
    .maybeSingle()

  return NextResponse.json({ paid: !!data, userId: user.id })
}
