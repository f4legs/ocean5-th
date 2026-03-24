import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase-server'

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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const stripeSessionId = session.id

    // Idempotent update — only update if currently pending
    const { data: existing } = await supabase
      .from('payments')
      .select('stripe_status')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (existing && existing.stripe_status !== 'paid') {
      await supabase
        .from('payments')
        .update({ stripe_status: 'paid' })
        .eq('stripe_session_id', stripeSessionId)
    }
  }

  return NextResponse.json({ received: true })
}
