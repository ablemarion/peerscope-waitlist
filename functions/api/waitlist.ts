interface Env {
  DB: D1Database
  NOTIFY_WEBHOOK_URL?: string
}

interface WaitlistRequest {
  email: string
  source?: string
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

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await context.env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, source, created_at) VALUES (?, ?, ?)'
    )
      .bind(email, source, new Date().toISOString())
      .run()

    // Notify on new signups only (not duplicates)
    const isNew = (result.meta?.changes ?? 0) > 0
    if (isNew && context.env.NOTIFY_WEBHOOK_URL) {
      const countResult = await context.env.DB.prepare(
        'SELECT COUNT(*) as count FROM waitlist'
      ).first<{ count: number }>()
      context.waitUntil(
        notifyNewSignup(context.env.NOTIFY_WEBHOOK_URL, email, countResult?.count ?? 0, source)
      )
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
