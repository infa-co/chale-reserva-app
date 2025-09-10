import { useState, useEffect } from 'react';
import { Plus, Calendar, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useICalSyncs } from '@/hooks/useICalSyncs';
import { Property } from '@/types/property';

interface SyncManagerProps {
  properties: Property[];
  selectedPropertyId?: string;
}

const SyncManager = ({ properties, selectedPropertyId }: SyncManagerProps) => {
  const { syncs, loading, fetchSyncs, addSync, updateSync, deleteSync, manualSync, getSyncsForProperty } = useICalSyncs();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSync, setNewSync] = useState({
    property_id: selectedPropertyId || '',
    platform_name: 'Airbnb',
    ical_url: '',
    sync_frequency_hours: 6
  });

  useEffect(() => {
    fetchSyncs();
  }, [fetchSyncs]);

  useEffect(() => {
    if (selectedPropertyId) {
      setNewSync(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  const handleAddSync = async () => {
    if (!newSync.property_id || !newSync.ical_url) {
      return;
    }

    try {
      await addSync({
        property_id: newSync.property_id,
        platform_name: newSync.platform_name,
        ical_url: newSync.ical_url,
        sync_frequency_hours: newSync.sync_frequency_hours,
        is_active: true
      });

      setShowAddForm(false);
      setNewSync({
        property_id: selectedPropertyId || '',
        platform_name: 'Airbnb',
        ical_url: '',
        sync_frequency_hours: 6
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const displaySyncs = selectedPropertyId 
    ? getSyncsForProperty(selectedPropertyId)
    : syncs;

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold">
            {selectedPropertyId ? 'Sincronizações da Propriedade' : 'Todas as Sincronizações'}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Gerencie sincronizações com calendários externos
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="sm" className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {properties.length === 0 && (
        <Alert>
          <AlertDescription>
            Você precisa cadastrar pelo menos uma propriedade antes de configurar sincronizações.
          </AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Sincronização</CardTitle>
            <CardDescription>
              Adicione um calendário iCal de uma plataforma externa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">Propriedade</Label>
                <Select 
                  value={newSync.property_id} 
                  onValueChange={(value) => setNewSync(prev => ({ ...prev, property_id: value }))}
                  disabled={!!selectedPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.filter(p => p.is_active).map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select 
                  value={newSync.platform_name} 
                  onValueChange={(value) => setNewSync(prev => ({ ...prev, platform_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airbnb">Airbnb</SelectItem>
                    <SelectItem value="Booking.com">Booking.com</SelectItem>
                    <SelectItem value="VRBO">VRBO</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ical_url">URL do Calendário iCal</Label>
              <Input
                id="ical_url"
                placeholder="https://calendar.airbnb.com/calendar/ics/..."
                value={newSync.ical_url}
                onChange={(e) => setNewSync(prev => ({ ...prev, ical_url: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência de Sincronização</Label>
              <Select 
                value={newSync.sync_frequency_hours.toString()} 
                onValueChange={(value) => setNewSync(prev => ({ ...prev, sync_frequency_hours: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">A cada hora</SelectItem>
                  <SelectItem value="3">A cada 3 horas</SelectItem>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleAddSync} className="flex-1">Adicionar</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {displaySyncs.map((sync) => {
          const syncProperty = properties.find(p => p.id === sync.property_id);
          return (
            <Card key={sync.id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm md:text-base">{sync.platform_name}</span>
                      <Badge variant={sync.is_active ? "default" : "secondary"} className="text-xs">
                        {sync.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    {!selectedPropertyId && syncProperty && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {syncProperty.name} - {syncProperty.location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {sync.last_sync_at 
                        ? `Última sincronização: ${new Date(sync.last_sync_at).toLocaleString('pt-BR')}`
                        : 'Nunca sincronizado'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={sync.is_active}
                      onCheckedChange={(checked) => updateSync(sync.id, { is_active: checked })}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => manualSync(sync.id)}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(sync.ical_url, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSync(sync.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displaySyncs.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma sincronização configurada</h3>
            <p className="text-muted-foreground mb-4">
              Configure sincronizações com plataformas externas para centralizar seus calendários
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira sincronização
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyncManager;