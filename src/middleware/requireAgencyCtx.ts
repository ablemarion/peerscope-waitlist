/**
 * requireAgencyCtx — Hono middleware for Client Portal multi-tenancy.
 *
 * Verifies a HS256 JWT signed with BETTER_AUTH_SECRET (issued by
 * POST /api/portal/auth/token after invite acceptance). Extracts
 * `agency_id` and `role` from the payload, then confirms the user is
 * an active member of that agency in the `agency_users` table.
 *
 * Populates `c.var.agencyCtx` for downstream route handlers.
 */

import type { Context, MiddlewareHandler } from 'hono'
import { jwtVerify, SignJWT } from 'jose'
import type { D1Database } from '@cloudflare/workers-types'
import type { AgencyRole } from '../lib/auth'

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AgencyContext {
  agencyId: string
  role: AgencyRole
  userId: string
}

// Augment Hono's ContextVariableMap so `c.var.agencyCtx` is typed everywhere.
declare module 'hono' {
  interface ContextVariableMap {
    agencyCtx: AgencyContext
  }
}

// ─── Expected JWT payload ─────────────────────────────────────────────────────

interface PortalJwtPayload {
  sub: string
  agency_id: string
  role: AgencyRole
  iat?: number
  exp?: number
}

function isPortalJwtPayload(p: unknown): p is PortalJwtPayload {
  if (typeof p !== 'object' || p === null) return false
  const obj = p as Record<string, unknown>
  return (
    typeof obj['sub'] === 'string' &&
    typeof obj['agency_id'] === 'string' &&
    (obj['role'] === 'agency_admin' || obj['role'] === 'client_viewer')
  )
}

// ─── Role normalisation ───────────────────────────────────────────────────────

// Normalises legacy 'admin'/'member' values from migration 0009.
function normaliseRole(dbRole: string): AgencyRole {
  if (dbRole === 'agency_admin' || dbRole === 'client_viewer') return dbRole as AgencyRole
  if (dbRole === 'admin' || dbRole === 'member') return 'agency_admin'
  return 'agency_admin'
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/** Derive a 32-byte HMAC key from BETTER_AUTH_SECRET. */
function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/**
 * Issue a signed portal JWT.
 * Called from POST /api/portal/auth/token after session validation.
 */
export async function issuePortalJwt(opts: {
  userId: string
  agencyId: string
  role: AgencyRole
  secret: string
  expiresInHours?: number
}): Promise<string> {
  const key = secretKey(opts.secret)
  return new SignJWT({
    agency_id: opts.agencyId,
    role: opts.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(opts.userId)
    .setIssuedAt()
    .setExpirationTime(`${opts.expiresInHours ?? 1}h`)
    .sign(key)
}

// ─── Middleware factory ───────────────────────────────────────────────────────

export interface RequireAgencyCtxOptions {
  /**
   * BETTER_AUTH_SECRET used to verify HS256 JWT signatures.
   * Passed from the Cloudflare Pages env binding.
   */
  secret: string
}

export function requireAgencyCtx(opts: RequireAgencyCtxOptions): MiddlewareHandler {
  const key = secretKey(opts.secret)

  return async (c: Context, next) => {
    // 1. Extract bearer token
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorised' }, 401)
    }
    const token = authHeader.slice(7)

    // 2. Verify JWT signature + expiry
    let payload: PortalJwtPayload
    try {
      const { payload: rawPayload } = await jwtVerify(token, key)
      if (!isPortalJwtPayload(rawPayload)) {
        return c.json({ error: 'Invalid token claims' }, 401)
      }
      payload = rawPayload
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // 3. Confirm the user is a member of the agency declared in the JWT.
    //    This prevents a valid token issued for agency A being replayed on
    //    agency B's routes, and catches revoked memberships immediately.
    const db = c.env.DB as D1Database
    const membership = await db
      .prepare(
        'SELECT role FROM agency_users WHERE agency_id = ? AND user_id = ? LIMIT 1'
      )
      .bind(payload.agency_id, payload.sub)
      .first<{ role: string }>()

    if (!membership) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // 4. Validate the DB role matches the JWT role (defense-in-depth).
    const dbRole = normaliseRole(membership.role)
    if (dbRole !== payload.role) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // 5. Populate typed context for downstream handlers.
    c.set('agencyCtx', {
      agencyId: payload.agency_id,
      role: dbRole,
      userId: payload.sub,
    })

    await next()
  }
}
