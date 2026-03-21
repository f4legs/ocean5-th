# OCEAN5-TH — Improvements & Fixes (Round 2)

Previous 27 issues: all resolved.
This round focuses on edge cases, defensive programming, and production readiness.

---

## Verified Correct (no changes needed)

- Item counts: exactly 10 per factor (E/A/C/N/O)
- Reverse-scoring logic: `score = item.reverse ? 6 - answer : answer` is correct
- Neuroticism direction: all 10 N items correctly keyed (high N = high neuroticism)
- shuffleItems() algorithm: correctly prevents adjacent same-factor items
- JSON export data: complete with session, answers, timings, metadata
- Data pipeline quiz → profile → results: all values persisted correctly

---

## P0 — Critical

### 1. AbortController not actually passed to Gemini SDK
**File:** `app/api/interpret/route.ts` lines 106-119
**Why:** The `AbortController` is created and the `controller.abort()` fires after 30s, but the controller's signal is never passed to `model.generateContent()`. The Google Generative AI SDK doesn't accept an abort signal in `generateContent()` anyway.
**Impact:** If Gemini hangs, the serverless function waits indefinitely (up to Vercel's 60s limit), ignoring our 30s timeout entirely.
**Fix:** Replace with `Promise.race` pattern:
```ts
const genPromise = model.generateContent(prompt)
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Gemini timeout')), 30000)
)
const result = await Promise.race([genPromise, timeoutPromise])
```

### 2. Tailwind v4 prose class likely not rendering
**File:** `app/results/page.tsx` line 295
**Why:** The project uses Tailwind v4 (`"tailwindcss": "^4"` in package.json). Tailwind v4 does not include the `@tailwindcss/typography` plugin by default — the `prose prose-sm prose-slate` classes will be ignored, resulting in unstyled markdown output (no heading sizes, no list indentation, no spacing).
**Impact:** AI report renders as flat, unstyled text — the most important screen in the app looks broken.
**Fix:** Either:
- (a) `npm install @tailwindcss/typography` and add to postcss/tailwind config
- (b) Or replace `prose` with explicit Tailwind classes on the ReactMarkdown component using `components` prop to style h2, h3, ul, li, p, strong, em individually

---

## P1 — High

### 3. Unanswered items silently skip, producing wrong scores
**File:** `lib/scoring.ts` lines 54-58
**Why:** `if (answer === undefined) continue` means if only 35 of 50 items are answered, the raw score for a factor with 7/10 items answered will be lower than expected. The percentage formula assumes all 10 items contributed (range 10–50), so a partial score is misleadingly low.
**Impact:** Data integrity issue. While the quiz UI forces all answers, direct API callers or corrupted localStorage could produce partial answers.
**Fix:** Add a guard at the top of `calcScores`:
```ts
const answeredCount = Object.keys(answers).length
if (answeredCount < items.length) {
  console.warn(`Only ${answeredCount}/${items.length} items answered`)
}
```
Or throw an error if used in strict/analysis mode.

### 4. Rate limiter doesn't work on Vercel (serverless)
**File:** `app/api/interpret/route.ts` lines 5-19
**Why:** The `rateMap` is an in-memory `Map`. On Vercel, each API call may hit a different serverless instance, and cold starts reset all state. The rate limiter is effectively useless.
**Impact:** No real rate limiting in production — API key can be burned.
**Fix:** Accept this as a known limitation and document it. For real protection, either:
- Use Vercel's built-in rate limiting (vercel.json `"rewrites"` with rate limit)
- Or add `upstash/ratelimit` (Redis-based, works on serverless)
- For now, add a comment explaining the limitation.

---

## P2 — Medium

### 5. Remove dead `color` field from DIMENSION_INFO
**File:** `lib/scoring.ts` lines 16-47
**Why:** Each dimension defines a `color` hex value (e.g. `'#F59E0B'`) that is never used anywhere. Results page uses its own `DIMENSION_COLORS` map with Tailwind classes instead. This confuses maintainers.
**Fix:** Remove the `color` property from every entry in `DIMENSION_INFO`, and from the type annotation.

### 6. Hardcoded localStorage keys should be constants
**File:** `app/results/page.tsx` line 184, `app/quiz/page.tsx` line 15
**Why:** Quiz page defines `DRAFT_KEY = 'ocean_answers_draft'` but results page hardcodes `'ocean_answers_draft'` in `handleRestart()`. Other keys like `'ocean_answers'`, `'ocean_session'`, etc. are hardcoded strings scattered across files.
**Fix:** Create `lib/storage-keys.ts` with all localStorage key constants, import everywhere.

### 7. Add localStorage try-catch wrapper for private browsing
**File:** All client components
**Why:** In some browsers' private/incognito mode, or with certain privacy extensions, `localStorage` throws on access. The app would crash silently.
**Fix:** Create a `lib/storage.ts` helper:
```ts
export function getItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function setItem(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* silently fail */ }
}
```

### 8. Validate age on profile form submit
**File:** `app/profile/page.tsx` lines 54-57
**Why:** HTML `min={10} max={100}` attributes are hints, not enforced. User can type `5`, `150`, or negative values. This produces invalid data in the export.
**Fix:** In `handleSubmit()`, clamp or validate:
```ts
const parsedAge = age ? parseInt(age) : null
const validAge = parsedAge && parsedAge >= 10 && parsedAge <= 100 ? parsedAge : null
```

### 9. Document the eslint-disable for exhaustive-deps
**File:** `app/quiz/page.tsx` line 58
**Why:** The `// eslint-disable-line react-hooks/exhaustive-deps` is unexplained. The effect intentionally only re-runs on `page` change (not `pageItems`), but this isn't documented.
**Fix:** Replace with a clear comment:
```ts
// eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depends only on `page`; pageItems is derived from page
```

### 10. Response time tracking inflated after tab-away
**File:** `app/quiz/page.tsx` lines 23-29
**Why:** `itemShownAt` records when items first appear and never resets. If a user opens a quiz page, switches to another tab for 10 minutes, then answers, the response time shows 600000ms+ instead of their actual thinking time.
**Fix:** Use `document.visibilitychange` to pause/resume the timer, or reset `itemShownAt` when the tab becomes visible again.

---

## P3 — Low

### 11. x-forwarded-for header is spoofable
**File:** `app/api/interpret/route.ts` line 34
**Why:** Attackers can set custom `x-forwarded-for` headers to bypass IP-based rate limiting.
**Fix:** On Vercel, use `req.headers.get('x-real-ip')` which Vercel sets from the actual client IP (not spoofable). Add a comment noting this.

### 12. No graceful handling if quiz is accessed with no prior data
**File:** `app/quiz/page.tsx`
**Why:** If someone bookmarks `/quiz` and visits later with cleared localStorage, the quiz works fine (starts fresh). But if they bookmark `/results` or `/profile`, those pages redirect to `/`. This is correct behavior, but a flash of the loading state is visible.
**Fix:** Minor — consider showing a brief "ไม่พบข้อมูล กรุณาเริ่มทำแบบทดสอบใหม่" message before redirect.

### 13. Favicon still uses Next.js default
**File:** `public/`
**Why:** No custom favicon was created despite being in the previous improvements list (#25).
**Fix:** Create a simple SVG favicon and add to `app/layout.tsx`:
```tsx
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

---

## Summary by file

| File | Issues |
|------|--------|
| `app/api/interpret/route.ts` | #1 (timeout), #4 (rate limiter), #11 (x-forwarded-for) |
| `app/results/page.tsx` | #2 (prose styling), #6 (hardcoded keys) |
| `lib/scoring.ts` | #3 (partial answers), #5 (dead color) |
| `app/quiz/page.tsx` | #9 (eslint comment), #10 (response time) |
| `app/profile/page.tsx` | #8 (age validation) |
| All client files | #6 (storage keys), #7 (localStorage wrapper) |
| `public/` + `app/layout.tsx` | #13 (favicon) |
