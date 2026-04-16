-- Optional compatibility patch for deployments that still have an is_used column.
-- This keeps legacy boolean usage flags in sync with canonical status values.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meal_tokens'
      AND column_name = 'is_used'
  ) THEN
    -- Backfill existing rows first.
    UPDATE public.meal_tokens
    SET is_used = (status = 'USED')
    WHERE is_used IS DISTINCT FROM (status = 'USED');
  END IF;
END
$$;
