/**
 * Cloudflare Pages Function: /for/[channel]
 *
 * Social crawlers (Twitter, LinkedIn, Facebook) don't execute JavaScript,
 * so og:image must be injected server-side. This function intercepts requests
 * to /for/saas, /for/small-business, /for/agencies and rewrites the meta tags
 * before serving the SPA shell.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}

interface ChannelMeta {
  title: string
  description: string
  ogImage: string
}

const BASE_URL = 'https://peerscope.io'

const CHANNEL_META: Record<string, ChannelMeta> = {
  saas: {
    title: 'Peerscope for SaaS Founders — Competitive Intelligence That Fits Your Budget',
    description:
      'Your competitors just launched a new plan. Your sales team found out from a lost deal. Peerscope tracks competitor pricing, positioning, and feature changes automatically.',
    ogImage: `${BASE_URL}/og/og-saas.svg`,
  },
  'small-business': {
    title: 'Peerscope for Small Business — Know When Competitors Change Pricing',
    description:
      'Stop finding out your competitor changed their pricing from your customers. Peerscope monitors competitor websites and alerts you the moment something changes.',
    ogImage: `${BASE_URL}/og/og-small-business.svg`,
  },
  agencies: {
    title: 'Peerscope for Agencies — Real-Time Competitive Intelligence for Every Client',
    description:
      "Your client's competitors moved. Do you know about it yet? Peerscope gives agencies competitive intelligence across all clients — without the enterprise price tag.",
    ogImage: `${BASE_URL}/og/og-agencies.svg`,
  },
  consultants: {
    title: 'Peerscope for Business Consultants',
    description:
      'Monitor competitor pricing and positioning for all your clients — automatically.',
    ogImage: `${BASE_URL}/og/og-consultants.svg`,
  },
  ecommerce: {
    title: 'Peerscope for E-commerce Stores',
    description:
      'Track competitor pricing and promotions automatically. Know before your customers do.',
    ogImage: `${BASE_URL}/og/og-ecommerce.svg`,
  },
}

const KNOWN_CHANNELS = Object.keys(CHANNEL_META)

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const channel = (params['channel'] as string) ?? ''

  // Unknown /for/* — let the SPA handle the redirect
  if (!KNOWN_CHANNELS.includes(channel)) {
    return env.ASSETS.fetch(request)
  }

  // Fetch the static SPA shell (index.html)
  const indexUrl = new URL('/', request.url)
  const indexResponse = await env.ASSETS.fetch(new Request(indexUrl.toString(), request))

  if (!indexResponse.ok) {
    return indexResponse
  }

  const html = await indexResponse.text()
  const meta = CHANNEL_META[channel]

  // Replace generic og:image / twitter:image with community-specific card.
  // Use simple string replacement on known static values from index.html
  // to avoid regex issues with URLs containing slashes.
  const rewritten = html
    .replace(
      'content="Peerscope - Track your competitors. Not your budget."',
      `content="${escapeAttr(meta.title)}"`
    )
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`
    )
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      `$1${meta.ogImage}$2`
    )
    .replace(
      /(<meta property="og:image:type" content=")[^"]*(")/,
      `$1image/svg+xml$2`
    )
    .replace(
      /(<meta name="twitter:image" content=")[^"]*(")/,
      `$1${meta.ogImage}$2`
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${BASE_URL}/for/${channel}$2`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${escapeAttr(meta.title)}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${escapeAttr(meta.description)}$2`
    )

  return new Response(rewritten, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
