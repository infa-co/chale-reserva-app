import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ClipboardPaste, Copy, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedICalSyncs, validateCalendarUrl } from '@/hooks/useOptimizedICalSyncs';
import { usePlanRestrictions } from '@/hooks/usePlanRestrictions';
import { Property } from '@/types/property';
import { toast } from 'sonner';

const exportDoneKey = (propertyId: string) => `ordomo-airbnb-export-${propertyId}`;

function readExportDone(propertyId: string): boolean {
  try {
    return localStorage.getItem(exportDoneKey(propertyId)) === '1';
  } catch {
    return false;
  }
}

function writeExportDone(propertyId: string) {
  try {
    localStorage.setItem(exportDoneKey(propertyId), '1');
  } catch {
    // storage unavailable: the step simply shows again next time
  }
}

/** Copies the chalé's signed Ordomo calendar link (the same link every time). */
async function copyOrdomoLink(propertyId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke(`export-ical?property_id=${propertyId}`, { method: 'POST' });
  if (error || !data?.url) {
    let message = 'Não foi possível gerar o link do Ordomo.';
    try {
      const body = await (error as { context?: Response })?.context?.clone().json();
      if (typeof body?.error === 'string') message = body.error;
    } catch {
      // resposta sem JSON
    }
    toast.error(message);
    return false;
  }
  await navigator.clipboard.writeText(data.url);
  toast.success('Link do Ordomo copiado');
  return true;
}

