# Design Guide — OCEAN Personality Platform

A premium, research-grade aesthetic that communicates scientific depth and trust.
The visual language is "Analytical Canvas": editorial typography, tonal surface layering, and precise data visualization.

---

## Color System

### Core Palette
| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#456276` | Interactive primary, icon accents |
| `--primary-dark` | `#2c4350` | Button fill, strong headings |
| `--primary-deeper` | `#233643` | Gradient endpoint, darkest surfaces |
| `--primary-soft` | `rgba(69,98,118,0.08)` | Tinted backgrounds, hover states |

### Surface Stack (light → dark background)
| Token | Value | Use |
|-------|-------|-----|
| `--surface-page` | `#e8ecef` | Page background |
| `--surface-low` | `#f1f4f6` | Section background, body panels |
| `--surface-card` | `#ffffff` | Card / foreground surface |
| `--surface-raised` | `rgba(255,255,255,0.92)` | Glass panels, overlays |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `--text-main` | `#1a3040` | Primary text on light |
| `--text-soft` | `#4a6070` | Secondary / body text |
| `--text-faint` | `#7a9aaa` | Captions, meta, labels |
| `--text-ghost` | `rgba(255,255,255,0.56)` | Subtext on dark gradient |
| `--text-on-dark` | `rgba(255,255,255,0.85)` | Primary text on gradient |

### Semantic
| Purpose | Value |
|---------|-------|
| Success | `#10b981` / `rgba(16,185,129,0.07)` |
| Warning | `#d97706` / `rgba(245,158,11,0.07)` |
| Error | `#ef4444` / `rgba(239,68,68,0.06)` |
| Info (violet) | `#8b5cf6` / `rgba(139,92,246,0.07)` |

### Hero Gradient
```css
background: linear-gradient(150deg, #456276 0%, #233643 100%);
```
Used for: hero panels, primary CTA button, feature headers.

---

## Typography

### Font Stack
- **Display / Headlines**: `var(--font-display)` — Noto Serif Thai, Georgia, serif
- **Body / UI**: `var(--font-body)` — Noto Sans Thai, Arial, sans-serif
- **Brand**: `var(--font-brand)` — Outfit (Latin only, used sparingly)

### Scale
| Role | Size | Weight | Tracking | Line-height |
|------|------|--------|----------|-------------|
| Display hero | `2.2–2.6rem` | 700 | `-0.03em` | `1.10` |
| Section title | `1.5–1.9rem` | 600 | `-0.02em` | `1.20` |
| Card heading | `1rem–1.1rem` | 600 | `-0.01em` | `1.30` |
| Body | `14px` | 400 | normal | `1.65` |
| Caption / meta | `10–11px` | 500–600 | `+0.12em` | `1.50` |
| Eyebrow label | `10px` | 700 | `+0.20em` | — |

### Rules
- **Thai headlines** always use `--font-display` (Noto Serif Thai)
- **Latin-only labels** (OCEAN, IPIP-NEO, etc.) may use Outfit or inherit body font
- **Tabular numbers** use `tabular-nums` class for data/scores
- Keep headline letter-spacing negative for optical tightness

---

## Surface & Layering Model

No explicit borders for structural separation — use tonal background shifts instead.

```
Page (#e8ecef)
  └─ Section panel (#f1f4f6)
       └─ Card (white)
            └─ Inset / muted (rgba(244,247,249,0.96))
```

**On dark gradient backgrounds**, use frosted layers:
```css
/* frosted card on dark */
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.10);

/* stats / data strip on dark */
background: rgba(0,0,0,0.18);
```

**Borders** are only used for:
- Frosted glass layering on dark backgrounds
- Form input focus rings
- Dividers inside a single card (use `rgba(255,255,255,0.07)` on dark, `rgba(108,124,136,0.12)` on light)

---

## Component Patterns

### Eyebrow Badge
Small uppercase label to introduce a section.
```css
display: inline-flex; align-items: center; gap: 0.6rem;
padding: 0.45rem 0.8rem; border-radius: 999px;
background: rgba(255,255,255,0.1);  /* on dark */
/* OR */
background: rgba(255,255,255,0.8);  /* on light */
color: var(--primary-dark); font-size: 10px;
font-weight: 700; letter-spacing: 0.20em; text-transform: uppercase;
```
Optionally prefix with a glowing dot (`accent-dot`).

### Accent Dot
```css
width: 0.38rem; height: 0.38rem; border-radius: 999px;
background: var(--primary-dark);
box-shadow: 0 0 0 5px rgba(69,98,118,0.10);
```

### Primary Button
```css
background: linear-gradient(135deg, #456276 0%, #2c4350 100%);
box-shadow: 0 10px 28px rgba(44,67,80,0.24);
color: white; border-radius: 1rem; min-height: 3.25rem;
font-weight: 600; font-size: 14px;
/* hover */
transform: translateY(-1px);
box-shadow: 0 14px 32px rgba(44,67,80,0.30);
```

### Secondary Button
```css
background: white; border: 1px solid rgba(95,116,130,0.18);
color: var(--primary-dark); border-radius: 1rem; min-height: 3.25rem;
```

### Glass Panel (light)
```css
background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90));
border: 1px solid rgba(255,255,255,0.72);
box-shadow: 0 18px 40px rgba(15,23,42,0.06);
backdrop-filter: blur(8px);
```

### Surface Card (flat, on #f1f4f6 background)
```css
background: white; border-radius: 1rem;  /* no border */
```
Use `padding: 1rem 1.25rem` for compact, `padding: 1.25rem 1.5rem` for standard.

