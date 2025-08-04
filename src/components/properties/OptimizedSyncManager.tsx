import React, { memo, useState, useEffect, useMemo, Suspense } from 'react';
import { Plus, Calendar, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOptimizedICalSyncs } from '@/hooks/useOptimizedICalSyncs';
import { Property } from '@/types/property';

interface SyncManagerProps {
  properties: Property[];
  selectedPropertyId?: string;
}

const SyncFormCard = memo(({ 
  properties, 
  selectedPropertyId, 
  onAdd, 
  onCancel 
}: {
  properties: Property[];
  selectedPropertyId?: string;
  onAdd: (sync: any) => void;
  onCancel: () => void;
}) => {
  const [newSync, setNewSync] = useState({
    property_id: selectedPropertyId || '',
    platform_name: 'Airbnb',
    ical_url: '',
    sync_frequency_hours: 6
  });

  useEffect(() => {
    if (selectedPropertyId) {
      setNewSync(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  const handleSubmit = () => {
    if (!newSync.property_id || !newSync.ical_url) return;
    onAdd(newSync);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Sincronização</CardTitle>
        <CardDescription>
          Adicione um calendário iCal de uma plataforma externa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="ical_url">URL do Calendário iCal</Label>
          <Input
            id="ical_url"
            placeholder="https://calendar.airbnb.com/calendar/ics/..."
            value={newSync.ical_url}
            onChange={(e) => setNewSync(prev => ({ ...prev, ical_url: e.target.value }))}
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

        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Adicionar</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SyncFormCard.displayName = 'SyncFormCard';

const SyncCard = memo(({ 
  sync, 
  syncProperty, 
  selectedPropertyId, 
  onToggleActive, 
  onManualSync, 
  onDelete 
}: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{sync.platform_name}</span>
            <Badge variant={sync.is_active ? "default" : "secondary"}>
              {sync.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {!selectedPropertyId && syncProperty && (
            <p className="text-sm text-muted-foreground">
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
        
        <div className="flex items-center gap-1">
          <Switch
            checked={sync.is_active}
            onCheckedChange={(checked) => onToggleActive(sync.id, { is_active: checked })}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManualSync(sync.id)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(sync.ical_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(sync.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

SyncCard.displayName = 'SyncCard';

const OptimizedSyncManager = memo(({ properties, selectedPropertyId }: SyncManagerProps) => {
  const { syncs, loading, addSync, updateSync, deleteSync, manualSync, getSyncsForProperty } = useOptimizedICalSyncs();
  const [showAddForm, setShowAddForm] = useState(false);

  const displaySyncs = useMemo(() => 
    selectedPropertyId ? getSyncsForProperty(selectedPropertyId) : syncs,
    [selectedPropertyId, getSyncsForProperty, syncs]
  );

  const handleAddSync = async (newSyncData: any) => {
    try {
      await addSync({
        ...newSyncData,
        is_active: true
      });
      setShowAddForm(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedPropertyId ? 'Sincronizações da Propriedade' : 'Todas as Sincronizações'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie sincronizações com calendários externos
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
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
        <Suspense fallback={<div>Carregando formulário...</div>}>
          <SyncFormCard
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onAdd={handleAddSync}
            onCancel={() => setShowAddForm(false)}
          />
        </Suspense>
      )}

      <div className="space-y-4">
        {displaySyncs.map((sync) => {
          const syncProperty = properties.find(p => p.id === sync.property_id);
          return (
            <SyncCard
              key={sync.id}
              sync={sync}
              syncProperty={syncProperty}
              selectedPropertyId={selectedPropertyId}
              onToggleActive={updateSync}
              onManualSync={manualSync}
              onDelete={deleteSync}
            />
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
});

OptimizedSyncManager.displayName = 'OptimizedSyncManager';

export default OptimizedSyncManager;