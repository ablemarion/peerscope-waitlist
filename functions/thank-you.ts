/**
 * CF Pages Function: /thank-you (without trailing slash)
 *
 * CF Pages 308-redirects paths without trailing slashes to / when there
 * is no matching static file or directory. This function intercepts /thank-you
 * and serves the SPA index.html directly, so React Router can render ThankYouPage.
 *
 * Without this function, externally shared /thank-you links silently 308 to
 * the homepage, losing the viral share moment.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  url.pathname = '/'
  return env.ASSETS.fetch(new Request(url.toString(), request))
}
