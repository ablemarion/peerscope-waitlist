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
  CreateClientCompetitorSchema,
  UpdateClientCompetitorSchema,
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
  /** Stripe price ID for the monthly plan. */
  STRIPE_PRICE_ID_MONTHLY?: string
  /** Legacy alias — kept for backwards compat with existing deployments. */
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

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

// ─── Demo seeder ──────────────────────────────────────────────────────────────
// Seeds 2 clients, 7 competitors, and 1 published report per client into an
// existing agency. Called by POST /seed-demo and POST /api/demo-invite/:token/claim.

async function seedDemoData(db: D1Database, agencyId: string): Promise<void> {
  // ── CLIENT 1: Melbourne Plumbing Co ──────────────────────────────────────────
  const client1Id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO clients (id, agency_id, name, email, status, created_at)
       VALUES (?, ?, 'Melbourne Plumbing Co', 'info@melbourneplumbing.com.au', 'active', ?)`
    )
    .bind(client1Id, agencyId, daysAgo(30))
    .run()

  const project1Id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO projects (id, agency_id, client_id, name, description, created_at)
       VALUES (?, ?, ?, 'Local SEO & Brand Monitoring', 'Track competitor pricing, hiring activity, and service page changes across Melbourne plumbing market.', ?)`
    )
    .bind(project1Id, agencyId, client1Id, daysAgo(28))
    .run()

  const plumbingCompetitors = [
    { name: 'Melbourne Emergency Plumbers', domain: 'melbourneemergencyplumbers.com.au' },
    { name: 'VIC Plumbing Solutions', domain: 'vicplumbingsolutions.com.au' },
    { name: 'PlumbCo Melbourne', domain: 'plumbcomelbourne.com.au' },
    { name: 'Rapid Response Plumbing', domain: 'rapidresponseplumbing.com.au' },
  ]
  for (const comp of plumbingCompetitors) {
    await db
      .prepare(
        `INSERT INTO competitor_targets (id, project_id, domain, name, track_pricing, track_jobs, track_reviews, track_features)
         VALUES (?, ?, ?, ?, 1, 1, 1, 1)`
      )
      .bind(crypto.randomUUID(), project1Id, comp.domain, comp.name)
      .run()
  }

  const report1Id = crypto.randomUUID()
  const report1GeneratedAt = daysAgo(2)
  const snapshot1 = {
    reportId: report1Id,
    projectId: project1Id,
    projectName: 'Local SEO & Brand Monitoring',
    generatedAt: report1GeneratedAt,
    competitors: [
      {
        domain: 'melbourneemergencyplumbers.com.au',
        name: 'Melbourne Emergency Plumbers',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Flat call-out fee of $95 + labour. Emergency surcharge bumped from $85 to $95 on 8 Apr.',
            plans: [
              { name: 'Standard Call-Out', price: 95, currency: 'AUD', period: 'call', highlight: 'Includes first 30 min' },
              { name: 'After Hours', price: 165, currency: 'AUD', period: 'call', highlight: '6pm – 6am' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(2),
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 3,
            byDepartment: { 'Field Technicians': 2, 'Customer Service': 1 },
            hiringSignal: 'medium',
            lastChecked: daysAgo(2),
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.6,
            g2Count: 218,
            capterra: 4.5,
            summary: 'Customers praise fast response times. Recurring complaints about after-hours surcharge transparency.',
            lastChecked: daysAgo(2),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(8), type: 'pricing', description: 'Emergency call-out surcharge increased from $85 to $95.' },
              { date: daysAgo(14), type: 'service', description: "New service page added: 'Grease Trap Cleaning'." },
              { date: daysAgo(21), type: 'content', description: "Blog published: '5 Signs Your Hot Water System Needs Replacing'." },
            ],
            lastChecked: daysAgo(2),
          },
        },
      },
      {
        domain: 'vicplumbingsolutions.com.au',
        name: 'VIC Plumbing Solutions',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Fixed-price quoting on all jobs. Blocked hidden fee model — transparent upfront pricing.',
            plans: [
              { name: 'Blocked Drain', price: 189, currency: 'AUD', period: 'fixed', highlight: 'No call-out fee' },
              { name: 'Hot Water Service', price: 290, currency: 'AUD', period: 'fixed', highlight: 'Parts included' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(2),
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 1,
            byDepartment: { 'Field Technicians': 1 },
            hiringSignal: 'low',
            lastChecked: daysAgo(2),
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.3,
            g2Count: 97,
            capterra: 4.2,
            summary: 'Strong on fixed-price transparency. Response time mixed outside metro Melbourne.',
            lastChecked: daysAgo(2),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(5), type: 'content', description: 'Homepage hero updated — now emphasises same-day availability.' },
              { date: daysAgo(19), type: 'service', description: "Added 'CCTV Drain Inspection' to service menu." },
            ],
            lastChecked: daysAgo(2),
          },
        },
      },
      {
        domain: 'plumbcomelbourne.com.au',
        name: 'PlumbCo Melbourne',
        tracking: { pricing: true, jobs: false, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Hourly rate model at $120/hr. No fixed-price quotes offered on site.',
            plans: [
              { name: 'Hourly Labour', price: 120, currency: 'AUD', period: 'hr', highlight: 'Min 1 hr' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(2),
          },
        },
        jobs: null,
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 3.9,
            g2Count: 44,
            capterra: 3.8,
            summary: 'Polarised reviews — strong regulars but several complaints about delays on new bookings.',
            lastChecked: daysAgo(2),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(11), type: 'pricing', description: 'Hourly rate increased from $110 to $120.' },
            ],
            lastChecked: daysAgo(2),
          },
        },
      },
      {
        domain: 'rapidresponseplumbing.com.au',
        name: 'Rapid Response Plumbing',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Competitive flat rate of $79 call-out, positioning aggressively against emergency specialists.',
            plans: [
              { name: 'Standard Call-Out', price: 79, currency: 'AUD', period: 'call', highlight: '30-min guarantee' },
              { name: 'Weekend Rate', price: 120, currency: 'AUD', period: 'call', highlight: 'Sat & Sun' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(2),
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 5,
            byDepartment: { 'Field Technicians': 4, 'Dispatch': 1 },
            hiringSignal: 'high',
            lastChecked: daysAgo(2),
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.7,
            g2Count: 312,
            capterra: 4.6,
            summary: 'Highest-rated competitor. Customers consistently mention the 30-minute guarantee. Growing fast.',
            lastChecked: daysAgo(2),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(3), type: 'service', description: "Launched 'Commercial Plumbing' service line with dedicated landing page." },
              { date: daysAgo(9), type: 'content', description: 'Added customer testimonial video to homepage.' },
              { date: daysAgo(17), type: 'pricing', description: 'Weekend rate reduced from $140 to $120 — likely a promotional move.' },
            ],
            lastChecked: daysAgo(2),
          },
        },
      },
    ],
    status: 'published',
  }

  await db
    .prepare(
      `INSERT INTO reports (id, project_id, agency_id, title, status, snapshot_json, generated_at, published_at, created_at)
       VALUES (?, ?, ?, 'Melbourne Plumbing Co — Competitive Report', 'published', ?, ?, ?, ?)`
    )
    .bind(report1Id, project1Id, agencyId, JSON.stringify(snapshot1), report1GeneratedAt, report1GeneratedAt, daysAgo(2))
    .run()

  // ── CLIENT 2: Sydney Dental Group ─────────────────────────────────────────────
  const client2Id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO clients (id, agency_id, name, email, status, created_at)
       VALUES (?, ?, 'Sydney Dental Group', 'admin@sydneydentalgroup.com.au', 'active', ?)`
    )
    .bind(client2Id, agencyId, daysAgo(25))
    .run()

  const project2Id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO projects (id, agency_id, client_id, name, description, created_at)
       VALUES (?, ?, ?, 'Competitor Intelligence', 'Monitor pricing, service launches, and patient reviews across the Sydney dental market.', ?)`
    )
    .bind(project2Id, agencyId, client2Id, daysAgo(23))
    .run()

  const dentalCompetitors = [
    { name: 'Sydney CBD Dental', domain: 'sydneycbddental.com.au' },
    { name: 'SydSmile Dental', domain: 'sydsmile.com.au' },
    { name: 'Bright Dental Sydney', domain: 'brightdentalsydney.com.au' },
  ]
  for (const comp of dentalCompetitors) {
    await db
      .prepare(
        `INSERT INTO competitor_targets (id, project_id, domain, name, track_pricing, track_jobs, track_reviews, track_features)
         VALUES (?, ?, ?, ?, 1, 1, 1, 1)`
      )
      .bind(crypto.randomUUID(), project2Id, comp.domain, comp.name)
      .run()
  }

  const report2Id = crypto.randomUUID()
  const report2GeneratedAt = daysAgo(1)
  const snapshot2 = {
    reportId: report2Id,
    projectId: project2Id,
    projectName: 'Competitor Intelligence',
    generatedAt: report2GeneratedAt,
    competitors: [
      {
        domain: 'sydneycbddental.com.au',
        name: 'Sydney CBD Dental',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Premium positioning. Teeth whitening now $399 (was $349) — 14% price increase effective 1 Apr.',
            plans: [
              { name: 'Scale & Clean', price: 180, currency: 'AUD', period: 'visit', highlight: 'New patient discount 20% off' },
              { name: 'Teeth Whitening', price: 399, currency: 'AUD', period: 'visit', highlight: 'Raised from $349 on 1 Apr' },
              { name: 'Invisalign', price: 6500, currency: 'AUD', period: 'treatment', highlight: 'From price' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(1),
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 2,
            byDepartment: { 'Dentists': 1, 'Reception': 1 },
            hiringSignal: 'low',
            lastChecked: daysAgo(1),
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.8,
            g2Count: 534,
            capterra: 4.7,
            summary: 'Dominant Google reviews presence. 12 new 5-star reviews in the last 7 days — possible review campaign underway.',
            lastChecked: daysAgo(1),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(13), type: 'pricing', description: 'Teeth whitening price raised from $349 to $399.' },
              { date: daysAgo(20), type: 'service', description: "New service launched: 'Invisalign treatment' with full landing page." },
              { date: daysAgo(7), type: 'content', description: 'Google Reviews spike: 12 new reviews in 7 days — active review generation.' },
            ],
            lastChecked: daysAgo(1),
          },
        },
      },
      {
        domain: 'sydsmile.com.au',
        name: 'SydSmile Dental',
        tracking: { pricing: true, jobs: false, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Value-led positioning. Consistent low-cost entry points targeting price-sensitive patients.',
            plans: [
              { name: 'Scale & Clean', price: 120, currency: 'AUD', period: 'visit', highlight: 'Includes X-rays' },
              { name: 'Teeth Whitening', price: 249, currency: 'AUD', period: 'visit', highlight: 'Take-home kit included' },
            ],
            hasFreeTrialOrTier: true,
            lastChecked: daysAgo(1),
          },
        },
        jobs: null,
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.2,
            g2Count: 189,
            capterra: 4.1,
            summary: 'Positive on price and friendliness. Several recent reviews mention wait times and parking.',
            lastChecked: daysAgo(1),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(4), type: 'content', description: 'Homepage updated — new tagline and before/after whitening gallery.' },
              { date: daysAgo(16), type: 'service', description: "Added 'Emergency Dental' page targeting same-day appointments." },
            ],
            lastChecked: daysAgo(1),
          },
        },
      },
      {
        domain: 'brightdentalsydney.com.au',
        name: 'Bright Dental Sydney',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: 'Mid-market pricing with bundle offers. New family plan launched this month.',
            plans: [
              { name: 'Scale & Clean', price: 150, currency: 'AUD', period: 'visit', highlight: 'Standard consult' },
              { name: 'Family Plan', price: 89, currency: 'AUD', period: 'mo', highlight: 'Launched Mar 2026 — up to 4 family members' },
              { name: 'Veneers', price: 1200, currency: 'AUD', period: 'per tooth', highlight: 'Composite from price' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: daysAgo(1),
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 4,
            byDepartment: { 'Dentists': 2, 'Dental Assistants': 1, 'Reception': 1 },
            hiringSignal: 'high',
            lastChecked: daysAgo(1),
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.5,
            g2Count: 276,
            capterra: 4.4,
            summary: 'Strong satisfaction across family services. Hiring signal and new family plan suggest aggressive growth phase.',
            lastChecked: daysAgo(1),
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: daysAgo(6), type: 'service', description: "Launched 'Family Dental Plan' subscription — $89/mo for up to 4 members." },
              { date: daysAgo(12), type: 'pricing', description: 'Veneer pricing now listed publicly (was "call for quote").' },
              { date: daysAgo(24), type: 'content', description: 'New blog series: Monthly dental tips — first two posts published.' },
            ],
            lastChecked: daysAgo(1),
          },
        },
      },
    ],
    status: 'published',
  }

  await db
    .prepare(
      `INSERT INTO reports (id, project_id, agency_id, title, status, snapshot_json, generated_at, published_at, created_at)
       VALUES (?, ?, ?, 'Sydney Dental Group — Competitive Report', 'published', ?, ?, ?, ?)`
    )
    .bind(report2Id, project2Id, agencyId, JSON.stringify(snapshot2), report2GeneratedAt, report2GeneratedAt, daysAgo(1))
    .run()
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

