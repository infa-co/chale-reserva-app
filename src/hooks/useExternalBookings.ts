import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProperty } from '@/contexts/PropertyContext';
import { useToast } from '@/hooks/use-toast';
import { ExternalBooking } from '@/types/externalBooking';

interface ExternalBookingWithProperty extends ExternalBooking {
  ical_syncs?: {
    property_id: string | null;
  };
}

export const useExternalBookings = () => {
  const { user } = useAuth();
  const { activePropertyId, properties } = useProperty();
  const { toast } = useToast();
  const [allExternalBookings, setAllExternalBookings] = useState<ExternalBookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExternalBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('external_bookings')
        .select(`
          *,
          ical_syncs!inner (
            property_id
          )
        `)
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

      setAllExternalBookings(data || []);
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

  // Filtra pelo property_id ativo
  const externalBookings = useMemo(() => {
    if (!activePropertyId || properties.length === 0) {
      return allExternalBookings;
    }
    return allExternalBookings.filter(b => b.ical_syncs?.property_id === activePropertyId);
  }, [allExternalBookings, activePropertyId, properties.length]);

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