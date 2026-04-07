#!/usr/bin/env tsx
/**
 * Post Peerscope waitlist to Reddit.
 *
 * Required env vars:
 *   REDDIT_CLIENT_ID      — Reddit app client ID (create at reddit.com/prefs/apps)
 *   REDDIT_CLIENT_SECRET  — Reddit app client secret
 *   REDDIT_USERNAME       — Reddit account username
 *   REDDIT_PASSWORD       — Reddit account password
 *
 * Usage:
 *   pnpm tsx scripts/post-reddit.ts --dry-run          # preview posts without submitting
 *   pnpm tsx scripts/post-reddit.ts --subreddit saas   # post to specific subreddit only
 */

const CLIENT_ID = process.env.REDDIT_CLIENT_ID
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET
const USERNAME = process.env.REDDIT_USERNAME
const PASSWORD = process.env.REDDIT_PASSWORD

const DRY_RUN = process.argv.includes('--dry-run')
const SUBREDDIT_FILTER = process.argv.find((a) => a.startsWith('--subreddit='))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--subreddit') + 1]

interface RedditTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface Post {
  subreddit: string
  title: string
  kind: 'self' | 'link'
  text?: string
  url?: string
  flair?: string
}

const POSTS: Post[] = [
  {
    subreddit: 'SaaS',
    kind: 'self',
    title: 'I built a tool that monitors competitor pricing/features 24/7 — found out the hard way I needed it',
    text: `Background: I ran a small B2B SaaS for 3 years. Lost a $8k/yr deal because a competitor had quietly cut their price 30% six weeks earlier. Found out from the prospect, not from any monitoring I had in place. That stung.

So I'm building **Peerscope** — it watches competitor websites (pricing pages, feature pages, job boards, G2/Capterra reviews) and sends you a Slack or email alert the same day something changes. No more Monday-morning spot checks or finding out from customers.

What it tracks:
- Pricing changes (including hidden/gated pages)
- Feature launches and removals
- Job postings (great for knowing if a competitor is hiring into a new market)
- Review site movements on G2, Capterra, Trustpilot

It's aimed at SMBs tracking 3–10 competitors, not enterprise war rooms. Founder price is $49/mo, going to $99 after April 15.

I'm still in waitlist phase — genuinely want to know: **what competitor move caught you off guard the most?**

Waitlist + more info: https://peerscope-waitlist.pages.dev`,
  },
  {
    subreddit: 'startups',
    kind: 'self',
    title: 'How do you track competitor moves? Manual checks or something automated?',
    text: `Curious how founders here handle competitive intelligence.

We're building Peerscope (competitive monitoring for SMBs) and trying to understand the current pain point better before we build more.

Our experience: most founders either (a) do nothing and find out from customers, or (b) have a spreadsheet with weekly manual checks that always falls behind.

What we're seeing in user research: the biggest moments are pricing changes, feature launches, and "they're hiring a VP of Sales in our territory" signals from job boards.

**Question for the room**: What competitor move caught you off guard in the last 12 months? And how are you currently tracking them?

(We're also collecting early access signups at https://peerscope-waitlist.pages.dev if this resonates)`,
  },
  {
    subreddit: 'Entrepreneur',
    kind: 'self',
    title: 'Lost a $8k deal because I missed a competitor\'s price cut — so I built something about it',
    text: `Three years ago I lost a deal because a competitor had quietly dropped their price 30% six weeks earlier. The prospect told me on the call. I had no idea.

The information was sitting on a public pricing page the whole time. I just wasn't watching.

That's what led me to build **Peerscope** — automated competitive monitoring for small businesses. It watches competitor websites and alerts you the same day something changes: pricing, features, job postings, reviews.

You set up your competitors once (takes ~5 minutes), then Peerscope runs 24/7 and pings your Slack or email when it detects a change. No more manual checks.

Founding member pricing is $49/mo locked for life, closing April 15: https://peerscope-waitlist.pages.dev

Would love to hear — has a competitor move ever blindsided you? How do you currently keep tabs on them?`,
  },
]

async function getToken(): Promise<string> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Peerscope/1.0 (by /u/peerscope)',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: USERNAME!,
      password: PASSWORD!,
    }),
  })

  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as RedditTokenResponse
  return data.access_token
}

async function submitPost(token: string, post: Post): Promise<void> {
  const body: Record<string, string> = {
    sr: post.subreddit,
    kind: post.kind,
    title: post.title,
    resubmit: 'true',
    nsfw: 'false',
    spoiler: 'false',
    sendreplies: 'true',
  }

  if (post.kind === 'self' && post.text) body.text = post.text
  if (post.kind === 'link' && post.url) body.url = post.url

  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Peerscope/1.0 (by /u/peerscope)',
    },
    body: new URLSearchParams(body),
  })

  const data = await res.json() as { success?: boolean; jquery?: unknown[]; error?: string }

  if (!res.ok || data.error) {
    throw new Error(`Submit failed for r/${post.subreddit}: ${JSON.stringify(data)}`)
  }

  console.log(`Posted to r/${post.subreddit}: ${post.title}`)
}

async function main(): Promise<void> {
  if (!DRY_RUN) {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Error: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set.')
      console.error('Create a Reddit app at: https://www.reddit.com/prefs/apps')
      process.exit(1)
    }
    if (!USERNAME || !PASSWORD) {
      console.error('Error: REDDIT_USERNAME and REDDIT_PASSWORD must be set.')
      process.exit(1)
    }
  }

  const posts = SUBREDDIT_FILTER
    ? POSTS.filter((p) => p.subreddit.toLowerCase() === SUBREDDIT_FILTER.toLowerCase())
    : POSTS

  if (posts.length === 0) {
    console.error(`No posts found for subreddit: ${SUBREDDIT_FILTER}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('=== DRY RUN — no posts will be submitted ===\n')
    for (const post of posts) {
      console.log(`--- r/${post.subreddit} ---`)
      console.log(`Title: ${post.title}`)
      if (post.text) console.log(`\nBody:\n${post.text}`)
      console.log()
    }
    return
  }

  console.log('Authenticating with Reddit...')
  const token = await getToken()
  console.log('Authenticated.\n')

  for (const post of posts) {
    try {
      await submitPost(token, post)
      // Reddit rate limit: 1 post per ~10 minutes per account
      if (posts.indexOf(post) < posts.length - 1) {
        console.log('Waiting 60s between posts...')
        await new Promise((r) => setTimeout(r, 60_000))
      }
    } catch (err) {
      console.error(`Failed to post to r/${post.subreddit}:`, err)
    }
  }

  console.log('\nDone.')
}

main()
