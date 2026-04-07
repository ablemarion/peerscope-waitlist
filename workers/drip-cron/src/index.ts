import { Resend } from 'resend'

interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
}

interface WaitlistRow {
  id: number
  email: string
  signup_ts: string
  email_sent_2: string | null
  email_sent_3: string | null
  email_sent_4: string | null
}

const FROM = 'Henrik from Peerscope <hello@peerscope.io>'

function extractFirstName(email: string): string {
  const local = email.split('@')[0]
  // Take first word-like segment, strip numbers/punctuation
  const segment = local.split(/[._+\-0-9]/)[0]
  if (!segment || segment.length < 2) return 'there'
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

function buildEmail2(firstName: string): { subject: string; text: string } {
  return {
    subject: "One thing your competitors aren't telling you",
    text: `Hi ${firstName},

Quick one from me.

Most founders I talk to discover their blind spot the same way - from a customer.

I spoke to a SaaS founder last year who lost three deals in six weeks. Each time, the prospect mentioned a competitor's pricing change - a 30% cut that had been quietly live for over a month. By the time he found out, those conversations were over. The worst part: the information was sitting right there on a public pricing page. Nobody was watching it.

Has something like this happened to you? Hit reply and let me know - I'm genuinely curious how common it is.

Henrik at Peerscope`,
  }
}

function buildEmail3(firstName: string): { subject: string; text: string } {
  return {
    subject: 'Would you pay $49/month for this?',
    text: `Hi ${firstName},

Wanted to be direct about what Peerscope is.

We automatically monitor competitor websites - pricing pages, feature pages, job boards, and review sites like G2 and Capterra. When something changes, you get an alert. No more Monday-morning spot checks.

What we track: pricing changes, feature launches, job postings, and product updates across up to 10 competitors. Alerts land in your Slack or inbox the same day.

What we don't do: we're not a research analyst. We won't write battlecards for you (though we're building templates for Pro users). We're a monitoring layer that catches the moves your competitors make while you're busy running your business.

Straightforward question: would you pay $49/month for that?

Reply yes or no - I read every one.

Henrik at Peerscope`,
  }
}

function buildEmail4(firstName: string): { subject: string; text: string } {
  return {
    subject: 'Founding member pricing closes April 15',
    text: `Hi ${firstName},

Founding member pricing - $49/mo locked in for life - closes on April 15.

After that, early access moves to $99/mo before general launch.

Reply "I'm in" to reserve your spot before April 15.

Henrik at Peerscope`,
  }
}

async function sendDripEmail(
  resend: Resend,
  email: string,
  emailNumber: number,
  subject: string,
  text: string,
): Promise<string> {
  const result = await resend.emails.send({ from: FROM, to: email, subject, text })
  const resendId = (result.data as { id?: string } | null)?.id ?? 'unknown'
  console.log(JSON.stringify({
    event: 'drip_email_sent',
    email,
    email_number: emailNumber,
    resend_id: resendId,
    success: true,
  }))
  return resendId
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.RESEND_API_KEY) {
      console.log(JSON.stringify({ event: 'drip_cron_skipped', reason: 'RESEND_API_KEY not set' }))
      return
    }
    console.log(JSON.stringify({ event: 'drip_cron_start', ts: new Date().toISOString() }))

    const resend = new Resend(env.RESEND_API_KEY)
    const now = Date.now()

    const MS_24H = 24 * 60 * 60 * 1000
    // Email 3 fires 24h after Email 2 (not 48h from signup), so back-to-back sends
    // are impossible even when Email 2 was delayed past the 48h mark.
    // Email 4 fires 5 days after Email 3 (~7 days from signup on a normal cadence).
    const MS_5D = 5 * 24 * 60 * 60 * 1000

    // Fetch all rows that may need a drip email
    const { results } = await env.DB.prepare(
      `SELECT id, email, signup_ts, email_sent_2, email_sent_3, email_sent_4
       FROM waitlist
       WHERE signup_ts IS NOT NULL
         AND (email_sent_2 IS NULL OR email_sent_3 IS NULL OR email_sent_4 IS NULL)`
    ).all<WaitlistRow>()

    let sent2 = 0
    let sent3 = 0
    let sent4 = 0

    const tasks = results.map((row) =>
      ctx.waitUntil(
        (async () => {
          const signupAge = now - new Date(row.signup_ts).getTime()
          const firstName = extractFirstName(row.email)

          // Email 2: 24 hours after signup
          if (row.email_sent_2 === null && signupAge >= MS_24H) {
            try {
              const { subject, text } = buildEmail2(firstName)
              await sendDripEmail(resend, row.email, 2, subject, text)
              await env.DB.prepare(
                'UPDATE waitlist SET email_sent_2 = ? WHERE id = ?'
              ).bind(new Date().toISOString(), row.id).run()
              sent2++
            } catch (err) {
              console.log(JSON.stringify({ event: 'drip_email_failed', email: row.email, email_number: 2, success: false, error: String(err) }))
            }
            return
          }

          // Email 3: 24 hours after Email 2 was sent (not 48h from signup).
          // This prevents Email 3 firing 1 hour after a delayed Email 2.
          if (row.email_sent_3 === null && row.email_sent_2 !== null) {
            const email2Age = now - new Date(row.email_sent_2).getTime()
            if (email2Age >= MS_24H) {
              try {
                const { subject, text } = buildEmail3(firstName)
                await sendDripEmail(resend, row.email, 3, subject, text)
                await env.DB.prepare(
                  'UPDATE waitlist SET email_sent_3 = ? WHERE id = ?'
                ).bind(new Date().toISOString(), row.id).run()
                sent3++
              } catch (err) {
                console.log(JSON.stringify({ event: 'drip_email_failed', email: row.email, email_number: 3, success: false, error: String(err) }))
              }
            }
            return
          }

          // Email 4: 5 days after Email 3 was sent (~7 days from signup on normal cadence).
          if (row.email_sent_4 === null && row.email_sent_3 !== null) {
            const email3Age = now - new Date(row.email_sent_3).getTime()
            if (email3Age >= MS_5D) {
              try {
                const { subject, text } = buildEmail4(firstName)
                await sendDripEmail(resend, row.email, 4, subject, text)
                await env.DB.prepare(
                  'UPDATE waitlist SET email_sent_4 = ? WHERE id = ?'
                ).bind(new Date().toISOString(), row.id).run()
                sent4++
              } catch (err) {
                console.log(JSON.stringify({ event: 'drip_email_failed', email: row.email, email_number: 4, success: false, error: String(err) }))
              }
            }
          }
        })()
      )
    )

    await Promise.allSettled(tasks)
    console.log(JSON.stringify({ event: 'drip_cron_complete', email2: sent2, email3: sent3, email4: sent4, ts: new Date().toISOString() }))
  },
}
