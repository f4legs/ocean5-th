import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { FACET_NAMES } from '@/lib/scoring120'

export const maxDuration = 300

// Same rate limiting pattern as /api/interpret
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

function sanitize(s: string | null | undefined, maxLen = 100): string | null {
  if (!s) return null
  return s.replace(/[^\p{L}\p{N}\s.,\-()]/gu, '').slice(0, maxLen).trim() || null
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 })
  }

  const body = await req.json()
  const { domainScores, facetScores, profile, testType } = body as {
    domainScores: Record<string, number>
    facetScores: Record<string, { pct: number }>
    profile?: { age?: string; sex?: string; occupation?: string; goal?: string }
    testType: '120' | '300'
  }

  // Validate domain scores
  for (const key of ['E', 'A', 'C', 'N', 'O']) {
    const val = domainScores?.[key]
    if (typeof val !== 'number' || !isFinite(val) || val < 0 || val > 100) {
      return NextResponse.json({ error: `Invalid domain score for ${key}` }, { status: 400 })
    }
  }

  const age = sanitize(profile?.age, 3)
  const sex = sanitize(profile?.sex, 10)
  const occupation = sanitize(profile?.occupation, 80)
  const goal = sanitize(profile?.goal, 80)

  const profileLines = [
    age ? `- อายุ: ${age} ปี` : null,
    sex ? `- เพศ: ${sex}` : null,
    occupation ? `- อาชีพ: ${occupation}` : null,
    goal ? `- วัตถุประสงค์: ${goal}` : null,
  ].filter(Boolean).join('\n')

  // Build facet scores section
  const facetLines = Object.entries(FACET_NAMES)
    .map(([code, name]) => {
      const score = facetScores?.[code]?.pct
      return score !== undefined ? `- ${name} (${code}): ${Math.round(score)}%` : null
    })
    .filter(Boolean)
    .join('\n')

  const prompt = `You are an expert clinical psychologist specializing in NEO-PI-R facet-level assessment. DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.

ผลการทดสอบ OCEAN เชิงลึก (${testType} ข้อ, IPIP-NEO):

**มิติหลัก:**
- การเปิดรับประสบการณ์ (O): ${domainScores.O}%
- ความรับผิดชอบ (C): ${domainScores.C}%
- ความเปิดเผย (E): ${domainScores.E}%
- ความเป็นมิตร (A): ${domainScores.A}%
- ความไม่มั่นคงทางอารมณ์ (N): ${domainScores.N}%

**ลักษณะย่อย 30 ด้าน:**
${facetLines}

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานบุคลิกภาพเชิงลึกในภาษาไทย 2,000–2,500 คำ โดยใช้ทั้ง 30 ลักษณะย่อยเป็นฐานการวิเคราะห์ จัดโครงสร้างดังนี้:

## ภาพรวมบุคลิกภาพ
สรุปบุคลิกภาพจากรูปแบบคะแนนทั้งหมด โดยเน้นการผสมผสานระหว่างมิติและลักษณะย่อยที่สร้างรูปแบบเฉพาะตัว

## วิเคราะห์เชิงลึกแต่ละมิติพร้อมลักษณะย่อยที่โดดเด่น
วิเคราะห์ 5 มิติ โดยแต่ละมิติให้เน้นลักษณะย่อยที่มีคะแนนสูงหรือต่ำผิดปกติ อธิบายว่าการผสมผสานของลักษณะย่อยนั้นส่งผลต่อพฤติกรรมและความคิดอย่างไร

## ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
วิเคราะห์ว่าลักษณะย่อยด้าน Agreeableness, Extraversion และ Neuroticism ร่วมกันสร้างรูปแบบความสัมพันธ์และการสื่อสารอย่างไร

## จุดแข็งที่ซ่อนอยู่และโอกาสพัฒนา
วิเคราะห์จากการปฏิสัมพันธ์ระหว่างลักษณะย่อย เช่น C5 (Self-Discipline) สูง แต่ N5 (Immoderation) ก็สูงด้วย — ความขัดแย้งภายในนี้หมายความว่าอะไร

## แนวทางอาชีพและการใช้ชีวิต
ระบุสภาพแวดล้อมและบทบาทที่เหมาะกับโปรไฟล์ลักษณะย่อยนี้โดยเฉพาะ${occupation ? ` วิเคราะห์ความสอดคล้องกับอาชีพ "${occupation}"` : ''}

## คำแนะนำพัฒนาตนเอง 5–7 ข้อ
แต่ละข้อต้องอ้างอิงลักษณะย่อยเฉพาะที่เกี่ยวข้อง และให้แนวทางปฏิบัติที่เป็นรูปธรรม${goal ? ` เชื่อมโยงกับเป้าหมาย "${goal}"` : ''}`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const genStream = ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of await genStream) {
            controller.enqueue(encoder.encode(chunk.text ?? ''))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
