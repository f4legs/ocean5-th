# แบบทดสอบบุคลิกภาพ 5 มิติ (OCEAN)

Thai-language Big Five personality test with AI-powered personalized results, built with Next.js and Google Gemini.

**Live demo:** _[your Vercel URL here]_

---

## Features

- **50 คำถาม** — adapted from the Thai IPIP NEO Domains translation (Yomaboot & Cooper)
- **5 มิติบุคลิกภาพ** — Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Stability
- **AI วิเคราะห์เชิงลึก** — Google Gemini generates a personalized Thai-language personality report
- **ข้อมูลส่วนตัวเสริม** — optional age, sex, occupation, goal for more tailored insights
- **ไม่มีการจัดเก็บข้อมูล** — all processing is client-side; no personal data is stored

---

## Dimensions (OCEAN)

| มิติ | ชื่อไทย | ความหมาย |
|------|---------|----------|
| **O** | การเปิดรับประสบการณ์ | จินตนาการ ความคิดสร้างสรรค์ ความชอบสิ่งใหม่ |
| **C** | ความรับผิดชอบ | ความมีระเบียบ ความขยัน ความมุ่งมั่น |
| **E** | ความเปิดเผย | ความชอบเข้าสังคม ความมีชีวิตชีวา |
| **A** | ความเป็นมิตร | ความใจดี ความร่วมมือ ความไว้วางใจ |
| **N** | ความมั่นคงทางอารมณ์ | ความสามารถรับมือกับความเครียด |

---

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Google Gemini API** (`gemini-2.0-flash`) — server-side via Next.js API route
- **localStorage** — client-side answer storage, no backend database

---

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key — get one at [aistudio.google.com](https://aistudio.google.com)

### Local Development

```bash
# Clone the repo
git clone https://github.com/f4legs/ocean5-th.git
cd ocean5-th

# Install dependencies
npm install

# Set up environment variable
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
ocean5-th/
├── app/
│   ├── page.tsx              # Landing page
│   ├── quiz/page.tsx         # 50-item quiz (10 items × 5 pages)
│   ├── profile/page.tsx      # Optional personal info form
│   ├── results/page.tsx      # Score bars + AI report
│   └── api/interpret/route.ts  # Gemini API endpoint
├── lib/
│   ├── items.ts              # 50 Thai IPIP items with scoring key
│   └── scoring.ts            # Big Five scoring logic
```

---

## Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. In **Project Settings → Environment Variables**, add:
   ```
   GEMINI_API_KEY = your_gemini_api_key
   ```
4. Deploy — every `git push` to `main`/`master` auto-deploys

---

## Scoring

Each dimension is scored from 10 items on a 5-point Likert scale (1–5).
Reverse-scored items are calculated as `6 − response`. Final score range: **10–50** per dimension.

The percentage shown is: `(score − 10) / 40 × 100`

---

## Source & License

This app is based on the **International Personality Item Pool (IPIP)** and references the Thai IPIP NEO Domains translation by **Panida Yomaboot & Dr. Andrew J. Cooper**:

- Main source: [ipip.ori.org](https://ipip.ori.org)
- Thai translation page: [Thai50-itemNEO-PI-R-Domains.htm](https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm)

The IPIP website states that its items and scales are in the public domain. That public-domain status applies to the IPIP questionnaire materials, not to this app's original code, interface, explanatory copy, or reporting flow.

Copyright for app-specific material:

`© 2026 fars-ai / FARS-AI Cognitive Science Team. All rights reserved where applicable.`

This repository includes a local adaptation of the Thai questionnaire wording for two items, so it should be described as an IPIP-based implementation rather than an official IPIP deployment.
