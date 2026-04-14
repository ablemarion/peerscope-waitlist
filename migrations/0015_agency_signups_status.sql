-- Track activation state for agency signups captured from /portal/signup
-- status: 'pending_review' (default) | 'activated'
ALTER TABLE agency_signups ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_review';
ALTER TABLE agency_signups ADD COLUMN activated_at TEXT;
ALTER TABLE agency_signups ADD COLUMN agency_id TEXT;

CREATE INDEX IF NOT EXISTS idx_agency_signups_status ON agency_signups (status);
