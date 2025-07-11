
-- Corrigir as funções que estão com search_path mutável
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Criar trigger para handle_new_user se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Criar triggers para handle_updated_at nas tabelas relevantes
DROP TRIGGER IF EXISTS handle_updated_at_bookings ON public.bookings;
CREATE TRIGGER handle_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_clients ON public.clients;
CREATE TRIGGER handle_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
