interface Env {
  DB: D1Database
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()

    if (!email) {
      return Response.json(
        { error: 'email required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await context.env.DB.prepare(
      `SELECT COUNT(*) as position FROM waitlist WHERE created_at <= (SELECT created_at FROM waitlist WHERE email = ? LIMIT 1)`
    )
      .bind(email)
      .first<{ position: number }>()

    return Response.json(
      { position: result?.position ?? null },
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Position error:', err)
    return Response.json(
      { error: 'Something went wrong.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}
