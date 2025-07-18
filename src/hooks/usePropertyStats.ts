
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyStats } from '@/types/property';
import { startOfMonth, endOfMonth } from 'date-fns';

export const usePropertyStats = (propertyId?: string) => {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_value, check_in, check_out, nights, status')
        .eq('user_id', user.id);

      if (propertyId) {
        bookingsQuery = bookingsQuery.eq('property_id', propertyId);
      }

      const { data: bookings, error } = await bookingsQuery;

      if (error) {
        console.error('Error fetching property stats:', error);
        return;
      }

      if (!bookings) return;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_out');
      const monthlyBookings = confirmedBookings.filter(booking => {
        const checkIn = new Date(booking.check_in);
        return checkIn >= monthStart && checkIn <= monthEnd;
      });

      const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);
      const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);
      
      const totalNights = confirmedBookings.reduce((sum, booking) => sum + booking.nights, 0);
      const averageDailyRate = totalNights > 0 ? totalRevenue / totalNights : 0;

      const daysInMonth = monthEnd.getDate();
      const occupiedNights = monthlyBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        
        const overlapStart = checkIn < monthStart ? monthStart : checkIn;
        const overlapEnd = checkOut > monthEnd ? monthEnd : checkOut;
        
        if (overlapStart < overlapEnd) {
          const diffTime = overlapEnd.getTime() - overlapStart.getTime();
          return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return sum;
      }, 0);

      const occupancyRate = (occupiedNights / daysInMonth) * 100;

      const calculatedStats: PropertyStats = {
        totalBookings: confirmedBookings.length,
        monthlyBookings: monthlyBookings.length,
        totalRevenue,
        monthlyRevenue,
        occupancyRate: Math.min(occupancyRate, 100),
        averageDailyRate
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error calculating property stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, propertyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};
