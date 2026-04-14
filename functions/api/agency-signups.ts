import { Resend } from 'resend'

interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
  ALERT_EMAIL?: string
}

interface AgencySignupRequest {
  agency_name: string
  name: string
  email: string
  client_count: string
  current_method?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const VALID_CLIENT_COUNTS = ['1-5', '6-15', '16-30', '30+']
const ALERT_EMAIL_DEFAULT = 'henrik@soederlund.com.au'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<AgencySignupRequest>()

    const agencyName = (body.agency_name ?? '').trim().slice(0, 200)
    const name = (body.name ?? '').trim().slice(0, 100)
    const email = (body.email ?? '').trim().toLowerCase().slice(0, 254)
    const clientCount = (body.client_count ?? '').trim()
    const currentMethod = (body.current_method ?? '').trim().slice(0, 1000) || null

    if (!agencyName) {
      return Response.json({ error: 'Agency name is required.' }, { status: 400, headers: corsHeaders })
    }
    if (!name) {
      return Response.json({ error: 'Your name is required.' }, { status: 400, headers: corsHeaders })
    }
    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400, headers: corsHeaders })
    }
    if (!VALID_CLIENT_COUNTS.includes(clientCount)) {
      return Response.json({ error: 'Please select a valid number of active clients.' }, { status: 400, headers: corsHeaders })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await context.env.DB.prepare(
      'INSERT INTO agency_signups (id, agency_name, name, email, client_count, current_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(id, agencyName, name, email, clientCount, currentMethod, now)
      .run()

    if (context.env.RESEND_API_KEY) {
      const resend = new Resend(context.env.RESEND_API_KEY)
      const alertTo = context.env.ALERT_EMAIL ?? ALERT_EMAIL_DEFAULT

      context.waitUntil(
        resend.emails.send({
          from: 'Peerscope Alerts <onboarding@resend.dev>',
          to: alertTo,
          subject: `Agency beta request: ${agencyName} (${name}) <${email}>`,
          html: `
            <p><strong>New agency beta request from /portal/signup</strong></p>
            <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
            <p><strong>Agency:</strong> ${agencyName}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Active clients:</strong> ${clientCount}</p>
            ${currentMethod ? `<p><strong>Current method:</strong> ${currentMethod}</p>` : ''}
            <p><strong>Time:</strong> ${now}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
            <p><a href="https://peerscope-waitlist.pages.dev/admin/dashboard">View dashboard →</a></p>
          `,
        }).catch((err: unknown) => console.error('Failed to send agency signup alert:', err))
      )
    }

    return Response.json({ success: true }, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('Agency signup error:', err)
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}
