# Phase 2: Platform Extension — Paid Tests (120/300) + Friend Comparison

## Goal
Extend the free 50-item OCEAN test into a tiered platform:

| Tier | Items | Scores | Price | Notes |
|------|-------|--------|-------|-------|
| Free | 50 (Thai, official) | 5 domains | ฟรี | Existing flow — unchanged |
| Deep | 120 (AI-translated Thai) | 30 facets + 5 domains | ฿49 | IPIP-NEO-120, Johnson 2014 |
| Research | +180 continuation | 30 facets + 5 domains | ฿79 | IPIP-NEO-300, strict subset |

Plus a **friend comparison** feature: share invite link → friend takes free 50-item test → AI generates compatibility/relationship analysis.

**Constraint:** Do not modify the existing 50-item quiz/profile/results flow beyond adding two buttons to `app/results/page.tsx`.

---

## IPIP Item Transfer Map

All 120 IPIP-NEO-120 items are confirmed **strict subsets** of the IPIP-NEO-300 (verified from ipip.ori.org).

| Transition | Pre-filled | Still needed |
|-----------|-----------|--------------|
| 50-item → 120-item | 18 items | 102 new items |
| 50-item → 300-item | 18 items | 282 new items |
| **120-item → 300-item** | **120 items** | **180 new items** |

The 18 items that appear in both the Thai 50-item test and the IPIP-NEO-120 (by item ID in our app):
`1, 2, 3, 5, 10, 11, 12, 13, 17, 22, 32, 36, 37, 41, 42, 43, 45, 47`

This means the 300-item test is presented as a **+180 continuation** — the user only answers the 180 items they haven't seen yet.

---

## New Backend: Supabase (PostgreSQL)

**New env vars required:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...            # service_role — server only, never expose
NEXT_PUBLIC_SUPABASE_URL=...           # same URL, safe for client
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon key, safe for client
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # https://yourdomain.com in prod
```

### Schema (run in Supabase SQL editor)

```sql
-- Stores any completed test result (all tiers) for sharing/comparison
create table test_results (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  test_type text not null check (test_type in ('50','120','300')),
  scores jsonb not null,     -- { raw, pct } — facet scores included for 120/300
  answers jsonb not null,
  profile jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 days'
);