// One chalé, two directions, in plain words:
//   Airbnb → Ordomo: the owner pastes the Airbnb export link once; reservations come in every hour.
//   Ordomo → Airbnb: the owner pastes the Ordomo link in Airbnb once; Airbnb blocks those dates.
export const AirbnbConnection = ({ property }: { property: Property }) => {
  const { syncs, addSync, manualSync, syncingId, deleteSync } = useOptimizedICalSyncs();
  const { checkFeatureAccess } = usePlanRestrictions();
  const canImport = checkFeatureAccess('hasAirbnbSync');
  const canExport = checkFeatureAccess('hasICalExport');

  const sync = useMemo(
    () => syncs.find((s) => s.property_id === property.id && /airbnb/i.test(s.platform_name)),
    [syncs, property.id],
  );
  const [exportDone, setExportDone] = useState(() => readExportDone(property.id));
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const linkProblem = link.trim() ? validateCalendarUrl(link) : null;
  const importing = Boolean(sync && (syncingId === sync.id || (!sync.last_attempt_at && !sync.last_sync_at)));

  useEffect(() => {
    if (open) {
      setStep(sync || !canImport ? 2 : 1);
      setLink('');
    }
    // Only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pasteFromClipboard = async () => {
    try {
      setLink((await navigator.clipboard.readText()).trim());
    } catch {
      toast.info('Toque no campo e cole o link (segure e escolha Colar).');
    }
  };

  const connect = async () => {
    const problem = validateCalendarUrl(link);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      // Hourly, matching the scheduled job, so new Airbnb reservations show up quickly.
      await addSync({ property_id: property.id, platform_name: 'Airbnb', ical_url: link.trim(), sync_frequency_hours: 1, is_active: true });
      setStep(2);
    } catch {
      // The hook already explained the problem.
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    setCopying(true);
    try {
      if (await copyOrdomoLink(property.id)) {
        writeExportDone(property.id);
        setExportDone(true);
      }
    } finally {
      setCopying(false);
    }
  };

  const importLine = () => {
    if (!canImport) return <span className="text-muted-foreground">Disponível no plano Premium</span>;
    if (!sync) return <span className="text-muted-foreground">Não conectado</span>;
    if (importing) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Importando reservas…
        </span>
      );
    }
    if (sync.last_sync_status === 'error') {
      return <span className="text-destructive">{sync.last_sync_error || 'A última sincronização falhou.'}</span>;
    }
    const when = sync.last_sync_at ? formatDistanceToNow(new Date(sync.last_sync_at), { locale: ptBR, addSuffix: true }) : '';
    const count = sync.last_sync_count ?? 0;
    return (
      <span className="text-green-700">
        Conectado · {count} {count === 1 ? 'reserva' : 'reservas'} do Airbnb{when ? ` · atualizado ${when}` : ''}
      </span>
    );
  };

  const exportLine = () => {
    if (!canExport) return <span className="text-muted-foreground">Disponível nos planos Pro e Premium</span>;
    return exportDone
      ? <span className="text-green-700">Link do Ordomo copiado para o Airbnb</span>
      : <span className="text-muted-foreground">Ainda não configurado</span>;
  };

  const hasError = sync?.last_sync_status === 'error';
  const fullyConnected = (!canImport || (sync && !hasError)) && (!canExport || exportDone);

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{property.name}</p>
          {property.location && <p className="text-xs text-muted-foreground truncate">{property.location}</p>}
        </div>
        {fullyConnected ? (
          <span className="flex items-center gap-1 text-xs text-green-700 shrink-0"><CheckCircle2 className="h-4 w-4" /> Sincronizado</span>
        ) : hasError ? (
          <span className="flex items-center gap-1 text-xs text-destructive shrink-0"><AlertCircle className="h-4 w-4" /> Precisa de atenção</span>
        ) : null}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <ArrowDownToLine className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div><span className="font-medium">Airbnb → Ordomo: </span>{importLine()}</div>
        </div>
        <div className="flex items-start gap-2">
          <ArrowUpFromLine className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div><span className="font-medium">Ordomo → Airbnb: </span>{exportLine()}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(canImport || canExport) && (
          <Button size="sm" className="bg-sage-600 hover:bg-sage-700" onClick={() => setOpen(true)}>
            {sync || exportDone ? 'Ver conexão' : 'Conectar ao Airbnb'}
          </Button>
        )}
        {sync && (
          <Button size="sm" variant="outline" disabled={importing} onClick={() => manualSync(sync.id)}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${importing ? 'animate-spin' : ''}`} />
            Atualizar agora
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conectar {property.name} ao Airbnb</DialogTitle>
            <DialogDescription>
              Dois passos, feitos uma única vez. Depois disso os calendários se atualizam sozinhos.
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Passo 1 de 2: trazer as reservas do Airbnb</p>
              <ol className="text-sm space-y-1.5 list-decimal pl-5 text-muted-foreground">
                <li>No Airbnb, abra o <strong>Calendário</strong> e escolha o anúncio deste chalé.</li>
                <li>Entre em <strong>Disponibilidade</strong> e procure <strong>Conectar calendários</strong> (ou "Sincronizar calendários").</li>
                <li>Toque em <strong>Exportar calendário</strong> e copie o link.</li>
              </ol>
              <p className="text-xs text-muted-foreground">Os nomes dos menus podem variar um pouco entre o site e o app do Airbnb.</p>
              <div className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.airbnb.com.br/calendar/ical/…"
                  className="min-w-0"
                  aria-label="Link de exportação do calendário do Airbnb"
                />
                <Button type="button" variant="outline" onClick={pasteFromClipboard} aria-label="Colar link">
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
              </div>
              {linkProblem && <p className="text-xs text-destructive">{linkProblem}</p>}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={connect} disabled={saving || !link.trim() || Boolean(linkProblem)} className="bg-sage-600 hover:bg-sage-700">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Conectar e importar
                </Button>
                {canExport && (
                  <Button variant="ghost" onClick={() => setStep(2)}>Pular este passo</Button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {sync && (
                <div className="rounded-md bg-muted/60 p-3 text-sm space-y-2">
                  <p className="font-medium">Reservas do Airbnb</p>
                  <p className="text-xs">{importLine()}</p>
                  {hasError && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => manualSync(sync.id)}>Tentar de novo</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          deleteSync(sync.id);
                          setStep(1);
                        }}
                      >
                        Trocar o link
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {!canImport && (
                <p className="text-xs text-muted-foreground">
                  Trazer as reservas do Airbnb para o Ordomo faz parte do plano Premium.
                </p>
              )}

              {canExport ? (
                <>
                  <p className="text-sm font-medium">{canImport ? 'Passo 2 de 2: ' : ''}bloquear no Airbnb as reservas do Ordomo</p>
                  <Button onClick={copyLink} disabled={copying} className="w-full bg-sage-600 hover:bg-sage-700">
                    {copying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copiar link do Ordomo
                  </Button>
                  <ol className="text-sm space-y-1.5 list-decimal pl-5 text-muted-foreground">
                    <li>Volte à mesma tela do Airbnb (<strong>Conectar calendários</strong>).</li>
                    <li>Toque em <strong>Importar calendário</strong>.</li>
                    <li>Cole o link do Ordomo, dê o nome <strong>Ordomo</strong> e salve.</li>
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    O Airbnb busca esse calendário sozinho algumas vezes por dia. Uma reserva nova feita no Ordomo pode levar
                    algumas horas para bloquear no Airbnb; esse intervalo é definido pelo Airbnb.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Bloquear no Airbnb as reservas do Ordomo faz parte dos planos Pro e Premium.</p>
              )}

              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Concluir</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
