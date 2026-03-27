import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { FACET_NAMES } from '@/lib/scoring120'
import { normalizeMarkdown } from '@/lib/markdown'
import {
  createAuthenticatedSupabaseClient,
  getAuthenticatedUser,
  getBearerToken,
} from '@/utils/api/auth'
import { createFixedWindowRateLimiter, getClientIp } from '@/utils/api/rate-limit'

export const maxDuration = 300

type TestType = '50' | '120' | '300'
type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

type OceanProfileRow = {
  id: string
  owner_id: string
  label: string
  source: 'test' | 'upload' | 'shared'
  test_type: TestType
  scores: {
    raw?: Record<string, number>
    pct: Record<string, number>
    facets?: Record<string, { raw?: number; pct: number }>
    domains?: { raw?: Record<string, number>; pct?: Record<string, number> }
  }
  profile?: {
    age?: string | null
    sex?: string | null
    occupation?: string | null
    goal?: string | null
  } | null
  ai_report?: string | null
}

const checkRateLimit = createFixedWindowRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
})

function sanitize(s: string | null | undefined, maxLen = 100): string | null {
  if (!s) return null
  return s.replace(/[^\p{L}\p{N}\s.,\-()]/gu, '').slice(0, maxLen).trim() || null
}

function extractPct(scores: OceanProfileRow['scores']): Record<string, number> | null {
  if (scores?.pct && typeof scores.pct === 'object') return scores.pct
  if (scores?.domains?.pct && typeof scores.domains.pct === 'object') return scores.domains.pct
  return null
}

function isValidDomainScores(pct: Record<string, number> | null): pct is Record<Factor, number> {
  if (!pct) return false
  for (const key of ['E', 'A', 'C', 'N', 'O'] as const) {
    const val = pct[key]
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 100) {
      return false
    }
  }
  return true
}

function buildProfileLines(profile: OceanProfileRow['profile']): string {
  const age = sanitize(profile?.age, 3)
  const sex = sanitize(profile?.sex, 10)
  const occupation = sanitize(profile?.occupation, 80)
  const goal = sanitize(profile?.goal, 80)

  return [
    age ? `- อายุ: ${age} ปี` : null,
    sex ? `- เพศ: ${sex}` : null,
    occupation ? `- อาชีพ: ${occupation}` : null,
    goal ? `- วัตถุประสงค์: ${goal}` : null,
  ].filter(Boolean).join('\n')
}

function buildPrompt50(profile: OceanProfileRow, pct: Record<Factor, number>): string {
  const profileLines = buildProfileLines(profile.profile)
  return `You are an expert clinical psychologist specializing in Big Five / Five-Factor Model personality assessment. DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.
Output valid GitHub-flavored Markdown only. Do not wrap the entire response in triple backticks.

ผลการทดสอบบุคลิกภาพ OCEAN จากโปรไฟล์ในคลัง:
- ชื่อโปรไฟล์: ${profile.label}
- การเปิดรับประสบการณ์ (Openness / O): ${Math.round(pct.O)}%
- ความรับผิดชอบ (Conscientiousness / C): ${Math.round(pct.C)}%
- ความเปิดเผย (Extraversion / E): ${Math.round(pct.E)}%
- ความเป็นมิตร (Agreeableness / A): ${Math.round(pct.A)}%
- ความไม่มั่นคงทางอารมณ์ (Neuroticism / N): ${Math.round(pct.N)}%

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานวิเคราะห์เชิงลึก 1,300–1,900 คำ โดยใช้โครงสร้าง:

## ภาพรวมบุคลิกภาพ
## วิเคราะห์รายมิติเชิงลึก
## ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
## แนวทางอาชีพและสภาพแวดล้อมที่เหมาะสม
## จุดแข็ง จุดที่ควรระวัง และคำแนะนำการพัฒนาตนเอง 5–6 ข้อ

เขียนให้อ่านง่าย เป็นมิตร และใช้หลักจิตวิทยา หลีกเลี่ยงภาษาตัดสินคุณค่า`
}

