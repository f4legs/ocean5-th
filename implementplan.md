# Implementation Plan: Website Refactoring & Optimization

> **For AI agents:** This is a self-contained plan. Read this file, then execute phases in order. Each phase is independently testable. Run `npm run build` after each phase to verify.

## Problem

- ~5,350 lines across 12 pages, only 4 shared components (330 lines)
- 3 quiz pages are ~80% identical copies (quiz, quiz120, quiz300)
- 3 results pages are ~90% identical copies (results, results120, results300)
- Dashboard is a 1,224-line monolith
- 9/12 pages are fully `'use client'` — all content ships as client JS
- Constants (LABELS, FACTOR_ORDER, DOMAIN_COLORS, etc.) duplicated 3-4 times each

## Goals

1. Deduplicate shared code into reusable components/constants
2. Push `'use client'` boundaries down — static content server-rendered, only interactive leaves are client (Next.js 16 best practice)
3. Reduce total code by ~1,600 lines and shrink client JS bundles

## Tech Stack

- Next.js 16.2.1, React 19, Tailwind CSS v4, Supabase, Stripe
- Next.js docs: `node_modules/next/dist/docs/01-app/`
- AGENTS.md says: "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code"

## Important Next.js 16 Notes

- `params` and `searchParams` are now **Promises** — must `await` them
- Default components are Server Components (no directive needed)
- `'use client'` should go on the **smallest possible interactive components**
- Server Components can pass as `children` to Client Components (interleaving pattern)

---

## Phase 1: Extract Shared Constants & Utilities

**Risk: Low. No UI changes.**

### Step 1.1: Create `lib/ocean-constants.ts`

Extract these duplicated items into one file:

```typescript
// From quiz/page.tsx, quiz120/page.tsx, quiz300/page.tsx (lines 9-15 in each):
export const LABELS = [
  { value: 5, th: 'ตรงมาก' },
  { value: 4, th: 'ค่อนข้างตรง' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรง' },
  { value: 1, th: 'ไม่ตรงเลย' },
] as const

// From results/page.tsx (line 12), results120/page.tsx (line 11),
// results300/page.tsx (line 11), dashboard/page.tsx (line 35):
export const FACTOR_ORDER = ['O', 'C', 'E', 'A', 'N'] as const

// From results120/page.tsx (line 30), results300/page.tsx (line 30):
export const FACET_DOMAIN_ORDER = ['N', 'E', 'O', 'A', 'C'] as const

// From results120/page.tsx (lines 13-19), results300/page.tsx (lines 13-19):
// Also consolidate with DIMENSION_INFO from lib/scoring.ts
export const DOMAIN_LABELS: Record<string, { label: string; sublabel: string; description: string }> = {
  O: { label: 'การเปิดรับประสบการณ์', sublabel: 'OPENNESS', description: 'จินตนาการ ความคิดสร้างสรรค์ และความอยากรู้อยากเห็น' },
  C: { label: 'ความรับผิดชอบ', sublabel: 'CONSCIENTIOUSNESS', description: 'ความเป็นระเบียบ ความมุ่งมั่น และวินัยในตนเอง' },
  E: { label: 'ความเปิดเผย', sublabel: 'EXTRAVERSION', description: 'ความกระตือรือร้น ความชอบสังคม และความร่าเริง' },
  A: { label: 'ความเป็นมิตร', sublabel: 'AGREEABLENESS', description: 'ความร่วมมือ ความไว้วางใจ และความเห็นอกเห็นใจ' },
  N: { label: 'ความไม่มั่นคงทางอารมณ์', sublabel: 'NEUROTICISM', description: 'ความวิตกกังวล ความอ่อนไหว และการรับมือกับความเครียด' },
}

// From results120/page.tsx (lines 22-28), results300/page.tsx (lines 22-28):
// Also consolidate with DIMENSION_STYLES from results/page.tsx (lines 15-21)
export const DOMAIN_COLORS: Record<string, { barColor: string; chipBg: string; chipText: string; hue: string }> = {
  O: { barColor: 'hsl(210,55%,52%)', chipBg: 'hsl(210,60%,95%)', chipText: 'hsl(210,50%,36%)', hue: '210' },
  C: { barColor: 'hsl(38,60%,50%)',  chipBg: 'hsl(38,70%,94%)',  chipText: 'hsl(38,55%,34%)',  hue: '38'  },
  E: { barColor: 'hsl(158,50%,42%)', chipBg: 'hsl(158,60%,93%)', chipText: 'hsl(158,45%,30%)', hue: '158' },
  A: { barColor: 'hsl(268,45%,55%)', chipBg: 'hsl(268,60%,95%)', chipText: 'hsl(268,40%,38%)', hue: '268' },
  N: { barColor: 'hsl(348,52%,52%)', chipBg: 'hsl(348,60%,95%)', chipText: 'hsl(348,45%,36%)', hue: '348' },
}

// From results/page.tsx (lines 23-27), results120/page.tsx (lines 32-36), results300/page.tsx (lines 32-36):
export function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
}

// From results/page.tsx (lines 29-33), results120/page.tsx (lines 38-42), results300/page.tsx (lines 38-42):
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}
```

