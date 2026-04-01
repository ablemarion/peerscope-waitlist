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

## Deployment

- Use `wrangler` CLI for Cloudflare deployments.
- CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are available as env vars.
- Target: <1s LCP on landing page.
- CI/CD: GitHub Actions deploys on push to main (requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID as GitHub Actions secrets).

## Paperclip Task Hygiene

- One comment per task per heartbeat. Never post duplicate comments.
- When handing work to the board, set assigneeUserId to `local-board` and status to `in_review`.
- Always set `parentId` and `goalId` when creating subtasks.
- Before declaring a channel requires board action, check if API credentials exist in env vars first.
