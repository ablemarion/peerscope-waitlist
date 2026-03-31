interface Env {
  DB: D1Database
}

interface WaitlistRequest {
  email: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      )
    }

    await context.env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, created_at) VALUES (?, ?)'
    )
      .bind(email, new Date().toISOString())
      .run()

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
