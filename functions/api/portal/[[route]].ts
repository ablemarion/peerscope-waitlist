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
import Stripe from 'stripe'
import type { D1Database } from '@cloudflare/workers-types'
import type { MiddlewareHandler } from 'hono'
import { Resend } from 'resend'
import { requireAgencyCtx, issuePortalJwt } from '../../../src/middleware/requireAgencyCtx'
import { createRepo } from '../../../src/db/repo'
import type { ClientInvitationRow, ReportRow } from '../../../src/db/repo'
import {
  CreateAgencySchema,
  CreateClientSchema,
  UpdateClientSchema,
  CreateProjectSchema,
  CreateCompetitorTargetSchema,
  AcceptInviteSchema,
  GenerateReportSchema,
} from '../../../src/types/portal'
import type { AgencyResponse } from '../../../src/types/portal'

// ─── Env bindings ─────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database
  /** HS256 JWT signing secret (required). */
  BETTER_AUTH_SECRET: string
  /** Public base URL for magic links and Stripe redirects. */
  BETTER_AUTH_URL: string
  /** Admin key for bootstrapping new agencies. */
  ADMIN_KEY?: string
  /** Resend API key for transactional email. */
  RESEND_API_KEY?: string
  /** Stripe secret key (sk_live_... or sk_test_...). */
  STRIPE_SECRET_KEY?: string
  /** Stripe webhook signing secret (whsec_...). */
  STRIPE_WEBHOOK_SECRET?: string
  /** Stripe price ID for the AUD$249/mo plan. */
  STRIPE_PRICE_ID?: string
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return { data, error: null } as const
}

function err(message: string) {
  return { data: null, error: message } as const
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Lazy-cached agency auth middleware ───────────────────────────────────────

let _agencyAuth: ReturnType<typeof requireAgencyCtx> | null = null

const agencyAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (!_agencyAuth) {
    _agencyAuth = requireAgencyCtx({ secret: c.env.BETTER_AUTH_SECRET })
  }
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

  // Link creator as agency_admin (migration 0010 uses agency_admin).
  await db
    .prepare(
      "INSERT OR IGNORE INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'agency_admin')"
    )
    .bind(agency.id, userId)
    .run()

  return c.json(ok(agency), 201)
})

