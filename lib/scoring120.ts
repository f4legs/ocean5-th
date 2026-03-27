export type Factor = 'N' | 'E' | 'O' | 'A' | 'C'
export type FacetCode =
  | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6'
  | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6'
  | 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'O6'
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6'

export interface FacetScore {
  raw: number
  pct: number
}

export interface DomainScores {
  raw: Record<Factor, number>
  pct: Record<Factor, number>
}

export interface FullScoreResult {
  domains: DomainScores
  facets: Record<FacetCode, FacetScore>
}

export const FACETS_BY_DOMAIN: Record<Factor, FacetCode[]> = {
  N: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'],
  E: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
  O: ['O1', 'O2', 'O3', 'O4', 'O5', 'O6'],
  A: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
  C: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
}

// Facet → domain mapping
export const FACET_DOMAIN: Record<FacetCode, Factor> = {
  N1: 'N', N2: 'N', N3: 'N', N4: 'N', N5: 'N', N6: 'N',
  E1: 'E', E2: 'E', E3: 'E', E4: 'E', E5: 'E', E6: 'E',
  O1: 'O', O2: 'O', O3: 'O', O4: 'O', O5: 'O', O6: 'O',
  A1: 'A', A2: 'A', A3: 'A', A4: 'A', A5: 'A', A6: 'A',
  C1: 'C', C2: 'C', C3: 'C', C4: 'C', C5: 'C', C6: 'C',
}

export const FACET_LABELS: Record<FacetCode, { th: string; en: string }> = {
  N1: { th: 'ความวิตกกังวล', en: 'Anxiety' },
  N2: { th: 'ความโกรธง่าย', en: 'Anger' },
  N3: { th: 'ภาวะซึมเศร้า', en: 'Depression' },
  N4: { th: 'ความเขินอาย', en: 'Self-Consciousness' },
  N5: { th: 'การขาดการยับยั้งชั่งใจ', en: 'Immoderation' },
  N6: { th: 'ความเปราะบาง', en: 'Vulnerability' },
  E1: { th: 'ความเป็นมิตร', en: 'Friendliness' },
  E2: { th: 'ความชอบสังคม', en: 'Gregariousness' },
  E3: { th: 'ความกล้าแสดงออก', en: 'Assertiveness' },
  E4: { th: 'ระดับความกระตือรือร้น', en: 'Activity Level' },
  E5: { th: 'การแสวงหาความตื่นเต้น', en: 'Excitement-Seeking' },
  E6: { th: 'ความร่าเริง', en: 'Cheerfulness' },
  O1: { th: 'จินตนาการ', en: 'Imagination' },
  O2: { th: 'ความสนใจด้านศิลปะ', en: 'Artistic Interests' },
  O3: { th: 'ความอ่อนไหวทางอารมณ์', en: 'Emotionality' },
  O4: { th: 'ความชอบผจญภัย', en: 'Adventurousness' },
  O5: { th: 'ความสนใจด้านสติปัญญา', en: 'Intellect' },
  O6: { th: 'ความเปิดกว้างทางความคิด', en: 'Liberalism' },
  A1: { th: 'ความไว้วางใจ', en: 'Trust' },
  A2: { th: 'ความซื่อสัตย์', en: 'Morality' },
  A3: { th: 'ความเห็นอกเห็นใจ', en: 'Altruism' },
  A4: { th: 'ความร่วมมือ', en: 'Cooperation' },
  A5: { th: 'ความถ่อมตน', en: 'Modesty' },
  A6: { th: 'ความเห็นใจผู้อื่น', en: 'Sympathy' },
  C1: { th: 'ความเชื่อมั่นในตนเอง', en: 'Self-Efficacy' },
  C2: { th: 'ความเป็นระเบียบ', en: 'Orderliness' },
  C3: { th: 'ความรับผิดชอบต่อหน้าที่', en: 'Dutifulness' },
  C4: { th: 'ความมุ่งมั่นสู่ความสำเร็จ', en: 'Achievement-Striving' },
  C5: { th: 'ความมีวินัยในตนเอง', en: 'Self-Discipline' },
  C6: { th: 'ความรอบคอบ', en: 'Cautiousness' },
}

