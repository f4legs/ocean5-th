import { items, Factor } from './items'

export interface Scores {
  E: number
  A: number
  C: number
  N: number
  O: number
}

export interface ScoreResult {
  raw: Scores       // sum of items per factor (range 10–50)
  pct: Scores       // percentage 0–100
}

export const DIMENSION_INFO: Record<Factor, { label: string; sublabel: string; color: string; description: string }> = {
  E: {
    label: 'ความเปิดเผย',
    sublabel: 'Extraversion',
    color: '#F59E0B',
    description: 'วัดความชอบเข้าสังคม ความมีชีวิตชีวา และการแสดงออก',
  },
  A: {
    label: 'ความเป็นมิตร',
    sublabel: 'Agreeableness',
    color: '#10B981',
    description: 'วัดความใจดี ความร่วมมือ และความไว้วางใจผู้อื่น',
  },
  C: {
    label: 'ความรับผิดชอบ',
    sublabel: 'Conscientiousness',
    color: '#3B82F6',
    description: 'วัดความมีระเบียบ ความขยัน และความมุ่งมั่น',
  },
  N: {
    label: 'ความมั่นคงทางอารมณ์',
    sublabel: 'Emotional Stability',
    color: '#8B5CF6',
    description: 'วัดความสามารถในการรับมือกับความเครียดและอารมณ์',
  },
  O: {
    label: 'การเปิดรับประสบการณ์',
    sublabel: 'Openness',
    color: '#EF4444',
    description: 'วัดความชอบสิ่งใหม่ จินตนาการ และความคิดสร้างสรรค์',
  },
}

export function calcScores(answers: Record<number, number>): ScoreResult {
  const raw: Scores = { E: 0, A: 0, C: 0, N: 0, O: 0 }

  for (const item of items) {
    const answer = answers[item.id]
    if (answer === undefined) continue
    const score = item.reverse ? 6 - answer : answer
    raw[item.factor] += score
  }

  const pct: Scores = {
    E: Math.round((raw.E - 10) / 40 * 100),
    A: Math.round((raw.A - 10) / 40 * 100),
    C: Math.round((raw.C - 10) / 40 * 100),
    N: Math.round((raw.N - 10) / 40 * 100),
    O: Math.round((raw.O - 10) / 40 * 100),
  }

  return { raw, pct }
}
