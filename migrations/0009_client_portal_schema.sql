-- Client Portal MVP: Core tenancy tables
-- Migration 0009: agencies, agency_users, clients, projects, competitor_targets, reports, client_invitations

-- Agencies (tenants)
CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agency staff (admin users)
CREATE TABLE IF NOT EXISTS agency_users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(agency_id, user_id)
);

-- Clients the agency serves
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Projects (what to track for each client)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Competitors to track per project
CREATE TABLE IF NOT EXISTS competitor_targets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  track_pricing INTEGER NOT NULL DEFAULT 1,
  track_jobs INTEGER NOT NULL DEFAULT 1,
  track_reviews INTEGER NOT NULL DEFAULT 1,
  track_features INTEGER NOT NULL DEFAULT 1
);

-- Generated reports (metadata in D1, body in R2)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  r2_key TEXT,
  generated_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client invite tokens (magic link, 7-day TTL)
CREATE TABLE IF NOT EXISTS client_invitations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns (always filter by agency_id)
CREATE INDEX IF NOT EXISTS idx_agency_users_agency ON agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_targets_project ON competitor_targets(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_agency ON reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_client_invitations_agency ON client_invitations(agency_id);