export const FACET_NAMES = Object.fromEntries(
  Object.entries(FACET_LABELS).map(([code, label]) => [code, label.th])
) as Record<FacetCode, string>

export const FACET_NAMES_EN = Object.fromEntries(
  Object.entries(FACET_LABELS).map(([code, label]) => [code, label.en])
) as Record<FacetCode, string>

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function domainAverage(facets: Record<FacetCode, FacetScore>, domain: Factor): number {
  const codes = FACETS_BY_DOMAIN[domain]
  const sum = codes.reduce((acc, code) => acc + facets[code].pct, 0)
  return clamp(sum / codes.length)
}

/**
 * Score a 120-item test (IPIP-NEO-120).
 * items120 must be imported from lib/items120.ts.
 * answers: { [itemId: number]: 1..5 }
 *
 * Facet scoring: 4 items/facet, raw 4–20, pct = (raw-4)/16*100
 */
export function calcScores120(
  answers: Record<number, number>,
  items: Array<{ id: number; facet: FacetCode; reverse: boolean }>
): FullScoreResult {
  // Init facet raws
  const facetRaw: Partial<Record<FacetCode, number>> = {}
  for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
    facetRaw[code] = 0
  }

  for (const item of items) {
    const ans = answers[item.id]
    if (ans === undefined) continue
    const score = item.reverse ? 6 - ans : ans
    facetRaw[item.facet] = (facetRaw[item.facet] ?? 0) + score
  }

  const facets = {} as Record<FacetCode, FacetScore>
  for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
    const raw = facetRaw[code] ?? 0
    facets[code] = { raw, pct: clamp((raw - 4) / 16 * 100) }
  }

  const domains: DomainScores = {
    raw: { N: 0, E: 0, O: 0, A: 0, C: 0 },
    pct: { N: 0, E: 0, O: 0, A: 0, C: 0 },
  }
  for (const factor of ['N', 'E', 'O', 'A', 'C'] as Factor[]) {
    domains.pct[factor] = domainAverage(facets, factor)
    // Raw = sum of facet raws for this domain (6 facets × 4 items each = 24 max per domain)
    const codes = FACETS_BY_DOMAIN[factor]
    domains.raw[factor] = codes.reduce((acc, c) => acc + (facetRaw[c] ?? 0), 0)
  }

  return { domains, facets }
}

/**
 * Score a 300-item test (IPIP-NEO-300).
 * Accepts the merged 300 answers (120 items + 180 new items).
 *
 * Facet scoring: 10 items/facet, raw 10–50, pct = (raw-10)/40*100
 */
export function calcScores300(
  answers: Record<number, number>,
  items: Array<{ id: number; facet: FacetCode; reverse: boolean }>
): FullScoreResult {
  const facetRaw: Partial<Record<FacetCode, number>> = {}
  for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
    facetRaw[code] = 0
  }

  for (const item of items) {
    const ans = answers[item.id]
    if (ans === undefined) continue
    const score = item.reverse ? 6 - ans : ans
    facetRaw[item.facet] = (facetRaw[item.facet] ?? 0) + score
  }

  const facets = {} as Record<FacetCode, FacetScore>
  for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
    const raw = facetRaw[code] ?? 0
    facets[code] = { raw, pct: clamp((raw - 10) / 40 * 100) }
  }

  const domains: DomainScores = {
    raw: { N: 0, E: 0, O: 0, A: 0, C: 0 },
    pct: { N: 0, E: 0, O: 0, A: 0, C: 0 },
  }
  for (const factor of ['N', 'E', 'O', 'A', 'C'] as Factor[]) {
    domains.pct[factor] = domainAverage(facets, factor)
    const codes = FACETS_BY_DOMAIN[factor]
    domains.raw[factor] = codes.reduce((acc, c) => acc + (facetRaw[c] ?? 0), 0)
  }

  return { domains, facets }
}
