import { NextRequest, NextResponse } from 'next/server'
import { getDeepPriceId, getStripe } from '@/lib/stripe'
import { supabaseAdmin as supabase } from '@/utils/supabase/admin'
import {
  createAuthenticatedSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
} from '@/utils/api/auth'

export const dynamic = 'force-dynamic'

function resolveBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall back to request origin when env is invalid
    }
  }
  return req.nextUrl.origin
}

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated via their session token
    const accessToken = getBearerToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from their access token
    const userClient = createAuthenticatedSupabaseClient(accessToken)
    const user = await getAuthenticatedUser(userClient)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already paid
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('stripe_status', 'paid')
      .maybeSingle()

    if (existingError) {
      console.error('[checkout] payments lookup failed', existingError)
      return NextResponse.json({ error: 'Payment lookup failed' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    const stripe = getStripe()
    const priceId = getDeepPriceId()
    const baseUrl = resolveBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout_success=1`,
      cancel_url: `${baseUrl}/checkout?cancelled=1`,
      metadata: { user_id: user.id },
    })

    if (!session.url) {
      console.error('[checkout] stripe session missing url', { sessionId: session.id })
      return NextResponse.json({ error: 'Stripe session missing URL' }, { status: 500 })
    }

    // Create pending payment record
    const { error: insertError } = await supabase.from('payments').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      stripe_status: 'pending',
      amount: 4900, // ฿49 in satang
    })

    if (insertError) {
      console.error('[checkout] failed to insert pending payment', insertError)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout initialization failed'
    console.error('[checkout] unhandled error', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
