-- Adicionar coluna guest_email na tabela bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Criar tabela de audit logs para rastreamento de operações sensíveis
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Habilitar RLS na tabela de audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver todos os logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Sistema pode inserir logs (via service role)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Criar tabela para rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP ou user_id
  action TEXT NOT NULL, -- 'login', 'signup', etc.
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice único para performance e constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
ON public.rate_limit_tracking(identifier, action, window_start);

-- Índice para limpeza de registros antigos
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start 
ON public.rate_limit_tracking(window_start);

-- Habilitar RLS
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode acessar (usado pelas edge functions)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limit_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para limpar registros antigos de rate limiting (mais de 1 hora)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limit_tracking
  WHERE window_start < (now() - interval '1 hour');
END;
$$;