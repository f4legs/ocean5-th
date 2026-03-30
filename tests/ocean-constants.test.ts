import { describe, expect, it } from 'vitest'
import { buildDashboardStripGradient, getDashboardStripSegments } from '@/lib/ocean-constants'

describe('dashboard strip helpers', () => {
  it('keeps low non-dominant scores visible with a 2 percent minimum base', () => {
    const segments = getDashboardStripSegments(
      { O: 96, C: 70, E: 10, A: 4, N: 0 },
      'O',
    )

    expect(segments).toEqual([
      { factor: 'O', width: 72 },
      { factor: 'C', width: 18.667 },
      { factor: 'E', width: 4.381 },
      { factor: 'A', width: 2.952 },
      { factor: 'N', width: 2 },
    ])
    expect(segments[3]?.width).toBeGreaterThanOrEqual(2)
    expect(segments[4]?.width).toBe(2)
    expect(segments.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 3)
  })

  it('falls back to an even split of the proportional pool when other scores are zero', () => {
    const segments = getDashboardStripSegments(
      { O: 80, C: 0, E: 0, A: 0, N: 0 },
      'O',
    )

    expect(segments).toEqual([
      { factor: 'O', width: 72 },
      { factor: 'C', width: 7 },
      { factor: 'E', width: 7 },
      { factor: 'A', width: 7 },
      { factor: 'N', width: 7 },
    ])
    const gradient = buildDashboardStripGradient({ O: 80, C: 0, E: 0, A: 0, N: 0 }, 'O')
    expect(gradient).toContain('110deg')
    expect(gradient).toContain('72%')
  })

  it('orders non-dominant segments by descending score rank', () => {
    const segments = getDashboardStripSegments(
      { O: 88, C: 22, E: 11, A: 5, N: 33 },
      'O',
    )

    expect(segments.map((segment) => segment.factor)).toEqual(['O', 'N', 'C', 'E', 'A'])
  })
})
