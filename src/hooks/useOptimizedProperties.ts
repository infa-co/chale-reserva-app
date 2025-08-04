import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Property } from '@/types/property';

const QUERY_KEYS = {
  properties: ['properties'] as const,
};

const usePropertiesQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.properties,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        throw new Error('Erro ao carregar propriedades');
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useOptimizedProperties = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: properties = [], isLoading: loading, refetch } = usePropertiesQuery();

  const addPropertyMutation = useMutation({
    mutationFn: async (propertyData: Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .insert([{
          ...propertyData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding property:', error);
        throw new Error('Erro ao criar propriedade');
      }

      return data;
    },
    onMutate: async (newProperty) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.properties });
      
      const previousProperties = queryClient.getQueryData<Property[]>(QUERY_KEYS.properties);
      
      // Optimistically update
      const optimisticProperty: Property = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newProperty,
      };
      
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (old = []) => [
        optimisticProperty,
        ...old
      ]);
      
      return { previousProperties };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.properties, context?.previousProperties);
      toast.error('Erro ao criar propriedade');
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (old = []) => 
        old.map(property => 
          property.id.startsWith('temp-') ? data : property
        )
      );
      toast.success('Propriedade criada com sucesso!');
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, propertyData }: { id: string; propertyData: Partial<Property> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        throw new Error('Erro ao atualizar propriedade');
      }

      return data;
    },
    onMutate: async ({ id, propertyData }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.properties });
      
      const previousProperties = queryClient.getQueryData<Property[]>(QUERY_KEYS.properties);
      
      // Optimistically update
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (old = []) =>
        old.map(property =>
          property.id === id ? { ...property, ...propertyData } : property
        )
      );
      
      return { previousProperties };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.properties, context?.previousProperties);
      toast.error('Erro ao atualizar propriedade');
    },
    onSuccess: () => {
      toast.success('Propriedade atualizada com sucesso!');
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      // Check for active bookings first
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', id)
        .in('status', ['confirmed', 'pending', 'checked_in', 'active']);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        throw new Error('Erro ao verificar reservas');
      }

      if (bookings && bookings.length > 0) {
        throw new Error('Não é possível excluir propriedade com reservas ativas');
      }

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting property:', error);
        throw new Error('Erro ao excluir propriedade');
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.properties });
      
      const previousProperties = queryClient.getQueryData<Property[]>(QUERY_KEYS.properties);
      
      // Optimistically update
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (old = []) =>
        old.filter(property => property.id !== id)
      );
      
      return { previousProperties };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.properties, context?.previousProperties);
      toast.error(error.message || 'Erro ao excluir propriedade');
    },
    onSuccess: () => {
      toast.success('Propriedade excluída com sucesso!');
    },
  });

  const getPropertyById = (id: string) => {
    return properties.find(property => property.id === id);
  };

  return {
    properties,
    loading,
    addProperty: addPropertyMutation.mutate,
    updateProperty: (id: string, propertyData: Partial<Property>) => 
      updatePropertyMutation.mutate({ id, propertyData }),
    deleteProperty: deletePropertyMutation.mutate,
    getPropertyById,
    refetch,
    isAddingProperty: addPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
  };
};