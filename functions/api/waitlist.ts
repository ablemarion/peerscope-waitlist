import { Resend } from 'resend'

interface Env {
  DB: D1Database
  NOTIFY_WEBHOOK_URL?: string
  RESEND_API_KEY?: string
}

const CONFIRMATION_EMAIL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the Peerscope waitlist</title>
</head>
<body style="margin:0;padding:0;background:#0D0F1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0F1A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:18px;font-weight:700;color:#B8622A;letter-spacing:-0.02em;">Peerscope</span>
            </td>
          </tr>
          <tr>
            <td style="background:#13162A;border-radius:12px;padding:40px 40px 36px;">
              <h1 style="margin:0 0 20px;font-size:28px;font-weight:700;color:#F5F5F5;letter-spacing:-0.03em;line-height:1.2;">You're on the list.</h1>
              <p style="margin:0 0 16px;font-size:16px;color:#A0A3B1;line-height:1.6;">We'll alert you the moment Peerscope launches.</p>
              <p style="margin:0;font-size:16px;color:#A0A3B1;line-height:1.6;">In the meantime, know a founder who'd benefit? Forward this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#4A4D5E;">Track your competitors. Not your budget.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

async function sendConfirmationEmail(apiKey: string, email: string): Promise<void> {
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'Peerscope <onboarding@resend.dev>',
    to: email,
    subject: "You're on the Peerscope waitlist",
    html: CONFIRMATION_EMAIL_HTML,
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
          sendConfirmationEmail(context.env.RESEND_API_KEY, email).catch((err: unknown) => {
            console.error('Failed to send confirmation email:', err)
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
