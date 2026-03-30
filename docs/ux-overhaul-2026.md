# UX/UI Overhaul 2026 — Progress Tracker

> Started: 2026-03-29
> Plan: `.claude/plans/sunny-finding-ullman.md`
> Design direction: iamrobin.com structure × origami geometry
> OCEAN colors: existing palette from `lib/ocean-constants.ts` (O=blue 210, C=amber 38, E=green 158, A=purple 268, N=rose 348)

---

## Phase Status

| Phase | Description | Status | PR |
|-------|-------------|--------|-----|
| 1 | Free 50-test flow: minimal noise, easy share | ✅ Done | — |
| 2 | Paid dashboard: mobile-first compact redesign | 🔲 Todo | — |
| 3 | Compare feature: consistency & mobile UX | 🔲 Todo | — |
| 4 | Design system: Origami × Editorial | ✅ Done | — |

---

## Phase 1 — Free 50-Test Flow ✅

**Completed:** 2026-03-29

### Files changed
- `components/quiz-shell.tsx`
- `app/results/results-client.tsx`

### What changed

#### quiz-shell.tsx
- **Mobile sidebar hidden** (`hidden lg:block`) — eliminates dense 5-section sidebar on small screens
- **Sticky progress strip** — thin top bar on mobile showing `%` + filled bar + `answered/total` count
- **Page medallion removed** — reduced redundancy in sidebar progress panel
- **Arrow icons** — replaced `←`/`→` text with `<IconChevronLeft>` / `<IconChevronRight>` from icons.tsx

#### results-client.tsx
- **Removed `fakeProgress` state and interval** — no more artificial progress simulation
- **Removed `loadingSeconds` state** — removed elapsed-time display and multi-message rotation
- **Simplified loading UI** — single message: "กำลังวิเคราะห์ผลลัพธ์…" with "อาจใช้เวลา 1–3 นาที"
- **Single actions card** — removed DOM duplication (`lg:hidden` + `hidden lg:block` copies); actions card is now one instance in the main content flow
- **Invite card moved inline** — now visible on all viewports in the main column (was buried in desktop-only sidebar)
- **LINE share banner** — appears after report completes; LINE share link + copy-link button
- **Restart modal** — replaced inline amber hardcoded styles with `muted-panel` + `primary-button` / `secondary-button` design system classes

### Verification
- [ ] Quiz sidebar hidden at 375px viewport; sticky strip visible
- [ ] Page medallion gone from desktop sidebar
- [ ] Chevron icons on back/next buttons
- [ ] Loading shows single message (no fake progress bar)
- [ ] Actions card appears once (not duplicated)
- [ ] Invite card visible on mobile (no `hidden lg:block`)
- [ ] LINE share banner appears after report loads
- [ ] Restart warning uses design system styling

---

## Phase 2 — Paid Dashboard: Mobile-First ✅

**Completed:** 2026-03-29

### Files changed
- `app/dashboard/dashboard-client.tsx`

### What changed

#### Mobile navigation
- **Sticky tab bar** added at top of page for `< lg` — 5 tabs: โปรไฟล์ / เปรียบเทียบ / กลุ่ม / นำเข้า / เชิญ
- Invite link and upload error display inline in tab bar on mobile (was sidebar-only)
- Sidebar hidden on mobile (`hidden lg:block`)

#### Profile cards on mobile
- Default view now shows profile cards grid on mobile (`lg:hidden`)
- Each card: 5-color OCEAN bar strip proportional to scores + label + test type chip + date + dominant trait
- Tap → opens profile detail view
- Empty state and loading state handled

#### English → Thai translations
- "Compare Profiles" → "เปรียบเทียบโปรไฟล์"
- "Run Comparison" → "เปรียบเทียบ"
- "Analyzing…" → "กำลังวิเคราะห์…"
- "Save PDF" → "บันทึก PDF"
- "Five Factor Scores" → "คะแนน 5 มิติ"
- "AI Comparison Report" → "รายงาน AI เปรียบเทียบ"
- "Deep AI Report" → "รายงาน AI เชิงลึก"
- "Show 30 Facets" → "แสดง 30 ลักษณะย่อย"
- "Generate Analysis" → "สร้างรายงาน AI"
- "Regenerate Analysis" → "สร้างรายงานใหม่"
- "Generating analysis..." → "กำลังสร้างรายงาน..."
- "Compare this Profile" → "เปรียบเทียบโปรไฟล์นี้"
- "Share to other member" → "แชร์ให้สมาชิก"
- "Profile not found" → "ไม่พบโปรไฟล์"
- "Generating..." (share link) → "กำลังสร้างลิงก์..."
- Nav labels: "(Overview)", "(Compare)", "(Group Dynamics)" removed; "TOOLS" → "เครื่องมือ"

#### Button fixes
- Compare button: removed inline `style` override → uses `primary-button text-sm` class
- Save PDF button: removed inline `style` → uses `secondary-button min-h-0 px-4 py-2 text-xs` class

