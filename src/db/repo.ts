/**
 * Typed D1 repository wrapper for Client Portal.
 *
 * All public methods automatically scope queries to the provided agencyId.
 * Route handlers NEVER need to add `AND agency_id = ?` inline — this layer
 * enforces it universally, preventing cross-tenant data leaks.
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types'

// ─── Row types ────────────────────────────────────────────────────────────────

export interface AgencyRow {
  id: string
  name: string
  slug: string
  stripe_customer_id: string | null
  plan: string
  logo_url: string | null
  primary_color: string
  created_at: string
}

export interface ClientRow {
  id: string
  agency_id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface ProjectRow {
  id: string
  agency_id: string
  client_id: string
  name: string
  description: string | null
  created_at: string
}

export interface CompetitorTargetRow {
  id: string
  project_id: string
  domain: string
  name: string
  track_pricing: number
  track_jobs: number
  track_reviews: number
  track_features: number
}

export interface ReportRow {
  id: string
  project_id: string
  agency_id: string
  title: string
  status: 'draft' | 'published'
  r2_key: string | null
  generated_at: string | null
  published_at: string | null
  created_at: string
}

export interface ClientInvitationRow {
  id: string
  agency_id: string
  client_id: string
  email: string
  token_hash: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// ─── D1 result helpers ────────────────────────────────────────────────────────

function rows<T>(result: D1Result<T>): T[] {
  return result.results ?? []
}

// ─── Repo ─────────────────────────────────────────────────────────────────────

export class AgencyRepo {
  private readonly db: D1Database
  private readonly agencyId: string

  constructor(db: D1Database, agencyId: string) {
    this.db = db
    this.agencyId = agencyId
  }

  // ── Agencies ────────────────────────────────────────────────────────────────

  async getAgency(): Promise<AgencyRow | null> {
    return this.db
      .prepare('SELECT * FROM agencies WHERE id = ?')
      .bind(this.agencyId)
      .first<AgencyRow>()
  }

  // ── Clients ─────────────────────────────────────────────────────────────────

  async listClients(opts: { limit?: number; offset?: number } = {}): Promise<ClientRow[]> {
    const { limit = 50, offset = 0 } = opts
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE agency_id = ? ORDER BY name ASC LIMIT ? OFFSET ?')
      .bind(this.agencyId, limit, offset)
      .all<ClientRow>()
    return rows(result)
  }

  async getClient(clientId: string): Promise<ClientRow | null> {
    return this.db
      .prepare('SELECT * FROM clients WHERE id = ? AND agency_id = ?')
      .bind(clientId, this.agencyId)
      .first<ClientRow>()
  }

  async createClient(data: { name: string; email: string }): Promise<ClientRow> {
    const result = await this.db
      .prepare(
        'INSERT INTO clients (agency_id, name, email) VALUES (?, ?, ?) RETURNING *'
      )
      .bind(this.agencyId, data.name, data.email)
      .first<ClientRow>()
    if (!result) throw new Error('Failed to create client')
    return result
  }

  async updateClient(
    clientId: string,
    data: Partial<Pick<ClientRow, 'name' | 'email' | 'status'>>
  ): Promise<ClientRow | null> {
    const fields: string[] = []
    const values: unknown[] = []
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email) }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }
    if (fields.length === 0) return this.getClient(clientId)
    values.push(clientId, this.agencyId)
    return this.db
      .prepare(
        `UPDATE clients SET ${fields.join(', ')} WHERE id = ? AND agency_id = ? RETURNING *`
      )
      .bind(...values)
      .first<ClientRow>()
  }

  async deleteClient(clientId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM clients WHERE id = ? AND agency_id = ?')
      .bind(clientId, this.agencyId)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  // ── Projects ─────────────────────────────────────────────────────────────────

  async listProjects(clientId?: string): Promise<ProjectRow[]> {
    const result = clientId
      ? await this.db
          .prepare(
            'SELECT * FROM projects WHERE agency_id = ? AND client_id = ? ORDER BY name ASC'
          )
          .bind(this.agencyId, clientId)
          .all<ProjectRow>()
      : await this.db
          .prepare('SELECT * FROM projects WHERE agency_id = ? ORDER BY name ASC')
          .bind(this.agencyId)
          .all<ProjectRow>()
    return rows(result)
  }

  async getProject(projectId: string): Promise<ProjectRow | null> {
    return this.db
      .prepare('SELECT * FROM projects WHERE id = ? AND agency_id = ?')
      .bind(projectId, this.agencyId)
      .first<ProjectRow>()
  }

  async createProject(data: {
    clientId: string
    name: string
    description?: string
  }): Promise<ProjectRow> {
    const result = await this.db
      .prepare(
        'INSERT INTO projects (agency_id, client_id, name, description) VALUES (?, ?, ?, ?) RETURNING *'
      )
      .bind(this.agencyId, data.clientId, data.name, data.description ?? null)
      .first<ProjectRow>()
    if (!result) throw new Error('Failed to create project')
    return result
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM projects WHERE id = ? AND agency_id = ?')
      .bind(projectId, this.agencyId)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  // ── Competitor targets ────────────────────────────────────────────────────────

  async listCompetitorTargets(projectId: string): Promise<CompetitorTargetRow[]> {
    // Validate the project belongs to this agency before returning targets.
    const project = await this.getProject(projectId)
    if (!project) return []
    const result = await this.db
      .prepare('SELECT * FROM competitor_targets WHERE project_id = ?')
      .bind(projectId)
      .all<CompetitorTargetRow>()
    return rows(result)
  }

  // ── Client invitations (create) ──────────────────────────────────────────────

  async createInvitation(data: {
    clientId: string
    email: string
    tokenHash: string
    expiresAt: string
  }): Promise<ClientInvitationRow> {
    const result = await this.db
      .prepare(
        'INSERT INTO client_invitations (agency_id, client_id, email, token_hash, expires_at) VALUES (?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(this.agencyId, data.clientId, data.email, data.tokenHash, data.expiresAt)
      .first<ClientInvitationRow>()
    if (!result) throw new Error('Failed to create invitation')
    return result
  }

  // ── Reports (create) ──────────────────────────────────────────────────────────

  async createReport(data: {
    id: string
    projectId: string
    title: string
    r2Key: string
    generatedAt: string
  }): Promise<ReportRow> {
    const result = await this.db
      .prepare(
        `INSERT INTO reports (id, project_id, agency_id, title, status, r2_key, generated_at)
         VALUES (?, ?, ?, ?, 'draft', ?, ?) RETURNING *`
      )
      .bind(data.id, data.projectId, this.agencyId, data.title, data.r2Key, data.generatedAt)
      .first<ReportRow>()
    if (!result) throw new Error('Failed to create report')
    return result
  }

  async createCompetitorTarget(data: {
    projectId: string
    domain: string
    name: string
    trackPricing?: boolean
    trackJobs?: boolean
    trackReviews?: boolean
    trackFeatures?: boolean
  }): Promise<CompetitorTargetRow | null> {
    // Validate the project belongs to this agency.
    const project = await this.getProject(data.projectId)
    if (!project) return null
    const result = await this.db
      .prepare(
        `INSERT INTO competitor_targets
           (project_id, domain, name, track_pricing, track_jobs, track_reviews, track_features)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(
        data.projectId,
        data.domain,
        data.name,
        data.trackPricing !== false ? 1 : 0,
        data.trackJobs !== false ? 1 : 0,
        data.trackReviews !== false ? 1 : 0,
        data.trackFeatures !== false ? 1 : 0
      )
      .first<CompetitorTargetRow>()
    return result ?? null
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  /**
   * List reports. client_viewer role is restricted to published reports only
   * via the `publishedOnly` flag set by requireAgencyCtx middleware.
   */
  async listReports(opts: {
    projectId?: string
    publishedOnly?: boolean
  } = {}): Promise<ReportRow[]> {
    const conditions: string[] = ['agency_id = ?']
    const bindings: unknown[] = [this.agencyId]

    if (opts.projectId) {
      conditions.push('project_id = ?')
      bindings.push(opts.projectId)
    }
    if (opts.publishedOnly) {
      conditions.push("status = 'published'")
    }

    const result = await this.db
      .prepare(
        `SELECT * FROM reports WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`
      )
      .bind(...bindings)
      .all<ReportRow>()
    return rows(result)
  }

  async getReport(reportId: string, publishedOnly = false): Promise<ReportRow | null> {
    const statusClause = publishedOnly ? " AND status = 'published'" : ''
    return this.db
      .prepare(
        `SELECT * FROM reports WHERE id = ? AND agency_id = ?${statusClause}`
      )
      .bind(reportId, this.agencyId)
      .first<ReportRow>()
  }

  // ── Client invitations ────────────────────────────────────────────────────────

  async getInvitationByTokenHash(tokenHash: string): Promise<ClientInvitationRow | null> {
    return this.db
      .prepare(
        'SELECT * FROM client_invitations WHERE token_hash = ? AND agency_id = ?'
      )
      .bind(tokenHash, this.agencyId)
      .first<ClientInvitationRow>()
  }

  async acceptInvitation(invitationId: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        "UPDATE client_invitations SET accepted_at = datetime('now') WHERE id = ? AND agency_id = ? AND accepted_at IS NULL"
      )
      .bind(invitationId, this.agencyId)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }
}

/**
 * Factory: create a repo instance already scoped to the authenticated agency.
 * Call this inside route handlers after requireAgencyCtx has populated c.var.agencyCtx.
 */
export function createRepo(db: D1Database, agencyId: string): AgencyRepo {
  return new AgencyRepo(db, agencyId)
}
