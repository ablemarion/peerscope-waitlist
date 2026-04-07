import { Resend } from 'resend'

interface Env {
  DB: D1Database
  NOTIFY_WEBHOOK_URL?: string
  RESEND_API_KEY?: string
}

const FROM = 'Henrik from Peerscope <hello@peerscope.io>'

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
    subject: "You're on the Peerscope waitlist — founding price locked",
    text: `Hi ${firstName},

You're in. Founding price locked at $49/mo for life — as long as you stay subscribed.

Peerscope monitors your competitors 24/7 and sends you an instant Slack or email alert the moment they change pricing, launch features, or post jobs. Know before your customers tell you.

I'm building this as a solo founder and I read every reply. Two questions:

1. What's the biggest competitor move that caught you off guard?
2. Know another founder who'd find this useful? Forward this or share the link: https://peerscope-waitlist.pages.dev

Henrik
Peerscope — Track your competitors. Not your budget.`,
  })
}

interface WaitlistRequest {
  email: string
  source?: string
  session_id?: string
  variant?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

  try {
    const body = await context.request.json<WaitlistRequest>()
    const email = (body.email ?? '').trim().toLowerCase()
    const source = (body.source ?? 'direct').slice(0, 100)
    const sessionId = (body.session_id ?? '').slice(0, 64) || null
    const variant = (body.variant ?? 'b').slice(0, 10)

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const now = new Date().toISOString()
    const result = await context.env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, source, session_id, variant, created_at, signup_ts) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(email, source, sessionId, variant, now, now)
      .run()

    // Notify and email on new signups only (not duplicates)
    const isNew = (result.meta?.changes ?? 0) > 0
    if (isNew && sessionId) {
      context.waitUntil(
        context.env.DB.prepare(
          'UPDATE page_views SET converted = 1 WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
        )
          .bind(sessionId)
          .run()
          .catch((err: unknown) => console.error('Conversion mark failed:', err))
      )
    }
    if (isNew) {
      if (context.env.NOTIFY_WEBHOOK_URL) {
        const countResult = await context.env.DB.prepare(
          'SELECT COUNT(*) as count FROM waitlist'
        ).first<{ count: number }>()
        context.waitUntil(
          notifyNewSignup(context.env.NOTIFY_WEBHOOK_URL, email, countResult?.count ?? 0, source)
        )
      }
      if (context.env.RESEND_API_KEY) {
        context.waitUntil(
          sendWelcomeEmail(context.env.RESEND_API_KEY, email).catch((err: unknown) => {
            console.error('Failed to send welcome email:', err)
          })
        )
      }
    }

    return Response.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Waitlist error:', err)
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
