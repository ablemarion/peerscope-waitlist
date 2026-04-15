/**
 * Portal API — request/response types.
 *
 * Zod schemas are used for request body validation at the route layer.
 * Response shapes are plain TypeScript types derived from DB row types.
 */

import { z } from 'zod'
import type { AgencyRow, ClientRow, CompetitorTargetRow, ProjectRow, ReportRow } from '../db/repo'

// ─── Request schemas ──────────────────────────────────────────────────────────

export const CreateAgencySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  }),
})
export type CreateAgencyInput = z.infer<typeof CreateAgencySchema>

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})
export type CreateClientInput = z.infer<typeof CreateClientSchema>

export const UpdateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>

export const CreateProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const CreateCompetitorTargetSchema = z.object({
  projectId: z.string().min(1),
  domain: z.string().min(1).max(200),
  name: z.string().min(1).max(100),
  trackPricing: z.boolean().default(true),
  trackJobs: z.boolean().default(true),
  trackReviews: z.boolean().default(true),
  trackFeatures: z.boolean().default(true),
})
export type CreateCompetitorTargetInput = z.infer<typeof CreateCompetitorTargetSchema>

export const CreateClientCompetitorSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
  homepageUrl: z
    .string()
    .min(1)
    .max(500)
    .refine((v) => v.startsWith('https://'), { message: 'URL must start with https://' }),
  notes: z.string().max(500).optional(),
})
export type CreateClientCompetitorInput = z.infer<typeof CreateClientCompetitorSchema>

export const UpdateClientCompetitorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  homepageUrl: z
    .string()
    .min(1)
    .max(500)
    .refine((v) => v.startsWith('https://'), { message: 'URL must start with https://' })
    .optional(),
  notes: z.string().max(500).optional(),
})
export type UpdateClientCompetitorInput = z.infer<typeof UpdateClientCompetitorSchema>

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
})
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>

export const GenerateReportSchema = z.object({
  projectId: z.string().min(1),
})
export type GenerateReportInput = z.infer<typeof GenerateReportSchema>

// ─── Response types ────────────────────────────────────────────────────────────

/** Standard API envelope — every portal endpoint wraps its payload here. */
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }

/** Public-safe subset of an agency row (excludes stripe_customer_id). */
export type AgencyResponse = Pick<
  AgencyRow,
  'id' | 'name' | 'slug' | 'plan' | 'logo_url' | 'primary_color' | 'created_at'
>

export type ClientResponse = ClientRow
export type ProjectResponse = ProjectRow
export type CompetitorTargetResponse = CompetitorTargetRow
export type ReportResponse = ReportRow

export interface AcceptInviteResponse {
  sessionToken: string
  userId: string
  agencyId: string
}
