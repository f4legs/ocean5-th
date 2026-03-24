import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Single paid tier: ฿49 unlocks both 120-item and 300-item tests
// Replace with your real Stripe price ID from the dashboard
export const PRICE_DEEP: string = process.env.STRIPE_PRICE_DEEP ?? 'price_placeholder'
