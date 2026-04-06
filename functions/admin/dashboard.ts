interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface SignupRow {
  email: string
  variant: string | null
  source: string | null
  created_at: string
}

interface VariantRow {
  variant: string | null
  sessions: number
  signups: number
}

interface CountRow {
  count: number
}

interface DripStats {
  email1: number
  email2: number
  email3: number
  email4: number
  pipeline: number
}

interface PageviewRow {
  date: string
  pageviews: number
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  return `${local[0]}***@${domain}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-AU', {
    timeZone: 'Australia/Perth',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function renderHtml(data: {
  totalSignups: number
  recentSignups: SignupRow[]
  variantStats: (VariantRow & { cvr: string })[]
  pageviewsToday: number
  pageviewsYesterday: number
  generatedAt: string
  bestVariant: string | null
  dripStats: DripStats
}): string {
  const { totalSignups, recentSignups, variantStats, pageviewsToday, pageviewsYesterday, generatedAt, bestVariant, dripStats } =
    data

  const pvDelta = pageviewsToday - pageviewsYesterday
  const pvDeltaStr = pvDelta >= 0 ? `+${pvDelta}` : `${pvDelta}`
  const pvDeltaColour = pvDelta >= 0 ? '#4ade80' : '#f87171'

  const signupRows = recentSignups
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-family:monospace;font-size:13px;color:#e2e8f0;">${maskEmail(r.email)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;">${r.variant ?? '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;">${r.source ?? 'direct'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;white-space:nowrap;">${formatDate(r.created_at)}</td>
      </tr>`,
    )
    .join('')

  const variantRows = variantStats
    .map((v) => {
      const isBest = bestVariant !== null && v.variant === bestVariant
      const rowBg = isBest ? 'background:#0f2a1a;' : ''
      const labelSuffix = isBest ? ' <span style="font-size:11px;background:#14532d;color:#4ade80;padding:2px 6px;border-radius:4px;margin-left:4px;">★ Best</span>' : ''
      return `
      <tr style="${rowBg}">
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#e2e8f0;">${v.variant ?? 'unknown'}${labelSuffix}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;text-align:right;">${v.sessions.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;text-align:right;">${v.signups}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:${isBest ? '#4ade80' : '#a0a3b1'};font-weight:${isBest ? '700' : '400'};text-align:right;">${v.cvr}%</td>
      </tr>`
    })
    .join('')

  const recommendationNote =
    bestVariant !== null
      ? `<p style="margin:12px 0 0;font-size:12px;color:#4ade80;">Recommended default: <strong>${bestVariant}</strong></p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="30">
<title>Peerscope — Admin Dashboard</title>
</head>
<body style="margin:0;padding:0;background:#0D0F1A;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;">
  <div style="max-width:960px;margin:0 auto;padding:32px 24px;">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
      <span style="font-size:16px;font-weight:700;color:#B8622A;letter-spacing:-0.02em;">Peerscope</span>
      <span style="font-size:12px;color:#4a4d5e;">Updated ${formatDate(generatedAt)} · auto-refreshes every 30s</span>
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;">
      <div style="flex:1;min-width:180px;background:#13162A;border-radius:10px;padding:20px 24px;">
        <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Real Sign-ups</div>
        <div style="font-size:40px;font-weight:700;color:#f5f5f5;letter-spacing:-0.03em;">${totalSignups}</div>
      </div>
      <div style="flex:1;min-width:180px;background:#13162A;border-radius:10px;padding:20px 24px;">
        <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Pageviews Today</div>
        <div style="font-size:40px;font-weight:700;color:#f5f5f5;letter-spacing:-0.03em;">${pageviewsToday.toLocaleString()}</div>
        <div style="font-size:12px;color:${pvDeltaColour};margin-top:4px;">${pvDeltaStr} vs yesterday (${pageviewsYesterday})</div>
      </div>
    </div>

    <div style="margin-bottom:32px;">
      <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Drip Email Stats</h2>
      <div style="background:#13162A;border-radius:10px;padding:20px 24px;display:flex;gap:0;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;text-align:center;padding:0 12px;border-right:1px solid #1e2133;">
          <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Email 1</div>
          <div style="font-size:28px;font-weight:700;color:#f5f5f5;">${dripStats.email1}</div>
          <div style="font-size:11px;color:#4a4d5e;margin-top:2px;">welcome</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center;padding:0 12px;border-right:1px solid #1e2133;">
          <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Email 2</div>
          <div style="font-size:28px;font-weight:700;color:#f5f5f5;">${dripStats.email2}</div>
          <div style="font-size:11px;color:#4a4d5e;margin-top:2px;">day 1</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center;padding:0 12px;border-right:1px solid #1e2133;">
          <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Email 3</div>
          <div style="font-size:28px;font-weight:700;color:#f5f5f5;">${dripStats.email3}</div>
          <div style="font-size:11px;color:#4a4d5e;margin-top:2px;">day 2</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center;padding:0 12px;border-right:1px solid #1e2133;">
          <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Email 4</div>
          <div style="font-size:28px;font-weight:700;color:#f5f5f5;">${dripStats.email4}</div>
          <div style="font-size:11px;color:#4a4d5e;margin-top:2px;">day 7</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center;padding:0 12px;">
          <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Pipeline</div>
          <div style="font-size:28px;font-weight:700;color:${dripStats.pipeline > 0 ? '#facc15' : '#f5f5f5'};">${dripStats.pipeline}</div>
          <div style="font-size:11px;color:#4a4d5e;margin-top:2px;">pending</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:32px;">
      <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">A/B Variant Conversion</h2>
      <div style="background:#13162A;border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a1d33;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Variant</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Sessions</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Sign-ups</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">CVR</th>
            </tr>
          </thead>
          <tbody>${variantRows || '<tr><td colspan="4" style="padding:16px 12px;text-align:center;color:#4a4d5e;font-size:13px;">No data yet</td></tr>'}</tbody>
        </table>
      </div>
      ${recommendationNote}
    </div>

    <div>
      <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Recent Sign-ups</h2>
      <div style="background:#13162A;border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a1d33;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Email</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Variant</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Source</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Time (AWST)</th>
            </tr>
          </thead>
          <tbody>${signupRows || '<tr><td colspan="4" style="padding:16px 12px;text-align:center;color:#4a4d5e;font-size:13px;">No sign-ups yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>

  </div>
</body>
</html>`
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return new Response('401 Unauthorised', { status: 401, headers: { 'Content-Type': 'text/plain' } })
  }

  const todayUtc = new Date().toISOString().slice(0, 10)
  const yesterdayUtc = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const [
    signupCountResult,
    recentResult,
    pvSessionResult,
    waitlistVariantResult,
    pvTodayResult,
    pvYesterdayResult,
    drip2Result,
    drip3Result,
    drip4Result,
    dripPending2Result,
    dripPending3Result,
  ] = await context.env.DB.batch([
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE email NOT LIKE '%test%'
       AND email NOT LIKE '%example%'
       AND email NOT LIKE '%peerscope.app'`,
    ),
    context.env.DB.prepare(
      `SELECT email, variant, source, created_at FROM waitlist
       ORDER BY created_at DESC LIMIT 10`,
    ),
    context.env.DB.prepare(
      `SELECT variant, COUNT(DISTINCT session_id) as sessions
       FROM page_views WHERE variant IS NOT NULL GROUP BY variant`,
    ),
    context.env.DB.prepare(
      `SELECT variant, COUNT(*) as signups
       FROM waitlist WHERE variant IS NOT NULL GROUP BY variant`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as pageviews FROM page_views WHERE DATE(created_at) = '${todayUtc}'`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as pageviews FROM page_views WHERE DATE(created_at) = '${yesterdayUtc}'`,
    ),
    context.env.DB.prepare(`SELECT COUNT(*) as count FROM waitlist WHERE email_sent_2 IS NOT NULL`),
    context.env.DB.prepare(`SELECT COUNT(*) as count FROM waitlist WHERE email_sent_3 IS NOT NULL`),
    context.env.DB.prepare(`SELECT COUNT(*) as count FROM waitlist WHERE email_sent_4 IS NOT NULL`),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE email_sent_2 IS NULL AND signup_ts < datetime('now', '-1 day')`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE email_sent_2 IS NOT NULL AND email_sent_3 IS NULL AND signup_ts < datetime('now', '-2 days')`,
    ),
  ])

  const totalSignups = (signupCountResult.results[0] as CountRow | undefined)?.count ?? 0
  const recentSignups = recentResult.results as SignupRow[]
  const pageviewsToday = (pvTodayResult.results[0] as { pageviews: number } | undefined)?.pageviews ?? 0
  const pageviewsYesterday =
    (pvYesterdayResult.results[0] as { pageviews: number } | undefined)?.pageviews ?? 0

  const signupsByVariant = new Map<string, number>()
  for (const row of waitlistVariantResult.results as { variant: string; signups: number }[]) {
    signupsByVariant.set(row.variant, row.signups)
  }
  const variantStats = (pvSessionResult.results as { variant: string; sessions: number }[])
    .filter((row) => row.sessions > 0)
    .map((row) => {
      const signups = signupsByVariant.get(row.variant) ?? 0
      return {
        variant: row.variant,
        sessions: row.sessions,
        signups,
        cvr: ((signups / row.sessions) * 100).toFixed(1),
      }
    })
    .sort((a, b) => parseFloat(b.cvr) - parseFloat(a.cvr))

  const bestVariant = variantStats.length > 0 ? (variantStats[0].variant ?? null) : null

  const dripStats: DripStats = {
    email1: totalSignups,
    email2: (drip2Result.results[0] as CountRow | undefined)?.count ?? 0,
    email3: (drip3Result.results[0] as CountRow | undefined)?.count ?? 0,
    email4: (drip4Result.results[0] as CountRow | undefined)?.count ?? 0,
    pipeline:
      ((dripPending2Result.results[0] as CountRow | undefined)?.count ?? 0) +
      ((dripPending3Result.results[0] as CountRow | undefined)?.count ?? 0),
  }

  const html = renderHtml({
    totalSignups,
    recentSignups,
    variantStats,
    pageviewsToday,
    pageviewsYesterday,
    generatedAt: new Date().toISOString(),
    bestVariant,
    dripStats,
  })

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  })
}
