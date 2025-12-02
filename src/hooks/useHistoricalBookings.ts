import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProperty } from '@/contexts/PropertyContext';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';

export const useHistoricalBookings = () => {
  const [allHistoricalBookings, setAllHistoricalBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activePropertyId, properties } = useProperty();

  const fetchHistoricalBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_historical', true)
        .order('check_out', { ascending: false });

      if (error) {
        console.error('Error fetching historical bookings:', error);
        toast.error('Erro ao carregar histórico de reservas');
        return;
      }

      const typedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status']
      }));

      setAllHistoricalBookings(typedBookings);
    } catch (error) {
      console.error('Error fetching historical bookings:', error);
      toast.error('Erro ao carregar histórico de reservas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistoricalBookings();
  }, [fetchHistoricalBookings]);

  // Filtra pelo property_id ativo
  const historicalBookings = useMemo(() => {
    if (!activePropertyId || properties.length === 0) {
      return allHistoricalBookings;
    }
    return allHistoricalBookings.filter(b => b.property_id === activePropertyId);
  }, [allHistoricalBookings, activePropertyId, properties.length]);

  const addHistoricalBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_historical' | 'historical_registration_date'>) => {
    if (!user) return;

    try {
      // Adiciona property_id automaticamente se não fornecido
      const bookingWithProperty = {
        ...bookingData,
        property_id: bookingData.property_id || activePropertyId || null,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingWithProperty,
          user_id: user.id,
          is_historical: true,
          historical_registration_date: new Date().toISOString(),
          status: 'completed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding historical booking:', error);
        toast.error('Erro ao registrar reserva histórica');
        return;
      }

      const typedBooking: Booking = {
        ...data,
        status: data.status as Booking['status']
      };

      setAllHistoricalBookings(prev => [typedBooking, ...prev]);
      toast.success('Reserva histórica registrada com sucesso!');
    } catch (error) {
      console.error('Error adding historical booking:', error);
      toast.error('Erro ao registrar reserva histórica');
    }
  }, [user, activePropertyId]);

  const updateHistoricalBooking = useCallback(async (id: string, bookingData: Partial<Booking>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_historical', true)
        .select()
        .single();

      if (error) {
        console.error('Error updating historical booking:', error);
        toast.error('Erro ao atualizar reserva histórica');
        return;
      }

      const typedBooking: Booking = {
        ...data,
        status: data.status as Booking['status']
      };

      setAllHistoricalBookings(prev => 
        prev.map(booking => 
          booking.id === id ? typedBooking : booking
        )
      );
      toast.success('Reserva histórica atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating historical booking:', error);
      toast.error('Erro ao atualizar reserva histórica');
    }
  }, [user]);

  const deleteHistoricalBooking = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_historical', true);

      if (error) {
        console.error('Error deleting historical booking:', error);
        toast.error('Erro ao excluir reserva histórica');
        return;
      }

      setAllHistoricalBookings(prev => prev.filter(booking => booking.id !== id));
      toast.success('Reserva histórica excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting historical booking:', error);
      toast.error('Erro ao excluir reserva histórica');
    }
  }, [user]);

  return {
    historicalBookings,
    loading,
    addHistoricalBooking,
    updateHistoricalBooking,
    deleteHistoricalBooking,
    refetch: fetchHistoricalBookings
  };
};