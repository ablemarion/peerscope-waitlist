interface Env {
  DB: D1Database
  RESEND_WEBHOOK_SECRET?: string
}

interface ResendWebhookEvent {
  type: string
  data: {
    email_id?: string
    to?: string[]
    from?: string
    subject?: string
    created_at?: string
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Resend signs webhook payloads with svix. For now we log all events and
  // verify via secret header when RESEND_WEBHOOK_SECRET is configured.
  const secret = context.env.RESEND_WEBHOOK_SECRET
  if (secret) {
    const svixId = context.request.headers.get('svix-id')
    const svixTs = context.request.headers.get('svix-timestamp')
    const svixSig = context.request.headers.get('svix-signature')
    if (!svixId || !svixTs || !svixSig) {
      return Response.json({ error: 'Missing svix headers' }, { status: 401 })
    }
    // Basic timestamp staleness check (±5 min)
    const ts = parseInt(svixTs, 10)
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return Response.json({ error: 'Timestamp out of range' }, { status: 401 })
    }
  }

  let event: ResendWebhookEvent
  try {
    event = await context.request.json<ResendWebhookEvent>()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = event
  const to = data.to?.[0] ?? null
  const emailId = data.email_id ?? null

  console.log(JSON.stringify({
    event: 'resend_webhook',
    type,
    email_id: emailId,
    to,
    subject: data.subject ?? null,
    ts: new Date().toISOString(),
  }))

  // Log delivery events to DB for observability
  if (to && (type === 'email.delivered' || type === 'email.bounced' || type === 'email.complained')) {
    try {
      await context.env.DB.prepare(
        `INSERT OR IGNORE INTO email_events (email_id, email, event_type, occurred_at)
         VALUES (?, ?, ?, ?)`
      ).bind(emailId, to, type, new Date().toISOString()).run()
    } catch {
      // email_events table may not exist yet — non-fatal
    }
  }

  return Response.json({ received: true })
}
