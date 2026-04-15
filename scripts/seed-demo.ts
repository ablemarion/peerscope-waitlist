#!/usr/bin/env tsx
/**
 * Demo seed script — bootstraps a complete agency with realistic data for agency demos.
 *
 * Usage:
 *   ADMIN_KEY=<your-key> BASE_URL=https://peerscope-waitlist.pages.dev npx tsx scripts/seed-demo.ts
 *
 * What it creates:
 *   1. Agency: "Acme Digital" (slug: acme-digital)
 *   2. Admin user + magic link invite (to AGENCY_ADMIN_EMAIL)
 *   3. Client: "RetailCo" with a client_viewer user
 *   4. Project: "SEO Tool Competitive Analysis"
 *   5. 4 competitor targets: Semrush, Ahrefs, Moz, Serpstat
 *   6. A published report with realistic populated snapshot data
 */

const BASE_URL = process.env.BASE_URL ?? 'https://peerscope-waitlist.pages.dev'
const ADMIN_KEY = process.env.ADMIN_KEY
const AGENCY_ADMIN_EMAIL = process.env.AGENCY_ADMIN_EMAIL ?? 'demo-admin@example.com'
const CLIENT_EMAIL = process.env.CLIENT_EMAIL ?? 'demo-client@example.com'

if (!ADMIN_KEY) {
  console.error('❌ ADMIN_KEY env var required. Get it from Cloudflare Pages > Settings > Environment Variables.')
  process.exit(1)
}

async function apiPost(path: string, body: unknown, jwt?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(ADMIN_KEY && path === '/api/portal/agencies' ? { 'X-Admin-Key': ADMIN_KEY } : {}),
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { data: unknown; error: string | null }
  if (json.error) throw new Error(`POST ${path} failed: ${json.error} (${res.status})`)
  return json.data
}

async function apiGet(path: string, jwt: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const json = (await res.json()) as { data: unknown; error: string | null }
  if (json.error) throw new Error(`GET ${path} failed: ${json.error} (${res.status})`)
  return json.data
}

async function apiPatch(path: string, body: unknown, jwt: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { data: unknown; error: string | null }
  if (json.error) throw new Error(`PATCH ${path} failed: ${json.error} (${res.status})`)
  return json.data
}

// ─── Realistic demo snapshot ──────────────────────────────────────────────────

