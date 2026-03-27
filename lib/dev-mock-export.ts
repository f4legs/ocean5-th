import { FACTOR_ORDER, type Factor } from '@/lib/ocean-constants'

export type MockTestType = '50' | '120' | '300'

export interface MockScoresInput {
  O: number
  C: number
  E: number
  A: number
  N: number
}

interface BuildMockExportOptions {
  testType: MockTestType
  pct: MockScoresInput
}

const TRAIT_BOUNDS: Record<MockTestType, { min: number; max: number; totalItems: number; testId: string }> = {
  '50': { min: 10, max: 50, totalItems: 50, testId: 'ipip-neo-50-th' },
  '120': { min: 24, max: 120, totalItems: 120, testId: 'ipip-neo-120-th' },
  '300': { min: 60, max: 300, totalItems: 300, testId: 'ipip-neo-300-th' },
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function toNormalizedPct(input: MockScoresInput): Record<Factor, number> {
  return {
    O: clampPct(input.O),
    C: clampPct(input.C),
    E: clampPct(input.E),
    A: clampPct(input.A),
    N: clampPct(input.N),
  }
}

function toApproxRawScore(pct: number, min: number, max: number): number {
  const span = max - min
  return Math.round(min + (clampPct(pct) / 100) * span)
}

export function buildMockExportData(options: BuildMockExportOptions) {
  const normalizedPct = toNormalizedPct(options.pct)
  const bound = TRAIT_BOUNDS[options.testType]
  const rawScores = Object.fromEntries(
    FACTOR_ORDER.map((factor) => [
      factor,
      toApproxRawScore(normalizedPct[factor], bound.min, bound.max),
    ]),
  ) as Record<Factor, number>

  return {
    testId: bound.testId,
    scores: {
      raw: rawScores,
      pct: normalizedPct,
    },
    profile: null,
    answers: null,
    session: {
      sessionId: crypto.randomUUID(),
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      totalItems: bound.totalItems,
      durationSeconds: null,
      source: 'dev-mock',
    },
  }
}
