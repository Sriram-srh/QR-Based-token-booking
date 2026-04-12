-- Add backup code support for manual token verification fallback
ALTER TABLE meal_tokens
ADD COLUMN IF NOT EXISTS backup_code VARCHAR(16);

-- Backfill existing tokens that do not yet have a backup code
UPDATE meal_tokens
SET backup_code = UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 8))
WHERE backup_code IS NULL;

-- Enforce uniqueness and lookup performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_tokens_backup_code ON meal_tokens(backup_code);
