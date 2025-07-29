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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Property {
  id: string;
  name: string;
  location: string;
}

interface ICalSync {
  id: string;
  property_id: string;
  platform_name: string;
  ical_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency_hours: number;
  created_at: string;
  properties?: Property;
}

const Synchronization = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [syncs, setSyncs] = useState<ICalSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSync, setNewSync] = useState({
    property_id: '',
    platform_name: 'Airbnb',
    ical_url: '',
    sync_frequency_hours: 6
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch existing syncs
      const { data: syncsData, error: syncsError } = await supabase
        .from('ical_syncs')
        .select(`
          *,
          properties:property_id (
            id,
            name,
            location
          )
        `)
        .eq('user_id', user?.id);

      if (syncsError) throw syncsError;
      setSyncs(syncsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de sincronização',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSync = async () => {
    if (!newSync.property_id || !newSync.ical_url) {
      toast({
        title: 'Erro',
        description: 'Selecione uma propriedade e insira a URL do calendário',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ical_syncs')
        .insert({
          user_id: user?.id,
          property_id: newSync.property_id,
          platform_name: newSync.platform_name,
          ical_url: newSync.ical_url,
          sync_frequency_hours: newSync.sync_frequency_hours
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização adicionada com sucesso'
      });

      setShowAddForm(false);
      setNewSync({
        property_id: '',
        platform_name: 'Airbnb',
        ical_url: '',
        sync_frequency_hours: 6
      });
      fetchData();

    } catch (error) {
      console.error('Error adding sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar sincronização',
        variant: 'destructive'
      });
    }
  };

  const handleToggleSync = async (syncId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ical_syncs')
        .update({ is_active: isActive })
        .eq('id', syncId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Sincronização ${isActive ? 'ativada' : 'desativada'}`
      });

      fetchData();

    } catch (error) {
      console.error('Error toggling sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da sincronização',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSync = async (syncId: string) => {
    try {
      const { error } = await supabase
        .from('ical_syncs')
        .delete()
        .eq('id', syncId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização removida'
      });

      fetchData();

    } catch (error) {
      console.error('Error deleting sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover sincronização',
        variant: 'destructive'
      });
    }
  };

  const handleManualSync = async (syncId: string) => {
    try {
      const { error } = await supabase.functions.invoke('sync-ical', {
        body: { sync_id: syncId }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização manual iniciada'
      });

      fetchData();

    } catch (error) {
      console.error('Error manual sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao executar sincronização manual',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sincronização com Plataformas</h1>
          <p className="text-muted-foreground">
            Sincronize calendários do Airbnb e outras plataformas
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Sincronização
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Propriedade</Label>
              <Select 
                value={newSync.property_id} 
                onValueChange={(value) => setNewSync(prev => ({ ...prev, property_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma propriedade" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
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
              <Button onClick={handleAddSync}>Adicionar</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {syncs.map((sync) => (
          <Card key={sync.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{sync.platform_name}</span>
                    <Badge variant={sync.is_active ? "default" : "secondary"}>
                      {sync.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sync.properties?.name} - {sync.properties?.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sync.last_sync_at 
                      ? `Última sincronização: ${new Date(sync.last_sync_at).toLocaleString('pt-BR')}`
                      : 'Nunca sincronizado'
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sync.is_active}
                    onCheckedChange={(checked) => handleToggleSync(sync.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualSync(sync.id)}
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
                    onClick={() => handleDeleteSync(sync.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {syncs.length === 0 && !showAddForm && (
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

export default Synchronization;