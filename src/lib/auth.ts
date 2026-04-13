/**
 * Better Auth configuration for Client Portal multi-tenancy.
 *
 * Roles:
 *   agency_admin  — agency staff; full read/write over their agency's resources
 *   client_viewer — client portal user; read-only, published reports only
 *
 * JWT claims include { agency_id, role } sourced from the user's profile.
 * The JWT plugin exposes GET /api/portal/auth/jwks for token verification.
 */

import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'
import type { D1Database } from '@cloudflare/workers-types'

export type AgencyRole = 'agency_admin' | 'client_viewer'

export interface AgencyJwtClaims {
  agency_id: string | null
  role: AgencyRole | null
}

interface AuthEnv {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

export function createAuth(env: AuthEnv) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: {
      // D1 is SQLite-compatible; better-auth accepts a D1Database as the db option
      db: env.DB as unknown as Parameters<typeof betterAuth>[0]['database'] extends { db: infer T } ? T : never,
      type: 'sqlite' as const,
    },
    user: {
      additionalFields: {
        agencyId: {
          type: 'string' as const,
          fieldName: 'agency_id',
          required: false,
          defaultValue: null,
        },
        agencyRole: {
          type: 'string' as const,
          fieldName: 'agency_role',
          required: false,
          defaultValue: 'agency_admin',
        },
      },
    },
    plugins: [
      jwt({
        jwt: {
          expirationTime: '1h',
          definePayload: ({ user }) => ({
            agency_id: (user as { agencyId?: string | null }).agencyId ?? null,
            role: ((user as { agencyRole?: string | null }).agencyRole ?? null) as AgencyRole | null,
          }),
        },
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
