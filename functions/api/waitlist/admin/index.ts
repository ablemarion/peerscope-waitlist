interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface WaitlistRow {
  id: number
  email: string
  source: string | null
  created_at: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const rows = await context.env.DB.prepare(
    'SELECT id, email, source, created_at FROM waitlist ORDER BY created_at DESC'
  ).all<WaitlistRow>()

  const bySource: Record<string, number> = {}
  for (const row of rows.results) {
    const src = row.source ?? 'direct'
    bySource[src] = (bySource[src] ?? 0) + 1
  }

  return Response.json({
    count: rows.results.length,
    by_source: bySource,
    signups: rows.results,
  })
}