function buildPromptDeep(profile: OceanProfileRow, pct: Record<Factor, number>): string {
  const profileLines = buildProfileLines(profile.profile)
  const facetScores = profile.scores?.facets ?? {}
  const facetLines = Object.entries(FACET_NAMES)
    .map(([code, name]) => {
      const score = facetScores[code]?.pct
      return typeof score === 'number' ? `- ${name} (${code}): ${Math.round(score)}%` : null
    })
    .filter(Boolean)
    .join('\n')

  return `You are an expert clinical psychologist specializing in NEO-PI-R facet-level assessment. DO NOT mention who you are.

Write the entire report in Thai (ภาษาไทย). Use English only for psychological terminology in parentheses.
Output valid GitHub-flavored Markdown only. Do not wrap the entire response in triple backticks.

ผลการทดสอบ OCEAN เชิงลึก (${profile.test_type} ข้อ, จากคลังโปรไฟล์):
- ชื่อโปรไฟล์: ${profile.label}

**มิติหลัก:**
- การเปิดรับประสบการณ์ (O): ${Math.round(pct.O)}%
- ความรับผิดชอบ (C): ${Math.round(pct.C)}%
- ความเปิดเผย (E): ${Math.round(pct.E)}%
- ความเป็นมิตร (A): ${Math.round(pct.A)}%
- ความไม่มั่นคงทางอารมณ์ (N): ${Math.round(pct.N)}%

**ลักษณะย่อย 30 ด้าน:**
${facetLines || '- ไม่มีข้อมูลลักษณะย่อย'}

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานบุคลิกภาพเชิงลึก 1,900–2,500 คำ โดยใช้โครงสร้าง:

## ภาพรวมบุคลิกภาพ
## วิเคราะห์เชิงลึกแต่ละมิติพร้อมลักษณะย่อยที่โดดเด่น
## ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
## จุดแข็งที่ซ่อนอยู่และโอกาสพัฒนา
## แนวทางอาชีพและการใช้ชีวิต
## คำแนะนำพัฒนาตนเอง 5–7 ข้อ

ให้ข้อเสนอที่ปฏิบัติได้จริง และเชื่อมโยงกับรูปแบบคะแนนที่ปรากฏ`
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const accessToken = getBearerToken(req)
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { limited } = checkRateLimit(getClientIp(req))
  if (limited) {
    return NextResponse.json({ error: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 })
  }

  const userClient = createAuthenticatedSupabaseClient(accessToken)
  const user = await getAuthenticatedUser(userClient)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const profileId = (body as { profileId?: unknown })?.profileId
  if (typeof profileId !== 'string' || !profileId.trim()) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
  }

  const { data, error } = await userClient
    .from('ocean_profiles')
    .select('id, owner_id, label, source, test_type, scores, profile, ai_report')
    .eq('owner_id', user.id)
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
  }

  const profile = data as OceanProfileRow
  const pct = extractPct(profile.scores)
  if (!isValidDomainScores(pct)) {
    return NextResponse.json({ error: 'Invalid profile scores' }, { status: 400 })
  }

  const prompt = profile.test_type === '50'
    ? buildPrompt50(profile, pct)
    : buildPromptDeep(profile, pct)

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
        let fullReport = ''
        try {
          for await (const chunk of await genStream) {
            const text = chunk.text ?? ''
            fullReport += text
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
          const normalizedReport = normalizeMarkdown(fullReport)
          if (normalizedReport) {
            userClient
              .from('ocean_profiles')
              .update({ ai_report: normalizedReport })
              .eq('owner_id', user.id)
              .eq('id', profile.id)
              .then(({ error: updateError }) => {
                if (updateError) console.error('Failed to save profile analysis:', updateError)
              })
          }
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
    console.error('Profile analysis Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
