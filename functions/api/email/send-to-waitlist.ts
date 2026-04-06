import { Resend } from 'resend'

interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
  ADMIN_KEY?: string
}

interface SendRequest {
  subject: string
  /** Plain text body (recommended for personal outreach) */
  text?: string
  /** HTML body (for formatted campaigns) */
  html?: string
  from?: string
  /** Optional: only send to these specific addresses (must exist in waitlist) */
  to?: string[]
}

interface WaitlistRow {
  email: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return Response.json({ error: 'Unauthorised' }, { status: 403 })
  }

  if (!context.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  let body: SendRequest
  try {
    body = await context.request.json<SendRequest>()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { subject, text, html, from = 'Henrik from Peerscope <hello@peerscope.io>', to: targetEmails } = body

  if (!subject) {
    return Response.json({ error: 'subject is required' }, { status: 400 })
  }
  if (!text && !html) {
    return Response.json({ error: 'text or html body is required' }, { status: 400 })
  }

  const rows = await context.env.DB.prepare(
    'SELECT email FROM waitlist ORDER BY created_at ASC'
  ).all<WaitlistRow>()

  let emails = rows.results.map((r) => r.email)

  if (targetEmails && targetEmails.length > 0) {
    const targetSet = new Set(targetEmails.map((e) => e.toLowerCase()))
    emails = emails.filter((e) => targetSet.has(e.toLowerCase()))
  }

  if (emails.length === 0) {
    return Response.json({ sent: 0, failed: 0, message: 'No matching subscribers found' })
  }

  const resend = new Resend(context.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0
  const failures: string[] = []

  for (const email of emails) {
    try {
      await resend.emails.send({
        from,
        to: email,
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
      })
      sent++
    } catch (err) {
      failed++
      failures.push(email)
      console.error(`Failed to send to ${email}:`, err)
    }
  }

  console.log(`Email send complete: ${sent} sent, ${failed} failed`)

  return Response.json({
    sent,
    failed,
    total: emails.length,
    ...(failures.length > 0 && { failures }),
  })
}
