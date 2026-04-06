interface Env {
  DB: D1Database
  ADMIN_KEY?: string
}

interface CountRow {
  count: number
}

interface LastSignupRow {
  last_signup_at: string | null
}

function isTestEmail(email: string): boolean {
  return (
    email.includes('+test') ||
    email.includes('test@') ||
    email.endsWith('@test.com') ||
    email.endsWith('@example.com') ||
    email.endsWith('@mailinator.com')
  )
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const adminKey = context.env.ADMIN_KEY
  const providedKey = new URL(context.request.url).searchParams.get('key')

  if (!adminKey || providedKey !== adminKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const [totalResult, wtpResult, lastResult] = await Promise.all([
      context.env.DB.prepare('SELECT COUNT(*) as count FROM waitlist').first<CountRow>(),
      context.env.DB.prepare(
        "SELECT COUNT(*) as count FROM waitlist WHERE source LIKE '%wtp%'"
      ).first<CountRow>(),
      context.env.DB.prepare(
        'SELECT MAX(created_at) as last_signup_at FROM waitlist'
      ).first<LastSignupRow>(),
    ])

    const total = totalResult?.count ?? 0

    // Count test signups by email pattern or test source
    const allEmails = await context.env.DB.prepare(
      'SELECT email, source FROM waitlist'
    ).all<{ email: string; source: string | null }>()

    let testCount = 0
    for (const row of allEmails.results) {
      if (isTestEmail(row.email) || row.source === 'test') {
        testCount++
      }
    }

    const real = total - testCount

    return Response.json({
      total,
      real,
      test: testCount,
      wtp_emails_sent: wtpResult?.count ?? 0,
      last_signup_at: lastResult?.last_signup_at ?? null,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