### Step 1.2: Create `lib/stream-report.ts` (~50 lines)

Extract the streaming report fetch logic shared across all 3 results pages. Each results page has a `streamReport` or `fetchReport` function with:
- Fetch to `/api/interpret` or `/api/interpret-deep` with streaming response
- ReadableStream reader loop with TextDecoder
- Markdown normalization regex
- Fake progress bar useEffect (identical step logic: 6/4/3/2/1 at thresholds 24/48/72/86)

### Step 1.3: Create `lib/export.ts` (~200 lines)

Extract from `app/results/page.tsx` (approximately lines 35-276):
- `buildExport()`, `buildJsonFile()`, `buildPdfFile()`
- `shareOrDownloadFile()`, `downloadBlob()`
- `isProbablyIos()`, `shouldUseNativeShare()`
- `buildReportSignature()`, `normalizeProfile()`, `readCachedReport()`
- TypeScript interfaces: `ExportData`, `ProfileData`, `ExportProfile`, `SessionData`, `CachedReport`

### Step 1.4: Update all imports

Replace inline definitions with imports from `lib/ocean-constants.ts` in:
- `app/quiz/page.tsx` — remove LABELS
- `app/quiz120/page.tsx` — remove LABELS
- `app/quiz300/page.tsx` — remove LABELS
- `app/results/page.tsx` — remove FACTOR_ORDER, DIMENSION_STYLES (use DOMAIN_COLORS), pctToLabel, formatDuration
- `app/results120/page.tsx` — remove FACTOR_ORDER, DOMAIN_LABELS, DOMAIN_COLORS, FACET_DOMAIN_ORDER, pctToLabel, formatDuration
- `app/results300/page.tsx` — remove FACTOR_ORDER, DOMAIN_LABELS, DOMAIN_COLORS, FACET_DOMAIN_ORDER, pctToLabel, formatDuration
- `app/dashboard/page.tsx` — remove FACTOR_ORDER
- `lib/scoring.ts` — update DIMENSION_INFO to re-export from ocean-constants or remove if redundant

**Verify:** `npm run build` passes.

---

## Phase 2: Unified Quiz Shell + Server/Client Split

### Step 2.1: Create `components/quiz-shell.tsx` (`'use client'`, ~280 lines)

Read `app/quiz120/page.tsx` as the primary reference — it's the most complete variant.

The shared component accepts a config object:

```typescript
interface QuizShellConfig {
  variant: '50' | '120' | '300'
  eyebrowText: string
  titleText: string
  subtitleText: string
  items: { id: number; th: string }[]
  getPageItems: (page: number) => { id: number; th: string }[]
  itemsPerPage: number
  totalPages: number
  premiumBadge?: { title: string; features: string[] } | null
  restoreState: () => Promise<{
    answers: Record<number, number>
    page: number
    responseTimes: Record<number, number>
    pageDurations: Record<number, number>
  } | null>
  saveDraft: (data: {
    answers: Record<number, number>
    page: number
    responseTimes: Record<number, number>
    pageDurations: Record<number, number>
  }) => void | Promise<void>
  onComplete: (data: {
    answers: Record<number, number>
    responseTimes: Record<number, number>
    pageDurations: Record<number, number>
  }) => void | Promise<void>
  draftSaveDebounce?: number
}
```

