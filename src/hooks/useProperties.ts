
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Property } from '@/types/property';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProperties = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast.error('Erro ao carregar propriedades');
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Erro ao carregar propriedades');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const addProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
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
        toast.error('Erro ao criar propriedade');
        return;
      }

      setProperties(prev => [data, ...prev]);
      toast.success('Propriedade criada com sucesso!');
      return data;
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Erro ao criar propriedade');
    }
  }, [user]);

  const updateProperty = useCallback(async (id: string, propertyData: Partial<Property>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        toast.error('Erro ao atualizar propriedade');
        return;
      }

      setProperties(prev => 
        prev.map(property => 
          property.id === id ? data : property
        )
      );
      toast.success('Propriedade atualizada com sucesso!');
      return data;
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Erro ao atualizar propriedade');
    }
  }, [user]);

  const deleteProperty = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', id)
        .in('status', ['confirmed', 'pending', 'checked_in', 'active']);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        toast.error('Erro ao verificar reservas');
        return;
      }

      if (bookings && bookings.length > 0) {
        toast.error('Não é possível excluir propriedade com reservas ativas');
        return;
      }

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting property:', error);
        toast.error('Erro ao excluir propriedade');
        return;
      }

      setProperties(prev => prev.filter(property => property.id !== id));
      toast.success('Propriedade excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Erro ao excluir propriedade');
    }
  }, [user]);

  const getPropertyById = useCallback((id: string) => {
    return properties.find(property => property.id === id);
  }, [properties]);

  return {
    properties,
    loading,
    addProperty,
    updateProperty,
    deleteProperty,
    getPropertyById,
    refetch: fetchProperties
  };
};