// ── POST /auth/accept-invite — validate magic-link token, create BA session ───
// PUBLIC: registered before agencyAuth middleware so it is not token-gated.
app.post('/auth/accept-invite', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = AcceptInviteSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(err('token is required'), 400)
  }

  const { token } = parsed.data
  const tokenHash = await sha256Hex(token)

  // Look up invitation without agency scope — the token itself encodes identity.
  const invitation = await c.env.DB
    .prepare('SELECT * FROM client_invitations WHERE token_hash = ? LIMIT 1')
    .bind(tokenHash)
    .first<ClientInvitationRow>()

  if (!invitation) {
    return c.json(err('Invalid or expired invitation'), 400)
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return c.json(err('Invitation has expired'), 400)
  }

  if (invitation.accepted_at) {
    return c.json(err('Invitation has already been used'), 400)
  }

  // Atomic single-use enforcement: update only if accepted_at is still NULL.
  const marked = await c.env.DB
    .prepare(
      "UPDATE client_invitations SET accepted_at = datetime('now') WHERE token_hash = ? AND accepted_at IS NULL"
    )
    .bind(tokenHash)
    .run()

  if ((marked.meta?.changes ?? 0) === 0) {
    return c.json(err('Invitation has already been used'), 400)
  }

  const now = new Date().toISOString()

  // Find or create a Better Auth user for this email.
  let userId: string
  const existingUser = await c.env.DB
    .prepare('SELECT id FROM user WHERE email = ? LIMIT 1')
    .bind(invitation.email)
    .first<{ id: string }>()

  if (existingUser) {
    userId = existingUser.id
    await c.env.DB
      .prepare(
        'UPDATE user SET agency_id = ?, agency_role = ?, updated_at = ? WHERE id = ?'
      )
      .bind(invitation.agency_id, 'client_viewer', now, userId)
      .run()
  } else {
    userId = crypto.randomUUID()
    await c.env.DB
      .prepare(
        `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, agency_id, agency_role)
         VALUES (?, ?, ?, 1, ?, ?, ?, 'client_viewer')`
      )
      .bind(userId, invitation.email, invitation.email, now, now, invitation.agency_id)
      .run()
  }

  // Ensure user appears in agency_users for middleware membership check.
  // INSERT OR IGNORE so re-inviting an existing client is idempotent.
  await c.env.DB
    .prepare(
      "INSERT OR IGNORE INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'client_viewer')"
    )
    .bind(invitation.agency_id, userId)
    .run()

  // Create a session the client exchanges for a JWT at POST /auth/token.
  const sessionId = crypto.randomUUID()
  const sessionToken = randomHex(32)
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB
    .prepare(
      `INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(sessionId, sessionToken, userId, sessionExpiry, now, now)
    .run()

  return c.json(ok({ sessionToken, userId, agencyId: invitation.agency_id }))
})

// ── POST /auth/token — exchange session token for a signed HS256 JWT ─────────
// PUBLIC: called by frontend after accept-invite to get Bearer token.
app.post('/auth/token', async (c) => {
  const body = await c.req.json().catch(() => null)
  const schema = z.object({ sessionToken: z.string().min(1) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err('sessionToken is required'), 400)
  }

  const { sessionToken } = parsed.data

  const row = await c.env.DB
    .prepare(
      `SELECT s.user_id, s.expires_at, u.agency_id, u.agency_role
       FROM session s
       JOIN user u ON u.id = s.user_id
       WHERE s.token = ? LIMIT 1`
    )
    .bind(sessionToken)
    .first<{ user_id: string; expires_at: string; agency_id: string | null; agency_role: string | null }>()

  if (!row) return c.json(err('Invalid session token'), 401)
  if (new Date(row.expires_at) < new Date()) return c.json(err('Session has expired'), 401)
  if (!row.agency_id || !row.agency_role) return c.json(err('User has no agency association'), 403)

  const role = row.agency_role === 'client_viewer' ? 'client_viewer' as const : 'agency_admin' as const

  const jwt = await issuePortalJwt({
    userId: row.user_id,
    agencyId: row.agency_id,
    role,
    secret: c.env.BETTER_AUTH_SECRET,
    expiresInHours: 8,
  })

  return c.json(ok({ token: jwt }))
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

// ── POST /clients/:id/invite — generate magic-link and send via Resend ───────
app.post('/clients/:id/invite', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const repo = createRepo(c.env.DB, agencyId)
  const client = await repo.getClient(c.req.param('id'))
  if (!client) return c.json(err('Client not found'), 404)

  if (!c.env.RESEND_API_KEY) {
    return c.json(err('Email service not configured'), 500)
  }

  // Generate raw token (64 hex chars = 32 random bytes) and store only the hash.
  const rawToken = randomHex(32)
  const tokenHash = await sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await repo.createInvitation({
    clientId: client.id,
    email: client.email,
    tokenHash,
    expiresAt,
  })

  const magicLink = `https://peerscope-waitlist.pages.dev/portal/join?token=${rawToken}`

  const resend = new Resend(c.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: 'Peerscope <onboarding@resend.dev>',
    to: client.email,
    subject: "You've been invited to your Peerscope portal",
    html: `
      <p>Hi ${client.name},</p>
      <p>Your agency has invited you to view your competitive intelligence reports on Peerscope.</p>
      <p>
        <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Access your portal
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">This link expires in 7 days and can only be used once.</p>
    `,
    text: `Hi ${client.name},\n\nYour agency has invited you to view your competitive intelligence reports on Peerscope.\n\nAccess your portal: ${magicLink}\n\nThis link expires in 7 days and can only be used once.`,
  })

  if (emailError) {
    console.error('Resend error:', emailError)
    return c.json(err('Failed to send invitation email'), 500)
  }

  return c.json(ok({ message: 'Invitation sent', email: client.email }))
})

// ── POST /reports/generate — build mock snapshot, store to R2, create draft ──
app.post('/reports/generate', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = GenerateReportSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const project = await repo.getProject(parsed.data.projectId)
  if (!project) return c.json(err('Project not found'), 404)

  const targets = await repo.listCompetitorTargets(parsed.data.projectId)
  const reportId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Build mock JSON snapshot — real crawl data will populate this later.
  const snapshot = {
    reportId,
    projectId: project.id,
    projectName: project.name,
    generatedAt: now,
    competitors: targets.map((t) => ({
      domain: t.domain,
      name: t.name,
      tracking: {
        pricing: t.track_pricing === 1,
        jobs: t.track_jobs === 1,
        reviews: t.track_reviews === 1,
        features: t.track_features === 1,
      },
      pricing: t.track_pricing === 1 ? { status: 'pending_crawl', data: null } : null,
      jobs: t.track_jobs === 1 ? { status: 'pending_crawl', data: null } : null,
      reviews: t.track_reviews === 1 ? { status: 'pending_crawl', data: null } : null,
      features: t.track_features === 1 ? { status: 'pending_crawl', data: null } : null,
    })),
    status: 'draft',
  }

  const report = await repo.createReport({
    id: reportId,
    projectId: project.id,
    title: `${project.name} Competitive Report`,
    snapshotJson: JSON.stringify(snapshot),
    generatedAt: now,
  })

  return c.json(ok(report), 201)
})

