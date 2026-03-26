import { describe, expect, it, vi } from 'vitest'
import { items } from '@/lib/items'
import { calcScores } from '@/lib/scoring'

function buildAnswers(
  picker: (item: (typeof items)[number]) => number
): Record<number, number> {
  const answers: Record<number, number> = {}
  for (const item of items) {
    answers[item.id] = picker(item)
  }
  return answers
}

describe('calcScores', () => {
  it('returns 100% for all factors when all items are answered at max keyed direction', () => {
    const answers = buildAnswers(item => (item.reverse ? 1 : 5))
    const result = calcScores(answers)

    expect(result.raw).toEqual({ E: 50, A: 50, C: 50, N: 50, O: 50 })
    expect(result.pct).toEqual({ E: 100, A: 100, C: 100, N: 100, O: 100 })
  })

  it('returns 0% for all factors when all items are answered at min keyed direction', () => {
    const answers = buildAnswers(item => (item.reverse ? 5 : 1))
    const result = calcScores(answers)

    expect(result.raw).toEqual({ E: 10, A: 10, C: 10, N: 10, O: 10 })
    expect(result.pct).toEqual({ E: 0, A: 0, C: 0, N: 0, O: 0 })
  })

  it('warns when answers are incomplete', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const partialAnswers: Record<number, number> = { 1: 3 }

    calcScores(partialAnswers)

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Only 1/${items.length} items answered`)
    )
    warnSpy.mockRestore()
  })
})
