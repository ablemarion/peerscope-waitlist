import { Resend } from 'resend'

interface Env {
  DB: D1Database
  NOTIFY_WEBHOOK_URL?: string
  RESEND_API_KEY?: string
  ALERT_EMAIL?: string
  DEBOUNCE: KVNamespace
}

const FROM = 'Henrik from Peerscope <onboarding@resend.dev>'

function extractFirstName(email: string): string {
  const local = email.split('@')[0]
  const segment = local.split(/[._+\-0-9]/)[0]
  if (!segment || segment.length < 2) return 'there'
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

async function sendWelcomeEmail(apiKey: string, email: string): Promise<void> {
  const resend = new Resend(apiKey)
  const firstName = extractFirstName(email)
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're on the Peerscope waitlist — beta access confirmed",
    text: `Hi ${firstName},

You're in. First 5 agencies get beta access free — after beta, agency plan is AUD$249/mo.

Peerscope monitors your competitors 24/7 and sends you an instant Slack or email alert the moment they change pricing, launch features, or post jobs. Know before your customers tell you.

I'm building this as a solo founder and I read every reply. Two questions:

1. What's the biggest competitor move that caught you off guard?
2. Know another founder who'd find this useful? Forward this or share the link: https://peerscope-waitlist.pages.dev

Henrik
Peerscope — Track your competitors. Not your budget.

P.S. Know a founder tracking competitor pricing in a spreadsheet? Forward them this: https://peerscope-waitlist.pages.dev`,
  })
}

interface WaitlistRequest {
  email: string
  source?: string
  session_id?: string
  variant?: string
  button_variant?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  ref_code?: string
  // Agency request fields (not stored in DB, surfaced in alert email only)
  name?: string
  agency_name?: string
  client_count?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const ALERT_EMAIL_DEFAULT = 'henrik@soederlund.com.au'

async function sendAlertEmail(
  apiKey: string,
  alertTo: string,
  email: string,
  name: string,
  source: string,
  variant: string,
  agencyFields?: { agency_name?: string; client_count?: string; submitted_name?: string }
): Promise<void> {
  const resend = new Resend(apiKey)
  const isAgencyRequest = source.includes('agency') || agencyFields?.agency_name
  const subject = isAgencyRequest
    ? `Agency early access request: ${agencyFields?.agency_name || name} <${email}>`
    : `New waitlist sign-up: ${email} (${source || 'direct'})`
  const agencySection = isAgencyRequest && agencyFields ? `
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
      <p style="color:#B8622A;font-weight:bold">Agency Request Details</p>
      ${agencyFields.submitted_name ? `<p><strong>Name:</strong> ${agencyFields.submitted_name}</p>` : ''}
      ${agencyFields.agency_name ? `<p><strong>Agency:</strong> ${agencyFields.agency_name}</p>` : ''}
      ${agencyFields.client_count ? `<p><strong>Clients:</strong> ${agencyFields.client_count}</p>` : ''}
  ` : ''
  await resend.emails.send({
    from: 'Peerscope Alerts <onboarding@resend.dev>',
    to: alertTo,
    subject,
    html: `
      <p><strong>New sign-up:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Source:</strong> ${source || 'direct/organic'}</p>
      <p><strong>Variant:</strong> ${variant}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      ${agencySection}
      <p><a href="https://peerscope-waitlist.pages.dev/admin/dashboard">View dashboard →</a></p>
    `,
  })
}

async function sendErrorAlertEmail(
  apiKey: string,
  alertTo: string,
  error: unknown,
  submittedEmail?: string
): Promise<void> {
  const resend = new Resend(apiKey)
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? '') : ''
  await resend.emails.send({
    from: 'Peerscope Alerts <onboarding@resend.dev>',
    to: alertTo,
    subject: '[PEERSCOPE ALERT] /api/waitlist error',
    html: `
      <p><strong>⚠️ /api/waitlist threw an error</strong></p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      ${submittedEmail ? `<p><strong>Submitted email:</strong> ${submittedEmail}</p>` : ''}
      <p><strong>Error:</strong> ${message}</p>
      ${stack ? `<pre style="background:#f4f4f4;padding:12px;font-size:12px">${stack}</pre>` : ''}
      <p><a href="https://peerscope-waitlist.pages.dev/admin/dashboard">View dashboard →</a></p>
    `,
  })
}

