-- 1) Plan limits enforced by the database (they were only checked in the browser).
-- 2) Link between an Ordomo booking and the platform reservation it came from.
-- 3) Tables for the Ordomo WhatsApp assistant.

-- ---------------------------------------------------------------------------
-- Plan known to the database. check-subscription (and the WhatsApp assistant)
-- store the paid plan they resolved from Stripe; triggers below read it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_access
  ADD COLUMN IF NOT EXISTS paid_plan text CHECK (paid_plan IN ('basic', 'pro', 'premium')),
  ADD COLUMN IF NOT EXISTS plan_checked_at timestamptz;

-- Returns 'basic' | 'pro' | 'premium' | 'none', or 'unverified' while the plan has
-- never been resolved for this account (nothing is blocked in that case, so existing
-- customers keep working until their first access check after this migration).
CREATE OR REPLACE FUNCTION private.effective_plan(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  ua public.user_access%ROWTYPE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
    RETURN 'premium';
  END IF;
  SELECT * INTO ua FROM public.user_access WHERE user_id = _user_id;
  IF NOT FOUND THEN
    RETURN 'unverified';
  END IF;
  IF ua.manual_access THEN
    RETURN CASE WHEN ua.manual_plan IN ('basic', 'pro') THEN ua.manual_plan ELSE 'premium' END;
  END IF;
  IF ua.paid_plan IS NOT NULL THEN
    RETURN ua.paid_plan;
  END IF;
  IF ua.trial_ends_at > now() THEN
    RETURN 'premium';
  END IF;
  IF ua.plan_checked_at IS NULL THEN
    RETURN 'unverified';
  END IF;
  RETURN 'none';
END;
$$;
REVOKE ALL ON FUNCTION private.effective_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.effective_plan(uuid) TO service_role;

-- Service-role wrapper so edge functions can ask the same question the triggers ask.
CREATE OR REPLACE FUNCTION public.effective_plan_for(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.effective_plan(_user_id);
$$;
REVOKE ALL ON FUNCTION public.effective_plan_for(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effective_plan_for(uuid) TO service_role;

-- Error codes read by the app and by the WhatsApp assistant:
--   ORD00 no active plan · ORD01 chalé limit · ORD02 monthly booking limit
--   ORD03 feature not in plan
CREATE OR REPLACE FUNCTION public.enforce_property_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  plan text := private.effective_plan(NEW.user_id);
  max_properties integer := CASE plan WHEN 'basic' THEN 1 WHEN 'pro' THEN 3 ELSE NULL END;
BEGIN
  IF plan = 'none' THEN
    RAISE EXCEPTION 'Sua assinatura não está ativa.' USING ERRCODE = 'ORD00';
  END IF;
  IF max_properties IS NOT NULL
     AND (SELECT count(*) FROM public.properties WHERE user_id = NEW.user_id) >= max_properties THEN
    RAISE EXCEPTION 'Seu plano permite até % chalé(s).', max_properties USING ERRCODE = 'ORD01';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_booking_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  plan text := private.effective_plan(NEW.user_id);
  max_bookings integer := CASE plan WHEN 'basic' THEN 15 WHEN 'pro' THEN 50 ELSE NULL END;
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
BEGIN
  IF plan = 'none' THEN
    RAISE EXCEPTION 'Sua assinatura não está ativa.' USING ERRCODE = 'ORD00';
  END IF;
  IF NEW.is_historical THEN
    IF plan = 'basic' THEN
      RAISE EXCEPTION 'O registro de reservas passadas não faz parte do seu plano.' USING ERRCODE = 'ORD03';
    END IF;
    RETURN NEW;
  END IF;
  IF max_bookings IS NOT NULL
     AND (SELECT count(*) FROM public.bookings
          WHERE user_id = NEW.user_id AND NOT is_historical AND created_at >= month_start) >= max_bookings THEN
    RAISE EXCEPTION 'Seu plano permite até % reservas por mês.', max_bookings USING ERRCODE = 'ORD02';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_ical_sync_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  plan text := private.effective_plan(NEW.user_id);
BEGIN
  IF plan NOT IN ('premium', 'unverified') THEN
    RAISE EXCEPTION 'A importação de calendários faz parte do plano Premium.' USING ERRCODE = 'ORD03';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_property_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_booking_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_ical_sync_plan() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_property_limit ON public.properties;
CREATE TRIGGER enforce_property_limit BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_limit();

DROP TRIGGER IF EXISTS enforce_booking_limit ON public.bookings;
CREATE TRIGGER enforce_booking_limit BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_limit();

DROP TRIGGER IF EXISTS enforce_ical_sync_plan ON public.ical_syncs;
CREATE TRIGGER enforce_ical_sync_plan BEFORE INSERT ON public.ical_syncs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ical_sync_plan();

-- ---------------------------------------------------------------------------
-- A booking registered from a platform reservation keeps that reservation's iCal UID,
-- so the import knows the dates are already an Ordomo booking and stops listing them
-- as an external block.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS external_uid text,
  ADD COLUMN IF NOT EXISTS external_platform text,
  ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'app' CHECK (created_via IN ('app', 'whatsapp'));

CREATE INDEX IF NOT EXISTS idx_bookings_external_uid
  ON public.bookings (property_id, external_uid) WHERE external_uid IS NOT NULL;

-- ---------------------------------------------------------------------------
-- WhatsApp assistant. Only edge functions (service role) touch these tables:
-- row level security is on and there are no policies for app users.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_links (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE,
  linked_at timestamptz,
  link_code_hash text,
  link_code_expires_at timestamptz,
  daily_summary boolean NOT NULL DEFAULT true,
  last_inbound_at timestamptz,
  last_summary_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_links_code ON public.whatsapp_links (link_code_hash) WHERE link_code_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  pending_action jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per inbound WhatsApp message: de-duplicates Meta's retries and feeds rate limits.
CREATE TABLE IF NOT EXISTS public.whatsapp_events (
  wa_message_id text PRIMARY KEY,
  phone text NOT NULL,
  kind text NOT NULL DEFAULT 'message',
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_phone_time ON public.whatsapp_events (phone, received_at);

ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_links, public.whatsapp_conversations, public.whatsapp_events FROM anon, authenticated;
GRANT ALL ON public.whatsapp_links, public.whatsapp_conversations, public.whatsapp_events TO service_role;

DROP TRIGGER IF EXISTS whatsapp_links_updated_at ON public.whatsapp_links;
CREATE TRIGGER whatsapp_links_updated_at BEFORE UPDATE ON public.whatsapp_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Daily summary: every hour the job asks the function to send the summaries that are due
-- (the function decides by São Paulo time and sends at most one per account per day).
INSERT INTO private.cron_secrets (name) VALUES ('whatsapp-summary') ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_name text, _secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM private.cron_secrets WHERE name = _name AND secret = _secret);
$$;
REVOKE ALL ON FUNCTION public.verify_cron_secret(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text, text) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('whatsapp-daily-summary');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'whatsapp-daily-summary',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lwmwwsthduvmuyhynwol.supabase.co/functions/v1/whatsapp-daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT secret FROM private.cron_secrets WHERE name = 'whatsapp-summary')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

-- Old de-duplication rows are only needed for a few days.
DO $$
BEGIN
  PERFORM cron.unschedule('whatsapp-events-cleanup');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
SELECT cron.schedule(
  'whatsapp-events-cleanup',
  '30 6 * * *',
  $$ DELETE FROM public.whatsapp_events WHERE received_at < now() - interval '7 days'; $$
);
