
-- Criar tabela de propriedades (chalés)
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  default_daily_rate numeric CHECK (default_daily_rate IS NULL OR default_daily_rate > 0),
  fixed_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Adicionar coluna property_id na tabela bookings (permitir NULL para compatibilidade)
ALTER TABLE public.bookings 
ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

-- Habilitar RLS na tabela properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para properties
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- Criar trigger para updated_at na tabela properties
CREATE TRIGGER handle_updated_at_properties
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Criar uma propriedade padrão para usuários existentes que já têm reservas
INSERT INTO public.properties (user_id, name, location, capacity, is_active)
SELECT DISTINCT 
  user_id,
  'Meu Chalé Principal' as name,
  'Localização não definida' as location,
  4 as capacity,
  true as is_active
FROM public.bookings 
WHERE NOT EXISTS (
  SELECT 1 FROM public.properties WHERE properties.user_id = bookings.user_id
);

-- Associar reservas existentes à propriedade padrão de cada usuário
UPDATE public.bookings 
SET property_id = (
  SELECT p.id 
  FROM public.properties p 
  WHERE p.user_id = bookings.user_id 
  LIMIT 1
)
WHERE property_id IS NULL;
