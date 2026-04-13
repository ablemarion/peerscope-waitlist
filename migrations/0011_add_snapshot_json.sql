-- Migration 0011: add snapshot_json column to reports
-- Replaces R2 storage for report snapshots so deployment works without R2 enabled.
-- When R2 is enabled via CF dashboard, snapshots can be migrated there for scale.
ALTER TABLE reports ADD COLUMN snapshot_json TEXT;
