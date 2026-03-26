import { describe, expect, it } from 'vitest'
import { computeGroupDynamics } from '@/lib/group-dynamics'

describe('computeGroupDynamics', () => {
  it('returns null for empty groups', () => {
    expect(computeGroupDynamics([])).toBeNull()
  })

  it('computes deterministic team metrics and labels', () => {
    const result = computeGroupDynamics([
      { id: '1', label: 'A', pct: { O: 75, C: 90, E: 80, A: 85, N: 10 } },
      { id: '2', label: 'B', pct: { O: 75, C: 90, E: 80, A: 85, N: 10 } },
      { id: '3', label: 'C', pct: { O: 75, C: 90, E: 80, A: 85, N: 10 } },
    ])

    expect(result).not.toBeNull()
    expect(result?.memberCount).toBe(3)
    expect(result?.executionStrength).toEqual({ score: 89, label: 'Very High' })
    expect(result?.innovationPivot).toEqual({ score: 67, label: 'High' })
    expect(result?.socialCohesion).toEqual({ score: 85, label: 'Very High' })
  })

  it('clamps out-of-range values to valid score bounds', () => {
    const result = computeGroupDynamics([
      { id: '1', label: 'A', pct: { O: 140, C: -20, E: 180, A: -10, N: 220 } },
      { id: '2', label: 'B', pct: { O: 140, C: -20, E: 180, A: -10, N: 220 } },
      { id: '3', label: 'C', pct: { O: 140, C: -20, E: 180, A: -10, N: 220 } },
    ])

    expect(result).not.toBeNull()
    for (const metric of [
      result!.teamBalanceIndex,
      result!.executionStrength,
      result!.innovationPivot,
      result!.socialCohesion,
    ]) {
      expect(metric.score).toBeGreaterThanOrEqual(0)
      expect(metric.score).toBeLessThanOrEqual(100)
    }
  })
})
