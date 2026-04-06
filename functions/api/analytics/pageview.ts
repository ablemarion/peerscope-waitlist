interface Env {
  DB: D1Database
}

interface PageViewRequest {
  session_id: string
  variant?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

function detectDevice(ua: string): string {
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    return /iPad/i.test(ua) ? 'tablet' : 'mobile'
  }
  return 'desktop'
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const body = await context.request.json<PageViewRequest>()
    const sessionId = (body.session_id ?? '').slice(0, 64)

    if (!sessionId) {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const ua = context.request.headers.get('user-agent') ?? ''
    const deviceType = detectDevice(ua)

    await context.env.DB.prepare(
      `INSERT OR IGNORE INTO page_views
         (session_id, variant, referrer, utm_source, utm_medium, utm_campaign, device_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sessionId,
        (body.variant ?? null),
        (body.referrer ?? null)?.slice(0, 500) ?? null,
        (body.utm_source ?? null)?.slice(0, 100) ?? null,
        (body.utm_medium ?? null)?.slice(0, 100) ?? null,
        (body.utm_campaign ?? null)?.slice(0, 100) ?? null,
        deviceType,
        new Date().toISOString()
      )
      .run()

    return new Response(null, { status: 204, headers: corsHeaders })
  } catch (err) {
    console.error('Analytics error:', err)
    return new Response(null, { status: 204, headers: corsHeaders })
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
