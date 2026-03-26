import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin as supabase } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// Stripe requires the raw body for webhook signature verification
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const stripeSessionId = session.id
    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('No user_id found in session metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 1. Try to find the existing pending row
    const { data: existing } = await supabase
      .from('payments')
      .select('id, stripe_status')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (existing) {
      // Update existing row
      if (existing.stripe_status !== 'paid') {
        await supabase
          .from('payments')
          .update({ stripe_status: 'paid' })
          .eq('id', existing.id)
      }
    } else {
      // 2. Fallback: Create the row if it doesn't exist (e.g. if the initial insert failed or was skipped)
      // This makes the fulfillment more robust as recommended by Stripe Quickstart
      await supabase.from('payments').insert({
        user_id: userId,
        stripe_session_id: stripeSessionId,
        stripe_status: 'paid',
        amount: session.amount_total ?? 4900,
      })
    }
  }

  return NextResponse.json({ received: true })
}