function buildDemoSnapshot(reportId: string, projectId: string): string {
  const now = new Date().toISOString()
  const snapshot = {
    reportId,
    projectId,
    projectName: 'SEO Tool Competitive Analysis',
    generatedAt: now,
    competitors: [
      {
        domain: 'semrush.com',
        name: 'Semrush',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: '3 plans from USD$129.95/mo to USD$499.95/mo',
            plans: [
              { name: 'Pro', price: 129.95, currency: 'USD', period: 'monthly', highlight: 'Best for freelancers' },
              { name: 'Guru', price: 249.95, currency: 'USD', period: 'monthly', highlight: 'Best for agencies' },
              { name: 'Business', price: 499.95, currency: 'USD', period: 'monthly', highlight: 'Best for enterprises' },
            ],
            hasFreeTrialOrTier: true,
            lastChecked: now,
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 47,
            byDepartment: { Engineering: 18, Sales: 12, Marketing: 9, Design: 5, Other: 3 },
            hiringSignal: 'high',
            lastChecked: now,
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.5,
            g2Count: 1847,
            capterra: 4.6,
            summary: 'Strong NPS, praised for keyword database depth. Complaints about steep learning curve.',
            lastChecked: now,
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: '2026-03-28', type: 'new', description: 'AI-powered keyword clustering in Pro+ plans' },
              { date: '2026-02-14', type: 'improvement', description: 'Site Audit now supports 1M pages for Business tier' },
            ],
            lastChecked: now,
          },
        },
      },
      {
        domain: 'ahrefs.com',
        name: 'Ahrefs',
        tracking: { pricing: true, jobs: true, reviews: true, features: true },
        pricing: {
          status: 'populated',
          data: {
            summary: '4 plans from USD$129/mo to USD$449/mo',
            plans: [
              { name: 'Lite', price: 129, currency: 'USD', period: 'monthly', highlight: 'For small sites' },
              { name: 'Standard', price: 249, currency: 'USD', period: 'monthly', highlight: 'For growing agencies' },
              { name: 'Advanced', price: 449, currency: 'USD', period: 'monthly', highlight: 'For large teams' },
              { name: 'Enterprise', price: null, currency: 'USD', period: 'monthly', highlight: 'Custom pricing' },
            ],
            hasFreeTrialOrTier: false,
            lastChecked: now,
          },
        },
        jobs: {
          status: 'populated',
          data: {
            openRoles: 12,
            byDepartment: { Engineering: 7, Marketing: 3, Other: 2 },
            hiringSignal: 'low',
            lastChecked: now,
          },
        },
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.6,
            g2Count: 523,
            capterra: 4.7,
            summary: 'Top-rated for backlink data accuracy. No free tier is a frequent complaint.',
            lastChecked: now,
          },
        },
        features: {
          status: 'populated',
          data: {
            recentChanges: [
              { date: '2026-03-15', type: 'new', description: 'Content Explorer 3.0 with AI summarisation' },
            ],
            lastChecked: now,
          },
        },
      },
      {
        domain: 'moz.com',
        name: 'Moz Pro',
        tracking: { pricing: true, jobs: false, reviews: true, features: false },
        pricing: {
          status: 'populated',
          data: {
            summary: '4 plans from USD$99/mo to USD$599/mo',
            plans: [
              { name: 'Starter', price: 99, currency: 'USD', period: 'monthly', highlight: 'Basic SEO tracking' },
              { name: 'Standard', price: 179, currency: 'USD', period: 'monthly', highlight: 'Most popular' },
              { name: 'Medium', price: 299, currency: 'USD', period: 'monthly', highlight: 'For agencies' },
              { name: 'Large', price: 599, currency: 'USD', period: 'monthly', highlight: 'Enterprise' },
            ],
            hasFreeTrialOrTier: true,
            lastChecked: now,
          },
        },
        jobs: null,
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.3,
            g2Count: 411,
            capterra: 4.4,
            summary: 'Respected brand, Domain Authority metric is industry standard. Interface feels dated.',
            lastChecked: now,
          },
        },
        features: null,
      },
      {
        domain: 'serpstat.com',
        name: 'Serpstat',
        tracking: { pricing: true, jobs: false, reviews: true, features: false },
        pricing: {
          status: 'populated',
          data: {
            summary: '4 plans from USD$69/mo to USD$499/mo — aggressive pricing vs Semrush',
            plans: [
              { name: 'Individual', price: 69, currency: 'USD', period: 'monthly', highlight: 'Solopreneur' },
              { name: 'Team', price: 149, currency: 'USD', period: 'monthly', highlight: 'Small agencies' },
              { name: 'Agency', price: 299, currency: 'USD', period: 'monthly', highlight: 'Growing agencies' },
              { name: 'Enterprise', price: 499, currency: 'USD', period: 'monthly', highlight: 'Large teams' },
            ],
            hasFreeTrialOrTier: true,
            lastChecked: now,
          },
        },
        jobs: null,
        reviews: {
          status: 'populated',
          data: {
            g2Rating: 4.6,
            g2Count: 389,
            capterra: 4.7,
            summary: 'Best value in the market. Data accuracy behind Semrush/Ahrefs but pricing 40% lower.',
            lastChecked: now,
          },
        },
        features: null,
      },
    ],
    status: 'published',
  }
  return JSON.stringify(snapshot)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Seeding demo agency at ${BASE_URL}\n`)

  // 1. Create agency
  console.log('1. Creating agency "Acme Digital"...')
  const agency = (await apiPost('/api/portal/agencies', {
    name: 'Acme Digital',
    slug: 'acme-digital',
    adminEmail: AGENCY_ADMIN_EMAIL,
  })) as { id: string; name: string }
  console.log(`   ✅ Agency created: ${agency.id}`)

  // 2. Send admin invite (magic link will be emailed to AGENCY_ADMIN_EMAIL)
  console.log(`\n2. Sending admin invite to ${AGENCY_ADMIN_EMAIL}...`)
  console.log('   ℹ️  Check your email for the magic link to log in as agency admin.')
  console.log('   ℹ️  To continue seeding, accept the invite and copy the JWT from localStorage.')
  console.log('\n   Once logged in, set JWT_TOKEN env var and run:')
  console.log('   JWT_TOKEN=<your-jwt> AGENCY_ID=' + agency.id + ' BASE_URL=' + BASE_URL + ' npx tsx scripts/seed-demo-step2.ts')

  console.log('\n✅ Step 1 complete. Agency ID: ' + agency.id)
  console.log('\nAlternatively, use the D1 console to insert demo data directly:\n')

  const reportId = crypto.randomUUID()
  const projectId = crypto.randomUUID()
  const snapshot = buildDemoSnapshot(reportId, projectId)

  console.log('-- Run these SQL commands in your D1 console (Cloudflare Dashboard):')
  console.log(`-- Agency ID: ${agency.id}`)
  console.log('')
  // Client 1: RetailCo (SEO tools)
  console.log(`INSERT INTO clients (id, agency_id, name, email, status, created_at, updated_at)`)
  console.log(`VALUES ('client-retailco-001', '${agency.id}', 'RetailCo', 'retailco@example.com', 'active', datetime('now'), datetime('now'));`)
  console.log('')
  console.log(`INSERT INTO projects (id, agency_id, client_id, name, description, created_at, updated_at)`)
  console.log(`VALUES ('${projectId}', '${agency.id}', 'client-retailco-001', 'SEO Tool Competitive Analysis', 'Track pricing and positioning of key SEO tools', datetime('now'), datetime('now'));`)
  console.log('')
  console.log(`INSERT INTO competitor_targets (id, project_id, domain, name, track_pricing, track_jobs, track_reviews, track_features, created_at, updated_at)`)
  console.log(`VALUES`)
  console.log(`  ('ct-semrush', '${projectId}', 'semrush.com', 'Semrush', 1, 1, 1, 1, datetime('now'), datetime('now')),`)
  console.log(`  ('ct-ahrefs', '${projectId}', 'ahrefs.com', 'Ahrefs', 1, 1, 1, 1, datetime('now'), datetime('now')),`)
  console.log(`  ('ct-moz', '${projectId}', 'moz.com', 'Moz Pro', 1, 0, 1, 0, datetime('now'), datetime('now')),`)
  console.log(`  ('ct-serpstat', '${projectId}', 'serpstat.com', 'Serpstat', 1, 0, 1, 0, datetime('now'), datetime('now'));`)
  console.log('')
  console.log(`INSERT INTO reports (id, project_id, agency_id, title, status, snapshot_json, generated_at, published_at, created_at, updated_at)`)
  console.log(`VALUES ('${reportId}', '${projectId}', '${agency.id}', 'SEO Tool Competitive Analysis — April 2026', 'published', '${snapshot.replace(/'/g, "''")}', datetime('now'), datetime('now'), datetime('now'), datetime('now'));`)

  // Client 2: Brightline Health (project management tools)
  const projectId2 = crypto.randomUUID()
  console.log('')
  console.log('-- Client 2: Brightline Health')
  console.log(`INSERT INTO clients (id, agency_id, name, email, status, created_at, updated_at)`)
  console.log(`VALUES ('client-brightline-001', '${agency.id}', 'Brightline Health', 'ops@brightlinehealth.example.com', 'active', datetime('now'), datetime('now'));`)
  console.log('')
  console.log(`INSERT INTO projects (id, agency_id, client_id, name, description, created_at, updated_at)`)
  console.log(`VALUES ('${projectId2}', '${agency.id}', 'client-brightline-001', 'Project Management SaaS Landscape', 'Monitor pricing and hiring signals across PM tools', datetime('now'), datetime('now'));`)
  console.log('')
  console.log(`INSERT INTO competitor_targets (id, project_id, domain, name, track_pricing, track_jobs, track_reviews, track_features, created_at, updated_at)`)
  console.log(`VALUES`)
  console.log(`  ('ct-asana', '${projectId2}', 'asana.com', 'Asana', 1, 1, 1, 1, datetime('now'), datetime('now')),`)
  console.log(`  ('ct-linear', '${projectId2}', 'linear.app', 'Linear', 1, 1, 1, 1, datetime('now'), datetime('now')),`)
  console.log(`  ('ct-clickup', '${projectId2}', 'clickup.com', 'ClickUp', 1, 1, 1, 0, datetime('now'), datetime('now'));`)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
