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
    const result = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM waitlist'
    ).first<{ count: number }>()

    const count = result?.count ?? 0

    return Response.json(
      { count, show_count: count >= 1 },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (err) {
    console.error('Public stats error:', err)
    return Response.json(
      { error: 'Something went wrong.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}
