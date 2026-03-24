# PHASE2.md Review & Recommendations

I have reviewed the `PHASE2.md` implementation plan using the official, up-to-date documentation fetched via Context Hub (`stripe/api`, `supabase/client`, `nextjs`). 

Here are the flaws, improvements, and recommendations I found:

## 🚨 Critical Flaws to Fix

### 1. Stripe Checkout URLs Must Be Absolute
**Location:** Step 6 — Payment API Routes (`app/api/checkout/route.ts`)
**Issue:** `success_url` and `cancel_url` in `stripe.checkout.sessions.create()` are currently written as relative paths (`/quiz...`). Stripe API requires these to be **absolute URLs**.
**Fix:** Use the `NEXT_PUBLIC_BASE_URL` you defined in your environment variables.
```typescript
success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/quiz${testType}?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?type=${testType}&cancelled=1`
```

### 2. Next.js App Router Webhook Raw Body
**Location:** Step 6 — Payment API Routes (`app/api/stripe-webhook/route.ts`)
**Issue:** The plan says `(POST, raw body)` and uses `stripe.webhooks.constructEvent(body, sig, ...)`. In Next.js App Router route handlers, getting the raw string body for signature verification requires explicitly reading the request as text. If you use `req.json()`, the signature verification will fail.
**Fix:** Explicitly use `req.text()`:
```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  // ... constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
}
```

## 💡 Architectural Improvements & Recommendations

### 3. Supabase Security & Input Validation
**Location:** `lib/supabase.ts` and API Routes
**Observation:** You are using the `SUPABASE_SERVICE_KEY` for all API routes, which correctly bypasses Row Level Security (RLS) as planned. 
**Recommendation:** Because RLS is effectively disabled for operations coming through your Next.js API, your API routes (`/api/results/save`, `/api/compare/submit`) bear **100% of the responsibility for security**. Ensure you validate the `ExportData` payload structure (e.g., using Zod) before inserting it into Supabase to prevent malicious or malformed data injection.

### 4. GET Route Caching in Next.js
**Location:** Step 6 — `/api/checkout/verify/route.ts` and Step 12 — `/api/compare/[code]/route.ts`
**Observation:** In Next.js App Router, `GET` route handlers can sometimes be statically cached aggressively.
**Recommendation:** Since these endpoints rely on URL search parameters (e.g., `req.nextUrl.searchParams.get('session_id')`) or dynamic route segments (`[code]`), Next.js *should* treat them as dynamic automatically. However, it's a good practice to be explicit to prevent any caching bugs, especially for checking payment or invite status:
```typescript
export const dynamic = 'force-dynamic';
```

### 5. Webhook Idempotency
**Location:** Step 6 — `app/api/stripe-webhook/route.ts`
**Observation:** Webhooks can rarely be delivered more than once by Stripe. 
**Recommendation:** When updating the `payment_sessions` table, your logic should be idempotent. Updating a status flag to `true` is naturally idempotent, but be mindful if you ever add side effects (like sending emails) to this webhook handler in the future.
