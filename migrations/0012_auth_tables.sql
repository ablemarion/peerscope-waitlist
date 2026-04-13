-- Migration 0012: Better Auth user and session tables
-- These are written to directly by the portal auth routes (accept-invite, auth/token).
-- Column names match the snake_case used in all INSERT/SELECT queries in [[route]].ts.

CREATE TABLE IF NOT EXISTS user (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image        TEXT,
  agency_id    TEXT REFERENCES agencies(id) ON DELETE SET NULL,
  agency_role  TEXT CHECK (agency_role IN ('agency_admin', 'client_viewer')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  id         TEXT PRIMARY KEY,
  token      TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_session_token  ON session(token);
CREATE INDEX IF NOT EXISTS idx_session_user   ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email     ON user(email);