-- Comparison invite pairs (one creator, one friend)
create table compare_invites (
  code text primary key,                       -- 8-char random, e.g. 'ab3k9xyz'
  creator_result_id uuid references test_results(id),
  friend_result_id uuid references test_results(id),
  ai_comparison text,                          -- cached Gemini output
  status text default 'pending' check (status in ('pending','completed')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

-- Stripe payment → access token mapping
create table payment_sessions (
  stripe_session_id text primary key,
  test_type text not null check (test_type in ('120','300')),
  access_token text not null unique default gen_random_uuid()::text,
  used boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours'
);

-- RLS: only accessible via service_role key (all API routes use service key)
alter table test_results enable row level security;
alter table compare_invites enable row level security;
alter table payment_sessions enable row level security;
```

---

## Stripe Products

Create in Stripe Dashboard (test mode first):
- **"OCEAN ทดสอบเชิงลึก 120 ข้อ"** — one-time payment, ฿49
- **"OCEAN ระดับวิจัย +180 ข้อ"** — one-time payment, ฿79

Copy the price IDs into `lib/stripe.ts`.

---

## File Map

### New files to create

#### Dependencies / clients
```
lib/supabase.ts          Supabase server client (service key — API routes only)
lib/stripe.ts            Stripe client + PRICES constant with Stripe price IDs
```

#### Item data (output of translation script)
```
scripts/raw-items-120.ts     Raw EN item data for IPIP-NEO-120 (120 items)
scripts/raw-items-300.ts     Raw EN item data for IPIP-NEO-300 (300 items)
scripts/translate-items.ts   One-time Gemini translation script → writes lib/items120.ts, lib/items300.ts
lib/items120.ts              120 items with Thai text (committed after script runs)
lib/items300.ts              300 items with Thai text (committed after script runs)
lib/scoring120.ts            Facet-level scoring for 120 and 300 item tests
```

#### Pages
```
app/checkout/page.tsx        Payment landing (explains tier, price, Stripe buy button)
app/quiz120/page.tsx         120-item quiz (gated by access token; pre-fills 18 overlap answers)
app/quiz300/page.tsx         180-item continuation quiz (gated; pre-fills 120 answers silently)
app/results120/page.tsx      Results: 30 facet bars + 5 domain bars + deep AI report
app/results300/page.tsx      Same as results120, no further upgrade button
app/invite/[code]/page.tsx   Invite landing: "Your friend wants to compare profiles"
app/compare/[code]/page.tsx  Side-by-side comparison + AI compatibility report
```

#### API routes
```
app/api/checkout/route.ts              POST: create Stripe Checkout session
app/api/checkout/verify/route.ts       GET:  verify session_id → return access_token
app/api/stripe-webhook/route.ts        POST: handle checkout.session.completed
app/api/results/save/route.ts          POST: save ExportData to test_results → return { id }
app/api/compare/create/route.ts        POST: create invite code → return shareable URL
app/api/compare/[code]/route.ts        GET:  fetch invite status + both results
app/api/compare/submit/route.ts        POST: save friend's result, trigger AI comparison
app/api/compare/interpret/route.ts     POST: Gemini compatibility analysis (Thai, streaming)
app/api/interpret120/route.ts          POST: Gemini deep facet report (Thai, streaming)
```

#### Knowledge base
```
IPIP_REFERENCE.md    Full IPIP knowledge: items, transfer table, scoring formulas, sources
```

### Existing files to modify (minimal)

```
app/results/page.tsx     Add 2 buttons: "เปรียบเทียบกับเพื่อน" + "ทดสอบเชิงลึก 120 ข้อ"
app/results120/page.tsx  Add upgrade button: "ยกระดับสู่ระดับวิจัย +180 ข้อ"
app/page.tsx             Add pricing comparison section (3-column table)
lib/storage-keys.ts      Add: ACCESS_TOKEN_120, ACCESS_TOKEN_300, COMPARE_INVITE_CODE
package.json             Add: stripe, @supabase/supabase-js
```

---

## Implementation Steps

Work through in order. Each step is independently testable.

---

### STEP 0 — Install Dependencies

```bash
npm install stripe @supabase/supabase-js nanoid
```

Add all env vars to `.env.local` (see above). Add same vars to Vercel project settings for production.

---

### STEP 1 — Supabase Schema

Run the SQL above in Supabase SQL editor. Verify tables appear in Table Editor.

---

### STEP 2 — Client Libraries

**`lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
```

**`lib/stripe.ts`**
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
export const PRICES: Record<'120' | '300', string> = {
  '120': 'price_xxx',   // replace with real Stripe price IDs
  '300': 'price_yyy',
}
```

**`lib/storage-keys.ts`** — add to existing constants:
```typescript
export const ACCESS_TOKEN_120 = 'ocean_access_120'
export const ACCESS_TOKEN_300 = 'ocean_access_300'
export const COMPARE_INVITE_CODE = 'ocean_compare_code'
export const ANSWERS_120 = 'ocean_answers_120'
export const ANSWERS_300 = 'ocean_answers_300'
```

---

### STEP 3 — IPIP_REFERENCE.md

Create in project root. Include:
- Instrument overview: IPIP-50-TH (Yomaboot & Cooper), IPIP-NEO-120 (Johnson 2014), IPIP-NEO-300 (Goldberg)
- Transfer table (the table above)
- The 18 overlapping items with EN text and target facet
- Full IPIP-NEO-120 item list: 30 facets × 4 items with keying (+/−)
- Full IPIP-NEO-300 structure: 30 facets × 10 items with keying
- Scoring formulas:
  - Domain (50-item): raw 10–50 → `(raw-10)/40*100`
  - Facet (120-item): raw 4–20 → `(raw-4)/16*100`
  - Facet (300-item): raw 10–50 → `(raw-10)/40*100`
- Thai translation status: only 50-item has official translation; 120/300 are AI-translated
- Sources: `https://ipip.ori.org/30FacetNEO-PI-RItems.htm`, `https://ipip.ori.org/newNEOFacetsKey.htm`

---

### STEP 4 — Item Data + Translation Script

**`scripts/raw-items-120.ts`** — encode all 120 EN items from `IPIP_REFERENCE.md` as a typed array:
```typescript
export const rawItems120 = [
  { id: 1, en: 'Worry about things.', facet: 'N1', facetName: 'Anxiety', factor: 'N', reverse: false },
  // ... all 120
]
```
Note `overlaps50` for items 1,2,3,5,10,11,12,13,17,22,32,36,37,41,42,43,45,47.

**`scripts/raw-items-300.ts`** — same pattern for all 300 items. Mark `inNeo120: true` on the 120 items that appear in IPIP-NEO-120.

**`scripts/translate-items.ts`** — translation pipeline:
1. Read `GEMINI_API_KEY` from `.env.local`
2. Batch items in groups of 20
3. Call Gemini (gemini-2.5-flash-preview) with prompt:
   ```
   แปลประโยคต่อไปนี้เป็นภาษาไทยที่เป็นธรรมชาติ กระชับ เหมือนบอกเล่าเกี่ยวกับตัวเอง
   ไม่ต้องอธิบายหรือเพิ่มคำ ตอบเป็น JSON array ของ string เท่านั้น
   ["Worry about things.", ...]
   ```
4. Write `lib/items120.ts` and `lib/items300.ts` with translated `th` field
5. Run: `npx tsx scripts/translate-items.ts`

Commit the output files after reviewing translation quality.

---

### STEP 5 — Facet Scoring (`lib/scoring120.ts`)

```typescript
export interface FacetScore { raw: number; pct: number }
export interface FullScoreResult {
  domains: { raw: Record<'O'|'C'|'E'|'A'|'N', number>; pct: Record<'O'|'C'|'E'|'A'|'N', number> }
  facets: Record<string, FacetScore>  // 30 keys: 'N1' .. 'C6'
}

// 120-item: 4 items/facet → raw 4–20 → pct = (raw-4)/16*100
export function calcScores120(answers: Record<number, number>): FullScoreResult

// 300-item: 10 items/facet → raw 10–50 → pct = (raw-10)/40*100
export function calcScores300(answers: Record<number, number>): FullScoreResult
```

Domain score for both: average of 6 facet raw scores normalized to the domain scale.

---

### STEP 6 — Payment API Routes

**`app/api/checkout/route.ts`** (POST `{ testType: '120'|'300' }`)
1. Validate testType
2. `stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price: PRICES[testType], quantity: 1 }], success_url: '/quiz{testType}?session_id={CHECKOUT_SESSION_ID}', cancel_url: '/checkout?type={testType}&cancelled=1' })`
3. Insert row in `payment_sessions` (stripe_session_id, test_type, access_token=gen_random_uuid)
4. Return `{ url: session.url }`

**`app/api/checkout/verify/route.ts`** (GET `?session_id=cs_xxx`)
1. Look up `payment_sessions` by `stripe_session_id`
2. Check not expired
3. Cross-check with `stripe.checkout.sessions.retrieve(session_id)` → `payment_status === 'paid'`
4. Return `{ accessToken: row.access_token }`

**`app/api/stripe-webhook/route.ts`** (POST, raw body)
1. `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
2. On `checkout.session.completed`: update `payment_sessions` row to confirm (no `used` flag here)
3. Return 200

---

### STEP 7 — Checkout Page (`app/checkout/page.tsx`)

Client page. Reads `?type=120|300` from URL.

Layout:
- Header: test name + item count
- 3 bullets: what you get (facet scores, deep AI report, export JSON)
- Price badge
- "ชำระเงินเพื่อเริ่มทดสอบ" button → calls `POST /api/checkout` → `router.push(url)` to Stripe
- Back link

---

### STEP 8 — Quiz120 Page (`app/quiz120/page.tsx`)

On mount:
1. Check `session_id` in URL → `GET /api/checkout/verify?session_id=...` → store `accessToken` in `localStorage[ACCESS_TOKEN_120]` → `router.replace('/quiz120')` to clean URL
2. If no session_id: check `localStorage[ACCESS_TOKEN_120]` — if missing, redirect to `/checkout?type=120`

Quiz logic (same structure as `app/quiz/page.tsx`):
- Items: `items120` (120 items, 12 pages × 10 items)
- Pre-fill: for each item where `overlaps50` is set, check `localStorage[ANSWERS]` for that item ID. If answer exists, pre-populate (show as already selected, user can change)
- Session tracking: same `responseTimes`, `pageDurations` pattern
- On complete: save to `localStorage[ANSWERS_120]`, navigate to `/results120`

---

### STEP 9 — Quiz300 Page (`app/quiz300/page.tsx`)

Gate: check `localStorage[ACCESS_TOKEN_300]` — if missing, redirect to `/checkout?type=300`.

Items: `items300.filter(item => !item.inNeo120)` — 180 items only (18 pages × 10 items).

Pre-fill: silently load `localStorage[ANSWERS_120]` into answers map (not shown to user, used only for final scoring).

On complete: merge `answers120` + new 180 answers → save combined 300-answer record to `localStorage[ANSWERS_300]` → navigate to `/results300`.

---

### STEP 10 — Results120 Page (`app/results120/page.tsx`)

Same layout as `app/results/page.tsx` plus:

**Facet bars section** (between domain bars and AI report):
- Group by domain (5 sections)
- Each section: domain header + 6 facet bars (smaller, secondary colour)
- Score = `calcScores120(answers120).facets[facetId].pct`

**AI report**: calls `POST /api/interpret120` with all 30 facet scores + profile

**Export JSON**: include `facets` field in the export, `testId: 'ipip-neo-120-th'`

**Bottom buttons**:
- "ยกระดับสู่ระดับวิจัย +180 ข้อ" → `/checkout?type=300`
- "เปรียบเทียบกับเพื่อน" → same compare flow as 50-item results

---

### STEP 11 — interpret120 Route (`app/api/interpret120/route.ts`)

Same streaming Gemini pattern as `/api/interpret`. Prompt includes all 30 facet scores by name:

```
ผลการทดสอบ OCEAN เชิงลึก ({testType} ข้อ, IPIP-NEO):

มิติหลัก:
- การเปิดรับประสบการณ์ (O): {O}%
- ความรับผิดชอบ (C): {C}%
- ความเปิดเผย (E): {E}%
- ความเป็นมิตร (A): {A}%
- ความไม่มั่นคงทางอารมณ์ (N): {N}%

ลักษณะย่อย (30 ด้าน):
N: ความวิตกกังวล {N1}%, ความโกรธง่าย {N2}%, ภาวะซึมเศร้า {N3}%,
   ความเขินอาย {N4}%, การขาดการยับยั้งชั่งใจ {N5}%, ความเปราะบาง {N6}%
... (all 30)

ข้อมูลส่วนตัว: อายุ {age}, เพศ {sex}, อาชีพ {occupation}, วัตถุประสงค์: {goal}

เขียนรายงานบุคลิกภาพเชิงลึกในภาษาไทย 2000-2500 คำ:
1. ภาพรวมบุคลิกภาพและรูปแบบหลัก
2. วิเคราะห์แต่ละมิติพร้อมลักษณะย่อยที่โดดเด่น
3. ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
4. จุดแข็งที่ซ่อนอยู่และโอกาสพัฒนา
5. แนวทางอาชีพและการใช้ชีวิต
6. คำแนะนำพัฒนาตนเอง 5-7 ข้อ ที่เป็นรูปธรรม
```

---

### STEP 12 — Comparison Feature

**`app/api/results/save/route.ts`** (POST)
- Body: `ExportData`
- Insert into `test_results` (session_id, test_type, scores, answers, profile, metadata)
- Return `{ id: uuid }`

**`app/api/compare/create/route.ts`** (POST `{ resultId: uuid }`)
- Generate 8-char code: `nanoid(8)`
- Insert into `compare_invites` (code, creator_result_id)
- Return `{ code, url: '${BASE_URL}/invite/${code}' }`

**`app/invite/[code]/page.tsx`**
- Server component: fetch invite via `GET /api/compare/${code}`
- If expired/not found: show error with link back to home
- Client: store `compare_code` in `localStorage[COMPARE_INVITE_CODE]`
- Show: title + brief explanation + "เริ่มทดสอบเลย (ฟรี 50 ข้อ)" button → `/quiz`

**Quiz flow modification** (`app/results/page.tsx`):
- On results load: check `localStorage[COMPARE_INVITE_CODE]`
- If present: after AI report loads, automatically call `POST /api/compare/submit`

**`app/api/compare/submit/route.ts`** (POST `{ code, resultData: ExportData }`)
1. Save friend result to `test_results`
2. Update `compare_invites` (friend_result_id, status='completed')
3. Fetch creator result
4. Call `POST /api/compare/interpret` internally
5. Save AI comparison to `compare_invites.ai_comparison`
6. Return `{ comparisonUrl: '/compare/${code}' }`

**`app/api/compare/interpret/route.ts`** (POST)
- Gemini prompt (Thai, 1000–1500 words):
  - Input: both profiles' 5 domain scores + personal info
  - Sections: ความเหมือน/ต่าง, จุดแข็งเมื่ออยู่ด้วยกัน, จุดขัดแย้งที่ควรระวัง, สไตล์การสื่อสาร, สิ่งที่แต่ละคนเรียนรู้จากอีกฝ่าย

**`app/api/compare/[code]/route.ts`** (GET)
- Return invite row + joined creator/friend result rows (scores + profile only, not raw answers)

**`app/compare/[code]/page.tsx`**
- Fetch from `/api/compare/${code}`
- Side-by-side dimension bars (creator = left/blue, friend = right/purple)
- Difference indicator per dimension (+/− delta)
- AI comparison report (react-markdown)
- Each person exports their own JSON (download button shows which one you are)

---

### STEP 13 — Existing Results Page Buttons

**`app/results/page.tsx`** — add at end of action buttons area:

```tsx
<button onClick={handleCompare} disabled={comparePending}>
  {comparePending ? 'กำลังสร้างลิงก์...' : 'เปรียบเทียบกับเพื่อน'}
</button>

{compareUrl && (
  <div>
    <p>แชร์ลิงก์นี้กับเพื่อน:</p>
    <input readOnly value={compareUrl} />
    <button onClick={() => navigator.clipboard.writeText(compareUrl)}>คัดลอก</button>
  </div>
)}

<Link href="/checkout?type=120">ทดสอบเชิงลึก 120 ข้อ →</Link>
```

`handleCompare` function:
1. `POST /api/results/save` with `buildExport()` data → get `{ id }`
2. `POST /api/compare/create` with `{ resultId: id }` → get `{ url }`
3. Set `compareUrl` state

---

### STEP 14 — Home Page Pricing (`app/page.tsx`)

Add a 3-column pricing section below the dimension grid:

```tsx
// Three cards: Free / Deep (120) / Research (300)
// Free card: active CTA "เริ่มทดสอบฟรี"
// Deep card: "ทดสอบเชิงลึก ฿49" → /checkout?type=120
// Research card: "ระดับวิจัย ฿49+฿79" → /checkout?type=120 (with note: ต้องทำ 120 ก่อน)
```

---

## Verification Checklist

- [ ] `IPIP_REFERENCE.md` in repo with full item lists and transfer table
- [ ] `npx tsx scripts/translate-items.ts` runs without error, produces `lib/items120.ts` and `lib/items300.ts`
- [ ] `lib/items120.ts`: 120 items, all with `th` field, correct `facet`, `factor`, `reverse`, `overlaps50` on 18 items
- [ ] `lib/items300.ts`: 300 items, `inNeo120: true` on 120 of them
- [ ] Stripe test mode: click "ทดสอบเชิงลึก" → Stripe checkout → pay → redirect to quiz120 → quiz unlocks
- [ ] Stripe webhook: `checkout.session.completed` event received and processed (check Supabase `payment_sessions`)
- [ ] quiz120: 18 overlap items pre-filled with answers from 50-item test
- [ ] quiz300: only 180 items shown; merged 300-item score computed correctly
- [ ] Comparison flow: User A creates invite → User B takes test → `/compare/[code]` shows both profiles + AI report
- [ ] `/invite/[code]` shows friendly error if code is expired or invalid
- [ ] Old 50-item quiz/profile/results flow: no regressions (only 2 new buttons added to results page)
- [ ] TypeScript build: `npm run build` passes with no errors
