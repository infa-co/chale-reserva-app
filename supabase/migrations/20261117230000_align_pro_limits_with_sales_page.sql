-- The Pro plan sold on page.ordomo.com.br is 35 bookings per month and a single chalé.
-- Existing chalés and bookings are never removed: the limits only block new ones.
CREATE OR REPLACE FUNCTION public.enforce_property_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  plan text := private.effective_plan(NEW.user_id);
  max_properties integer := CASE plan WHEN 'basic' THEN 1 WHEN 'pro' THEN 1 ELSE NULL END;
BEGIN
  IF plan = 'none' THEN
    RAISE EXCEPTION 'Sua assinatura não está ativa.' USING ERRCODE = 'ORD00';
  END IF;
  IF max_properties IS NOT NULL
     AND (SELECT count(*) FROM public.properties WHERE user_id = NEW.user_id) >= max_properties THEN
    RAISE EXCEPTION 'Seu plano permite até % chalé(s). O plano Premium libera vários chalés.', max_properties USING ERRCODE = 'ORD01';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_booking_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  plan text := private.effective_plan(NEW.user_id);
  max_bookings integer := CASE plan WHEN 'basic' THEN 15 WHEN 'pro' THEN 35 ELSE NULL END;
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

REVOKE ALL ON FUNCTION public.enforce_property_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_booking_limit() FROM PUBLIC, anon, authenticated;
