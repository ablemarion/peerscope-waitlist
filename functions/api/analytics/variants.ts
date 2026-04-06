interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface SessionRow {
  variant: string
  sessions: number
}

interface SignupRow {
  variant: string
  signups: number
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const [sessionResult, signupResult] = await context.env.DB.batch([
    context.env.DB.prepare(
      `SELECT variant, COUNT(DISTINCT session_id) as sessions
       FROM page_views
       WHERE variant IS NOT NULL
       GROUP BY variant`,
    ),
    context.env.DB.prepare(
      `SELECT variant, COUNT(*) as signups
       FROM waitlist
       WHERE variant IS NOT NULL
       GROUP BY variant`,
    ),
  ])

  const signupByVariant = new Map<string, number>()
  for (const row of signupResult.results as SignupRow[]) {
    signupByVariant.set(row.variant, row.signups)
  }

  const variants = (sessionResult.results as SessionRow[])
    .filter((row) => row.sessions > 0)
    .map((row) => {
      const signups = signupByVariant.get(row.variant) ?? 0
      const conversion_rate = Math.round((signups / row.sessions) * 10000) / 100
      return { variant: row.variant, sessions: row.sessions, signups, conversion_rate }
    })
    .sort((a, b) => b.conversion_rate - a.conversion_rate)

  return Response.json({
    variants,
    generatedAt: new Date().toISOString(),
  })
}