// ── POST /seed-demo — idempotent demo environment seeder (ADMIN_KEY gated) ────
// Run before a prospect call to populate a realistic agency portal demo.
// Deletes any existing demo agency (slug='demo') and recreates from scratch.
app.post('/seed-demo', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const provided = c.req.header('X-Admin-Key')
  if (!adminKey || provided !== adminKey) {
    return c.json(err('Forbidden'), 403)
  }

  const db = c.env.DB
  const now = new Date().toISOString()

  // ── Wipe any existing demo agency (cascade deletes all child rows) ──────────
  await db.prepare("DELETE FROM agencies WHERE slug = 'demo'").run()
  // Wipe the demo user + sessions so they don't accumulate
  await db.prepare("DELETE FROM user WHERE email = 'admin@acmedigital.com.au'").run()

  // ── Create demo agency ──────────────────────────────────────────────────────
  const agencyId = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO agencies (id, name, slug, plan, primary_color, created_at)
       VALUES (?, 'Acme Digital Agency', 'demo', 'pro', '#F59E0B', ?)`
    )
    .bind(agencyId, now)
    .run()

  // ── Create demo admin user ───────────────────────────────────────────────────
  const userId = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, agency_id, agency_role)
       VALUES (?, 'Demo Admin', 'admin@acmedigital.com.au', 1, ?, ?, ?, 'agency_admin')`
    )
    .bind(userId, now, now, agencyId)
    .run()

  await db
    .prepare(
      "INSERT INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'agency_admin')"
    )
    .bind(agencyId, userId)
    .run()

  // ── Create 7-day session for demo admin ─────────────────────────────────────
  const sessionId = crypto.randomUUID()
  const sessionToken = randomHex(32)
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await db
    .prepare(
      `INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(sessionId, sessionToken, userId, sessionExpiry, now, now)
    .run()

  // ── Seed clients, competitors, and reports ──────────────────────────────────
  await seedDemoData(db, agencyId)

  // ── Return seed summary ─────────────────────────────────────────────────────
  return c.json(ok({
    message: 'Demo environment seeded successfully.',
    agency: { id: agencyId, name: 'Acme Digital Agency', slug: 'demo' },
    clients: [
      { name: 'Melbourne Plumbing Co', competitors: 4, reports: 1 },
      { name: 'Sydney Dental Group', competitors: 3, reports: 1 },
    ],
    auth: {
      sessionToken,
      sessionExpiry,
      instructions: [
        '1. POST /api/portal/auth/token with { "sessionToken": "<sessionToken>" } to get a JWT.',
        '2. Use the JWT as: Authorization: Bearer <jwt> for all portal requests.',
        '3. The session expires in 7 days — re-run the seeder to reset.',
      ],
      portalUrl: 'https://peerscope-waitlist.pages.dev/portal/dashboard',
    },
  }))
})

// ── GET /admin/demo-links — list last 10 generated demo tokens (ADMIN_KEY gated) ──
// Returns token, url, created_at, expires_at, and claimed (bool) for each row.
// Auth: ?key={adminKey} query param (browser-friendly for page-load fetches).
app.get('/admin/demo-links', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const provided = c.req.query('key')
  if (!adminKey || provided !== adminKey) {
    return c.json(err('Forbidden'), 403)
  }

  const db = c.env.DB
  const baseUrl = c.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://peerscope-waitlist.pages.dev'

  interface DemoTokenRow {
    token: string
    created_at: string
    expires_at: string
    claimed_at: string | null
  }

  const rows = await db
    .prepare(
      'SELECT token, created_at, expires_at, claimed_at FROM demo_tokens ORDER BY created_at DESC LIMIT 10'
    )
    .all<DemoTokenRow>()

  const links = (rows.results ?? []).map((r) => ({
    token: r.token,
    url: `${baseUrl}/portal/demo/${r.token}`,
    created_at: r.created_at,
    expires_at: r.expires_at,
    claimed: r.claimed_at !== null,
  }))

  return c.json(ok(links))
})

// ── POST /admin/demo-links — generate a shareable demo invite URL (ADMIN_KEY gated) ──
// Returns a one-time token URL pointing to /portal/demo/:token.
// The prospect claims it at POST /api/demo-invite/:token/claim.
app.post('/admin/demo-links', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const provided = c.req.header('X-Admin-Key')
  if (!adminKey || provided !== adminKey) {
    return c.json(err('Forbidden'), 403)
  }

  const db = c.env.DB
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // 16-char URL-safe token derived from a UUID (hex, no dashes)
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  await db
    .prepare('INSERT INTO demo_tokens (token, created_at, expires_at) VALUES (?, ?, ?)')
    .bind(token, now, expiresAt)
    .run()

  const baseUrl = c.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://peerscope-waitlist.pages.dev'
  const url = `${baseUrl}/portal/demo/${token}`

  return c.json(ok({ url, token, expiresAt }), 201)
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

// ── DELETE /competitor-targets/:id ───────────────────────────────────────────
app.delete('/competitor-targets/:id', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const repo = createRepo(c.env.DB, agencyId)
  const deleted = await repo.deleteCompetitorTarget(c.req.param('id'))
  if (!deleted) return c.json(err('Target not found'), 404)
  return c.json(ok(null))
})

// ── GET /clients/:clientId/competitors ───────────────────────────────────────
app.get('/clients/:clientId/competitors', async (c) => {
  const { agencyId } = c.var.agencyCtx
  const repo = createRepo(c.env.DB, agencyId)
  const targets = await repo.listCompetitorTargetsByClient(c.req.param('clientId'))
  return c.json(ok(targets))
})

// ── POST /clients/:clientId/competitors ──────────────────────────────────────
app.post('/clients/:clientId/competitors', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = CreateClientCompetitorSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const target = await repo.createCompetitorForClient({
    clientId: c.req.param('clientId'),
    projectId: parsed.data.projectId,
    name: parsed.data.name,
    homepageUrl: parsed.data.homepageUrl,
    notes: parsed.data.notes,
  })
  if (!target) return c.json(err('Client or project not found'), 404)
  return c.json(ok(target), 201)
})

// ── PATCH /competitors/:id ────────────────────────────────────────────────────
app.patch('/competitors/:id', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const body = await c.req.json().catch(() => null)
  const parsed = UpdateClientCompetitorSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    return c.json(err(message), 400)
  }

  const repo = createRepo(c.env.DB, agencyId)
  const target = await repo.updateCompetitorTarget(c.req.param('id'), {
    name: parsed.data.name,
    homepageUrl: parsed.data.homepageUrl,
    notes: parsed.data.notes,
  })
  if (!target) return c.json(err('Competitor not found'), 404)
  return c.json(ok(target))
})

// ── DELETE /competitors/:id ───────────────────────────────────────────────────
app.delete('/competitors/:id', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const repo = createRepo(c.env.DB, agencyId)
  const deleted = await repo.deleteCompetitorTarget(c.req.param('id'))
  if (!deleted) return c.json(err('Competitor not found'), 404)
  return c.json(ok(null))
})

// ── POST /clients/:id/invite — generate magic-link and send via Resend ───────
app.post('/clients/:id/invite', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const repo = createRepo(c.env.DB, agencyId)
  const client = await repo.getClient(c.req.param('id'))
  if (!client) return c.json(err('Client not found'), 404)

  // Generate raw token (64 hex chars = 32 random bytes) and store only the hash.
  const rawToken = randomHex(32)
  const tokenHash = await sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const invitation = await repo.createInvitation({
    clientId: client.id,
    email: client.email,
    tokenHash,
    expiresAt,
  })

  const magicLink = `https://peerscope-waitlist.pages.dev/portal/join?token=${rawToken}`

  // Attempt email delivery — failure is non-fatal: return magic link so admin can share manually.
  let emailSent = false
  if (c.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(c.env.RESEND_API_KEY)
      const { error: emailError } = await resend.emails.send({
        from: 'Peerscope <onboarding@resend.dev>',
        to: client.email,
        subject: "You've been invited to your Peerscope portal",
        html: `
          <p>Hi ${client.name},</p>
          <p>Your agency has invited you to view your competitive intelligence reports on Peerscope.</p>
          <p>
            <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#F59E0B;color:#0D0F1A;border-radius:6px;text-decoration:none;font-weight:600;">
              Access your portal
            </a>
          </p>
          <p style="color:#6b7280;font-size:14px;">This link expires in 7 days and can only be used once.</p>
        `,
        text: `Hi ${client.name},\n\nYour agency has invited you to view your competitive intelligence reports on Peerscope.\n\nAccess your portal: ${magicLink}\n\nThis link expires in 7 days and can only be used once.`,
      })
      if (emailError) {
        console.error('Resend error:', emailError)
      } else {
        emailSent = true
      }
    } catch (e) {
      console.error('Resend threw:', e)
    }
  }

  return c.json(ok({
    invitationId: invitation.id,
    magicLink,
    emailSent,
  }))
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

