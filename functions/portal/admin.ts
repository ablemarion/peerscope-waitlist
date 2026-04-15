interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface AgencySignupRow {
  id: string
  agency_name: string
  name: string
  email: string
  client_count: string
  current_method: string | null
  status: string
  created_at: string
  activated_at: string | null
  source: string | null
  medium: string | null
  campaign: string | null
}

interface CountRow {
  count: number
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-AU', {
    timeZone: 'Australia/Perth',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function renderHtml(data: {
  pendingSignups: AgencySignupRow[]
  activeCount: number
  weekCount: number
  adminKey: string
  generatedAt: string
}): string {
  const { pendingSignups, activeCount, weekCount, adminKey, generatedAt } = data

  const pendingRows = pendingSignups.length > 0
    ? pendingSignups.map((r) => {
        const activateUrl = `/api/portal/admin/activate/${r.id}?key=${encodeURIComponent(adminKey)}`
        const source = [r.source, r.medium, r.campaign].filter(Boolean).join(' / ') || '—'
        return `
      <tr id="row-${r.id}">
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-size:13px;font-weight:600;color:#e2e8f0;">${escHtml(r.agency_name)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;">${escHtml(r.name)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-family:monospace;font-size:12px;color:#a0a3b1;">${escHtml(r.email)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-size:13px;color:#a0a3b1;text-align:center;">${escHtml(r.client_count)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-size:12px;color:#4a4d5e;" title="${formatDate(r.created_at)}">${relativeTime(r.created_at)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;font-size:12px;color:#4a4d5e;">${escHtml(source)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #1e2133;text-align:right;">
          <button
            onclick="activateSignup('${r.id}', '${escHtml(adminKey)}', this)"
            style="display:inline-block;padding:6px 16px;background:#F07C35;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;"
          >Activate</button>
        </td>
      </tr>`
      }).join('')
    : `<tr><td colspan="7" style="padding:24px;text-align:center;color:#4a4d5e;font-size:14px;">No pending signups — all clear.</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>Peerscope — Agency Admin</title>
</head>
<body style="margin:0;padding:0;background:#0D0F1A;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;">
<div style="max-width:1100px;margin:0 auto;padding:32px 24px;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
    <div>
      <span style="font-size:18px;font-weight:700;color:#B8622A;letter-spacing:-0.02em;">Peerscope</span>
      <span style="font-size:14px;color:#4a4d5e;margin-left:12px;">Agency Admin</span>
    </div>
    <span style="font-size:12px;color:#4a4d5e;">Updated ${formatDate(generatedAt)} · auto-refreshes every 60s</span>
  </div>

  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;">
    <div style="flex:1;min-width:160px;background:#13162A;border-radius:10px;padding:20px 24px;">
      <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Pending Review</div>
      <div style="font-size:44px;font-weight:700;color:${pendingSignups.length > 0 ? '#facc15' : '#f5f5f5'};letter-spacing:-0.03em;">${pendingSignups.length}</div>
    </div>
    <div style="flex:1;min-width:160px;background:#13162A;border-radius:10px;padding:20px 24px;">
      <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Active Agencies</div>
      <div style="font-size:44px;font-weight:700;color:${activeCount > 0 ? '#4ade80' : '#f5f5f5'};letter-spacing:-0.03em;">${activeCount}</div>
    </div>
    <div style="flex:1;min-width:160px;background:#13162A;border-radius:10px;padding:20px 24px;">
      <div style="font-size:11px;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Signups This Week</div>
      <div style="font-size:44px;font-weight:700;color:#f5f5f5;letter-spacing:-0.03em;">${weekCount}</div>
    </div>
  </div>

  <div style="margin-bottom:8px;display:flex;align-items:baseline;gap:12px;">
    <h2 style="font-size:14px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.08em;margin:0;">Pending Signups</h2>
    <span style="font-size:12px;color:#4a4d5e;">(sorted newest first)</span>
  </div>

  <div style="background:#13162A;border-radius:10px;overflow:hidden;margin-bottom:32px;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:700px;">
        <thead>
          <tr style="background:#1a1d33;">
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Agency</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Contact</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Email</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Clients</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Submitted</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Source</th>
            <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:600;color:#a0a3b1;text-transform:uppercase;letter-spacing:0.06em;">Action</th>
          </tr>
        </thead>
        <tbody>${pendingRows}</tbody>
      </table>
    </div>
  </div>

  <p style="font-size:12px;color:#4a4d5e;margin:0;">
    Activating an agency creates their account and sends them a welcome email with portal access.
    <a href="/admin/dashboard?key=${encodeURIComponent(adminKey)}" style="color:#B8622A;margin-left:8px;">Waitlist dashboard →</a>
  </p>

</div>

<script>
async function activateSignup(id, adminKey, btn) {
  btn.disabled = true;
  btn.textContent = 'Activating…';
  btn.style.background = '#4a4d5e';
  try {
    const res = await fetch('/api/portal/admin/activate/' + id + '?key=' + encodeURIComponent(adminKey));
    if (res.ok || res.redirected) {
      btn.textContent = 'Activated ✓';
      btn.style.background = '#166534';
      btn.style.color = '#4ade80';
      var row = document.getElementById('row-' + id);
      if (row) row.style.opacity = '0.4';
    } else {
      btn.textContent = 'Error — retry?';
      btn.style.background = '#7f1d1d';
      btn.style.color = '#fca5a5';
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = 'Error — retry?';
    btn.style.background = '#7f1d1d';
    btn.style.color = '#fca5a5';
    btn.disabled = false;
  }
}
</script>
</body>
</html>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return new Response('401 Unauthorised', { status: 401, headers: { 'Content-Type': 'text/plain' } })
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [pendingResult, activeResult, weekResult] = await context.env.DB.batch([
    context.env.DB.prepare(
      `SELECT id, agency_name, name, email, client_count, current_method, status, created_at, activated_at, source, medium, campaign
       FROM agency_signups
       WHERE status = 'pending_review'
       ORDER BY created_at DESC`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM agency_signups WHERE status = 'activated'`,
    ),
    context.env.DB.prepare(
      `SELECT COUNT(*) as count FROM agency_signups WHERE created_at >= ?`,
    ).bind(weekAgo),
  ])

  const pendingSignups = pendingResult.results as AgencySignupRow[]
  const activeCount = (activeResult.results[0] as CountRow | undefined)?.count ?? 0
  const weekCount = (weekResult.results[0] as CountRow | undefined)?.count ?? 0

  const html = renderHtml({
    pendingSignups,
    activeCount,
    weekCount,
    adminKey,
    generatedAt: new Date().toISOString(),
  })

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
