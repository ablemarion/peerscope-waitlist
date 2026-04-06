interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface VariantRow {
  variant: string | null
  views: number
}

interface DailyViewRow {
  date: string
  pageviews: number
}

interface DailySignupRow {
  date: string
  signups: number
}

interface ReferrerRow {
  referrer: string
  count: number
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return Response.json({ error: 'Unauthorised' }, { status: 403 })
  }

  const [
    totalPvResult,
    uniqueResult,
    signupResult,
    variantResult,
    dailyViewResult,
    dailySignupResult,
    referrerResult,
    deviceResult,
  ] = await context.env.DB.batch([
    context.env.DB.prepare('SELECT COUNT(*) as count FROM page_views'),
    context.env.DB.prepare('SELECT COUNT(DISTINCT session_id) as count FROM page_views'),
    context.env.DB.prepare('SELECT COUNT(*) as count FROM waitlist'),
    context.env.DB.prepare(
      `SELECT COALESCE(variant, 'unknown') as variant, COUNT(*) as views
       FROM page_views GROUP BY variant ORDER BY views DESC`
    ),
    context.env.DB.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as pageviews
       FROM page_views GROUP BY date ORDER BY date DESC LIMIT 30`
    ),
    context.env.DB.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as signups
       FROM waitlist GROUP BY date ORDER BY date DESC LIMIT 30`
    ),
    context.env.DB.prepare(
      `SELECT COALESCE(referrer, 'direct') as referrer, COUNT(*) as count
       FROM page_views GROUP BY referrer ORDER BY count DESC LIMIT 5`
    ),
    context.env.DB.prepare(
      `SELECT COALESCE(device_type, 'unknown') as device_type, COUNT(*) as count
       FROM page_views GROUP BY device_type ORDER BY count DESC`
    ),
  ])

  const totalPageviews = (totalPvResult.results[0] as { count: number } | undefined)?.count ?? 0
  const uniqueVisitors = (uniqueResult.results[0] as { count: number } | undefined)?.count ?? 0
  const totalSignups = (signupResult.results[0] as { count: number } | undefined)?.count ?? 0
  const conversionRate = uniqueVisitors > 0 ? totalSignups / uniqueVisitors : 0

  // Merge daily pageviews and signups into one array
  const signupByDate = new Map<string, number>()
  for (const row of dailySignupResult.results as DailySignupRow[]) {
    signupByDate.set(row.date, row.signups)
  }
  const dailyBreakdown = (dailyViewResult.results as DailyViewRow[]).map((row) => ({
    date: row.date,
    pageviews: row.pageviews,
    signups: signupByDate.get(row.date) ?? 0,
  }))

  return Response.json({
    totalPageviews,
    uniqueVisitors,
    totalSignups,
    signupConversionRate: Math.round(conversionRate * 1000) / 1000,
    variantStats: variantResult.results as VariantRow[],
    dailyBreakdown,
    topReferrers: referrerResult.results as ReferrerRow[],
    deviceBreakdown: deviceResult.results,
    generatedAt: new Date().toISOString(),
  })
}
