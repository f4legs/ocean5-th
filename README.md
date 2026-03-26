# OCEAN Personality Platform

Thai-language Big Five personality assessment using the IPIP-NEO framework. Three test tiers, AI-generated reports, profile comparison, and a friend invite system.

---

## Test Tiers

| Tier | Items | Price | Features |
|------|-------|-------|----------|
| Free | 50 | — | 5 domain scores · AI report ~1,500 words · No login |
| Deep | 120 | ฿49 one-time | 30 facet scores · AI report ~2,500 words · Save profiles |
| Research | 300 | included with ฿49 | Full IPIP-NEO-300 · Research-grade reliability |

Paid users also get: profile library, AI-powered comparison between any two profiles (PDF export), and friend invite links.

---

## Tech Stack

- **Framework** — Next.js 16.2.1 (App Router, React 19)
- **Database / Auth** — Supabase (PostgreSQL + RLS + magic link / Google OAuth)
- **AI** — Google Gemini (`gemini-2.5-flash-preview`, streaming)
- **Payments** — Stripe Checkout (one-time, ฿49 THB)
- **PDF** — PDFKit (server-side)
- **Styling** — Tailwind CSS v4, Noto Sans/Serif Thai, Outfit

---

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── quiz/                     # Free 50-item test (localStorage)
├── profile/                  # Optional demographic form
├── results/                  # Free results + AI report
├── auth/                     # Magic link / Google OAuth
├── checkout/                 # Stripe Checkout (auth required)
├── quiz120/                  # Paid 120-item test
├── quiz300/                  # Paid 300-item test (extends quiz120)
├── results120/               # 120-item results + 30 facets
├── results300/               # 300-item results
├── dashboard/                # Profile library + comparison (auth required)
├── invite/[code]/            # Friend invite acceptance
└── api/
    ├── interpret/            # Stream AI report (50-item)
    ├── interpret-deep/       # Stream AI report (120/300)
    ├── compare/              # Stream AI profile comparison
    ├── compare-pdf/          # Generate comparison PDF
    ├── report-pdf/           # Generate results PDF
    ├── checkout/             # Create Stripe session
    ├── checkout/verify/      # Check payment status
    ├── stripe-webhook/       # Handle checkout.session.completed
    ├── profiles/upload/      # Import JSON export
    ├── profiles/share/       # Friend submits results via invite
    └── invite/               # Create friend invite link

lib/
├── items.ts / items120.ts / items300.ts   # Thai IPIP question banks
├── scoring.ts / scoring120.ts             # Domain + facet scoring
├── ocean-constants.ts                     # Shared labels, colors, helpers
├── stream-report.ts                       # Streaming report fetch
├── export.ts                              # JSON export serialization
├── report-pdf.ts / compare-pdf.ts        # PDFKit generation
├── storage.ts / storage-keys.ts          # localStorage abstraction
└── stripe.ts                             # Stripe client + price ID

components/
├── quiz-shell.tsx            # Unified quiz component (all 3 tests)
├── icons.tsx                 # SVG icon components
├── results/                  # DomainScores, FacetScores, ReportPanel, etc.
└── ocean-trait-cloud.tsx     # Animated homepage visualization
```

---

## Environment Variables

Create `.env.local`:

```env
# Google Gemini
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_DEEP=           # Price ID for the ฿49 product
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_BASE_URL=        # http://localhost:3000 in dev
```

---

## Local Setup

**Prerequisites:** Node 18+, a Supabase project, a Stripe test account, a Google AI API key.

```bash
npm install
```

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL Editor — creates all tables + RLS policies
3. Enable Auth → Email (magic link) and Google OAuth
4. Set redirect URL: `http://localhost:3000/auth/callback`
5. Copy Project URL and keys to `.env.local`

**Stripe:**
1. Create a product priced at ฿49 THB — copy its Price ID to `STRIPE_PRICE_DEEP`
2. For local webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

**Google AI:**
1. Get an API key from [Google AI Studio](https://aistudio.google.com)
2. Add to `GEMINI_API_KEY`

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `ocean_profiles` | All test results. `source`: `test`/`upload`/`shared`. `test_type`: `50`/`120`/`300`. Stores `scores` (raw + pct + facets), `answers`, `ai_report`. |
| `quiz_drafts` | Auto-saved quiz state every 2 seconds. Allows resuming mid-test. `test_type`: `120`/`300`. |
| `payments` | Stripe payment records. `stripe_status`: `pending` → `paid` on webhook. |
| `friend_invites` | 8-char invite codes with 7-day expiry. Anyone can read; owner creates. |
| `comparisons` | Cached AI comparison reports between two profiles. |

All tables use Row Level Security — users can only access their own rows, except `friend_invites` (public read for invite validation).

---

## Key Flows

**Free quiz (no login):**
`/quiz` → answers saved to localStorage → `/results` → AI streams from `/api/interpret`

**Paid quiz:**
`/auth` → `/checkout` (Stripe) → webhook marks `payments.stripe_status = 'paid'` → `/quiz120` → `/results120` → profile saved to Supabase

**Friend invite:**
Dashboard → `POST /api/invite` → share link → friend visits `/invite/[code]` → friend takes test → `POST /api/profiles/share` → owner sees friend's profile in dashboard

**Profile comparison:**
Dashboard → select two profiles → `POST /api/compare` (streaming) → AI report → optional PDF via `POST /api/compare-pdf`

---

## Notes

- The free 50-item test requires no server — all scoring runs client-side
- Quiz drafts auto-save every 2 seconds for paid tests; completing the test deletes the draft
- AI streaming uses `ReadableStream` with `TextDecoder`; max duration 300s (requires Vercel Pro or equivalent)
- Rate limiting on AI routes is in-memory per IP (best-effort on serverless)
- Search engine indexing is disabled (`noindex, nofollow` headers in `next.config.ts`)
- All brand colors use CSS variables or inline `style={{}}` — never Tailwind color utilities

---

## References

- IPIP-NEO-120 — Johnson (2014) — [ipip.ori.org](https://ipip.ori.org)
- IPIP-NEO-300 — Goldberg et al. (2006) — [ipip.ori.org](https://ipip.ori.org)
- Thai translation — Panida Yomaboot & Andrew J. Cooper
