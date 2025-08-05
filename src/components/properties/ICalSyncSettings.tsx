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
    <div className="space-y-4">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Export Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Exportar ({properties.length} propriedades)
            </CardTitle>
            <CardDescription className="text-sm">
              Links para bloquear datas no Airbnb
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.length > 0 ? (
              properties.map((property) => {
                const exportUrl = generateExportUrl(property.id);
                return (
                  <div key={property.id} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{property.name}</div>
                      <div className="font-mono text-xs text-muted-foreground truncate">
                        {exportUrl}
                      </div>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(exportUrl, property.name)}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma propriedade disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Import Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Importar ({activeSyncs.length}/{totalSyncs} ativas)
            </CardTitle>
            <CardDescription className="text-sm">
              Status das sincronizações configuradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalSyncs > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total configuradas:</span>
                  <Badge variant="outline">{totalSyncs}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ativas:</span>
                  <Badge variant={activeSyncs.length > 0 ? "default" : "secondary"}>
                    {activeSyncs.length}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sincronização configurada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Manager */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurar Sincronizações</CardTitle>
          <CardDescription className="text-sm">
            Gerencie importações de calendários externos
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