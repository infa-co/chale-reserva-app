import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Calendar, RefreshCw, Settings, Copy, ExternalLink } from 'lucide-react';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { useOptimizedICalSyncs } from '@/hooks/useOptimizedICalSyncs';
import { Property } from '@/types/property';
import OptimizedSyncManager from './OptimizedSyncManager';
import { toast } from 'sonner';

interface ICalSyncSettingsProps {
  properties: Property[];
}

const ICalSyncSettings = ({ properties }: ICalSyncSettingsProps) => {
  const { syncs, loading } = useOptimizedICalSyncs();

  const activeSyncs = syncs.filter(sync => sync.is_active);
  const totalSyncs = syncs.length;

  const generateExportUrl = (propertyId: string) => {
    return `https://lwmwwsthduvmuyhynwol.supabase.co/functions/v1/export-ical?property_id=${propertyId}`;
  };

  const copyToClipboard = async (text: string, propertyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`URL copiada para ${propertyName}!`);
    } catch (err) {
      toast.error('Erro ao copiar URL');
    }
  };

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

      {/* Export URLs */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <ExternalLink className="h-5 w-5" />
            Exportar para Airbnb/Booking.com
          </CardTitle>
          <CardDescription className="text-green-700">
            Use os links abaixo para bloquear datas no Airbnb e outras plataformas quando você tem reservas no Ordomo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {properties.length > 0 ? (
            <div className="space-y-4">
              {properties.map((property) => {
                const exportUrl = generateExportUrl(property.id);
                return (
                  <div key={property.id} className="p-4 border border-green-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">{property.name}</h4>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {property.location}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={exportUrl}
                        readOnly
                        className="font-mono text-xs bg-green-50 border-green-300"
                      />
                      <Button
                        onClick={() => copyToClipboard(exportUrl, property.name)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-green-700">Nenhuma propriedade disponível para exportação.</p>
          )}
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">Como configurar no Airbnb:</h5>
            <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
              <li>Copie o link da propriedade acima</li>
              <li>Acesse "Calendário" no painel do Airbnb</li>
              <li>Clique em "Importar calendário"</li>
              <li>Cole o link copiado</li>
              <li>As reservas do Ordomo aparecerão como bloqueadas</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            Sincronização Bidirecional
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure tanto a importação quanto a exportação para sincronização completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Importar (Airbnb → Ordomo):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Configure abaixo o link iCal do Airbnb</li>
                <li>Reservas externas aparecem no calendário</li>
                <li>Sincronização automática a cada hora</li>
              </ul>
            </div>
            <div>
              <strong>Exportar (Ordomo → Airbnb):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use os links de exportação acima</li>
                <li>Bloqueia datas no Airbnb automaticamente</li>
                <li>Evita reservas duplas</li>
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