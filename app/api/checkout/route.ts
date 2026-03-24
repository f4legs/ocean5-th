import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_DEEP } from '@/lib/stripe'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify the user is authenticated via their session token
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from their access token
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user already paid
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', user.id)
    .eq('stripe_status', 'paid')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: PRICE_DEEP, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout_success=1`,
    cancel_url: `${baseUrl}/checkout?cancelled=1`,
    metadata: { user_id: user.id },
  })

  // Create pending payment record
  await supabase.from('payments').insert({
    user_id: user.id,
    stripe_session_id: session.id,
    stripe_status: 'pending',
    amount: 4900, // ฿49 in satang
  })

  return NextResponse.json({ url: session.url })
}
