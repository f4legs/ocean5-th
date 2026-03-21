import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { scores, profile } = body as {
    scores: { E: number; A: number; C: number; N: number; O: number }
    profile: { age?: string; sex?: string; occupation?: string; goal?: string }
  }

  const profileLines = [
    profile.age       ? `- อายุ: ${profile.age} ปี` : null,
    profile.sex       ? `- เพศ: ${profile.sex}` : null,
    profile.occupation? `- อาชีพ: ${profile.occupation}` : null,
    profile.goal      ? `- วัตถุประสงค์ในการทำแบบทดสอบ: ${profile.goal}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `คุณเป็นนักจิตวิทยาผู้เชี่ยวชาญด้านบุคลิกภาพ Big Five ที่มีความเชี่ยวชาญในการอธิบายผลเป็นภาษาไทยอย่างละเอียด อบอุ่น และสร้างแรงบันดาลใจ

ผลการทดสอบบุคลิกภาพ OCEAN:
- ความเปิดเผย (Extraversion / E): ${scores.E}%
- ความเป็นมิตร (Agreeableness / A): ${scores.A}%
- ความรับผิดชอบ (Conscientiousness / C): ${scores.C}%
- ความไม่มั่นคงทางอารมณ์ (Neuroticism / N): ${scores.N}%
- การเปิดรับประสบการณ์ (Openness / O): ${scores.O}%

${profileLines ? `ข้อมูลส่วนตัว:\n${profileLines}` : 'ไม่มีข้อมูลส่วนตัวเพิ่มเติม'}

กรุณาเขียนรายงานวิเคราะห์บุคลิกภาพที่ครอบคลุมและเป็นประโยชน์เป็นภาษาไทย โดยจัดโครงสร้างดังนี้:

## ภาพรวมบุคลิกภาพ
สรุปภาพรวมบุคลิกภาพของบุคคลนี้จากการรวมคะแนนทั้ง 5 มิติ อธิบายว่าเขา/เธอเป็นคนแบบไหน

## วิเคราะห์รายมิติ
วิเคราะห์แต่ละมิติโดยละเอียด ระบุจุดแข็ง โอกาสพัฒนา และลักษณะที่โดดเด่น

## ความสัมพันธ์และการทำงานร่วมกับผู้อื่น
อธิบายว่าบุคลิกภาพนี้ส่งผลต่อความสัมพันธ์กับคนรอบข้างอย่างไร และมีแนวทางในการสร้างความสัมพันธ์ที่ดีอย่างไร

## แนวทางอาชีพและสภาพแวดล้อมที่เหมาะสม
ระบุประเภทงาน สภาพแวดล้อมการทำงาน และบทบาทที่เหมาะกับบุคลิกภาพนี้${profile.occupation ? ` โดยเชื่อมโยงกับอาชีพ ${profile.occupation} ด้วย` : ''}

## คำแนะนำการพัฒนาตนเอง
ให้คำแนะนำที่เป็นรูปธรรม 4–5 ข้อ สำหรับการพัฒนาจุดอ่อนและเสริมจุดแข็ง

ใช้ภาษากระชับ เป็นกันเอง ให้กำลังใจ และอิงจากหลักจิตวิทยา ห้ามใช้ภาษาเชิงลบหรือตัดสินคุณค่าของบุคคล`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ report: text })
  } catch (err) {
    console.error('Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
