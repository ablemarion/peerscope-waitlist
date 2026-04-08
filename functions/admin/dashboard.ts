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

interface HourlyRow {
  hour: string
  signups: number
}

interface DailyRow {
  day: string
  signups: number
}

interface SourceRow {
  source: string
  count: number
}

interface UtmSourceRow {
  source: string
  signups: number
}

interface LastSignupRow {
  last_signup: string | null
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
  hourlySignups: HourlyRow[]
  dailySignups: DailyRow[]
  signupsToday: number
  signupsYesterday: number
  topSourcesToday: SourceRow[]
  utmSourceBreakdown: UtmSourceRow[]
  lastSignupAt: string | null
  signupsLastHour: number
}): string {
  const {
    totalSignups,
    recentSignups,
    variantStats,
    pageviewsToday,
    pageviewsYesterday,
    generatedAt,
    bestVariant,
    dripStats,
    hourlySignups,
    dailySignups,
    signupsToday,
    signupsYesterday,
    topSourcesToday,
    utmSourceBreakdown,
    lastSignupAt,
    signupsLastHour,
  } = data

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

  // Velocity: today vs yesterday
  const signupDelta = signupsToday - signupsYesterday
  const signupDeltaStr = signupDelta >= 0 ? `+${signupDelta}` : `${signupDelta}`
  const signupDeltaPct =
    signupsYesterday > 0 ? ` (${signupDelta >= 0 ? '+' : ''}${((signupDelta / signupsYesterday) * 100).toFixed(0)}%)` : ''
  const signupDeltaColour = signupDelta >= 0 ? '#4ade80' : '#f87171'

  // Hourly bar chart (most recent first from query; reverse for display oldest→newest)
  const maxHourly = Math.max(...hourlySignups.map((r) => r.signups), 1)
  const hourlyRows = [...hourlySignups]
    .reverse()
    .map((r) => {
      const barPct = Math.round((r.signups / maxHourly) * 100)
      const label = r.hour.slice(11, 16) // HH:00
      return `<tr>
        <td style="padding:4px 12px 4px 0;font-size:12px;color:#a0a3b1;white-space:nowrap;font-family:monospace;width:42px;">${label}</td>
        <td style="padding:4px 0;width:100%;">
          <div style="background:#1a1d33;border-radius:3px;height:18px;position:relative;">
            ${barPct > 0 ? `<div style="background:#3b82f6;height:18px;width:${barPct}%;border-radius:3px;min-width:2px;"></div>` : ''}
          </div>
        </td>
        <td style="padding:4px 0 4px 10px;font-size:12px;color:#e2e8f0;text-align:right;width:28px;">${r.signups}</td>
      </tr>`
    })
    .join('')

  // Daily bar chart (last 7 days)
  const maxDaily = Math.max(...dailySignups.map((r) => r.signups), 1)
  const dailyRows = dailySignups
    .map((r) => {
      const barPct = Math.round((r.signups / maxDaily) * 100)
      const label = r.day.slice(5) // MM-DD
      return `<tr>
        <td style="padding:4px 12px 4px 0;font-size:12px;color:#a0a3b1;white-space:nowrap;font-family:monospace;width:42px;">${label}</td>
        <td style="padding:4px 0;width:100%;">
          <div style="background:#1a1d33;border-radius:3px;height:18px;position:relative;">
            ${barPct > 0 ? `<div style="background:#a855f7;height:18px;width:${barPct}%;border-radius:3px;min-width:2px;"></div>` : ''}
          </div>
        </td>
        <td style="padding:4px 0 4px 10px;font-size:12px;color:#e2e8f0;text-align:right;width:28px;">${r.signups}</td>
      </tr>`
    })
    .join('')

  // All-time UTM source breakdown table
  const utmSourceTableRows = utmSourceBreakdown
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#e2e8f0;">${r.source}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;text-align:right;">${r.signups}</td>
      </tr>`,
    )
    .join('')

  // Top sources today
  const sourceRows = topSourcesToday
    .map(
      (r) =>
        `<span style="display:inline-block;background:#1a1d33;border-radius:6px;padding:4px 10px;font-size:12px;color:#a0a3b1;margin-right:8px;margin-bottom:8px;">
          <span style="color:#e2e8f0;font-weight:600;">${r.source}</span>
          <span style="margin-left:6px;color:#4a4d5e;">${r.count}</span>
        </span>`,
    )
    .join('')

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
      <div style="flex:1;min-width:180px;background:#13162A;border-radius:10px;padding:20px 24px;">
        <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Last Hour</div>
        <div style="font-size:40px;font-weight:700;color:${signupsLastHour > 0 ? '#4ade80' : '#f5f5f5'};letter-spacing:-0.03em;">${signupsLastHour}</div>
        <div style="font-size:12px;color:#4a4d5e;margin-top:4px;">sign-ups</div>
      </div>
      <div style="flex:1;min-width:180px;background:#13162A;border-radius:10px;padding:20px 24px;">
        <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Last Sign-up</div>
        <div style="font-size:18px;font-weight:700;color:#f5f5f5;letter-spacing:-0.01em;margin-top:8px;">${lastSignupAt ? formatDate(lastSignupAt) : '—'}</div>
      </div>
    </div>

    <div style="margin-bottom:32px;">
      <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Sign-up Velocity</h2>

      <div style="background:#13162A;border-radius:10px;padding:16px 24px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;">
        <div>
          <span style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;">Today</span>
          <span style="font-size:28px;font-weight:700;color:#f5f5f5;margin-left:10px;">${signupsToday}</span>
        </div>
        <div>
          <span style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;">Yesterday</span>
          <span style="font-size:28px;font-weight:700;color:#f5f5f5;margin-left:10px;">${signupsYesterday}</span>
        </div>
        <div style="font-size:14px;color:${signupDeltaColour};font-weight:600;">${signupDeltaStr}${signupDeltaPct}</div>
        ${topSourcesToday.length > 0 ? `<div style="margin-left:auto;">${sourceRows}</div>` : ''}
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:240px;background:#13162A;border-radius:10px;padding:16px 20px;">
          <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Last 24 Hours</div>
          ${hourlyRows ? `<table style="width:100%;border-collapse:collapse;">${hourlyRows}</table>` : '<p style="font-size:13px;color:#4a4d5e;margin:0;">No sign-ups in last 24 hours</p>'}
        </div>
        <div style="flex:1;min-width:240px;background:#13162A;border-radius:10px;padding:16px 20px;">
          <div style="font-size:12px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Last 7 Days</div>
          ${dailyRows ? `<table style="width:100%;border-collapse:collapse;">${dailyRows}</table>` : '<p style="font-size:13px;color:#4a4d5e;margin:0;">No sign-ups in last 7 days</p>'}
        </div>
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
      <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Sign-ups by Source</h2>
      <div style="background:#13162A;border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a1d33;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Source</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Sign-ups</th>
            </tr>
          </thead>
          <tbody>${utmSourceTableRows || '<tr><td colspan="2" style="padding:16px 12px;text-align:center;color:#4a4d5e;font-size:13px;">No data yet</td></tr>'}</tbody>
        </table>
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
    hourlyResult,
    dailyResult,
    signupsTodayResult,
    signupsYesterdayResult,
    topSourcesResult,
    utmSourceBreakdownResult,
    lastSignupResult,
    signupsLastHourResult,
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
    context.env.DB.prepare(
      `SELECT strftime('%Y-%m-%d %H:00', created_at) as hour, COUNT(*) as signups
       FROM waitlist
       WHERE created_at >= datetime('now', '-24 hours')
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'
       GROUP BY hour
       ORDER BY hour DESC
       LIMIT 24`,
    ),
    context.env.DB.prepare(
      `SELECT DATE(created_at) as day, COUNT(*) as signups
       FROM waitlist
       WHERE created_at >= datetime('now', '-7 days')
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'
       GROUP BY day
       ORDER BY day ASC`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE DATE(created_at) = '${todayUtc}'
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE DATE(created_at) = '${yesterdayUtc}'
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'`,
    ),
    context.env.DB.prepare(
      `SELECT source, COUNT(*) as count FROM waitlist
       WHERE DATE(created_at) = '${todayUtc}'
       AND source IS NOT NULL AND source != 'direct'
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'
       GROUP BY source
       ORDER BY count DESC
       LIMIT 3`,
    ),
    context.env.DB.prepare(
      `SELECT COALESCE(source, 'direct/organic') as source, COUNT(*) as signups
       FROM waitlist
       WHERE email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'
       GROUP BY source
       ORDER BY signups DESC`,
    ),
    context.env.DB.prepare(
      `SELECT MAX(created_at) as last_signup FROM waitlist
       WHERE email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM waitlist
       WHERE created_at > datetime('now', '-1 hour')
       AND email NOT LIKE '%test%' AND email NOT LIKE '%example%' AND email NOT LIKE '%peerscope.app'`,
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

  const hourlySignups = hourlyResult.results as HourlyRow[]
  const dailySignups = dailyResult.results as DailyRow[]
  const signupsToday = (signupsTodayResult.results[0] as CountRow | undefined)?.count ?? 0
  const signupsYesterday = (signupsYesterdayResult.results[0] as CountRow | undefined)?.count ?? 0
  const topSourcesToday = topSourcesResult.results as SourceRow[]
  const utmSourceBreakdown = utmSourceBreakdownResult.results as UtmSourceRow[]
  const lastSignupAt = (lastSignupResult.results[0] as LastSignupRow | undefined)?.last_signup ?? null
  const signupsLastHour = (signupsLastHourResult.results[0] as CountRow | undefined)?.count ?? 0

  const html = renderHtml({
    totalSignups,
    recentSignups,
    variantStats,
    pageviewsToday,
    pageviewsYesterday,
    generatedAt: new Date().toISOString(),
    bestVariant,
    dripStats,
    hourlySignups,
    dailySignups,
    signupsToday,
    signupsYesterday,
    topSourcesToday,
    utmSourceBreakdown,
    lastSignupAt,
    signupsLastHour,
  })

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  })
}
