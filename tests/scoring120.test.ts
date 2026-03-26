import { describe, expect, it } from 'vitest'
import {
  FACET_DOMAIN,
  calcScores120,
  calcScores300,
  type FacetCode,
} from '@/lib/scoring120'

function buildFacetItems(itemsPerFacet: number, reverse: boolean) {
  const facetCodes = Object.keys(FACET_DOMAIN) as FacetCode[]
  let id = 1

  return facetCodes.flatMap(code =>
    Array.from({ length: itemsPerFacet }, () => ({
      id: id++,
      facet: code,
      reverse,
    }))
  )
}

function answerAll(
  items: Array<{ id: number }>,
  answer: number
): Record<number, number> {
  const answers: Record<number, number> = {}
  for (const item of items) answers[item.id] = answer
  return answers
}

describe('facet scoring (120/300)', () => {
  it('scores 120-item format to 100% at facet and domain level for max keyed answers', () => {
    const items = buildFacetItems(4, false)
    const answers = answerAll(items, 5)
    const result = calcScores120(answers, items)

    for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
      expect(result.facets[code]).toEqual({ raw: 20, pct: 100 })
    }
    expect(result.domains.raw).toEqual({ N: 120, E: 120, O: 120, A: 120, C: 120 })
    expect(result.domains.pct).toEqual({ N: 100, E: 100, O: 100, A: 100, C: 100 })
  })

  it('scores 120-item format to 0% at facet and domain level for minimum answers', () => {
    const items = buildFacetItems(4, false)
    const answers = answerAll(items, 1)
    const result = calcScores120(answers, items)

    for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
      expect(result.facets[code]).toEqual({ raw: 4, pct: 0 })
    }
    expect(result.domains.raw).toEqual({ N: 24, E: 24, O: 24, A: 24, C: 24 })
    expect(result.domains.pct).toEqual({ N: 0, E: 0, O: 0, A: 0, C: 0 })
  })

  it('applies reverse scoring in 300-item mode', () => {
    const items = buildFacetItems(10, true)
    const answers = answerAll(items, 1) // reverse-keyed 1 => score 5
    const result = calcScores300(answers, items)

    for (const code of Object.keys(FACET_DOMAIN) as FacetCode[]) {
      expect(result.facets[code]).toEqual({ raw: 50, pct: 100 })
    }
    expect(result.domains.raw).toEqual({ N: 300, E: 300, O: 300, A: 300, C: 300 })
    expect(result.domains.pct).toEqual({ N: 100, E: 100, O: 100, A: 100, C: 100 })
  })
})
