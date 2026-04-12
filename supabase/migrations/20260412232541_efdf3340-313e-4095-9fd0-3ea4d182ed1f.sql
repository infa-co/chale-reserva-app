
-- Fix audit_logs: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix rate_limit_tracking: restrict ALL to service_role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_tracking;
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limit_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix function search_path for validate_personal_data
CREATE OR REPLACE FUNCTION public.validate_personal_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    NEW.cpf := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
    IF length(NEW.cpf) != 11 THEN
      RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
  END IF;
  
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Formato de email inválido';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix function search_path for log_sensitive_data_access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(NEW, OLD);
END;
$function$;