async function notifyNewSignup(webhookUrl: string, email: string, count: number, source: string): Promise<void> {
  const sourceTag = source !== 'direct' ? ` via \`${source}\`` : ''
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🎉 New Peerscope waitlist signup: \`${email}\`${sourceTag} (total: ${count})`,
    }),
  })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Captured outside try/catch so the catch block can include it in the error alert
  let submittedEmail: string | undefined

  try {
    const body = await context.request.json<WaitlistRequest>()
    const email = (body.email ?? '').trim().toLowerCase()
    submittedEmail = email || undefined
    const source = (body.source ?? 'direct').slice(0, 100)
    const sessionId = (body.session_id ?? '').slice(0, 64) || null
    const variant = (body.variant ?? 'b').slice(0, 10)
    const buttonVariant = (body.button_variant ?? '').slice(0, 20) || null
    const utmSource = (body.utm_source ?? '').slice(0, 100) || null
    const utmMedium = (body.utm_medium ?? '').slice(0, 100) || null
    const utmCampaign = (body.utm_campaign ?? '').slice(0, 200) || null
    const refCode = (body.ref_code ?? '').slice(0, 64) || null
    const agencyFields = {
      submitted_name: (body.name ?? '').slice(0, 100) || undefined,
      agency_name: (body.agency_name ?? '').slice(0, 200) || undefined,
      client_count: (body.client_count ?? '').slice(0, 20) || undefined,
    }

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const now = new Date().toISOString()
    const result = await context.env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, source, session_id, variant, button_variant, utm_source, utm_medium, utm_campaign, ref_code, created_at, signup_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(email, source, sessionId, variant, buttonVariant, utmSource, utmMedium, utmCampaign, refCode, now, now)
      .run()

    // Notify and email on new signups only (not duplicates)
    const isNew = (result.meta?.changes ?? 0) > 0
    if (isNew && sessionId) {
      context.waitUntil(
        context.env.DB.prepare(
          'UPDATE page_views SET converted = 1 WHERE id = (SELECT id FROM page_views WHERE session_id = ? ORDER BY created_at DESC LIMIT 1)'
        )
          .bind(sessionId)
          .run()
          .catch((err: unknown) => console.error('Conversion mark failed:', err))
      )
    }
    let signupCount: number | null = null
    if (isNew) {
      const countResult = await context.env.DB.prepare(
        'SELECT COUNT(*) as count FROM waitlist'
      ).first<{ count: number }>()
      signupCount = countResult?.count ?? null

      if (context.env.NOTIFY_WEBHOOK_URL) {
        context.waitUntil(
          notifyNewSignup(context.env.NOTIFY_WEBHOOK_URL, email, signupCount ?? 0, source)
        )
      }
      if (context.env.RESEND_API_KEY) {
        context.waitUntil(
          sendWelcomeEmail(context.env.RESEND_API_KEY, email).catch((err: unknown) => {
            console.error('Failed to send welcome email:', err)
          })
        )
        const alertTo = context.env.ALERT_EMAIL ?? ALERT_EMAIL_DEFAULT
        const firstName = agencyFields.submitted_name || extractFirstName(email)
        context.waitUntil(
          sendAlertEmail(context.env.RESEND_API_KEY, alertTo, email, firstName, source, variant, agencyFields).catch(
            (err: unknown) => console.error('Failed to send alert email:', err)
          )
        )
      }
    }

    return Response.json(
      { success: true, position: signupCount, isNew },
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Waitlist error:', err)

    // Fire error alert email with KV-based debounce (one alert per error type per 5 min)
    if (context.env.RESEND_API_KEY) {
      const errorType = err instanceof Error ? err.constructor.name : 'UnknownError'
      const debounceKey = `alert-debounce:${errorType}`
      const alreadyAlerted = await context.env.DEBOUNCE.get(debounceKey)
      if (!alreadyAlerted) {
        // Mark as alerted for 5 minutes before firing so concurrent requests don't double-alert
        await context.env.DEBOUNCE.put(debounceKey, '1', { expirationTtl: 300 })
        const alertTo = context.env.ALERT_EMAIL ?? ALERT_EMAIL_DEFAULT
        context.waitUntil(
          sendErrorAlertEmail(context.env.RESEND_API_KEY, alertTo, err, submittedEmail).catch(
            (alertErr: unknown) => console.error('Failed to send error alert email:', alertErr)
          )
        )
      }
    }

    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
