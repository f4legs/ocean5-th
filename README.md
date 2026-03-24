# OCEAN Platform — แบบทดสอบบุคลิกภาพ 5 มิติ (Thai)

Thai-language Big Five personality assessment platform with AI-powered reports, paid deep-dive tests, and a dashboard for comparing profiles.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Supabase · Stripe · Google Gemini

---

## What this app does

| Tier | Test | Items | Cost | Key output |
|------|------|-------|------|------------|
| Free | IPIP-NEO-50-TH | 50 | ฿0 | 5 domain scores + AI summary (~1,500 words) |
| Deep | IPIP-NEO-120 | 120 | ฿49 | 30 facet scores + AI deep report (~2,500 words) |
| Research | IPIP-NEO-300 | 300 | ฿49 (same) | Full facet scores at research-grade reliability |

Paid users also get a **Dashboard workspace** to store, compare, rename, and share OCEAN profiles — their own test results, uploaded JSONs, and friends' results via invite links.

---

## Project structure

```
ocean5-th/
├── app/
│   ├── page.tsx                    # Landing page + pricing cards
│   ├── layout.tsx                  # Root layout (fonts, storage bootstrap)
│   ├── globals.css                 # Tailwind + design system tokens
│   │
│   ├── quiz/page.tsx               # Free 50-item quiz (10 items/page × 5 pages)
│   ├── profile/page.tsx            # Optional profile form (age/sex/occupation/goal)
│   ├── results/page.tsx            # Free results: 5 domain bars + AI report + deep test CTA
│   │
│   ├── auth/page.tsx               # Login page: magic link + Google OAuth
│   ├── auth/callback/route.ts      # Supabase OAuth callback handler
│   │
│   ├── checkout/page.tsx           # Payment page (requires auth)
│   │
│   ├── quiz120/page.tsx            # 120-item deep quiz (10 items/page × 12 pages)
│   ├── quiz300/page.tsx            # 300-item research quiz (+180 items, requires 120 first)
│   ├── results120/page.tsx         # 120 results: 30 facet bars + AI deep report
│   ├── results300/page.tsx         # 300 results: same layout as results120
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              # Auth guard (redirect to /auth if no session)
│   │   └── page.tsx                # Main workspace: profile library + comparison panel
│   │
│   └── invite/[code]/
│       ├── page.tsx                # Server component: validate invite code
│       └── invite-client.tsx       # Client: store invite code in localStorage
│
├── app/api/
│   ├── interpret/route.ts          # POST: stream Gemini AI report for 50-item test
│   ├── interpret120/route.ts       # POST: stream Gemini deep report for 120/300 test
│   ├── compare/route.ts            # POST: stream Gemini comparison of 2 profiles (auth required)
│   ├── checkout/route.ts           # POST: create Stripe Checkout session (auth required)
│   ├── checkout/verify/route.ts    # GET: check if user has paid
│   ├── stripe-webhook/route.ts     # POST: receive Stripe events, mark payment as paid
│   ├── profiles/route.ts           # GET/POST/PATCH/DELETE: manage ocean_profiles
│   ├── profiles/upload/route.ts    # POST: import JSON export → create ocean_profile
│   ├── profiles/share/route.ts     # POST: anonymous friend submits results via invite code
│   ├── invite/route.ts             # POST: create friend invite link (auth required)
│   ├── quiz-draft/route.ts         # GET/POST: load/save quiz draft for paid tests
│   └── report-pdf/route.ts         # POST: generate PDF from results + AI report
│
├── lib/
│   ├── items.ts                    # 50 Thai IPIP items with scoring key
│   ├── items120.ts                 # 120 Thai IPIP-NEO-120 items (run translate script first)
│   ├── items300.ts                 # 300 Thai IPIP-NEO-300 items (run translate script first)
│   ├── scoring.ts                  # 50-item domain scoring (pct = (raw-10)/40*100)
│   ├── scoring120.ts               # 120/300-item facet + domain scoring; FACET_NAMES export
│   ├── storage-keys.ts             # Centralized localStorage key constants
│   ├── storage.ts                  # Async localStorage wrapper
│   ├── stripe.ts                   # Stripe client + PRICE_DEEP constant
│   ├── supabase-browser.ts         # Supabase client for client components (anon key)
│   ├── supabase-server.ts          # Supabase client for API routes (service key)
│   └── report-pdf.ts               # PDFKit PDF generation logic
│
├── scripts/
│   ├── raw-items-120.ts            # Source data: 120 items in English with facet/keying
│   └── translate-items.ts          # Run once: translates items to Thai via Gemini → lib/items120.ts
│
├── components/
│   ├── import-json-button.tsx      # Upload OCEAN JSON → redirect to dashboard
│   ├── reference-note.tsx          # IPIP source attribution footer
│   └── storage-bootstrap.tsx       # Cleans up stale localStorage on app load
│
├── IPIP_REFERENCE.md               # Full IPIP item list, facet map, scoring formulas
├── supabase-schema.sql             # Run in Supabase SQL editor to create all tables
└── AGENTS.md                       # AI agent rules (read this first!)
```

