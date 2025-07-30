import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ICalSync } from '@/types/externalBooking';

export const useICalSyncs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncs, setSyncs] = useState<ICalSync[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSyncs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ical_syncs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSyncs(data || []);
    } catch (error) {
      console.error('Error fetching syncs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar sincronizações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const addSync = useCallback(async (syncData: Omit<ICalSync, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_sync_at'>) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('ical_syncs')
        .insert({
          ...syncData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização adicionada com sucesso'
      });

      await fetchSyncs();
    } catch (error) {
      console.error('Error adding sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar sincronização',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user?.id, toast, fetchSyncs]);

  const updateSync = useCallback(async (id: string, updates: Partial<ICalSync>) => {
    try {
      const { error } = await supabase
        .from('ical_syncs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização atualizada'
      });

      await fetchSyncs();
    } catch (error) {
      console.error('Error updating sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar sincronização',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user?.id, toast, fetchSyncs]);

  const deleteSync = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ical_syncs')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização removida'
      });

      await fetchSyncs();
    } catch (error) {
      console.error('Error deleting sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover sincronização',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user?.id, toast, fetchSyncs]);

  const manualSync = useCallback(async (syncId: string) => {
    try {
      const { error } = await supabase.functions.invoke('sync-ical', {
        body: { sync_id: syncId }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sincronização manual iniciada'
      });

      await fetchSyncs();
    } catch (error) {
      console.error('Error manual sync:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao executar sincronização manual',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast, fetchSyncs]);

  const getSyncsForProperty = useCallback((propertyId: string) => {
    return syncs.filter(sync => sync.property_id === propertyId);
  }, [syncs]);

  return {
    syncs,
    loading,
    fetchSyncs,
    addSync,
    updateSync,
    deleteSync,
    manualSync,
    getSyncsForProperty
  };
};