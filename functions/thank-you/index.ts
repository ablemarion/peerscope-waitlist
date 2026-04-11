/**
 * CF Pages Function: /thank-you/ (with trailing slash)
 *
 * Companion to functions/thank-you.ts — handles the trailing-slash variant.
 * Serves the SPA index.html so React Router can render ThankYouPage.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  url.pathname = '/'
  return env.ASSETS.fetch(new Request(url.toString(), request))
}