// ── GET /reports — list reports (filtered by projectId query param) ───────────
app.get('/reports', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  const url = new URL(c.req.url)
  const projectId = url.searchParams.get('projectId') ?? undefined
  const publishedOnly = role === 'client_viewer'
  const repo = createRepo(c.env.DB, agencyId)
  const reports = await repo.listReports({ projectId, publishedOnly })
  return c.json(ok(reports))
})

// ── GET /reports/:id — get report + load snapshot from R2 ─────────────────────
app.get('/reports/:id', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  const publishedOnly = role === 'client_viewer'
  const repo = createRepo(c.env.DB, agencyId)
  const report = await repo.getReport(c.req.param('id'), publishedOnly)
  if (!report) return c.json(err('Report not found'), 404)

  let snapshot: unknown = null
  if (report.snapshot_json) {
    try {
      snapshot = JSON.parse(report.snapshot_json) as unknown
    } catch {
      // Snapshot unreadable — return report without it
    }
  }

  return c.json(ok({ ...report, snapshot }))
})

// ── PATCH /reports/:id/publish — toggle draft → published ─────────────────────
app.patch('/reports/:id/publish', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const repo = createRepo(c.env.DB, agencyId)
  const report = await repo.getReport(c.req.param('id'))
  if (!report) return c.json(err('Report not found'), 404)

  const now = new Date().toISOString()
  const updated = await c.env.DB
    .prepare(
      "UPDATE reports SET status = 'published', published_at = ? WHERE id = ? AND agency_id = ? RETURNING *"
    )
    .bind(now, report.id, agencyId)
    .first<ReportRow>()

  if (!updated) return c.json(err('Failed to publish report'), 500)
  return c.json(ok(updated))
})

// ── POST /billing/checkout — create Stripe checkout session (AUD$249/mo) ─────
app.post('/billing/checkout', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_PRICE_ID) {
    return c.json(err('Billing not configured'), 503)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const agency = await repo.getAgency()
  if (!agency) return c.json(err('Agency not found'), 404)

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    // @ts-expect-error — CF Workers use fetch-based HTTP
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2024-12-18.acacia',
  })

  const baseUrl = c.env.BETTER_AUTH_URL ?? 'https://peerscope-waitlist.pages.dev'

  // Create or reuse the Stripe customer for this agency.
  let customerId = agency.stripe_customer_id ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: agency.name,
      metadata: { agency_id: agencyId },
    })
    customerId = customer.id
    await repo.updateAgencyStripe(customerId, agency.plan)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: c.env.STRIPE_PRICE_ID, quantity: 1 }],
    currency: 'aud',
    success_url: `${baseUrl}/portal/dashboard?billing=success`,
    cancel_url: `${baseUrl}/portal/dashboard?billing=cancelled`,
    metadata: { agency_id: agencyId },
    subscription_data: { metadata: { agency_id: agencyId } },
  })

  return c.json(ok({ url: session.url }))
})

// ── POST /billing/webhook — handle Stripe subscription lifecycle events ───────
// PUBLIC: verified by Stripe signature header, NOT by agency JWT.
app.post('/billing/webhook', async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json(err('Billing not configured'), 503)
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    // @ts-expect-error — CF Workers use fetch-based HTTP
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2024-12-18.acacia',
  })

  const sig = c.req.header('stripe-signature')
  if (!sig) return c.json(err('Missing Stripe signature'), 400)

  const rawBody = await c.req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (e) {
    console.error('Stripe webhook signature verification failed:', e)
    return c.json(err('Invalid signature'), 400)
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const agencyId = subscription.metadata?.agency_id
      if (agencyId) {
        const plan = subscription.status === 'active' ? 'pro' : 'free'
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id
        const repo = createRepo(c.env.DB, agencyId)
        await repo.updateAgencyStripe(customerId, plan)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const agencyId = subscription.metadata?.agency_id
      if (agencyId) {
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id
        const repo = createRepo(c.env.DB, agencyId)
        await repo.updateAgencyStripe(customerId, 'free')
      }
      break
    }

    case 'invoice.payment_failed': {
      // Log for now; future: send dunning email via Resend.
      const invoice = event.data.object as Stripe.Invoice
      console.warn('Invoice payment failed:', invoice.id, invoice.customer)
      break
    }

    default:
      break
  }

  return c.json({ received: true })
})

// ─── Export ───────────────────────────────────────────────────────────────────
export const onRequest = handle(app)
