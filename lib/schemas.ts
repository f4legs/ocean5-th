import { z } from 'zod'

const pct = z.float64().min(0).max(100)

// Profile fields are always the same shape across all test types
const profileSchema = z.object({
  age: z.string().max(3).nullable().optional(),
  sex: z.string().max(20).nullable().optional(),
  occupation: z.string().max(100).nullable().optional(),
  goal: z.string().max(200).nullable().optional(),
}).nullable().optional()

// Shared scores shape (domain pct map + optional facets)
export const oceanScoresSchema = z.object({
  raw: z.record(z.string(), z.float64()).optional(),
  pct: z.record(z.string(), pct),
  facets: z.record(z.string(), z.object({
    raw: z.float64(),
    pct,
  })).optional(),
})

// Full export format (used by JSON upload — matches the export file structure)
export const exportDataSchema = z.object({
  testId: z.string().max(64),
  scores: oceanScoresSchema,
  profile: profileSchema,
  answers: z.record(z.string(), z.int().min(1).max(5)).optional().nullable(),
  session: z.object({
    sessionId: z.uuid().optional(),
  }).optional().nullable(),
  metadata: z.object({
    exportedAt: z.string().optional(),
    totalItems: z.number().optional(),
    durationSeconds: z.number().nullable().optional(),
  }).optional().nullable(),
})

export const uploadPayloadSchema = z.object({
  exportData: exportDataSchema,
})

// Share payload — sent by results/page.tsx (50-item) and results120/300 pages
export const sharePayloadSchema = z.object({
  inviteCode: z.string().min(8).max(16),
  scores: z.object({
    pct: z.record(z.string(), pct),
    facets: z.record(z.string(), z.object({ raw: z.float64(), pct })).optional(),
  }),
  profile: profileSchema,
  sessionId: z.uuid().optional(),
  testType: z.enum(['50', '120', '300']).optional(),
})

export const profileShareCreatePayloadSchema = z.object({
  profileId: z.uuid(),
})

export const profileShareAcceptPayloadSchema = z.object({
  code: z.string().min(8).max(32),
})
