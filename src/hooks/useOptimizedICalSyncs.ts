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

const syncsKey = (userId?: string) => ['ical-syncs', userId] as const;

// Mirrors the hosts the import function accepts, so a wrong link is refused before it is saved.
const CALENDAR_HOST = /^((www\.)?airbnb\.[a-z.]{2,6}|ical\.booking\.com|admin\.booking\.com|www\.vrbo\.com|www\.homeaway\.com)$/;

export const validateCalendarUrl = (value: string): string | null => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return 'Cole o link completo do calendário (começa com https://)';
  }
  if (url.protocol !== 'https:') return 'O link do calendário precisa começar com https://';
  if (!CALENDAR_HOST.test(url.hostname.toLowerCase())) {
    return 'Use o link de exportação de calendário do Airbnb, Booking.com ou Vrbo';
  }
  return null;
};

// supabase-js hides the function's JSON body behind a generic error; read the real message.
const functionErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
  try {
    const body = await (error as { context?: Response })?.context?.clone().json();
    if (body && typeof body.error === 'string' && body.error.length < 200) return body.error;
  } catch {
    // not a JSON response
  }
  return fallback;
};

const useSyncsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: syncsKey(user?.id),
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ical_syncs')
        .select('*')
        .eq('user_id', user.id)
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
  const QUERY_KEYS = { syncs: syncsKey(user?.id) };
  
  const { data: syncs = [], isLoading: loading, refetch } = useSyncsQuery();

  const addSyncMutation = useMutation({
    mutationFn: async (syncData: Omit<ICalSync, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_sync_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const urlProblem = validateCalendarUrl(syncData.ical_url);
      if (urlProblem) throw new Error(urlProblem);

      const { data, error } = await supabase
        .from('ical_syncs')
        .insert([{
          ...syncData,
          ical_url: syncData.ical_url.trim(),
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding sync:', error);
        throw new Error(error.code?.startsWith('ORD') ? error.message : 'Erro ao adicionar sincronização');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ICalSync[]>(QUERY_KEYS.syncs, (old = []) => [data, ...old]);
      toast.success('Sincronização adicionada com sucesso!');
      // Import right away instead of waiting for the next scheduled run.
      manualSyncMutation.mutate(data.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error && error.message ? error.message : 'Erro ao adicionar sincronização');
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
      const { data, error } = await supabase.functions.invoke('sync-ical', {
        body: { sync_id: syncId }
      });

      if (error) {
        console.error('Error triggering manual sync:', error);
        throw new Error(await functionErrorMessage(error, 'Erro ao executar sincronização manual'));
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.skipped) {
        toast.info('Sincronização inativa. Ative-a para importar o calendário.');
      } else {
        const syncedCount = data?.synced_count || 0;
        toast.success(`Sincronização concluída! ${syncedCount} eventos importados.`);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncs });
    },
    onError: (error) => {
      toast.error(error instanceof Error && error.message ? error.message : 'Erro ao executar sincronização manual');
    },
  });

  const getSyncsForProperty = (propertyId: string) => {
    return syncs.filter(sync => sync.property_id === propertyId);
  };

  return {
    syncs,
    loading,
    addSync: addSyncMutation.mutateAsync,
    syncingId: manualSyncMutation.isPending ? manualSyncMutation.variables : undefined,
    updateSync: (id: string, updates: Partial<ICalSync>) => 
      updateSyncMutation.mutate({ id, updates }),
    deleteSync: deleteSyncMutation.mutate,
    manualSync: manualSyncMutation.mutate,
    getSyncsForProperty,
    refetch,
    fetchSyncs: refetch, // Keep for compatibility
  };
};