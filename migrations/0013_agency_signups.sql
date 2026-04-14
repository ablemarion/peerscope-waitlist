-- Agency signup leads captured from /portal/signup
CREATE TABLE IF NOT EXISTS agency_signups (
  id TEXT PRIMARY KEY NOT NULL,
  agency_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  client_count TEXT NOT NULL,
  current_method TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agency_signups_created_at ON agency_signups (created_at);
CREATE INDEX IF NOT EXISTS idx_agency_signups_email ON agency_signups (email);
