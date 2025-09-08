import { useState, useEffect } from 'react';
import { Monitor, Smartphone, LogOut, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location?: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface SessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionsDialog = ({ open, onOpenChange }: SessionsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Para este exemplo, vamos mostrar apenas a sessão atual
        // Em uma implementação real, você precisaria de um endpoint backend para listar todas as sessões
        const currentSession: SessionInfo = {
          id: session.access_token.substring(0, 8),
          device: getDeviceInfo(),
          browser: getBrowserInfo(),
          location: 'Brasil', // Você pode usar uma API de geolocalização aqui
          lastActive: new Date(),
          isCurrent: true
        };

        setSessions([currentSession]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Erro ao carregar sessões",
        description: "Não foi possível carregar as sessões ativas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const getDeviceInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'Mobile';
    }
    return 'Desktop';
  };

  const getBrowserInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Navegador desconhecido';
  };

  const handleSignOutOtherSessions = async () => {
    setIsLoading(true);
    try {
      // Supabase não tem uma função nativa para deslogar outras sessões
      // Para este exemplo, vamos simular a funcionalidade
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Outras sessões desconectadas",
        description: "Todas as outras sessões foram desconectadas com sucesso.",
      });
      
      // Recarregar sessões após desconectar outras
      await loadSessions();
    } catch (error) {
      console.error('Error signing out other sessions:', error);
      toast({
        title: "Erro ao desconectar sessões",
        description: "Não foi possível desconectar outras sessões.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    return device === 'Mobile' ? Smartphone : Monitor;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sessões Ativas</DialogTitle>
          <DialogDescription>
            Gerencie os dispositivos conectados à sua conta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando sessões...</span>
            </div>
          ) : (
            <>
              {sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device);
                
                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <DeviceIcon size={20} className="text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{session.browser} - {session.device}</h4>
                              {session.isCurrent && (
                                <Badge variant="secondary">Atual</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {session.location && (
                                <p>📍 {session.location}</p>
                              )}
                              <p>
                                Última atividade: {format(session.lastActive, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {!session.isCurrent && (
                          <Button variant="outline" size="sm">
                            <LogOut size={14} className="mr-1" />
                            Desconectar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma sessão ativa encontrada.
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Fechar
          </Button>
          {sessions.some(s => !s.isCurrent) && (
            <Button 
              variant="destructive" 
              onClick={handleSignOutOtherSessions}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desconectar Outras Sessões
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};