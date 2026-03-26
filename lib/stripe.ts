import Stripe from 'stripe'

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    })
  }

  return stripeSingleton
}

// Single paid tier: ฿49 unlocks both 120-item and 300-item tests
export function getDeepPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_DEEP?.trim()
  if (!priceId || priceId === 'price_placeholder') {
    throw new Error('Missing STRIPE_PRICE_DEEP')
  }

  return priceId
}
