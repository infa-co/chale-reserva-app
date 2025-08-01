
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_historical', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Erro ao carregar reservas');
        return;
      }

      const typedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status']
      }));

      setBookings(typedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const addBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding booking:', error);
        toast.error('Erro ao criar reserva');
        return;
      }

      const typedBooking: Booking = {
        ...data,
        status: data.status as Booking['status']
      };

      setBookings(prev => [typedBooking, ...prev]);
      toast.success('Reserva criada com sucesso!');
    } catch (error) {
      console.error('Error adding booking:', error);
      toast.error('Erro ao criar reserva');
    }
  }, [user]);

  const updateBooking = useCallback(async (id: string, bookingData: Partial<Booking>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        toast.error('Erro ao atualizar reserva');
        return;
      }

      const typedBooking: Booking = {
        ...data,
        status: data.status as Booking['status']
      };

      setBookings(prev => 
        prev.map(booking => 
          booking.id === id ? typedBooking : booking
        )
      );
      toast.success('Reserva atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erro ao atualizar reserva');
    }
  }, [user]);

  const deleteBooking = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting booking:', error);
        toast.error('Erro ao excluir reserva');
        return;
      }

      setBookings(prev => prev.filter(booking => booking.id !== id));
      toast.success('Reserva excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Erro ao excluir reserva');
    }
  }, [user]);

  const getBookingById = useCallback((id: string) => {
    return bookings.find(booking => booking.id === id);
  }, [bookings]);

  return {
    bookings,
    loading,
    addBooking,
    updateBooking,
    deleteBooking,
    getBookingById,
    refetch: fetchBookings
  };
};
