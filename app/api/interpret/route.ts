import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Simple in-memory rate limiter: max 5 requests per 10 minutes per IP
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
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

  const prompt = `คุณเป็นนักจิตวิทยาผู้เชี่ยวชาญด้านบุคลิกภาพ Big Five ที่มีความเชี่ยวชาญในการอธิบายผลเป็นภาษาไทยอย่างละเอียด อบอุ่น และสร้างแรงบันดาลใจ

ผลการทดสอบบุคลิกภาพ OCEAN (สูง = มีลักษณะมาก, ต่ำ = มีลักษณะน้อย):
- การเปิดรับประสบการณ์ (Openness / O): ${scores.O}%
- ความรับผิดชอบ (Conscientiousness / C): ${scores.C}%
- ความเปิดเผย (Extraversion / E): ${scores.E}%
- ความเป็นมิตร (Agreeableness / A): ${scores.A}%
- ความไม่มั่นคงทางอารมณ์ (Neuroticism / N): ${scores.N}% (สูง = อ่อนไหวต่อความเครียดมาก)

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานวิเคราะห์บุคลิกภาพที่ครอบคลุมและเป็นประโยชน์เป็นภาษาไทย โดยจัดโครงสร้างดังนี้:

## ภาพรวมบุคลิกภาพ
สรุปภาพรวมบุคลิกภาพจากคะแนนทั้ง 5 มิติ อธิบายว่าบุคคลนี้เป็นคนแบบไหนในชีวิตประจำวัน

## วิเคราะห์รายมิติ
วิเคราะห์แต่ละมิติโดยละเอียด ระบุจุดแข็ง โอกาสพัฒนา และลักษณะที่โดดเด่น

## ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
อธิบายว่าบุคลิกภาพนี้ส่งผลต่อความสัมพันธ์และการทำงานร่วมกับผู้อื่นอย่างไร

## แนวทางอาชีพและสภาพแวดล้อมที่เหมาะสม
ระบุประเภทงานและสภาพแวดล้อมการทำงานที่เหมาะกับบุคลิกภาพนี้${occupation ? ` โดยเชื่อมโยงกับอาชีพ ${occupation} ด้วย` : ''}

## คำแนะนำการพัฒนาตนเอง
ให้คำแนะนำที่เป็นรูปธรรม 4–5 ข้อ สำหรับการพัฒนาจุดอ่อนและเสริมจุดแข็ง

ใช้ภาษากระชับ เป็นกันเอง ให้กำลังใจ และอิงจากหลักจิตวิทยา ห้ามใช้ภาษาเชิงลบหรือตัดสินคุณค่าของบุคคล`

  // Abort if Gemini hangs beyond 30 seconds
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    })

    const result = await model.generateContent(prompt)
    clearTimeout(timeout)
    const text = result.response.text()
    return NextResponse.json({ report: text })
  } catch (err) {
    clearTimeout(timeout)
    if ((err as Error).name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout — กรุณาลองใหม่อีกครั้ง' }, { status: 504 })
    }
    console.error('Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
