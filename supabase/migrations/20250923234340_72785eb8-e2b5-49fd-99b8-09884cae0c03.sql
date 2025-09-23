-- Melhorias de segurança para proteção de dados pessoais
-- 1. Função para validar se dados pessoais são necessários
CREATE OR REPLACE FUNCTION public.validate_personal_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar formato de CPF se fornecido
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    -- Remove caracteres não numéricos
    NEW.cpf := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
    
    -- Valida se tem 11 dígitos
    IF length(NEW.cpf) != 11 THEN
      RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
  END IF;
  
  -- Validar formato de telefone
  IF NEW.phone IS NOT NULL THEN
    -- Remove caracteres especiais do telefone
    NEW.phone := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
  END IF;
  
  -- Validar formato de email se fornecido
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Formato de email inválido';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para validação automática
DROP TRIGGER IF EXISTS validate_booking_personal_data ON public.bookings;
CREATE TRIGGER validate_booking_personal_data
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_personal_data();

-- 3. Política adicional para garantir que apenas dados próprios sejam acessados
-- (Reforço da segurança existente)
DROP POLICY IF EXISTS "Enhanced security for personal data" ON public.bookings;
CREATE POLICY "Enhanced security for personal data" 
ON public.bookings 
FOR ALL 
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 4. Função para auditoria de acesso a dados sensíveis (opcional)
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log apenas em caso de acesso a dados sensíveis em produção
  -- Esta função pode ser expandida para audit logging se necessário
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentários para documentar os campos sensíveis
COMMENT ON COLUMN public.bookings.cpf IS 'Dados pessoais protegidos por RLS - acesso restrito ao proprietário';
COMMENT ON COLUMN public.bookings.phone IS 'Dados pessoais protegidos por RLS - acesso restrito ao proprietário';
COMMENT ON COLUMN public.bookings.email IS 'Dados pessoais protegidos por RLS - acesso restrito ao proprietário';
COMMENT ON COLUMN public.bookings.guest_name IS 'Dados pessoais protegidos por RLS - acesso restrito ao proprietário';