The shell owns:
- All useState/useRef: page, answers, itemShownAt, pageEnteredAt, pageDurations, responseTimes, restoredPage
- useEffect for restore state on mount (calls config.restoreState())
- useEffect for item-shown timestamps and visibility-change handler
- handleAnswer, handleNext, handleBack (delegates to config.saveDraft and config.onComplete)
- Full JSX: sidebar with progress + answer scale legend, question grid with 5-button radio, navigation footer

### Step 2.2: Refactor quiz pages with server/client split

Each quiz page becomes a thin server component + client wrapper:

**`app/quiz/page.tsx`** (Server Component, ~5 lines):
```typescript
import QuizClient from './quiz-client'
export default function QuizPage() {
  return <QuizClient />
}
```

**`app/quiz/quiz-client.tsx`** (`'use client'`, ~50 lines):
- Import QuizShell, items, getPageItems, ITEMS_PER_PAGE, TOTAL_PAGES from lib/items
- localStorage-based restoreState/saveDraft/onComplete callbacks
- Render <QuizShell config={...} />

**`app/quiz120/page.tsx`** (Server Component, ~5 lines):
```typescript
import Quiz120Client from './quiz120-client'
export default function Quiz120Page() {
  return <Quiz120Client />
}
```

**`app/quiz120/quiz120-client.tsx`** (`'use client'`, ~70 lines):
- Auth + payment gate useEffect
- Loading guard (if !authChecked, show spinner)
- Supabase-based restoreState (fetch from quiz_drafts table), saveDraft (debounced upsert), onComplete (save to ocean_profiles, navigate to results120)
- Render <QuizShell config={...} />

**`app/quiz300/page.tsx`** + **`app/quiz300/quiz300-client.tsx`** — same pattern as quiz120 but with additional 120-completion prerequisite check (~80 lines client).

**Verify:** Navigate /quiz, /quiz120, /quiz300. Test draft save/restore, answer persistence, final submission, progress tracking.

---

## Phase 3: Shared Results Components + Server/Client Split

### Step 3.1: Create shared sub-components

**`components/results/domain-scores.tsx`** (`'use client'`, ~60 lines):
- Props: `scores: Record<string, number>` (pct values), optional facets
- Renders the 5 OCEAN domain score cards with progress bar and percentage chip
- Uses DOMAIN_LABELS, DOMAIN_COLORS, pctToLabel from lib/ocean-constants

**`components/results/report-panel.tsx`** (`'use client'`, ~100 lines):
- Props: report, loading, error, fakeProgress, loadingSeconds, loadingMessage, estimatedTime, eyebrowText, titleText, onRetry
- Renders: loading spinner with fake progress bar, error panel with retry, ReactMarkdown report display
- Currently duplicated almost identically in all 3 results pages

**`components/results/invite-share-card.tsx`** (`'use client'`, ~50 lines):
- Props: inviteCode, inviteOwner, status, shareDescription, onShare, onDecline
- The invite/share sidebar card currently copy-pasted in all 3 results pages

**`components/results/facet-scores.tsx`** (`'use client'`, ~55 lines):
- Props: facets: Record<string, { raw: number; pct: number }>
- 30-facet breakdown section shared by results120 and results300

**`components/results/sidebar-scores.tsx`** (~25 lines):
- Sidebar score grid shared by all 3 results pages

### Step 3.2: Refactor results pages with server/client split

**`app/results/page.tsx`** (Server Component, ~5 lines) → imports `ResultsClient`
**`app/results/results-client.tsx`** (`'use client'`, ~350 lines):
- localStorage-based score loading, report caching
- Composes DomainScores, ReportPanel, InviteShareCard, SidebarScores
- Export functionality via lib/export.ts

