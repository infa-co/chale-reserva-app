import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ExternalBooking {
  id: string;
  user_id: string;
  ical_sync_id: string;
  external_id: string;
  summary: string;
  start_date: string;
  end_date: string;
  platform_name: string;
  raw_ical_data: string | null;
  created_at: string;
  updated_at: string;
}

export const useExternalBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [externalBookings, setExternalBookings] = useState<ExternalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExternalBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('external_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching external bookings:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar reservas externas',
          variant: 'destructive'
        });
        return;
      }

      setExternalBookings(data || []);
    } catch (error) {
      console.error('Error fetching external bookings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar reservas externas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchExternalBookings();
  }, [fetchExternalBookings]);

  const getExternalBookingsForDateRange = useCallback((startDate: Date, endDate: Date) => {
    return externalBookings.filter(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      // Check if booking overlaps with the date range
      return bookingStart <= endDate && bookingEnd >= startDate;
    });
  }, [externalBookings]);

  const getExternalBookingsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return externalBookings.filter(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      const checkDate = new Date(dateStr);
      
      return checkDate >= bookingStart && checkDate <= bookingEnd;
    });
  }, [externalBookings]);

  return {
    externalBookings,
    loading,
    refetch: fetchExternalBookings,
    getExternalBookingsForDateRange,
    getExternalBookingsForDate
  };
};