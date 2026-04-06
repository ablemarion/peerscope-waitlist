-- Drip email sequence tracking columns
ALTER TABLE waitlist ADD COLUMN signup_ts TEXT;
ALTER TABLE waitlist ADD COLUMN email_sent_2 TEXT;
ALTER TABLE waitlist ADD COLUMN email_sent_3 TEXT;
ALTER TABLE waitlist ADD COLUMN email_sent_4 TEXT;

-- Backfill signup_ts from created_at for existing rows
UPDATE waitlist SET signup_ts = created_at WHERE signup_ts IS NULL;
