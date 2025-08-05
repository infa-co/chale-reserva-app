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
      {/* Sync Overview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sincronização de Calendários
          </CardTitle>
          <CardDescription>
            Configure a sincronização bidirecional com plataformas externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Export Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <ExternalLink className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Exportar para Airbnb</h3>
                <Badge variant="outline" className="ml-auto">
                  {properties.length} propriedades
                </Badge>
              </div>
              
              <div className="space-y-3">
                {properties.length > 0 ? (
                  properties.map((property) => {
                    const exportUrl = generateExportUrl(property.id);
                    return (
                      <div key={property.id} className="p-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{property.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {property.location}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 p-2 bg-muted rounded text-xs font-mono truncate">
                            {exportUrl}
                          </div>
                          <Button
                            onClick={() => copyToClipboard(exportUrl, property.name)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma propriedade disponível
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  <strong>Como usar:</strong> Copie o link e cole em "Importar calendário" no Airbnb
                </div>
              </div>
            </div>

            {/* Import Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <RefreshCw className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Importar do Airbnb</h3>
                <Badge variant="outline" className="ml-auto">
                  {activeSyncs.length}/{totalSyncs} ativas
                </Badge>
              </div>
              
              <div className="space-y-3">
                {totalSyncs > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold">{totalSyncs}</div>
                        <div className="text-xs text-muted-foreground">Configuradas</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{activeSyncs.length}</div>
                        <div className="text-xs text-muted-foreground">Ativas</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                      <strong>Status:</strong> Sincronizações importam reservas externas automaticamente
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Nenhuma importação configurada</div>
                    <div className="text-xs">Configure abaixo para importar reservas</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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