// ── POST /billing/checkout — create Stripe checkout session ───────────────────
app.post('/billing/checkout', async (c) => {
  const { agencyId, role, userId } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  const priceId = c.env.STRIPE_PRICE_ID_MONTHLY ?? c.env.STRIPE_PRICE_ID
  if (!c.env.STRIPE_SECRET_KEY || !priceId) {
    return c.json(
      { error: 'billing_not_configured', message: 'Billing setup in progress — contact support.' },
      503
    )
  }

  const repo = createRepo(c.env.DB, agencyId)
  const agency = await repo.getAgency()
  if (!agency) return c.json(err('Agency not found'), 404)

  // Fetch user email for pre-filling the Stripe checkout form.
  const userRow = await c.env.DB
    .prepare('SELECT email FROM user WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<{ email: string }>()

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
      email: userRow?.email,
      metadata: { agency_id: agencyId },
    })
    customerId = customer.id
    await repo.updateAgencyStripe(customerId, agency.plan)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : userRow?.email,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    currency: 'aud',
    success_url: `${baseUrl}/portal/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/billing`,
    metadata: { agency_id: agencyId },
    subscription_data: { metadata: { agency_id: agencyId } },
  })

  return c.json(ok({ url: session.url }))
})

// ── POST /billing/portal-link — Stripe customer portal session ────────────────
app.post('/billing/portal-link', async (c) => {
  const { agencyId, role } = c.var.agencyCtx
  if (role !== 'agency_admin') return c.json(err('Forbidden'), 403)

  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json(
      { error: 'billing_not_configured', message: 'Billing setup in progress — contact support.' },
      503
    )
  }

  const repo = createRepo(c.env.DB, agencyId)
  const agency = await repo.getAgency()
  if (!agency?.stripe_customer_id) return c.json(err('No billing account found'), 404)

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    // @ts-expect-error — CF Workers use fetch-based HTTP
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2024-12-18.acacia',
  })

  const baseUrl = c.env.BETTER_AUTH_URL ?? 'https://peerscope-waitlist.pages.dev'
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: agency.stripe_customer_id,
    return_url: `${baseUrl}/portal/billing`,
  })

  return c.json(ok({ url: portalSession.url }))
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
    case 'checkout.session.completed': {
      // Fired when the customer completes the Stripe-hosted checkout page.
      // Mark as active immediately; subscription.created fires shortly after.
      const session = event.data.object as Stripe.CheckoutSession
      const agencyId = session.metadata?.agency_id
      if (agencyId && session.customer) {
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer.id
        const repo = createRepo(c.env.DB, agencyId)
        await repo.updateAgencyStripe(customerId, 'pro')
      }
      break
    }

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
        await repo.updateAgencyStripe(customerId, 'cancelled')
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

