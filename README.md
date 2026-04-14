# Peerscope

**Track your competitors. Not your budget.**

SMB competitive intelligence monitor. Peerscope tracks competitor pricing, features, job postings, and reviews — so small businesses stay ahead without enterprise-level spend.

**Live:** https://peerscope-waitlist.pages.dev

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 6, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Cloudflare Workers, Hono |
| Database | Cloudflare D1 (SQLite edge) |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Email | Resend (onboarding@resend.dev) |
| Payments | Stripe (subscriptions, webhooks) |
| Auth | Better Auth |
| Package manager | pnpm |
| CI/CD | GitHub Actions → Cloudflare Pages |

## Local Development

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:5173`. The API runs as Cloudflare Pages Functions (via `functions/`) — served automatically by `vite` in dev mode via the Cloudflare adapter.

### Database (D1)

```bash
# Apply migrations locally
pnpm db:migrate:local

# Apply to production
pnpm db:migrate:remote
```

### Environment variables

Secret values are set via the Cloudflare Pages dashboard or `wrangler pages secret put`. See `wrangler.toml` for the full list of required secrets.

For local dev, create a `.dev.vars` file (gitignored) with:

```
RESEND_API_KEY=re_...
BETTER_AUTH_SECRET=...
ADMIN_KEY=...
```

## Build & Deploy

```bash
# Build only
pnpm build

# Build + deploy to Cloudflare Pages
pnpm deploy
```

CI/CD: GitHub Actions deploys automatically on push to `main`.

## Testing

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

## A/B Testing

Two landing page variants are live:

- `?variant=a` — problem-led copy
- `?variant=b` — value-led copy (default)

## Project Structure

```
├── src/               # React frontend
├── functions/         # Cloudflare Pages Functions (API)
│   └── api/           # Hono routes: /waitlist, /portal, /auth, /stripe
├── workers/           # Standalone Cloudflare Workers (crawl pipeline)
├── migrations/        # D1 SQL migrations
├── email-templates/   # Transactional email HTML
├── scripts/           # Build scripts (OG image generation)
└── public/            # Static assets
```

## Goal

AUD$10K MRR by December 2026. 100 SMB customers at AUD$99/mo average.
