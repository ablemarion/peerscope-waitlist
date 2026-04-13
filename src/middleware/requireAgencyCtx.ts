/**
 * requireAgencyCtx — Hono middleware for Client Portal multi-tenancy.
 *
 * Extracts `agency_id` and `role` from the Better Auth JWT bearer token,
 * then verifies the authenticated user is an actual member of that agency
 * in the `agency_users` table. If either check fails the request is
 * rejected — routes NEVER trust a user-supplied agency_id.
 *
 * Populates `c.var.agencyCtx` for downstream route handlers.
 */

import type { Context, MiddlewareHandler } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
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

// ─── Middleware factory ───────────────────────────────────────────────────────

export interface RequireAgencyCtxOptions {
  /**
   * The URL of the Better Auth JWKS endpoint used to verify JWT signatures.
   * e.g. "https://your-worker.pages.dev/api/portal/auth/jwks"
   */
  jwksUrl: string
  /**
   * Expected JWT audience claim. Must match the `aud` set in betterAuth jwt config.
   * @default undefined (audience check skipped)
   */
  audience?: string
}

export function requireAgencyCtx(opts: RequireAgencyCtxOptions): MiddlewareHandler {
  const JWKS = createRemoteJWKSet(new URL(opts.jwksUrl))

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
      const { payload: rawPayload } = await jwtVerify(token, JWKS, {
        audience: opts.audience,
      })
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
    const dbRole = membership.role as AgencyRole
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
