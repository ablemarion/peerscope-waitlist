/**
 * Demo invite claim API — Hono catch-all for /api/demo-invite/*
 *
 * POST /api/demo-invite/:token/claim  (public, no auth)
 *   - Validates the demo token (exists, not expired, not already claimed)
 *   - Accepts { email: string } in the request body
 *   - Creates a fresh demo agency for the prospect and seeds it with
 *     2 clients, 7 competitors, and 1 published report
 *   - Issues a 7-day session and sends a magic link via Resend
 *   - Returns { ok: true }
 *   - Returns 400 { error: "invalid_token" } if token is invalid/expired/used
 */

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { z } from 'zod'
import { Resend } from 'resend'
import type { D1Database } from '@cloudflare/workers-types'

// ─── Env bindings ─────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  RESEND_API_KEY?: string
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return { data, error: null } as const
}

function err(message: string) {
  return { data: null, error: message } as const
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

// ─── Demo seeder ──────────────────────────────────────────────────────────────
// Inline copy of the portal seedDemoData() function. Kept here to avoid a
// cross-function import boundary in Cloudflare Pages. Must stay in sync with
// the version in /functions/api/portal/[[route]].ts.

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
            summary: 'Fixed-price quoting on all jobs. No hidden fees — transparent upfront pricing.',
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

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>().basePath('/api/demo-invite')

// ── POST /:token/claim — public endpoint to claim a demo invite token ──────────
// Validates the token, creates a fresh demo agency, seeds it, and emails a
// magic login link to the prospect. Single-use: claimed_at prevents replay.
app.post('/:token/claim', async (c) => {
  const token = c.req.param('token')
  if (!token || token.length < 8) {
    return c.json(err('invalid_token'), 400)
  }

  const body = await c.req.json().catch(() => null)
  const schema = z.object({ email: z.string().email() })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err('A valid email address is required'), 400)
  }

  const { email } = parsed.data
  const db = c.env.DB

  // ── Validate token ────────────────────────────────────────────────────────────
  interface DemoTokenRow {
    token: string
    created_at: string
    expires_at: string
    claimed_at: string | null
    claimant_email: string | null
  }

  const row = await db
    .prepare('SELECT * FROM demo_tokens WHERE token = ? LIMIT 1')
    .bind(token)
    .first<DemoTokenRow>()

  if (!row) {
    return c.json(err('invalid_token'), 400)
  }

  if (new Date(row.expires_at) < new Date()) {
    return c.json(err('This demo link has expired. Ask your Peerscope contact for a new one.'), 400)
  }

  if (row.claimed_at) {
    return c.json(err('This demo link has already been used.'), 400)
  }

  // Atomic single-use enforcement: only update if still unclaimed.
  const now = new Date().toISOString()
  const marked = await db
    .prepare(
      "UPDATE demo_tokens SET claimed_at = ?, claimant_email = ? WHERE token = ? AND claimed_at IS NULL"
    )
    .bind(now, email, token)
    .run()

  if ((marked.meta?.changes ?? 0) === 0) {
    return c.json(err('This demo link has already been used.'), 400)
  }

  // ── Create a fresh demo agency for this prospect ──────────────────────────────
  const agencyId = crypto.randomUUID()
  const slug = `demo-${token.slice(0, 8)}`

  await db
    .prepare(
      `INSERT INTO agencies (id, name, slug, plan, primary_color, created_at)
       VALUES (?, 'Demo Agency', ?, 'pro', '#F59E0B', ?)`
    )
    .bind(agencyId, slug, now)
    .run()

  // ── Create the prospect as agency_admin ───────────────────────────────────────
  const userId = crypto.randomUUID()
  const name = email.split('@')[0]

  await db
    .prepare(
      `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, agency_id, agency_role)
       VALUES (?, ?, ?, 1, ?, ?, ?, 'agency_admin')`
    )
    .bind(userId, name, email, now, now, agencyId)
    .run()

  await db
    .prepare(
      "INSERT OR IGNORE INTO agency_users (agency_id, user_id, role) VALUES (?, ?, 'agency_admin')"
    )
    .bind(agencyId, userId)
    .run()

  // ── Seed demo data ────────────────────────────────────────────────────────────
  await seedDemoData(db, agencyId)

  // ── Create a 7-day session exchangeable for a JWT ─────────────────────────────
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

  // ── Send magic link email ─────────────────────────────────────────────────────
  const baseUrl = c.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://peerscope-waitlist.pages.dev'
  const magicLink = `${baseUrl}/portal/join?session=${sessionToken}`

  if (c.env.RESEND_API_KEY) {
    const resend = new Resend(c.env.RESEND_API_KEY)
    try {
      await resend.emails.send({
        from: 'Peerscope <onboarding@resend.dev>',
        to: email,
        subject: "Your Peerscope demo is ready — click to enter",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
            <p style="font-size:22px;font-weight:700;margin:0 0 4px">Your demo portal is live.</p>
            <p style="color:#666;margin:0 0 24px">Hi ${name}, we've set up a live competitive intelligence demo just for you.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />
            <p style="margin:0 0 8px">Your demo includes:</p>
            <ul style="color:#444;margin:0 0 20px;padding-left:20px;line-height:1.8">
              <li><strong>2 clients</strong> pre-configured with real competitor tracking</li>
              <li><strong>7 competitors</strong> already tracked across pricing, jobs & reviews</li>
              <li><strong>1 live report</strong> ready to explore</li>
            </ul>
            <p style="margin:0 0 24px">Click below to enter your demo portal — no password needed:</p>
            <p style="margin:0 0 24px">
              <a href="${magicLink}"
                 style="display:inline-block;padding:14px 28px;background:#F07C35;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">
                Enter your demo portal →
              </a>
            </p>
            <p style="font-size:12px;color:#aaa;margin:0 0 8px">This link logs you in automatically and expires in 7 days.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px" />
            <p style="font-size:13px;color:#666;margin:0">
              Questions? Reply to this email or reach us at
              <a href="mailto:onboarding@resend.dev" style="color:#F07C35">onboarding@resend.dev</a>
            </p>
          </div>
        `,
        text: `Your Peerscope demo is ready.\n\nHi ${name},\n\nWe've set up a live competitive intelligence demo for you with 2 clients, 7 competitors, and 1 live report ready to explore.\n\nClick this link to enter your demo portal:\n${magicLink}\n\nThis link expires in 7 days.\n\nQuestions? Reply to this email.`,
      })
    } catch (e) {
      // Email failure is non-fatal — log and continue. The prospect can request a new link.
      console.error('Failed to send demo invite email:', e)
    }
  }

  return c.json(ok({ ok: true }))
})

// ─── Export ───────────────────────────────────────────────────────────────────
export const onRequest = handle(app)
