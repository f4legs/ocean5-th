import { type Factor } from '@/lib/ocean-constants'

export type GroupMetricLabel = 'Low' | 'Moderate' | 'High' | 'Very High'

export interface GroupDynamicsInput {
  id: string
  label: string
  pct: Record<Factor, number>
}

export interface GroupDynamicsMetric {
  score: number
  label: GroupMetricLabel
}

export interface GroupDynamicsResult {
  memberCount: number
  teamBalanceIndex: GroupDynamicsMetric
  executionStrength: GroupDynamicsMetric
  innovationPivot: GroupDynamicsMetric
  socialCohesion: GroupDynamicsMetric
  domainAverages: Record<Factor, number>
}

const FACTORS: Factor[] = ['O', 'C', 'E', 'A', 'N']

export function computeGroupDynamics(members: GroupDynamicsInput[]): GroupDynamicsResult | null {
  if (members.length === 0) return null

  const domainAverages: Record<Factor, number> = {
    O: mean(members.map(member => member.pct.O ?? 0)),
    C: mean(members.map(member => member.pct.C ?? 0)),
    E: mean(members.map(member => member.pct.E ?? 0)),
    A: mean(members.map(member => member.pct.A ?? 0)),
    N: mean(members.map(member => member.pct.N ?? 0)),
  }

  const diversity = mean(
    FACTORS.map(factor => {
      const spread = standardDeviation(members.map(member => member.pct[factor] ?? 0))
      return clamp((spread / 25) * 100)
    })
  )

  const teamHealth =
    domainAverages.C * 0.30 +
    domainAverages.A * 0.25 +
    domainAverages.E * 0.20 +
    domainAverages.O * 0.10 +
    (100 - domainAverages.N) * 0.15

  const teamBalanceIndex = clamp(teamHealth * 0.55 + diversity * 0.45)

  const executionStrength = clamp(
    domainAverages.C * 0.55 +
    (100 - domainAverages.N) * 0.30 +
    domainAverages.A * 0.15
  )

  const cFlex = clamp(100 - Math.abs(domainAverages.C - 55) * 2)
  const innovationPivot = clamp(
    domainAverages.O * 0.55 +
    domainAverages.E * 0.25 +
    cFlex * 0.20
  )

  const socialCohesion = clamp(
    domainAverages.A * 0.50 +
    domainAverages.E * 0.25 +
    (100 - domainAverages.N) * 0.25
  )

  return {
    memberCount: members.length,
    teamBalanceIndex: asMetric(teamBalanceIndex),
    executionStrength: asMetric(executionStrength),
    innovationPivot: asMetric(innovationPivot),
    socialCohesion: asMetric(socialCohesion),
    domainAverages,
  }
}

function asMetric(value: number): GroupDynamicsMetric {
  const score = Math.round(clamp(value))
  return {
    score,
    label: toLabel(score),
  }
}

function toLabel(score: number): GroupMetricLabel {
  if (score >= 80) return 'Very High'
  if (score >= 65) return 'High'
  if (score >= 40) return 'Moderate'
  return 'Low'
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const avg = mean(values)
  const variance = mean(values.map(value => (value - avg) ** 2))
  return Math.sqrt(variance)
}

function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}