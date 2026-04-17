-- Auto-generate the next 10 days of meals and keep the schedule maintained.
-- Run this once in Supabase SQL editor after enabling pg_cron.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION generate_upcoming_meals()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i INT;
  m_date DATE;
BEGIN
  FOR i IN 0..9 LOOP
    m_date := CURRENT_DATE + i;

    INSERT INTO meals (type, meal_date, booking_start, booking_end, max_quota, booked_count, is_open)
    VALUES
      ('Breakfast', m_date, m_date + time '06:00', m_date + time '09:00', 200, 0, false),
      ('Lunch',     m_date, m_date + time '11:00', m_date + time '14:00', 200, 0, false),
      ('Dinner',    m_date, m_date + time '18:00', m_date + time '21:00', 200, 0, false)
    ON CONFLICT (type, meal_date) DO NOTHING;
  END LOOP;
END;
$$;

-- Backfill the rolling 10-day window immediately.
SELECT generate_upcoming_meals();

-- Replace any previous schedule so the job stays idempotent.
DO $$
DECLARE
  existing_job_id integer;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'generate-meals-daily'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'generate-meals-daily',
  '0 0 * * *',
  $$SELECT generate_upcoming_meals();$$
);
