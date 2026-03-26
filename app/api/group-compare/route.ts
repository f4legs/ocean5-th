import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createClient } from '@supabase/supabase-js'
import { type Factor } from '@/lib/ocean-constants'
import { computeGroupDynamics } from '@/lib/group-dynamics'

export const maxDuration = 300

const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 4
const RATE_WINDOW_MS = 10 * 60 * 1000
const MAX_GROUP_SIZE = 12

const METHODS: Record<string, string> = {
  teamwork: 'ประสิทธิภาพการทำงานร่วมกันในทีม (Teamwork)',
  leadership: 'ภาวะผู้นำ การตัดสินใจ และการกระจายบทบาท (Leadership)',
  innovation: 'นวัตกรรม การคิดใหม่ และการทดลอง (Innovation)',
  risk: 'ความเสี่ยง จุดเปราะบาง และแผนป้องกันความขัดแย้ง (Risk)',
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count += 1
  return false
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = average(values)
  const variance = average(values.map(value => (value - mean) ** 2))
  return Math.sqrt(variance)
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

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as { profileIds?: string[]; method?: string } | null
  const profileIds = Array.isArray(body?.profileIds) ? body?.profileIds : []
  const method = body?.method ?? 'teamwork'

  const uniqueIds = [...new Set(profileIds.filter(id => typeof id === 'string' && id.trim()))]
  if (uniqueIds.length < 3) {
    return NextResponse.json({ error: 'ต้องเลือกอย่างน้อย 3 โปรไฟล์' }, { status: 400 })
  }
  if (uniqueIds.length > MAX_GROUP_SIZE) {
    return NextResponse.json({ error: `เลือกได้สูงสุด ${MAX_GROUP_SIZE} โปรไฟล์ต่อครั้ง` }, { status: 400 })
  }

  const methodLabel = METHODS[method] ?? METHODS.teamwork

  const { data: profiles, error: dbError } = await userClient
    .from('ocean_profiles')
    .select('id, label, test_type, scores')
    .in('id', uniqueIds)
    .eq('owner_id', user.id)

  if (dbError || !profiles || profiles.length !== uniqueIds.length) {
    return NextResponse.json({ error: 'Profiles not found or access denied' }, { status: 404 })
  }

  type ProfileRow = {
    id: string
    label: string
    test_type: string
    scores: { pct: Record<Factor, number> }
  }

  const profileMap = new Map((profiles as ProfileRow[]).map(profile => [profile.id, profile]))
  const orderedProfiles = uniqueIds.map(id => profileMap.get(id)).filter((profile): profile is ProfileRow => Boolean(profile))

  const domainKeys: Factor[] = ['O', 'C', 'E', 'A', 'N']
  const domainNames: Record<Factor, string> = {
    O: 'การเปิดรับประสบการณ์ (O)',
    C: 'ความรับผิดชอบ (C)',
    E: 'ความเปิดเผย (E)',
    A: 'ความเป็นมิตร (A)',
    N: 'ความไม่มั่นคงทางอารมณ์ (N)',
  }

  const domainAverages: Record<Factor, number> = {
    O: average(orderedProfiles.map(profile => profile.scores?.pct?.O ?? 0)),
    C: average(orderedProfiles.map(profile => profile.scores?.pct?.C ?? 0)),
    E: average(orderedProfiles.map(profile => profile.scores?.pct?.E ?? 0)),
    A: average(orderedProfiles.map(profile => profile.scores?.pct?.A ?? 0)),
    N: average(orderedProfiles.map(profile => profile.scores?.pct?.N ?? 0)),
  }

  const domainSpread: Record<Factor, number> = {
    O: standardDeviation(orderedProfiles.map(profile => profile.scores?.pct?.O ?? 0)),
    C: standardDeviation(orderedProfiles.map(profile => profile.scores?.pct?.C ?? 0)),
    E: standardDeviation(orderedProfiles.map(profile => profile.scores?.pct?.E ?? 0)),
    A: standardDeviation(orderedProfiles.map(profile => profile.scores?.pct?.A ?? 0)),
    N: standardDeviation(orderedProfiles.map(profile => profile.scores?.pct?.N ?? 0)),
  }

  const groupMetrics = computeGroupDynamics(
    orderedProfiles.map(profile => ({
      id: profile.id,
      label: profile.label,
      pct: profile.scores?.pct ?? { O: 0, C: 0, E: 0, A: 0, N: 0 },
    }))
  )

  const membersBlock = orderedProfiles.map((profile, index) => {
    const pct = profile.scores?.pct ?? { O: 0, C: 0, E: 0, A: 0, N: 0 }
    return `${index + 1}. ${profile.label} (${profile.test_type} ข้อ)
- O: ${Math.round(pct.O ?? 0)}% | C: ${Math.round(pct.C ?? 0)}% | E: ${Math.round(pct.E ?? 0)}% | A: ${Math.round(pct.A ?? 0)}% | N: ${Math.round(pct.N ?? 0)}%`
  }).join('\n\n')

  const summaryBlock = domainKeys.map(key => (
    `- ${domainNames[key]}: ค่าเฉลี่ย ${Math.round(domainAverages[key])}% | ความหลากหลาย (SD) ${domainSpread[key].toFixed(1)}`
  )).join('\n')

  const deterministicBlock = groupMetrics
    ? `- Team Balance Index: ${groupMetrics.teamBalanceIndex.score}% (${groupMetrics.teamBalanceIndex.label})
- Execution Strength: ${groupMetrics.executionStrength.score}% (${groupMetrics.executionStrength.label})
- Innovation Pivot: ${groupMetrics.innovationPivot.score}% (${groupMetrics.innovationPivot.label})
- Social Cohesion: ${groupMetrics.socialCohesion.score}% (${groupMetrics.socialCohesion.label})`
    : '- Team metrics unavailable'

  const prompt = `You are an expert psychologist specializing in Big Five team dynamics. DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.

วิเคราะห์กลุ่มจากข้อมูล OCEAN ทั้งหมด ${orderedProfiles.length} คน

วัตถุประสงค์หลัก: ${methodLabel}

สมาชิกในกลุ่ม:
${membersBlock}

สรุปสถิติกลุ่ม (domain-level):
${summaryBlock}

ดัชนีเชิงคำนวณ (deterministic):
${deterministicBlock}

กรุณาเขียนรายงานวิเคราะห์กลุ่ม 1,200–1,700 คำ โดยใช้โครงสร้างนี้:

## ภาพรวมวัฒนธรรมทีม
อธิบายลักษณะพลังงานรวมของทีมจาก OCEAN ทั้ง 5 มิติ

## จุดแข็งเชิงระบบของทีม
ระบุ 4–6 จุดแข็งที่เห็นได้จริงจากการผสมบุคลิกในทีม

## จุดบอดและความเสี่ยงเชิงพฤติกรรม
ระบุความเสี่ยงหลัก 3–5 ข้อ พร้อมสถานการณ์ที่อาจเกิดขึ้นจริง

## แผนการทำงานร่วมกันที่แนะนำ
เสนอแนวทางปฏิบัติที่ชัดเจน 6–8 ข้อ โดยโยงกับพฤติกรรมในทีม

## บทบาทแนะนำในทีม (Role Suggestions)
เสนอแนวทางจัดบทบาทคนในทีมแบบไม่ตัดสิน ไม่ตีตรา แต่ใช้งานได้จริง

## Action Plan 30 วัน
เสนอแผนปฏิบัติการ 3 ระยะ (สัปดาห์ 1, 2, 3-4) ที่นำไปใช้ได้จริง`

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
            const text = chunk.text ?? ''
            if (text) controller.enqueue(encoder.encode(text))
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
    console.error('Group dynamics Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to generate group report' }, { status: 500 })
  }
}
