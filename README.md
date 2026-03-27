# OCEAN Personality Platform (Thai)

Thai-language Big Five personality assessment platform using the IPIP framework.

## What It Includes

| Tier | Items | Price | Key Output |
| --- | --- | --- | --- |
| Free | 50 | Free | 5 domain scores + streamed AI summary |
| Deep | 120 | ฿49 one-time | 30 facet scores + deeper AI interpretation |
| Research | 300 | Included after Deep unlock | Full IPIP-NEO-300-style profile |

Paid member features include profile library, invite/share links, profile comparison, and PDF export.

## Tech Stack

- Next.js 16.2.1 (App Router) + React 19
- Supabase (PostgreSQL, Auth, RLS)
- Google Gemini (`@google/genai`) for report/comparison generation
- Stripe Checkout for one-time payment unlock
- PDFKit for server-side PDF generation
- Tailwind CSS v4

## Project Structure

```text
app/
  page.tsx                     Landing page
  quiz/                        Free 50-item flow
  quiz120/                     Paid 120-item flow
  quiz300/                     Paid 300-item flow
  results/                     Free results
  results120/                  120-item results
  results300/                  300-item results
  dashboard/                   Saved profiles + compare
  invite/[code]/               Friend invite acceptance
  share/[code]/                Paid-member share acceptance
  api/
    interpret/                 Stream AI report for free quiz
    interpret-deep/            Stream AI report for 120/300
    compare/                   Stream profile comparison
    group-compare/             Stream multi-profile/group comparison
    report-pdf/                Result PDF generation
    result-deep-pdf/           Deep result PDF generation
    compare-pdf/               Comparison PDF generation
    group-pdf/                 Group comparison PDF generation
    checkout/                  Create Stripe checkout session
    checkout/verify/           Verify payment state
    stripe-webhook/            Stripe webhook handler
    invite/                    Create friend invite links
    profiles/share/            Submit invited friend profile
    profiles/upload/           Import JSON profile
    profile-share/create/      Create one-time share link
    profile-share/accept/      Accept one-time share link

lib/
  scoring.ts, scoring120.ts    Domain/facet scoring logic
  items.ts, items120.ts,
  items300.ts                  Question banks
  report-pdf.ts, compare-pdf.ts,
  result-deep-pdf.ts, group-pdf.ts
                              PDF builders
  stream-report.ts             Streaming response parser
  export.ts                    Profile export serializer
  stripe.ts                    Stripe client/price resolver
```

## Environment Variables

Create `.env.local`:

```env
# AI
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_DEEP=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Dev tools (optional)
DEV_EMAIL_ALLOWLIST=dev1@example.com,dev2@example.com
NEXT_PUBLIC_DEV_EMAIL_ALLOWLIST=dev1@example.com,dev2@example.com
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Supabase setup:
- Create a Supabase project.
- Run `supabase-schema.sql` in SQL Editor.
- Enable Email magic link and (optional) Google OAuth.
- Add `http://localhost:3000/auth/callback` as redirect URL.

3. Stripe setup:
- Create a one-time ฿49 product and set its Price ID in `STRIPE_PRICE_DEEP`.
- For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

4. Run app:

```bash
npm run dev
```

## NPM Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint source
- `npm run test` - Vitest interactive run
- `npm run test:run` - single-run tests
- `npm run test:watch` - watch mode tests

## Core Data Tables (Supabase)

- `user_profiles` - display name metadata for auth users
- `ocean_profiles` - all result profiles (`source`: `test`/`upload`/`shared`)
- `comparisons` - cached profile comparison reports
- `friend_invites` - invite links for friend submissions
- `profile_share_links` - one-time paid-member share links
- `payments` - Stripe session/payment state
- `quiz_drafts` - resumable paid quiz progress

All major tables are protected by Row Level Security policies.

## Operational Notes

- Free quiz scoring is client-side; AI interpretation streams from server routes.
- Paid quiz drafts autosave and can be resumed.
- AI endpoints use in-memory IP rate limiting (best effort on serverless).
- Indexing is intentionally disabled (`robots.ts` + `X-Robots-Tag` headers).
- This project targets Thai language UX/content first.
