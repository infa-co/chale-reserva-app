import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';

const QUERY_KEYS = {
  bookings: 'bookings',
  allBookings: 'all-bookings',
  historicalBookings: 'historical-bookings',
} as const;

// Fetch all bookings (cached and deduplicated)
export const useAllBookingsQuery = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [QUERY_KEYS.allBookings, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bookings:', error);
        toast.error('Erro ao carregar todas as reservas');
        throw error;
      }

      return (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status']
      })) as Booking[];
    },
    enabled: !!user,
  });
};

// Optimized hooks that derive from the main query
export const useOptimizedBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const allBookingsQuery = useAllBookingsQuery();

  // Derive current bookings from all bookings (no extra API call)
  const currentBookings = allBookingsQuery.data?.filter(booking => !booking.is_historical) || [];
  
  // Derive historical bookings from all bookings (no extra API call)
  const historicalBookings = allBookingsQuery.data?.filter(booking => booking.is_historical) || [];

  // Optimized mutations with automatic cache updates
  const addBookingMutation = useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, status: data.status as Booking['status'] } as Booking;
    },
    onSuccess: (newBooking) => {
      // Optimistically update cache
      queryClient.setQueryData([QUERY_KEYS.allBookings, user?.id], (old: Booking[] = []) => [
        newBooking,
        ...old
      ]);
      toast.success('Reserva criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding booking:', error);
      toast.error('Erro ao criar reserva');
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, bookingData }: { id: string; bookingData: Partial<Booking> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, status: data.status as Booking['status'] } as Booking;
    },
    onSuccess: (updatedBooking) => {
      // Optimistically update cache
      queryClient.setQueryData([QUERY_KEYS.allBookings, user?.id], (old: Booking[] = []) =>
        old.map(booking => booking.id === updatedBooking.id ? updatedBooking : booking)
      );
      toast.success('Reserva atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating booking:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao atualizar reserva: ${errorMessage}`);
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically update cache
      queryClient.setQueryData([QUERY_KEYS.allBookings, user?.id], (old: Booking[] = []) =>
        old.filter(booking => booking.id !== deletedId)
      );
      toast.success('Reserva excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting booking:', error);
      toast.error('Erro ao excluir reserva');
    }
  });

  const addHistoricalBookingMutation = useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_historical' | 'historical_registration_date'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          user_id: user.id,
          is_historical: true,
          historical_registration_date: new Date().toISOString(),
          status: 'completed'
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, status: data.status as Booking['status'] } as Booking;
    },
    onSuccess: (newBooking) => {
      queryClient.setQueryData([QUERY_KEYS.allBookings, user?.id], (old: Booking[] = []) => [
        newBooking,
        ...old
      ]);
      toast.success('Reserva histórica registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding historical booking:', error);
      toast.error('Erro ao registrar reserva histórica');
    }
  });

  // Memoized utility functions
  const getBookingById = useCallback((id: string) => {
    return allBookingsQuery.data?.find(booking => booking.id === id);
  }, [allBookingsQuery.data]);

  const refetch = useCallback(() => {
    return allBookingsQuery.refetch();
  }, [allBookingsQuery.refetch]);

  // Subscribe to realtime changes for bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime booking change:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newBooking = { 
              ...payload.new, 
              status: payload.new.status as Booking['status'] 
            } as Booking;
            
            queryClient.setQueryData([QUERY_KEYS.allBookings, user.id], (old: Booking[] = []) => {
              // Evitar duplicatas
              if (old.some(b => b.id === newBooking.id)) return old;
              return [newBooking, ...old];
            });
          } 
          else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedBooking = { 
              ...payload.new, 
              status: payload.new.status as Booking['status'] 
            } as Booking;
            
            queryClient.setQueryData([QUERY_KEYS.allBookings, user.id], (old: Booking[] = []) =>
              old.map(booking => booking.id === updatedBooking.id ? updatedBooking : booking)
            );
          } 
          else if (payload.eventType === 'DELETE' && payload.old) {
            queryClient.setQueryData([QUERY_KEYS.allBookings, user.id], (old: Booking[] = []) =>
              old.filter(booking => booking.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    // Data
    bookings: currentBookings,
    allBookings: allBookingsQuery.data || [],
    historicalBookings,
    loading: allBookingsQuery.isLoading,
    
    // Actions
    addBooking: addBookingMutation.mutate,
    updateBooking: useCallback((id: string, bookingData: Partial<Booking>) => {
      return updateBookingMutation.mutateAsync({ id, bookingData });
    }, [updateBookingMutation.mutateAsync]),
    deleteBooking: deleteBookingMutation.mutate,
    addHistoricalBooking: addHistoricalBookingMutation.mutate,
    updateHistoricalBooking: useCallback((id: string, bookingData: Partial<Booking>) => {
      return updateBookingMutation.mutateAsync({ id, bookingData });
    }, [updateBookingMutation.mutateAsync]),
    deleteHistoricalBooking: deleteBookingMutation.mutate,
    
    // Utils
    getBookingById,
    refetch,
    
    // Loading states for mutations
    isAddingBooking: addBookingMutation.isPending,
    isUpdatingBooking: updateBookingMutation.isPending,
    isDeletingBooking: deleteBookingMutation.isPending,
  };
};