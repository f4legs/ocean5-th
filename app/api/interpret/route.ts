import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'

export const maxDuration = 300 // seconds — requires Vercel Pro or higher

// Simple in-memory rate limiter: max 5 requests per 10 minutes per IP
// NOTE: On serverless (Vercel), each instance has its own Map — this is best-effort only.
// For production-grade rate limiting, use Upstash or Vercel's built-in rate limits.
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

// Sanitize profile text: keep Thai, Latin, digits, and basic punctuation; max length
function sanitize(s: string | null | undefined, maxLen = 100): string | null {
  if (!s) return null
  return s.replace(/[^\p{L}\p{N}\s.,\-()]/gu, '').slice(0, maxLen).trim() || null
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  // Rate limiting by IP
  // Prefer x-real-ip (set by Vercel, not spoofable) over x-forwarded-for
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
      { status: 429 }
    )
  }

  let body: { scores?: unknown; profile?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scores, profile } = body as {
    scores: Record<string, number>
    profile: { age?: string; sex?: string; occupation?: string; goal?: string }
  }

  // Validate scores: all 5 factors must be numbers in range 0–100
  for (const key of ['E', 'A', 'C', 'N', 'O']) {
    const val = scores?.[key]
    if (typeof val !== 'number' || !isFinite(val) || val < 0 || val > 100) {
      return NextResponse.json({ error: `Invalid score for ${key}` }, { status: 400 })
    }
  }

  // Sanitize profile fields to prevent prompt injection
  const age = sanitize(profile?.age, 3)
  const sex = sanitize(profile?.sex, 10)
  const occupation = sanitize(profile?.occupation, 80)
  const goal = sanitize(profile?.goal, 80)

  const profileLines = [
    age        ? `- อายุ: ${age} ปี` : null,
    sex        ? `- เพศ: ${sex}` : null,
    occupation ? `- อาชีพ: ${occupation}` : null,
    goal       ? `- วัตถุประสงค์: ${goal}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are an expert clinical psychologist specializing in Big Five / Five-Factor Model personality assessment with deep knowledge of NEO-PI-R facet-level interpretation, cross-dimensional interaction patterns, and vocational psychology research but DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.
Output valid GitHub-flavored Markdown only. Do not wrap the entire response in triple backticks.

ผลการทดสอบบุคลิกภาพ OCEAN จากแบบทดสอบ IPIP-NEO 50 ข้อ (คะแนนเป็น percentile — สูง = มีลักษณะมาก, ต่ำ = มีลักษณะน้อย):
- การเปิดรับประสบการณ์ (Openness / O): ${scores.O}%
- ความรับผิดชอบ (Conscientiousness / C): ${scores.C}%
- ความเปิดเผย (Extraversion / E): ${scores.E}%
- ความเป็นมิตร (Agreeableness / A): ${scores.A}%
- ความไม่มั่นคงทางอารมณ์ (Neuroticism / N): ${scores.N}% (สูง = อ่อนไหวต่อความเครียดมาก)

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานวิเคราะห์บุคลิกภาพอย่างละเอียดและเป็นประโยชน์เป็นภาษาไทย โดยพิจารณาจากรูปแบบคะแนนทั้ง 5 มิติร่วมกัน${profileLines ? ' และบริบทของผู้ทดสอบ' : ''} เพื่ออนุมานลักษณะเชิงลึกในแต่ละด้าน จัดโครงสร้างดังนี้:

## ภาพรวมบุคลิกภาพ
สรุปบุคลิกภาพจากรูปแบบคะแนนทั้ง 5 มิติรวมกัน อธิบายว่าบุคคลนี้เป็นคนแบบไหนในชีวิตประจำวัน เน้นการ **ผสมผสานระหว่างมิติ** ที่สร้างลักษณะเฉพาะตัว (เช่น O สูง + C สูง = คนสร้างสรรค์ที่มีวินัย, E ต่ำ + A สูง = คนอบอุ่นแต่ชอบอยู่เงียบๆ)

## วิเคราะห์รายมิติเชิงลึก
วิเคราะห์แต่ละมิติอย่างละเอียด โดย **อนุมานลักษณะด้านย่อย (facets)** ที่น่าจะเด่นชัดจากระดับคะแนนและบริบท ตัวอย่าง:
- Extraversion: ความเป็นกันเอง (Friendliness), ความชอบสังคม (Gregariousness), ความกล้าแสดงออก (Assertiveness), ระดับพลังงาน (Activity Level), การแสวงหาความตื่นเต้น (Excitement-Seeking), อารมณ์เชิงบวก (Cheerfulness)
- Agreeableness: ความไว้วางใจ (Trust), ความจริงใจ (Morality), ความเอื้อเฟื้อ (Altruism), ความร่วมมือ (Cooperation), ความถ่อมตน (Modesty), ความเห็นอกเห็นใจ (Sympathy)
- Conscientiousness: ความมั่นใจในตัวเอง (Self-Efficacy), ความเป็นระเบียบ (Orderliness), ความรับผิดชอบต่อหน้าที่ (Dutifulness), ความมุ่งมั่น (Achievement-Striving), วินัยในตนเอง (Self-Discipline), ความรอบคอบ (Cautiousness)
- Neuroticism: ความวิตกกังวล (Anxiety), ความโกรธ (Anger), ภาวะซึมเศร้า (Depression), ความเก้อเขิน (Self-Consciousness), ความหุนหันพลันแล่น (Immoderation), ความเปราะบาง (Vulnerability)
- Openness: จินตนาการ (Imagination), ความสนใจศิลปะ (Artistic Interests), อารมณ์ร่วม (Emotionality), ความชอบผจญภัย (Adventurousness), สติปัญญา (Intellect), ความเปิดกว้างต่อค่านิยม (Liberalism)

ไม่ต้องวิเคราะห์ทุก facet — เลือกเฉพาะที่เด่นชัดและสอดคล้องกับรูปแบบคะแนน ระบุจุดแข็งและโอกาสพัฒนาในแต่ละมิติ

## รูปแบบความสัมพันธ์และการทำงานร่วมกับผู้อื่น
อธิบายว่าการผสมผสานของบุคลิกภาพนี้ส่งผลต่อรูปแบบความสัมพันธ์ การสื่อสาร และการทำงานเป็นทีมอย่างไร รวมถึงบุคลิกภาพแบบไหนที่จะเข้ากันได้ดีหรือเป็นความท้าทาย

## แนวทางอาชีพและสภาพแวดล้อมที่เหมาะสม
ระบุประเภทงาน สภาพแวดล้อม และวัฒนธรรมองค์กรที่เหมาะกับบุคลิกภาพนี้${occupation ? ` โดยวิเคราะห์ว่าอาชีพ "${occupation}" สอดคล้องหรือท้าทายบุคลิกภาพนี้อย่างไร` : ''} อ้างอิงงานวิจัยด้าน vocational psychology (เช่น Holland's RIASEC) ตามความเหมาะสม

## จุดแข็งที่ซ่อนอยู่และจุดที่ควรระวัง
วิเคราะห์ลักษณะที่เกิดจากการ **ปฏิสัมพันธ์ระหว่างมิติ** ที่อาจไม่เห็นจากคะแนนแต่ละมิติเดี่ยวๆ เช่น ความเสี่ยงต่อ burnout, แนวโน้มการตัดสินใจ, รูปแบบการรับมือกับความเครียด

## คำแนะนำการพัฒนาตนเอง
ให้คำแนะนำที่เป็นรูปธรรมและนำไปปฏิบัติได้ 5–6 ข้อ${goal ? ` โดยเชื่อมโยงกับเป้าหมาย "${goal}"` : ''} สำหรับการพัฒนาจุดที่ควรระวังและเสริมจุดแข็ง แนะนำเทคนิคหรือแนวทางเฉพาะเจาะจง

เขียนอย่างละเอียดแต่อ่านง่าย ใช้ภาษาเป็นกันเอง ให้กำลังใจ อิงจากหลักจิตวิทยา ห้ามใช้ภาษาเชิงลบหรือตัดสินคุณค่าของบุคคล ความยาวรวมประมาณ 1,500–2,000 คำ`

  try {
    const ai = new GoogleGenAI({ apiKey })

    const genStream = ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
      },
    })

    const encoder = new TextEncoder()
    const body = new ReadableStream({
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

    return new Response(body, {
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
