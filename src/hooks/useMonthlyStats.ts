import { useMemo } from 'react';
import { Booking } from '@/types/booking';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const useMonthlyStats = (allBookings: Booking[], currentBookings: Booking[], selectedMonth: Date) => {
  return useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Determine if a booking overlaps the selected month (by check-in/check-out)
    const overlapsMonth = (booking: Booking) => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return checkIn <= monthEnd && checkOut >= monthStart;
    };

    const monthlyBookings = currentBookings.filter(overlapsMonth);
    const allMonthlyBookings = allBookings.filter(overlapsMonth);

    const confirmedStatuses = new Set<Booking['status']>(['confirmed','checked_in','active','checked_out','completed']);

    const confirmedMonthly = monthlyBookings.filter(b => confirmedStatuses.has(b.status));
    const pendingMonthly = monthlyBookings.filter(b => b.status === 'pending');
    const historicalMonthly = allMonthlyBookings.filter(b => b.is_historical);

    const monthlyRevenue = allMonthlyBookings
      .filter(b => confirmedStatuses.has(b.status))
      .reduce((sum, b) => sum + Number(b.total_value), 0);

    return {
      totalBookings: confirmedMonthly.length,
      confirmedBookings: confirmedMonthly.length,
      pendingBookings: pendingMonthly.length,
      historicalBookings: historicalMonthly.length,
      monthlyRevenue
    };
  }, [allBookings, currentBookings, selectedMonth]);
};