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

const FROM = 'Henrik from Peerscope <henrik@peerscope.app>'

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

Reply "I'm in" to reserve your spot before Thursday.

Henrik at Peerscope`,
  }
}

async function sendDripEmail(
  resend: Resend,
  email: string,
  subject: string,
  text: string,
): Promise<void> {
  await resend.emails.send({ from: FROM, to: email, subject, text })
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set — drip cron skipped')
      return
    }

    const resend = new Resend(env.RESEND_API_KEY)
    const now = Date.now()

    const MS_24H = 24 * 60 * 60 * 1000
    const MS_48H = 48 * 60 * 60 * 1000
    const MS_7D = 7 * 24 * 60 * 60 * 1000

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

          if (row.email_sent_2 === null && signupAge >= MS_24H) {
            try {
              const { subject, text } = buildEmail2(firstName)
              await sendDripEmail(resend, row.email, subject, text)
              await env.DB.prepare(
                'UPDATE waitlist SET email_sent_2 = ? WHERE id = ?'
              ).bind(new Date().toISOString(), row.id).run()
              sent2++
            } catch (err) {
              console.error(`Email 2 failed for ${row.email}:`, err)
            }
            return
          }

          if (row.email_sent_3 === null && row.email_sent_2 !== null && signupAge >= MS_48H) {
            try {
              const { subject, text } = buildEmail3(firstName)
              await sendDripEmail(resend, row.email, subject, text)
              await env.DB.prepare(
                'UPDATE waitlist SET email_sent_3 = ? WHERE id = ?'
              ).bind(new Date().toISOString(), row.id).run()
              sent3++
            } catch (err) {
              console.error(`Email 3 failed for ${row.email}:`, err)
            }
            return
          }

          if (row.email_sent_4 === null && row.email_sent_3 !== null && signupAge >= MS_7D) {
            try {
              const { subject, text } = buildEmail4(firstName)
              await sendDripEmail(resend, row.email, subject, text)
              await env.DB.prepare(
                'UPDATE waitlist SET email_sent_4 = ? WHERE id = ?'
              ).bind(new Date().toISOString(), row.id).run()
              sent4++
            } catch (err) {
              console.error(`Email 4 failed for ${row.email}:`, err)
            }
          }
        })()
      )
    )

    await Promise.allSettled(tasks)
    console.log(`Drip cron complete: email2=${sent2} email3=${sent3} email4=${sent4}`)
  },
}
