-- Migration 0010: Normalise agency_users.role to agency_admin / client_viewer
-- The original schema used 'admin'/'member' but the JWT layer uses
-- 'agency_admin'/'client_viewer'. Recreate the table with the correct values
-- so INSERT statements and middleware role comparisons stay consistent.
--
-- This migration is safe to run on a fresh DB (no prod data yet at this stage).

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS agency_users_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agency_admin' CHECK (role IN ('agency_admin', 'client_viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(agency_id, user_id)
);

-- Carry over any existing rows, mapping old role names to new ones.
INSERT OR IGNORE INTO agency_users_new (id, agency_id, user_id, role, created_at)
SELECT
  id,
  agency_id,
  user_id,
  CASE
    WHEN role IN ('agency_admin', 'client_viewer') THEN role
    WHEN role = 'admin' THEN 'agency_admin'
    WHEN role = 'member' THEN 'agency_admin'
    ELSE 'agency_admin'
  END,
  created_at
FROM agency_users;

DROP TABLE agency_users;
ALTER TABLE agency_users_new RENAME TO agency_users;

-- Restore index dropped with the old table.
CREATE INDEX IF NOT EXISTS idx_agency_users_agency ON agency_users(agency_id);

PRAGMA foreign_keys = ON;
