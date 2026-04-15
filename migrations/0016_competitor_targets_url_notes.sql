-- Migration 0016: Add homepage_url and notes to competitor_targets
-- Supports the new client-level competitor management UI (SPA-400)

ALTER TABLE competitor_targets ADD COLUMN homepage_url TEXT;
ALTER TABLE competitor_targets ADD COLUMN notes TEXT;
