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

// Facet → domain mapping
export const FACET_DOMAIN: Record<FacetCode, Factor> = {
  N1: 'N', N2: 'N', N3: 'N', N4: 'N', N5: 'N', N6: 'N',
  E1: 'E', E2: 'E', E3: 'E', E4: 'E', E5: 'E', E6: 'E',
  O1: 'O', O2: 'O', O3: 'O', O4: 'O', O5: 'O', O6: 'O',
  A1: 'A', A2: 'A', A3: 'A', A4: 'A', A5: 'A', A6: 'A',
  C1: 'C', C2: 'C', C3: 'C', C4: 'C', C5: 'C', C6: 'C',
}

export const FACET_NAMES: Record<FacetCode, string> = {
  N1: 'ความวิตกกังวล', N2: 'ความโกรธง่าย', N3: 'ภาวะซึมเศร้า',
  N4: 'ความเขินอาย', N5: 'การขาดการยับยั้งชั่งใจ', N6: 'ความเปราะบาง',
  E1: 'ความเป็นมิตร', E2: 'ความชอบสังคม', E3: 'ความกล้าแสดงออก',
  E4: 'ระดับความกระตือรือร้น', E5: 'การแสวงหาความตื่นเต้น', E6: 'ความร่าเริง',
  O1: 'จินตนาการ', O2: 'ความสนใจด้านศิลปะ', O3: 'ความอ่อนไหวทางอารมณ์',
  O4: 'ความชอบผจญภัย', O5: 'ความสนใจด้านสติปัญญา', O6: 'ความเปิดกว้างทางความคิด',
  A1: 'ความไว้วางใจ', A2: 'ความซื่อสัตย์', A3: 'ความเห็นอกเห็นใจ',
  A4: 'ความร่วมมือ', A5: 'ความถ่อมตน', A6: 'ความเห็นใจผู้อื่น',
  C1: 'ความเชื่อมั่นในตนเอง', C2: 'ความเป็นระเบียบ', C3: 'ความรับผิดชอบต่อหน้าที่',
  C4: 'ความมุ่งมั่นสู่ความสำเร็จ', C5: 'ความมีวินัยในตนเอง', C6: 'ความรอบคอบ',
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function domainAverage(facets: Record<FacetCode, FacetScore>, domain: Factor): number {
  const codes = Object.entries(FACET_DOMAIN)
    .filter(([, d]) => d === domain)
    .map(([code]) => code as FacetCode)
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
    const codes = Object.entries(FACET_DOMAIN)
      .filter(([, d]) => d === factor)
      .map(([c]) => c as FacetCode)
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
    const codes = Object.entries(FACET_DOMAIN)
      .filter(([, d]) => d === factor)
      .map(([c]) => c as FacetCode)
    domains.raw[factor] = codes.reduce((acc, c) => acc + (facetRaw[c] ?? 0), 0)
  }

  return { domains, facets }
}
