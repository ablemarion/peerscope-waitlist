/**
 * Auth-aware fetch helper for Client Portal API calls.
 *
 * Reads the Bearer JWT from localStorage and injects the Authorization header
 * on every request. Components never need to handle the token directly.
 */

function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('peerscope_portal_jwt') ??
      localStorage.getItem('peerscope_session')
    )
  } catch {
    return null
  }
}

export async function portalFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(init?.headers)
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(path, { ...init, headers })
}