// ── GET /admin/activate/:signupId — one-click agency onboarding from Henrik's email ──
// Protected by ADMIN_KEY in ?key= query param (so it works as an email link).
// Creates the agency, admin user, session, and sends the prospect a welcome email.
// Idempotent: clicking the link twice returns a "already activated" page.
app.get('/admin/activate/:signupId', async (c) => {
  const adminKey = c.env.ADMIN_KEY
  const provided = c.req.query('key')
  if (!adminKey || provided !== adminKey) {
    return c.html(activateErrorHtml('Forbidden', 'Invalid or missing admin key.'), 403)
  }

  const signupId = c.req.param('signupId')
  const baseUrl = c.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://peerscope-waitlist.pages.dev'

  interface SignupRow {
    id: string
    agency_name: string
    name: string
    email: string
    client_count: string
    current_method: string | null
    status: string | null
    activated_at: string | null
    agency_id: string | null
  }

  const signup = await c.env.DB
    .prepare('SELECT id, agency_name, name, email, client_count, current_method, status, activated_at, agency_id FROM agency_signups WHERE id = ? LIMIT 1')
    .bind(signupId)
    .first<SignupRow>()

  if (!signup) {
    return c.html(activateErrorHtml('Not found', `No signup found with ID: ${signupId}`), 404)
  }

  // Idempotent — return success if already activated
  if (signup.status === 'activated' && signup.agency_id) {
    const dashUrl = `${baseUrl}/portal/dashboard`
    return c.html(activateSuccessHtml(signup.agency_name, signup.email, dashUrl, true))
  }

  const db = c.env.DB
  const now = new Date().toISOString()

  // Generate a URL-safe slug from the agency name
  const baseSlug = signup.agency_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'agency'

  let slug = baseSlug
  const slugConflict = await db
    .prepare('SELECT id FROM agencies WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{ id: string }>()
  if (slugConflict) {
    slug = `${baseSlug}-${randomHex(3)}`
  }

  // Create the agency
  const agency = await db
    .prepare('INSERT INTO agencies (name, slug) VALUES (?, ?) RETURNING id, name, slug')
    .bind(signup.agency_name, slug)
    .first<{ id: string; name: string; slug: string }>()

  if (!agency) {
    return c.html(activateErrorHtml('Error', 'Failed to create agency record in database.'), 500)
  }

  // Create the agency admin user
  const userId = crypto.randomUUID()
  const userName = signup.name || signup.email.split('@')[0]
  await db
    .prepare(
      `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, agency_id, agency_role)
       VALUES (?, ?, ?, 1, ?, ?, ?, 'agency_admin')`
    )
    .bind(userId, userName, signup.email, now, now, agency.id)
    .run()

  // Link user to agency
  await db
    .prepare("INSERT OR IGNORE INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'agency_admin')")
    .bind(agency.id, userId)
    .run()

  // Create a 30-day session for the new agency admin
  const sessionId = crypto.randomUUID()
  const sessionToken = randomHex(32)
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await db
    .prepare(
      `INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(sessionId, sessionToken, userId, sessionExpiry, now, now)
    .run()

  // Mark signup as activated
  await db
    .prepare("UPDATE agency_signups SET status = 'activated', activated_at = ?, agency_id = ? WHERE id = ?")
    .bind(now, agency.id, signupId)
    .run()

  // Portal login magic link for the prospect
  const portalLoginUrl = `${baseUrl}/portal/join?session=${sessionToken}`

  // Send welcome email to the agency prospect
  if (c.env.RESEND_API_KEY) {
    const resend = new Resend(c.env.RESEND_API_KEY)
    try {
      await resend.emails.send({
        from: 'Peerscope <onboarding@resend.dev>',
        to: signup.email,
        subject: `You're in — your Peerscope portal is ready`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
            <p style="font-size:24px;font-weight:700;margin:0 0 4px">You're approved. 🎉</p>
            <p style="color:#666;margin:0 0 24px">Hi ${signup.name}, your Peerscope agency portal is live.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />
            <p style="margin:0 0 8px">Your agency <strong>${signup.agency_name}</strong> is set up and ready to go.</p>
            <p style="margin:0 0 24px;color:#666">Click below to access your portal and start tracking your clients' competitors:</p>
            <p style="margin:0 0 24px">
              <a href="${portalLoginUrl}"
                 style="display:inline-block;padding:14px 28px;background:#F07C35;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">
                Access your portal →
              </a>
            </p>
            <p style="font-size:12px;color:#aaa;margin:0 0 8px">This link logs you in automatically and expires in 30 days.</p>
            <p style="font-size:12px;color:#aaa;margin:0 0 24px">After logging in, bookmark your portal at <strong>peerscope-waitlist.pages.dev/portal</strong>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />
            <p style="font-size:13px;color:#666;margin:0">
              Questions? Reply to this email or reach us at
              <a href="mailto:onboarding@resend.dev" style="color:#F07C35">onboarding@resend.dev</a>
            </p>
          </div>
        `,
      })
    } catch (e) {
      console.error('Failed to send welcome email to prospect:', e)
      // Don't fail the activation — Henrik can forward manually if needed.
    }
  }

  return c.html(activateSuccessHtml(agency.name, signup.email, portalLoginUrl, false))
})

// ── HTML helpers for /admin/activate ─────────────────────────────────────────

function activateSuccessHtml(agencyName: string, email: string, portalUrl: string, alreadyActivated: boolean): string {
  const heading = alreadyActivated ? 'Already activated' : 'Agency activated!'
  const subtext = alreadyActivated
    ? `${agencyName} was activated previously. The prospect's portal is at the link below.`
    : `${agencyName} is live. A welcome email with a magic login link was sent to ${email}.`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading} — Peerscope</title>
<style>body{font-family:system-ui,sans-serif;background:#0D0F1A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:420px;width:100%;text-align:center}
.icon{width:56px;height:56px;background:rgba(240,124,53,0.12);border:1px solid rgba(240,124,53,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
h1{font-size:20px;font-weight:700;margin:0 0 8px}p{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px}
a.btn{display:inline-block;padding:12px 24px;background:#F07C35;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px}
a.btn:hover{background:#E06A25}</style></head>
<body><div class="card">
<div class="icon">✅</div>
<h1>${heading}</h1>
<p>${subtext}</p>
<a href="${portalUrl}" class="btn">Open their portal →</a>
</div></body></html>`
}

function activateErrorHtml(title: string, detail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Peerscope</title>
<style>body{font-family:system-ui,sans-serif;background:#0D0F1A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:420px;width:100%;text-align:center}
.icon{width:56px;height:56px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
h1{font-size:20px;font-weight:700;margin:0 0 8px}p{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0}</style></head>
<body><div class="card">
<div class="icon">❌</div>
<h1>${title}</h1>
<p>${detail}</p>
</div></body></html>`
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const onRequest = handle(app)