**`app/results120/page.tsx`** (Server Component, ~5 lines) → imports `Results120Client`
**`app/results120/results120-client.tsx`** (`'use client'`, ~180 lines):
- Auth check, sessionStorage score loading
- Composes DomainScores, ReportPanel, FacetScores, InviteShareCard, SidebarScores

**`app/results300/page.tsx`** + **`app/results300/results300-client.tsx`** — nearly identical to results120 (~170 lines client).

**Verify:** Score display, facet breakdown, AI report streaming, progress animation, retry, invite share, export (JSON/PDF on /results).

---

## Phase 4: Dashboard Decomposition & Cleanups

### Step 4.1: Extract SVG icons → `components/icons.tsx` (~120 lines)
Move ~15 inline SVG icon components from dashboard/page.tsx and checkout/page.tsx into shared icons file.

### Step 4.2: Extract `components/dashboard/profile-combobox.tsx` (~60 lines)
Move the inline ProfileCombobox sub-component from dashboard.

### Step 4.3: Server/client split for dashboard
**`app/dashboard/page.tsx`** (Server Component) → imports `DashboardClient`
**`app/dashboard/dashboard-client.tsx`** (`'use client'`, ~900 lines after extractions)

### Step 4.4: Server/client split for checkout
**`app/checkout/page.tsx`** (Server Component, ~100 lines of static marketing JSX):
- Renders static feature lists, OCEAN dimension decorations
- Imports CheckoutForm as client child

**`app/checkout/checkout-form.tsx`** (`'use client'`, ~200 lines):
- Auth check, Stripe checkout session creation, payment flow

### Step 4.5: Clean up unused assets
Remove from `public/`: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (leftover Next.js boilerplate, unused in code).

### Step 4.6: Audit `await params`
`app/invite/[code]/page.tsx` uses dynamic route params — must `await params` per Next.js 16 (params is now a Promise). Check current code and fix if needed.

**Verify:** Dashboard renders all 3 views. Checkout renders + Stripe works. Invite flow works. `npm run build` passes.

---

## New Files Summary

| File | Lines | Type |
|------|-------|------|
| `lib/ocean-constants.ts` | ~80 | Shared constants + helpers |
| `lib/stream-report.ts` | ~50 | Report streaming logic |
| `lib/export.ts` | ~200 | Export utilities |
| `components/quiz-shell.tsx` | ~280 | Unified quiz component |
| `components/results/domain-scores.tsx` | ~60 | Score cards |
| `components/results/report-panel.tsx` | ~100 | AI report panel |
| `components/results/invite-share-card.tsx` | ~50 | Invite card |
| `components/results/facet-scores.tsx` | ~55 | Facet breakdown |
| `components/results/sidebar-scores.tsx` | ~25 | Score grid |
| `components/icons.tsx` | ~120 | Shared SVG icons |
| `components/dashboard/profile-combobox.tsx` | ~60 | Profile selector |
| `app/quiz/quiz-client.tsx` | ~50 | Quiz client wrapper |
| `app/quiz120/quiz120-client.tsx` | ~70 | Quiz120 client wrapper |
| `app/quiz300/quiz300-client.tsx` | ~80 | Quiz300 client wrapper |
| `app/results/results-client.tsx` | ~350 | Results client wrapper |
| `app/results120/results120-client.tsx` | ~180 | Results120 client wrapper |
| `app/results300/results300-client.tsx` | ~170 | Results300 client wrapper |
| `app/dashboard/dashboard-client.tsx` | ~900 | Dashboard client wrapper |
| `app/checkout/checkout-form.tsx` | ~200 | Checkout client wrapper |

## Final Verification

1. `npm run build` — must pass with zero errors
2. Test every route manually:
   - `/` — home page renders
   - `/quiz`, `/quiz120`, `/quiz300` — full quiz flow with draft persistence
   - `/results`, `/results120`, `/results300` — scores + AI report streaming
   - `/dashboard` — all 3 views (default, compare, group-compare)
   - `/checkout` — renders, Stripe flow works
   - `/invite/[code]` — invite acceptance
   - `/auth` — login form
   - `/profile` — profile page
3. Browser DevTools → Network: verify reduced JS bundle sizes on checkout, results pages
