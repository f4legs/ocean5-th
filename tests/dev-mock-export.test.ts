import { describe, expect, it } from 'vitest'
import { buildMockExportData } from '@/lib/dev-mock-export'

describe('dev mock export builder', () => {
  it('maps selected test type into expected testId and metadata', () => {
    const export50 = buildMockExportData({
      testType: '50',
      pct: { O: 80, C: 70, E: 60, A: 50, N: 40 },
    })
    const export120 = buildMockExportData({
      testType: '120',
      pct: { O: 80, C: 70, E: 60, A: 50, N: 40 },
    })
    const export300 = buildMockExportData({
      testType: '300',
      pct: { O: 80, C: 70, E: 60, A: 50, N: 40 },
    })

    expect(export50.testId).toBe('ipip-neo-50-th')
    expect(export120.testId).toBe('ipip-neo-120-th')
    expect(export300.testId).toBe('ipip-neo-300-th')
    expect(export300.metadata.totalItems).toBe(300)
  })

  it('preserves ocean percentages in scores.pct and clamps invalid values', () => {
    const data = buildMockExportData({
      testType: '120',
      pct: { O: 120, C: 70.3, E: -5, A: 50.9, N: 40 },
    })

    expect(data.scores.pct).toEqual({
      O: 100,
      C: 70,
      E: 0,
      A: 51,
      N: 40,
    })
  })
})