---

## Environment variables

Create `.env.local` with all of these before running locally or deploying:

```env
# Google Gemini (required for all AI features)
GEMINI_API_KEY=

# Supabase (required for auth, profiles, payments, drafts)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=           # Never expose — server-side only

# Stripe (required for payments)
STRIPE_SECRET_KEY=
STRIPE_PRICE_DEEP=              # Price ID from Stripe Dashboard (e.g. price_xxx)
STRIPE_WEBHOOK_SECRET=          # From Stripe CLI or Dashboard webhook config
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App URL (used in Stripe redirect URLs)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Setup checklist

### 1. Install and run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npx tsc --noEmit     # type check
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. In **Authentication → Providers**, enable:
   - **Email** (magic link) — leave defaults
   - **Google** — add OAuth credentials from Google Cloud Console
4. In **Authentication → URL Configuration**, set:
   - Site URL: `https://your-domain.com`
   - Redirect URL: `https://your-domain.com/auth/callback`
5. Copy **Project URL**, **anon key**, and **service_role key** to `.env.local`

### 3. Stripe

1. Create a product in [Stripe Dashboard](https://dashboard.stripe.com) named "OCEAN Deep Test"
2. Add a one-time price of ฿49 (THB) → copy the **Price ID** → `STRIPE_PRICE_DEEP`
3. For webhooks:
   - **Local dev:** `stripe listen --forward-to localhost:3000/api/stripe-webhook` → copy signing secret → `STRIPE_WEBHOOK_SECRET`
   - **Production:** Add endpoint `https://your-domain.com/api/stripe-webhook` in Stripe Dashboard, listen for `checkout.session.completed`

### 4. Translate quiz items (120/300)

The `lib/items120.ts` and `lib/items300.ts` files ship as empty arrays. Run the translation script once to populate them:

```bash
npx tsx scripts/translate-items.ts
```

This calls Gemini to translate all 120 IPIP-NEO-120 items from English to Thai and writes the result to `lib/items120.ts`. Takes ~2 minutes. The English source is in `scripts/raw-items-120.ts`.

---

## Key design decisions

### Three separate instruments — no item overlap

| Instrument | Items | Overlap |
|------------|-------|---------|
| IPIP-NEO-50-TH (free) | 50 | None — completely different items |
| IPIP-NEO-120 (paid) | 120 | None with 50-item; 120 overlap with 300 |
| IPIP-NEO-300 (research) | 300 | Includes all 120 items + 180 new |

The 50-item free test and 120-item paid test are fully isolated — there is no pre-filling of answers between them.

### Scoring

```
50-item:   pct = (raw - 10) / 40 * 100   (10 items/domain, range 10–50)
120-item:  pct = (raw - 4)  / 16 * 100   (4 items/facet,  range 4–20)
300-item:  pct = (raw - 10) / 40 * 100   (10 items/facet, range 10–50)
Domain:    average of 6 facet pct values  (for 120 and 300)
```

Facet → domain mapping and all facet names live in `lib/scoring120.ts` (`FACET_NAMES`, `FACET_DOMAIN`).

### Auth model

- **Free 50-item:** 100% anonymous. No login. All data in localStorage. Nothing sent to server.
- **Paid 120/300:** Supabase Auth required. Quiz drafts and results stored in Supabase.
- **Dashboard:** Paid user's profile library. Stores own test results, uploaded JSONs, friends' shared results.

### Friend invite flow

1. Paid user clicks "Invite Friend" → POST `/api/invite` → returns `https://your-domain.com/invite/[8-char-code]`
2. Friend opens link → sees invite UI → `invite-client.tsx` stores code in `localStorage[FRIEND_INVITE_CODE]`
3. Friend takes **free 50-item test** → sees own results normally (no extra UI, no forced login)
4. After AI report finishes, `results/page.tsx` detects `FRIEND_INVITE_CODE` → silently POSTs to `/api/profiles/share`
5. Server adds friend's 5 domain scores to paid user's `ocean_profiles` table (`source='shared'`)
6. Invite code is cleared from localStorage. Friend never sees any comparison — only paid user can generate those.

### Payment gating

- `POST /api/checkout` creates a Stripe Checkout session and a pending `payments` row
- On success, Stripe calls `POST /api/stripe-webhook` → sets `stripe_status = 'paid'`
- Quiz120 and quiz300 pages call `GET /api/checkout/verify` on mount — if not paid, redirect to `/checkout`
- One ฿49 payment unlocks both 120 and 300-item tests permanently

---

## Database tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | Display name for logged-in users |
| `ocean_profiles` | All OCEAN results in user's library (own tests, uploads, shared from friends) |
| `comparisons` | Cached AI comparison reports |
| `friend_invites` | Invite links with 7-day expiry |
| `payments` | Stripe session records |
| `quiz_drafts` | Resumable quiz state (auto-saved every 2s) |

All tables have Row Level Security enabled. `ocean_profiles` and all other paid data are scoped to `auth.uid()`. Friend share submissions use the service key (anonymous friend → owner's library).

---

## API routes reference

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/interpret` | POST | None | Stream AI report for 50-item test |
| `/api/interpret120` | POST | None | Stream AI deep report for 120/300 test |
| `/api/compare` | POST | Bearer | Stream AI comparison of 2 profiles |
| `/api/checkout` | POST | Bearer | Create Stripe Checkout session |
| `/api/checkout/verify` | GET | Bearer | Check payment status |
| `/api/stripe-webhook` | POST | Stripe sig | Update payment to 'paid' on checkout.session.completed |
| `/api/profiles` | GET/POST/PATCH/DELETE | Bearer | CRUD ocean_profiles |
| `/api/profiles/upload` | POST | Bearer | Import OCEAN JSON export |
| `/api/profiles/share` | POST | None | Friend submits results via invite code |
| `/api/invite` | POST | Bearer | Create friend invite link |
| `/api/quiz-draft` | GET/POST | Bearer | Load/save quiz draft |
| `/api/report-pdf` | POST | None | Generate PDF from results + report text |

Rate limiting on all Gemini routes: 5 requests per 10 minutes per IP (in-memory, best-effort on serverless).

---

## AI model

All AI features use `gemini-3-flash-preview` with `ThinkingLevel.MEDIUM` from `@google/genai`.

| Endpoint | Output | Length |
|----------|--------|--------|
| `/api/interpret` | Thai report, 5 sections | ~1,500–2,000 words |
| `/api/interpret120` | Thai deep report, 5 sections, uses all 30 facets | ~2,000–2,500 words |
| `/api/compare` | Thai comparison, 5 sections, 4 methods | ~1,500–2,000 words |

Reports stream via `ReadableStream` from the API route directly to the client. The client accumulates chunks and updates state incrementally.

---

## Pages and user flows

```
FREE (no login):
  / → /quiz → /profile → /results  (+ "deep test ฿49" CTA in sidebar)

PAID:
  / → /checkout → /auth  (magic link or Google)
  → Stripe Checkout → /dashboard
  /dashboard → start test → /quiz120 → /results120
                           → /quiz300 → /results300

FRIEND INVITE:
  /dashboard [create invite] → share link
  → /invite/[code] → /quiz (free) → /results (auto-share in background)
  → friend's scores appear in inviter's dashboard automatically
```

---

## Important notes for AI agents

- **Read `AGENTS.md` first** — it contains binding rules for this codebase including Next.js version notes
- **`params` is a Promise** — always `await params` in server components: `const { code } = await params`
- **Gemini model** is `gemini-3-flash-preview` — do not change to any other model name
- **Supabase clients**: use `lib/supabase-browser.ts` in `'use client'` components; use `lib/supabase-server.ts` (service key) in API routes only — never expose the service key to the client
- **localStorage keys**: always use `STORAGE_KEYS.*` from `lib/storage-keys.ts` — never use raw strings
- **Stripe API version**: `2026-02-25.clover` — do not change (set in `lib/stripe.ts`)
- **nanoid is not installed**: use `crypto.randomBytes(4).toString('hex')` for 8-char random codes
- **`items120` may be empty**: if `lib/items120.ts` exports an empty array, run `npx tsx scripts/translate-items.ts` first before testing quiz120
- **Stripe webhook must use raw body**: `stripe-webhook/route.ts` uses `req.text()` — never `req.json()` — signature verification breaks if body is parsed first
- **No comparison UI for free users**: `/api/compare` is auth-gated; free test users only see their own results
- **Score data flow**: quiz120 → `sessionStorage['ocean_scores_120']` → results120; quiz300 → `sessionStorage['ocean_scores_300']` → results300
- **IPIP_REFERENCE.md** has the full item list, facet structure, and scoring formulas — read it before modifying any scoring logic

---

## Source & license

Based on the **International Personality Item Pool (IPIP)**:
- IPIP-NEO-50-TH: Yomaboot & Cooper Thai translation — [ipip.ori.org](https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm)
- IPIP-NEO-120: Johnson (2014) — *J. Research in Personality*, 51, 78–89
- IPIP-NEO-300: Goldberg et al. (2006) — *J. Research in Personality*, 40, 84–96

IPIP items are public domain per [ipip.ori.org](https://ipip.ori.org). App code, interface, reports, and Thai adaptations:

`© 2026 fars-ai / FARS-AI Cognitive Science Team. All rights reserved where applicable.`