### Verification
- [ ] Tab bar visible at ≤ 768px, hidden at ≥ 1024px
- [ ] Sidebar hidden on mobile
- [ ] Profile cards grid visible on mobile default view
- [ ] OCEAN color strip on each card
- [ ] No English strings in Thai UI context (grep check)
- [ ] Compare button has no inline style
- [ ] Invite link / upload error display in mobile tab area

---

## Phase 3 — Compare Feature: Consistency ✅

**Completed:** 2026-03-29

### Files changed
- `app/dashboard/dashboard-client.tsx`
- `app/results120/results120-client.tsx`

### What changed

#### dashboard-client.tsx — compare view
- **Method selector** — replaced `<select>` dropdown with 4 horizontal `choice-chip` pills: ภาพรวม / ความสัมพันธ์ / การทำงาน / จุดแข็ง. Uses existing `.choice-chip.active` style. No new CSS needed.
- **Top-3 delta highlighting** — computed with `useMemo` (`topDeltaFactors`). Each factor row with a top-3 absolute delta gets a subtle `bg-[rgba(69,98,118,0.06)]` band.
- **Facets grouped by factor** — removed single `<details>` wrapper containing all 30 facets. Replaced with 5 collapsible `<details>` sections, one per factor (O/C/E/A/N), each with factor label and medallion.
- **`compareWith` URL param** — on init, if `?compareWith=<profileId>` is in URL, pre-selects that profile as slot A and switches to compare view.

#### results120-client.tsx
- **Compare CTA** — "เปรียบเทียบกับคนอื่น →" button added to actions card, links to `/dashboard?compareWith=<profileId>`.
- **DOM duplication fixed** — removed `renderActionsCard('lg:hidden')` + `renderActionsCard('hidden lg:block')` pattern. Single `renderActionsCard()` call in main content column. Invite card also moved to main column.

### Verification
- [ ] Method chips render in compare panel header (4 chips)
- [ ] Clicking a chip switches method and clears existing report
- [ ] Top-3 delta rows have tinted background
- [ ] Facets grouped into 5 `<details>` by factor
- [ ] results120 actions card shows "เปรียบเทียบกับคนอื่น →" when profileId exists
- [ ] Link navigates to `/dashboard?compareWith=<id>`
- [ ] Dashboard auto-selects slot A and switches to compare view when param present
- [ ] No DOM duplication in results120 (one actions card, one invite card)

---

## Phase 4 — Design System: Origami × Editorial ✅

**Completed:** 2026-03-29

### Files changed
- `app/globals.css`
- `app/dashboard/dashboard-client.tsx`
- `components/results/domain-scores.tsx`

### What changed

#### globals.css
- **`--dashboard-bg: #F7F6F3`** — warm paper-white CSS var added to `:root`
- **`.dashboard-page`** — applies warm background to dashboard `<main>` (scoped, doesn't affect other pages)
- **`.fold-divider`** — 1px horizontal rule using `linear-gradient(to right, transparent, rgba(76,93,105,0.22), transparent)` — origami crease motif
- **`.section-title`** — tightened letter-spacing to `-0.03em`, weight to `700`

#### dashboard-client.tsx
- **Imports** — added `DOMAIN_COLORS`, `DOMAIN_LABELS` from `@/lib/ocean-constants`
- **`<main>` class** — added `dashboard-page` for warm paper background
- **Editorial section header** — overview section title rewritten as editorial two-column (bold display title left, profile count right); eyebrow badge removed
- **Color-blocked profile cards** — mobile card grid redesigned: dominant OCEAN trait color as full card background, white text, `sublabel` as uppercase eyebrow, test type chip in white/20, `clamp()` for label font-size
- **Fold-line divider** — `<hr className="fold-divider" />` added above the mobile profile cards

#### domain-scores.tsx
- **Factor-tinted card backgrounds** — each domain card now uses `hsl({hue}, 38%, 97%)` from `DOMAIN_COLORS[factor].hue`, giving a subtle unique tint per factor instead of the generic gray gradient

### Verification
- [ ] Dashboard page has warm `#F7F6F3` background (vs. cold `#e8ecef` elsewhere)
- [ ] Mobile profile cards have full dominant-trait color background with white text
- [ ] Fold-line divider appears between overview text and profile card grid
- [ ] Section titles are bolder/tighter on all result pages
- [ ] Domain score cards have subtly different background tints (O=blue-ish, C=amber-ish, etc.)
- [ ] Editorial header shows title left + profile count right
- [ ] Other pages (quiz, results) unaffected by dashboard-specific styles

---

## LINE Browser Compat Checklist (all phases)

- [ ] No `position: fixed` on critical UI — use `position: sticky`
- [ ] Sticky elements have no `overflow` ancestor
- [ ] Modals use flow-positioned containers, not fixed overlays
- [ ] Test: LINE iOS
- [ ] Test: LINE Android

---

## Known Issues / Deferred

| Issue | Deferred to |
|-------|-------------|
| `results-client.tsx` unused `useCallback` wrapper on `fetchReport` — could be a plain function | Phase 4 cleanup |
| `results300-client.tsx` — same loading/sharing issues as results-client (not fixed in Phase 1) | Phase 3 |
| `results120-client.tsx` — awkward two-step retake confirmation | Phase 3 |
