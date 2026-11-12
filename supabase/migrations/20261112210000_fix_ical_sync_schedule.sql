-- The hourly iCal job called trigger-sync with the public anon key, which the function
-- rejects, so no calendar was ever synchronized automatically.
-- The job now proves itself with a random secret that never leaves the database.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.cron_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.cron_secrets FROM PUBLIC, anon, authenticated;

INSERT INTO private.cron_secrets (name) VALUES ('ical-sync') ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_ical_cron_secret(_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM private.cron_secrets WHERE name = 'ical-sync' AND secret = _secret);
$$;
REVOKE ALL ON FUNCTION public.verify_ical_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ical_cron_secret(text) TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('trigger-ical-sync-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job did not exist yet
END;
$$;

SELECT cron.schedule(
  'trigger-ical-sync-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lwmwwsthduvmuyhynwol.supabase.co/functions/v1/trigger-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT secret FROM private.cron_secrets WHERE name = 'ical-sync')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

-- Imported calendars are read per sync on every booking conflict check.
CREATE INDEX IF NOT EXISTS idx_external_bookings_sync_dates
  ON public.external_bookings (ical_sync_id, start_date, end_date);
