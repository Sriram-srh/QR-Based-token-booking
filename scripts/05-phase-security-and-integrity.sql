-- Phase security + integrity patch
-- Run in Supabase SQL editor

-- 1) Enable RLS on core tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_token_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pre_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pre_booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS counters ENABLE ROW LEVEL SECURITY;

-- 2) Temporary safe mode policy: service role full access
DROP POLICY IF EXISTS "service role full access" ON users;
CREATE POLICY "service role full access" ON users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON students;
CREATE POLICY "service role full access" ON students FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON staff;
CREATE POLICY "service role full access" ON staff FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON meal_tokens;
CREATE POLICY "service role full access" ON meal_tokens FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON menu_items;
CREATE POLICY "service role full access" ON menu_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON meal_menu_items;
CREATE POLICY "service role full access" ON meal_menu_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON meal_token_items;
CREATE POLICY "service role full access" ON meal_token_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON pre_bookings;
CREATE POLICY "service role full access" ON pre_bookings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON pre_booking_items;
CREATE POLICY "service role full access" ON pre_booking_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON audit_logs;
CREATE POLICY "service role full access" ON audit_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON notifications;
CREATE POLICY "service role full access" ON notifications FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON meals;
CREATE POLICY "service role full access" ON meals FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role full access" ON counters;
CREATE POLICY "service role full access" ON counters FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3) Missing FK + booking link
ALTER TABLE IF EXISTS pre_bookings
ADD COLUMN IF NOT EXISTS meal_id uuid REFERENCES meals(id) ON DELETE SET NULL;

-- 3a) Remove circular staff <-> counter FK path
ALTER TABLE IF EXISTS staff
DROP CONSTRAINT IF EXISTS fk_staff_counter;

ALTER TABLE IF EXISTS staff
DROP COLUMN IF EXISTS assigned_counter_id;

-- 4) Atomic booking RPC to avoid race conditions
CREATE OR REPLACE FUNCTION book_meal(
  p_student_id uuid,
  p_meal_id uuid,
  p_total_cost numeric
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_pre_booking_id uuid;
  v_meal_type text;
  v_meal_date date;
BEGIN
  SELECT type, meal_date
  INTO v_meal_type, v_meal_date
  FROM meals
  WHERE id = p_meal_id
    AND booked_count < max_quota
    AND is_open = true
  FOR UPDATE;

  IF v_meal_type IS NULL THEN
    RAISE EXCEPTION 'Meal unavailable or quota full';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pre_bookings
    WHERE student_id = p_student_id
      AND meal_id = p_meal_id
      AND status IN ('PENDING', 'ACTIVE')
  ) THEN
    RAISE EXCEPTION 'Pre-booking already exists for this meal';
  END IF;

  INSERT INTO pre_bookings (student_id, meal_id, meal_date, meal_type, status, total_cost)
  VALUES (p_student_id, p_meal_id, v_meal_date, v_meal_type, 'PENDING', p_total_cost)
  RETURNING id INTO v_pre_booking_id;

  UPDATE meals
  SET booked_count = booked_count + 1,
      updated_at = now()
  WHERE id = p_meal_id;

  RETURN v_pre_booking_id;
END;
$$;

-- 5) Performance indexes
CREATE INDEX IF NOT EXISTS idx_meal_token_items_token_id ON meal_token_items(token_id);
CREATE INDEX IF NOT EXISTS idx_pre_bookings_student_id ON pre_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_meal_tokens_counter_id ON meal_tokens(counter_id);

-- 5a) Scheduled token expiry maintenance
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION expire_meal_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE meal_tokens
  SET status = 'EXPIRED',
      updated_at = now()
  WHERE expires_at < now()
    AND status = 'VALID';
END;
$$;

DO $$
DECLARE
  existing_job_id integer;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'expire-meal-tokens'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'expire-meal-tokens',
  '*/15 * * * *',
  $$SELECT expire_meal_tokens();$$
);

-- 6) Ensure timestamptz
ALTER TABLE IF EXISTS notifications
ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;

-- 7) Notification read-state compatibility
DO $$
DECLARE
  has_read boolean;
  has_is_read boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
  ) INTO has_read;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
  ) INTO has_is_read;

  IF NOT has_is_read THEN
    EXECUTE 'ALTER TABLE public.notifications ADD COLUMN is_read boolean NOT NULL DEFAULT false';
    has_is_read := true;
  END IF;

  IF has_read AND has_is_read THEN
    EXECUTE 'UPDATE public.notifications SET is_read = read WHERE is_read IS DISTINCT FROM read';
  END IF;
END $$;