### Frosted Feature Card (on dark gradient)
```css
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 1rem;
```

### Form Input
```css
width: 100%; min-height: 3rem; padding: 0.85rem 1rem;
border-radius: 0.875rem; border: 1px solid rgba(95,116,130,0.18);
background: rgba(255,255,255,0.98); color: var(--text-main);
/* focus */
outline: none;
box-shadow: 0 0 0 3px rgba(69,98,118,0.14), 0 0 0 1px rgba(44,67,80,0.32);
border-color: transparent;
```

### Biological Progress Bar
Used to visualize trait/facet scores.
```css
/* Track */
height: 4px; border-radius: 999px;
background: rgba(255,255,255,0.09); /* on dark */
/* OR */
background: rgba(108,124,136,0.12); /* on light */

/* Fill — color per dimension */
height: 100%; border-radius: 999px;
background: hsl(HUE, 60%, 68%); /* on dark */
/* OR */
background: hsl(HUE, 55%, 52%); /* on light */
box-shadow: 0 0 5px hsl(HUE, 60%, 68%);
```

OCEAN hues: O=210, C=38, E=158, A=268, N=348

### Factor Medallion
```css
display: inline-grid; place-items: center;
width: 2.5rem; height: 2.5rem; border-radius: 999px;
background: linear-gradient(145deg, #fff, #f1f5f7);
border: 1px solid rgba(95,116,130,0.16);
color: var(--primary-dark); font-weight: 700; font-size: 1rem;
box-shadow: inset 0 1px 0 rgba(255,255,255,0.86);
```

### Notice / Alert
```css
display: flex; align-items: flex-start; gap: 0.625rem;
padding: 0.875rem 1rem; border-radius: 1rem;
background: rgba(COLOR, 0.07); /* no border */
```

---

## Layout Patterns

### Page Shell
```css
min-height: 100vh;
background: #e8ecef; /* --surface-page */
```
Add `lg:flex lg:items-center lg:justify-center lg:p-8` for centered checkout/auth pages.

### Standard Page (content pages)
```
padding: 1.25rem 1rem 2.5rem (mobile)
padding: 1.5rem 1.5rem 3rem  (sm+)
max-width: 76rem; margin: 0 auto;
```

### Split-Screen (checkout / landing upgrade)
Two columns: **left = value-prop gradient**, **right = action panel**.
```
Mobile/tablet: stacked (gradient → light)
Desktop (lg): side-by-side flex
  left: flex-[3], gradient bg
  right: flex-[2], white bg
Outer card: max-w-5xl, rounded-[2rem], overflow-hidden, shadow-xl
```

### Centered Card (auth / simple forms)
```
max-w-md (440px), mx-auto
glass-panel, rounded-[2rem], px-6 py-10 (sm: px-10)
```

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| default | <640px | Single column, full-width panels, compact padding |
| `sm:` | ≥640px | More padding (`px-10`, `py-12`), slightly larger type |
| `md:` | ≥768px | Two-column grids where appropriate |
| `lg:` | ≥1024px | Split-screen layouts, floating cards with shadow |

---

## Motion & Interaction

```css
/* Default transition on interactive elements */
transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, opacity 180ms ease;

/* Hover lift */
transform: translateY(-1px);

/* Loading spinner */
animation: spin 1s linear infinite;

/* Loading progress bar */
animation: loading-slide 1.5s ease-in-out infinite;
```

No aggressive animations. Interactions should feel precise and calm.

---

## Accessibility

- All icon-only elements have `aria-hidden="true"`
- Interactive elements have `:focus-visible` ring: `0 0 0 3px rgba(69,98,118,0.16), 0 0 0 1px rgba(44,67,80,0.36)`
- Skip-to-main link on all pages
- Color contrast: all body text meets WCAG AA on their respective surfaces
- Minimum touch target: 44×44px for buttons, 48px preferred

---

## Voice & Copy

- **Eyebrow labels**: ALLCAPS, technical, English abbreviations fine (IPIP-NEO, AI, OCEAN)
- **Headlines**: Thai, warm but precise — "รู้จักตัวเอง" not "ค้นพบตัวคุณ"
- **Body text**: Thai, clear, avoid jargon — explain technical terms in parentheses
- **Numbers**: Always tabular-nums, use `,` separator for thousands
- **Prices**: `฿49` format, no space between symbol and amount

---

## Do's and Don'ts

| Do | Don't |
|:---|:------|
| Use generous spacing (`spacing-12` / `spacing-16`) to let the layout breathe | Don't crowd data — if it feels tight, double the spacing |
| Use tonal background shifts for structural separation | Don't use 1px solid borders to divide sections |
| Use `--font-display` (Noto Serif Thai) for large Thai headlines | Don't use overly rounded corners — stay at `0.75rem`+ on cards |
| Apply 4–6% opacity ambient shadows only for floating elements | Don't use default drop shadows or high-opacity blacks |
| Use "Ghost Borders" (`rgba(95,116,130,0.15)`) only for subtle accessibility affordances | Don't use high-contrast dividers between list items |
| Use CSS variables or inline `style={{}}` for all brand colors | Don't use Tailwind color utilities for brand colors |

**Always avoid:**
- Emoji in UI chrome (eyebrows, buttons, nav labels) — use SVG icons instead
- Pure black text — use `#1a3040` / `--text-main`
- `box-shadow` on text
- `border-radius` below `0.75rem` on cards or panels
