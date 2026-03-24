import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createClient } from '@supabase/supabase-js'
import { FACET_NAMES } from '@/lib/scoring120'

export const maxDuration = 300

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

const METHODS: Record<string, string> = {
  general: 'วิเคราะห์ภาพรวมความเหมือนและความต่างของบุคลิกภาพทั้งสองคน',
  relationship: 'วิเคราะห์ความเข้ากันได้ในความสัมพันธ์ส่วนตัว ความรัก หรือมิตรภาพ',
  teamwork: 'วิเคราะห์การทำงานร่วมกัน จุดเสริมและจุดขัดแย้งในสภาพแวดล้อมการทำงาน',
  strengths: 'วิเคราะห์จุดแข็งและจุดอ่อนที่เสริมกัน และแนะนำวิธีเติมเต็มซึ่งกันและกัน',
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const accessToken = authHeader.slice(7)

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 })
  }

  // Verify user via their access token
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { profileAId, profileBId, method = 'general' } = body as {
    profileAId: string
    profileBId: string
    method?: string
  }

  if (!profileAId || !profileBId) {
    return NextResponse.json({ error: 'profileAId and profileBId are required' }, { status: 400 })
  }

  const methodLabel = METHODS[method] ?? METHODS.general

  // Fetch both profiles, verifying ownership
  const { data: profiles, error: dbError } = await userClient
    .from('ocean_profiles')
    .select('id, label, test_type, scores')
    .in('id', [profileAId, profileBId])
    .eq('owner_id', user.id)

  if (dbError || !profiles || profiles.length < 2) {
    return NextResponse.json({ error: 'Profiles not found or access denied' }, { status: 404 })
  }

  const profA = profiles.find((p: { id: string }) => p.id === profileAId)
  const profB = profiles.find((p: { id: string }) => p.id === profileBId)
  if (!profA || !profB) {
    return NextResponse.json({ error: 'One or both profiles not found' }, { status: 404 })
  }

  const scoresA = profA.scores as { pct: Record<string, number>; facets?: Record<string, { pct: number }> }
  const scoresB = profB.scores as { pct: Record<string, number>; facets?: Record<string, { pct: number }> }

  const domainKeys = ['O', 'C', 'E', 'A', 'N']

  function buildDomainBlock(label: string, pct: Record<string, number>): string {
    return `**${label}:**\n` + domainKeys.map(k => {
      const names: Record<string, string> = {
        O: 'การเปิดรับประสบการณ์ (O)',
        C: 'ความรับผิดชอบ (C)',
        E: 'ความเปิดเผย (E)',
        A: 'ความเป็นมิตร (A)',
        N: 'ความไม่มั่นคงทางอารมณ์ (N)',
      }
      return `- ${names[k]}: ${Math.round(pct[k] ?? 0)}%`
    }).join('\n')
  }

  const blockA = buildDomainBlock(profA.label, scoresA.pct)
  const blockB = buildDomainBlock(profB.label, scoresB.pct)

  // Delta section
  const deltaLines = domainKeys.map(k => {
    const a = Math.round(scoresA.pct[k] ?? 0)
    const b = Math.round(scoresB.pct[k] ?? 0)
    const diff = b - a
    return `- ${k}: ${a}% vs ${b}% (Δ ${diff >= 0 ? '+' : ''}${diff})`
  }).join('\n')

  // Facet comparison — only when both profiles have facet data
  let facetSection = ''
  if (scoresA.facets && scoresB.facets) {
    const facetLines = Object.entries(FACET_NAMES).map(([code, name]) => {
      const a = Math.round(scoresA.facets![code]?.pct ?? 0)
      const b = Math.round(scoresB.facets![code]?.pct ?? 0)
      const diff = b - a
      return `- ${name} (${code}): ${a}% vs ${b}% (Δ ${diff >= 0 ? '+' : ''}${diff})`
    }).join('\n')
    facetSection = `\n\n**ลักษณะย่อย 30 ด้าน (${profA.label} vs ${profB.label}):**\n${facetLines}`
  }

  const tierA = profA.test_type
  const tierB = profB.test_type

  const prompt = `You are an expert psychologist specializing in Big Five personality comparison and interpersonal dynamics. DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.

เปรียบเทียบบุคลิกภาพ OCEAN ระหว่างสองบุคคล:
- ${profA.label} (แบบทดสอบ ${tierA} ข้อ)
- ${profB.label} (แบบทดสอบ ${tierB} ข้อ)

วัตถุประสงค์การวิเคราะห์: ${methodLabel}

${blockA}

${blockB}

**ความต่างคะแนนมิติหลัก (${profA.label} vs ${profB.label}):**
${deltaLines}${facetSection}

กรุณาเขียนรายงานการเปรียบเทียบบุคลิกภาพในภาษาไทย 1,500–2,000 คำ โดยมีโครงสร้างดังนี้:

## ภาพรวมความเหมือนและความต่าง
วิเคราะห์รูปแบบโดยรวม — มิติใดที่คล้ายกัน มิติใดที่แตกต่างมาก และความต่างนี้มีความหมายอย่างไร

## วิเคราะห์เชิงลึกตามวัตถุประสงค์
${methodLabel} — วิเคราะห์โดยละเอียดว่าการผสมผสานบุคลิกภาพนี้จะส่งผลอย่างไรในบริบทที่ระบุ

## จุดเสริมกัน (Complementary Strengths)
ระบุว่าความต่างใดที่เป็นจุดแข็งที่เติมเต็มกัน และทำให้ทั้งคู่แข็งแกร่งขึ้นเมื่ออยู่ด้วยกัน

## จุดที่อาจขัดแย้ง (Potential Friction Points)
ระบุมิติที่แตกต่างมากที่สุดและอธิบายว่าอาจเกิดความขัดแย้งหรือความเข้าใจผิดในสถานการณ์ใด

## แนวทางสร้างความสัมพันธ์ที่ดี
คำแนะนำปฏิบัติ 4–5 ข้อที่ทั้งสองฝ่ายสามารถนำไปใช้ เพื่อใช้ประโยชน์จากจุดเสริมกันและลดจุดขัดแย้ง`

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
    return NextResponse.json({ error: 'Failed to generate comparison' }, { status: 500 })
  }
}
