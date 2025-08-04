import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, RefreshCw, Settings } from 'lucide-react';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { useOptimizedICalSyncs } from '@/hooks/useOptimizedICalSyncs';
import OptimizedSyncManager from './OptimizedSyncManager';

const ICalSyncSettings = () => {
  const { properties } = useOptimizedProperties();
  const { syncs, loading } = useOptimizedICalSyncs();

  const activeSyncs = syncs.filter(sync => sync.is_active);
  const totalSyncs = syncs.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sincronizações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSyncs}</div>
            <p className="text-xs text-muted-foreground">
              Configuradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sincronizações Ativas</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSyncs.length}</div>
            <p className="text-xs text-muted-foreground">
              Executando automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriedades</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para sincronização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            Sobre a Sincronização iCal
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure links de calendário do Airbnb, Booking.com e outras plataformas para sincronizar automaticamente suas reservas externas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Como funciona:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Adicione o link iCal da plataforma</li>
                <li>Sistema sincroniza automaticamente a cada hora</li>
                <li>Reservas aparecem no calendário com marcador laranja</li>
              </ul>
            </div>
            <div>
              <strong>Benefícios:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Evita conflitos de datas</li>
                <li>Visão unificada de todas as reservas</li>
                <li>Atualização automática em tempo real</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Sincronizações</CardTitle>
          <CardDescription>
            Configure e gerencie suas sincronizações de calendário externo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OptimizedSyncManager properties={properties} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ICalSyncSettings;