// Shared OCEAN constants and helpers used across quiz and results pages.
// Single source of truth — do not duplicate these in page files.

export type Factor = 'O' | 'C' | 'E' | 'A' | 'N'

// Answer scale labels for quiz pages (quiz, quiz120, quiz300)
export const LABELS = [
  { value: 5, th: 'ตรงมาก' },
  { value: 4, th: 'ค่อนข้างตรง' },
  { value: 3, th: 'เป็นกลาง' },
  { value: 2, th: 'ไม่ค่อยตรง' },
  { value: 1, th: 'ไม่ตรงเลย' },
] as const

// Domain display order for results and dashboard
export const FACTOR_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']

// Facet display order (grouped by domain) for deep results
export const FACET_DOMAIN_ORDER: Factor[] = ['O', 'C', 'E', 'A', 'N']

// Domain labels, sublabels, and descriptions (canonical — supersedes DIMENSION_INFO)
export const DOMAIN_LABELS: Record<Factor, { label: string; english: string; sublabel: string; description: string }> = {
  O: { label: 'การเปิดรับประสบการณ์', english: 'Openness',         sublabel: 'OPENNESS',          description: 'จินตนาการ ความคิดสร้างสรรค์ และความอยากรู้อยากเห็น' },
  C: { label: 'ความรับผิดชอบ',         english: 'Conscientiousness', sublabel: 'CONSCIENTIOUSNESS', description: 'ความเป็นระเบียบ ความมุ่งมั่น และวินัยในตนเอง' },
  E: { label: 'ความเปิดเผย',           english: 'Extraversion',      sublabel: 'EXTRAVERSION',      description: 'ความกระตือรือร้น ความชอบสังคม และความร่าเริง' },
  A: { label: 'ความเป็นมิตร',          english: 'Agreeableness',     sublabel: 'AGREEABLENESS',     description: 'ความร่วมมือ ความไว้วางใจ และความเห็นอกเห็นใจ' },
  N: { label: 'ความไม่มั่นคงทางอารมณ์', english: 'Neuroticism',      sublabel: 'NEUROTICISM',       description: 'ความวิตกกังวล ความอ่อนไหว และการรับมือกับความเครียด' },
}

// Domain color tokens — hues: O=210, C=38, E=158, A=268, N=348
export const DOMAIN_COLORS: Record<Factor, { barColor: string; chipBg: string; chipText: string; hue: string }> = {
  O: { barColor: 'hsl(210,55%,52%)', chipBg: 'hsl(210,60%,95%)', chipText: 'hsl(210,50%,36%)', hue: '210' },
  C: { barColor: 'hsl(38,60%,50%)',  chipBg: 'hsl(38,70%,94%)',  chipText: 'hsl(38,55%,34%)',  hue: '38'  },
  E: { barColor: 'hsl(158,50%,42%)', chipBg: 'hsl(158,60%,93%)', chipText: 'hsl(158,45%,30%)', hue: '158' },
  A: { barColor: 'hsl(268,45%,55%)', chipBg: 'hsl(268,60%,95%)', chipText: 'hsl(268,40%,38%)', hue: '268' },
  N: { barColor: 'hsl(348,52%,52%)', chipBg: 'hsl(348,60%,95%)', chipText: 'hsl(348,45%,36%)', hue: '348' },
}

// Maps a percentile score to a Thai level label
export function pctToLabel(pct: number): string {
  if (pct >= 70) return 'สูง'
  if (pct >= 40) return 'ปานกลาง'
  return 'ต่ำ'
}

// Formats a duration in seconds to M:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}
