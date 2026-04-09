# Peerscope

SMB competitive intelligence platform. "Track your competitors. Not your budget."

## Live

- **Production**: https://peerscope-waitlist.pages.dev
- **Repo**: https://github.com/ablemarion/peerscope-waitlist
- **Email capture**: D1 database via `/api/waitlist` endpoint
- **A/B testing**: `?variant=a` (problem-led) / `?variant=b` (value-led, default)

## Stack

- **Frontend**: Vite 6, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Cloudflare Workers, Hono
- **Database**: Cloudflare D1 (SQLite edge)
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Payments**: Stripe (subscriptions, checkout, webhooks)
- **Package manager**: pnpm
- **CI/CD**: GitHub Actions
- **DNS/Hosting**: Cloudflare Pages + Workers

## Code Standards

- TypeScript strict mode. No `any` types in production code.
- Use British English spelling in user-facing text (e.g. colour, analyse, optimise) except for CSS properties (`color`) and code identifiers.
- Tailwind CSS for all styling. No custom CSS unless absolutely necessary.
- Mobile-first responsive design. Breakpoints: default (mobile), sm, md, lg.
- WCAG 2.1 AA accessibility. Semantic HTML, proper labels, keyboard navigation, sufficient contrast.
- Error handling at system boundaries only (user input, external APIs, Stripe webhooks).
- No secrets in code. Use environment variables.
- Stripe webhook signatures must always be verified.

## Architecture

- Monorepo with pnpm workspaces: `apps/web` (frontend), `apps/api` (Workers), `packages/db` (D1 schema)
- Crawl pipeline: Cron Trigger -> Scheduler Worker -> Cloudflare Queues -> Fetch/Browser Rendering Workers -> D1 + KV
- No Durable Objects needed for current scale

## Git

- Commit frequently with clear messages describing what changed and why.
- Never include AI attribution in commit messages.
- Push to `ablemarion` GitHub account using GITHUB_TOKEN env var.

## Token Savings (RTK)

All shell commands should be run through `rtk` for token savings. Examples:

```bash
rtk git status          # instead of: git status
rtk git log --oneline   # instead of: git log --oneline
rtk git diff            # instead of: git diff
rtk ls -la              # instead of: ls -la
```

Use `rtk proxy` when you need raw unfiltered output (e.g. parsing JSON):

```bash
rtk proxy curl -s http://localhost:3100/api/health | python3 -m json.tool
```

## Browser Testing (browser-use)

`browser-use` CLI is available for visual testing, QA, form testing, and site auditing:

```bash
browser-use open https://peerscope-waitlist.pages.dev    # open the site
browser-use state                                         # list all interactive elements
browser-use screenshot ./screenshot.png                   # capture screenshot
browser-use screenshot --full ./full-page.png             # full-page screenshot
browser-use click <index>                                 # click element by index
browser-use input <index> "text"                          # fill a form field
browser-use scroll down                                   # scroll down
browser-use eval "document.title"                         # run JavaScript
browser-use get html --selector ".hero"                   # extract HTML
```

Use for: visual QA, mobile testing, form validation, conversion flow testing, design review screenshots.

## Important: Domain and Email

- **There is NO custom domain.** The only working URL is https://peerscope-waitlist.pages.dev
- **Do NOT use peerscope.io anywhere** - we do not own that domain
- **Emails send from** `onboarding@resend.dev` (Resend free tier shared domain)
- **Do NOT use** `@peerscope.io` email addresses - they will bounce

## Deployment

- Use `wrangler` CLI for Cloudflare deployments.
- **IMPORTANT**: Always run `unset CLOUDFLARE_ACCOUNT_ID && unset CLOUDFLARE_API_TOKEN` before wrangler commands to clear stale WSL env vars. The correct credentials are in your Paperclip agent env.
- Target: <1s LCP on landing page.
- CI/CD: GitHub Actions deploys on push to main.

## Troubleshooting Autonomy

Agents are expected to diagnose and fix problems themselves before escalating to the board:
- If an API call fails, read the error message and debug it
- If a URL returns 404, check you are using peerscope-waitlist.pages.dev (not peerscope.io)
- If credentials seem missing, check the EXACT env var names (e.g. HACKERNEWS_USERNAME not HN_USERNAME)
- If an email bounces, verify the sender is onboarding@resend.dev
- Only escalate after trying at least 2 approaches and documenting what you tried

## Paperclip Task Hygiene

- One comment per task per heartbeat. Never post duplicate comments.
- When handing work to the board, set assigneeUserId to `local-board` and status to `in_review`.
- Always set `parentId` and `goalId` when creating subtasks.
- Before declaring a channel requires board action, check if API credentials exist in env vars first.
