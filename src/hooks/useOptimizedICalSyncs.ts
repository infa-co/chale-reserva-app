import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ICalSync {
  id: string;
  user_id: string;
  property_id: string;
  platform_name: string;
  ical_url: string;
  sync_frequency_hours: number;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at?: string;
}

const QUERY_KEYS = {
  syncs: ['ical-syncs'] as const,
};

const useSyncsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.syncs,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ical_syncs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching syncs:', error);
        throw new Error('Erro ao carregar sincronizações');
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useOptimizedICalSyncs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: syncs = [], isLoading: loading, refetch } = useSyncsQuery();

  const addSyncMutation = useMutation({
    mutationFn: async (syncData: Omit<ICalSync, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_sync_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ical_syncs')
        .insert([{
          ...syncData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding sync:', error);
        throw new Error('Erro ao adicionar sincronização');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ICalSync[]>(QUERY_KEYS.syncs, (old = []) => [data, ...old]);
      toast.success('Sincronização adicionada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar sincronização');
    },
  });

  const updateSyncMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ICalSync> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ical_syncs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating sync:', error);
        throw new Error('Erro ao atualizar sincronização');
      }

      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.syncs });
      
      const previousSyncs = queryClient.getQueryData<ICalSync[]>(QUERY_KEYS.syncs);
      
      queryClient.setQueryData<ICalSync[]>(QUERY_KEYS.syncs, (old = []) =>
        old.map(sync => sync.id === id ? { ...sync, ...updates } : sync)
      );
      
      return { previousSyncs };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.syncs, context?.previousSyncs);
      toast.error('Erro ao atualizar sincronização');
    },
  });

  const deleteSyncMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ical_syncs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting sync:', error);
        throw new Error('Erro ao excluir sincronização');
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.syncs });
      
      const previousSyncs = queryClient.getQueryData<ICalSync[]>(QUERY_KEYS.syncs);
      
      queryClient.setQueryData<ICalSync[]>(QUERY_KEYS.syncs, (old = []) =>
        old.filter(sync => sync.id !== id)
      );
      
      return { previousSyncs };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.syncs, context?.previousSyncs);
      toast.error('Erro ao excluir sincronização');
    },
    onSuccess: () => {
      toast.success('Sincronização excluída com sucesso!');
    },
  });

  const manualSyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      const { data, error } = await supabase.functions.invoke('trigger-sync', {
        body: { syncId }
      });

      if (error) {
        console.error('Error triggering manual sync:', error);
        throw new Error('Erro ao executar sincronização manual');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Sincronização manual executada com sucesso!');
      refetch();
    },
    onError: () => {
      toast.error('Erro ao executar sincronização manual');
    },
  });

  const getSyncsForProperty = (propertyId: string) => {
    return syncs.filter(sync => sync.property_id === propertyId);
  };

  return {
    syncs,
    loading,
    addSync: addSyncMutation.mutate,
    updateSync: (id: string, updates: Partial<ICalSync>) => 
      updateSyncMutation.mutate({ id, updates }),
    deleteSync: deleteSyncMutation.mutate,
    manualSync: manualSyncMutation.mutate,
    getSyncsForProperty,
    refetch,
    fetchSyncs: refetch, // Keep for compatibility
  };
};