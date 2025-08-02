import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Booking } from '@/types/booking';

export const useAllBookings = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAllBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bookings:', error);
        toast.error('Erro ao carregar todas as reservas');
        return;
      }

      const typedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status']
      }));

      setAllBookings(typedBookings);
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      toast.error('Erro ao carregar todas as reservas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  return {
    allBookings,
    loading,
    refetch: fetchAllBookings
  };
};