/**
 * Client Portal CRUD API — Hono catch-all for /api/portal/*
 *
 * All routes (except POST /agencies) are protected by requireAgencyCtx, which
 * verifies the Better Auth agency JWT and confirms DB membership before granting
 * access. Every query is scoped to the authenticated agency via AgencyRepo so
 * cross-tenant data leaks are structurally impossible.
 *
 * POST /api/portal/agencies is the bootstrap endpoint: it creates a new agency
 * and links the requesting user as agency_admin. It is protected by ADMIN_KEY
 * (set via Cloudflare Pages secret) rather than an agency JWT, because the user
 * has no agency membership yet when calling it for the first time.
 */

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { z } from 'zod'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'
import type { MiddlewareHandler } from 'hono'
import { requireAgencyCtx } from '../../../src/middleware/requireAgencyCtx'
import { createRepo } from '../../../src/db/repo'
import {
  CreateAgencySchema,
  CreateClientSchema,
  UpdateClientSchema,
  CreateProjectSchema,
  CreateCompetitorTargetSchema,
} from '../../../src/types/portal'
import type { AgencyResponse } from '../../../src/types/portal'

// ─── Env bindings ─────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database
  PORTAL_STORAGE: R2Bucket
  /** Better Auth base URL — used to derive the JWKS endpoint. */
  BETTER_AUTH_URL: string
  /** Override JWKS URL if Better Auth is on a different origin. */
  PORTAL_JWKS_URL?: string
  /** Admin key for bootstrapping new agencies. */
  ADMIN_KEY?: string
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return { data, error: null } as const
}

function err(message: string) {
  return { data: null, error: message } as const
}

// ─── Lazy-cached agency auth middleware ───────────────────────────────────────

let _agencyAuth: ReturnType<typeof requireAgencyCtx> | null = null

const agencyAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (!_agencyAuth) {
    const jwksUrl =
      c.env.PORTAL_JWKS_URL ??
      `${c.env.BETTER_AUTH_URL}/api/auth/well-known/jwks.json`
    _agencyAuth = requireAgencyCtx({ jwksUrl })
  }
  // Cast required: the cached middleware was created without Bindings generic,
  // but the runtime behaviour is identical.
  return (_agencyAuth as MiddlewareHandler)(c, next)
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>().basePath('/api/portal')

// ── POST /agencies — bootstrap: create agency + add creator as agency_admin ──
app.post('/agencies', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const provided = c.req.header('X-Admin-Key')
  if (!adminKey || provided !== adminKey) {
    return c.json(err('Forbidden'), 403)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = CreateAgencySchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const userId = c.req.header('X-User-Id')
  if (!userId) {
    return c.json(err('X-User-Id header required'), 400)
  }

  const db = c.env.DB
  const { name, slug } = parsed.data

  // Check slug uniqueness.
  const existing = await db
    .prepare('SELECT id FROM agencies WHERE slug = ?')
    .bind(slug)
    .first<{ id: string }>()
  if (existing) {
    return c.json(err('Slug already taken'), 409)
  }

  // Create agency.
  const agency = await db
    .prepare(
      'INSERT INTO agencies (name, slug) VALUES (?, ?) RETURNING id, name, slug, plan, logo_url, primary_color, created_at'
    )
    .bind(name, slug)
    .first<AgencyResponse>()
  if (!agency) {
    return c.json(err('Failed to create agency'), 500)
  }

  // Link creator as agency_admin.
  await db
    .prepare(
      "INSERT OR IGNORE INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'admin')"
    )
    .bind(agency.id, userId)
    .run()

  return c.json(ok(agency), 201)
})

// ── All routes below require a valid agency JWT ───────────────────────────────
app.use('/*', agencyAuth)

// ── GET /agencies/me ──────────────────────────────────────────────────────────
app.get('/agencies/me', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const repo = createRepo(c.env.DB, agencyId)
  const agency = await repo.getAgency()
  if (!agency) {
    return c.json(err('Agency not found'), 404)
  }
  const response: AgencyResponse = {
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    plan: agency.plan,
    logo_url: agency.logo_url,
    primary_color: agency.primary_color,
    created_at: agency.created_at,
  }
  return c.json(ok(response))
})

// ── POST /clients ─────────────────────────────────────────────────────────────
app.post('/clients', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = CreateClientSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const client = await repo.createClient(parsed.data)
  return c.json(ok(client), 201)
})

// ── GET /clients ──────────────────────────────────────────────────────────────
app.get('/clients', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const url = new URL(c.req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0)

  const repo = createRepo(c.env.DB, agencyId)
  const clients = await repo.listClients({ limit, offset })
  return c.json(ok(clients))
})

// ── GET /clients/:id ──────────────────────────────────────────────────────────
app.get('/clients/:id', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const repo = createRepo(c.env.DB, agencyId)
  const client = await repo.getClient(c.req.param('id'))
  if (!client) return c.json(err('Client not found'), 404)
  return c.json(ok(client))
})

// ── PATCH /clients/:id ────────────────────────────────────────────────────────
app.patch('/clients/:id', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = UpdateClientSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const client = await repo.updateClient(c.req.param('id'), parsed.data)
  if (!client) return c.json(err('Client not found'), 404)
  return c.json(ok(client))
})

// ── POST /projects ────────────────────────────────────────────────────────────
app.post('/projects', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)

  // Confirm the referenced client belongs to this agency.
  const client = await repo.getClient(parsed.data.clientId)
  if (!client) return c.json(err('Client not found'), 404)

  const project = await repo.createProject({
    clientId: parsed.data.clientId,
    name: parsed.data.name,
    description: parsed.data.description,
  })
  return c.json(ok(project), 201)
})

// ── GET /projects ─────────────────────────────────────────────────────────────
app.get('/projects', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const clientId = new URL(c.req.url).searchParams.get('clientId') ?? undefined
  const repo = createRepo(c.env.DB, agencyId)
  const projects = await repo.listProjects(clientId)
  return c.json(ok(projects))
})

// ── GET /projects/:id ─────────────────────────────────────────────────────────
app.get('/projects/:id', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const repo = createRepo(c.env.DB, agencyId)
  const project = await repo.getProject(c.req.param('id'))
  if (!project) return c.json(err('Project not found'), 404)
  return c.json(ok(project))
})

// ── POST /competitor-targets ──────────────────────────────────────────────────
app.post('/competitor-targets', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = CreateCompetitorTargetSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const target = await repo.createCompetitorTarget({
    projectId: parsed.data.projectId,
    domain: parsed.data.domain,
    name: parsed.data.name,
    trackPricing: parsed.data.trackPricing,
    trackJobs: parsed.data.trackJobs,
    trackReviews: parsed.data.trackReviews,
    trackFeatures: parsed.data.trackFeatures,
  })
  if (!target) return c.json(err('Project not found'), 404)
  return c.json(ok(target), 201)
})

// ── GET /competitor-targets?projectId=:id ────────────────────────────────────
app.get('/competitor-targets', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const projectId = new URL(c.req.url).searchParams.get('projectId')
  if (!projectId) return c.json(err('projectId query param required'), 400)

  const repo = createRepo(c.env.DB, agencyId)
  const targets = await repo.listCompetitorTargets(projectId)
  return c.json(ok(targets))
})

// ─── Export ───────────────────────────────────────────────────────────────────
export const onRequest = handle(app)
