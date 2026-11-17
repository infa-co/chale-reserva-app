-- Each calendar connection remembers how its last attempt went, so the app can show
-- "conectado", "erro" and the reason even when the failure happened in the hourly job.
ALTER TABLE public.ical_syncs
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_status text CHECK (last_sync_status IN ('ok', 'error')),
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS last_sync_count integer;

-- The same calendar connected twice to one chalé would import every reservation twice.
CREATE UNIQUE INDEX IF NOT EXISTS ical_syncs_property_url_unique
  ON public.ical_syncs (property_id, ical_url);
