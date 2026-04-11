/**
 * CF Pages Function: /lp (without trailing slash)
 *
 * CF Pages 308-redirects /lp to / when there is no matching static file.
 * This function intercepts /lp and serves the SPA index.html directly, so
 * main.tsx can detect the /lp path and render LandingPage.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  url.pathname = '/'
  return env.ASSETS.fetch(new Request(url.toString(), request))
}
