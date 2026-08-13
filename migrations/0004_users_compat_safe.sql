-- Safe additive migration for legacy users schemas.
-- Run only if these columns are still missing. Existing data is preserved.
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN employment_type TEXT DEFAULT 'Full-time';
ALTER TABLE users ADD COLUMN start_date TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;
