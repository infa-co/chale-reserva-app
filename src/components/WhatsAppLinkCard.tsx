import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkStatus {
  configured: boolean;
  allowed: boolean;
  number: string | null;
  linked: boolean;
  phone: string | null;
  daily_summary: boolean;
  code?: string;
  expires_at?: string;
}

// Lets the owner link their own WhatsApp to the Ordomo assistant: the app shows a code and the
// owner sends it from their phone, which proves the number is theirs.
export const WhatsAppLinkCard = () => {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('whatsapp-link', { body: { action, ...extra } });
    if (error) {
      let message = 'Não foi possível falar com o WhatsApp do Ordomo.';
      try {
        const body = await (error as { context?: Response }).context?.clone().json();
        if (typeof body?.error === 'string') message = body.error;
      } catch {
        // resposta sem JSON
      }
      throw new Error(message);
    }
    return data as LinkStatus;
  }, []);

  useEffect(() => {
    let cancelled = false;
    call('status').then((s) => { if (!cancelled) setStatus(s); }).catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, [call]);

  // While a code is on screen, notice when the phone gets linked.
  useEffect(() => {
    if (!status?.code || status.linked) return;
    const timer = setInterval(() => {
      call('status').then((s) => {
        if (s.linked) {
          setStatus(s);
          toast.success('WhatsApp vinculado!');
        }
      }).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [status?.code, status?.linked, call]);

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      setStatus(await call(action, extra));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro inesperado');
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  const message = status.code ? `Vincular Ordomo ${status.code}` : '';
  const waLink = status.number && status.code ? `https://wa.me/${status.number}?text=${encodeURIComponent(message)}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          WhatsApp do Ordomo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mande reservas por mensagem, foto ou áudio e pergunte pela agenda. Nada é salvo sem a sua confirmação.
        </p>

        {!status.configured && (
          <p className="text-sm text-muted-foreground">Em breve: o número do Ordomo ainda está sendo ativado.</p>
        )}

        {status.configured && !status.allowed && (
          <p className="text-sm text-muted-foreground">Disponível nos planos Pro e Premium.</p>
        )}

        {status.configured && status.allowed && status.linked && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Número vinculado</p>
                <p className="text-sm text-muted-foreground">{status.phone}</p>
              </div>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => run('unlink')}>
                Desvincular
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Resumo diário</p>
                <p className="text-sm text-muted-foreground">Chegadas e saídas do dia, toda manhã.</p>
              </div>
              <Switch
                checked={status.daily_summary}
                disabled={busy}
                onCheckedChange={(enabled) => run('set_summary', { enabled })}
              />
            </div>
          </div>
        )}

        {status.configured && status.allowed && !status.linked && !status.code && (
          <Button disabled={busy} onClick={() => run('start')} className="bg-sage-600 hover:bg-sage-700">
            Vincular meu WhatsApp
          </Button>
        )}

        {status.configured && status.allowed && !status.linked && status.code && (
          <div className="space-y-3">
            <p className="text-sm">Envie esta mensagem do seu WhatsApp para o número do Ordomo (vale por 15 minutos):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">{message}</code>
              <Button
                variant="outline"
                size="sm"
                aria-label="Copiar mensagem"
                onClick={() => navigator.clipboard.writeText(message).then(() => toast.success('Mensagem copiada'))}
              >
                <Copy size={14} />
              </Button>
            </div>
            {waLink && (
              <Button asChild className="bg-sage-600 hover:bg-sage-700">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} className="mr-2" />
                  Abrir o WhatsApp
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
