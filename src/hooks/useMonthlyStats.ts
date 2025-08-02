import { useMemo } from 'react';
import { Booking } from '@/types/booking';
import { startOfMonth, endOfMonth } from 'date-fns';

export const useMonthlyStats = (allBookings: Booking[], currentBookings: Booking[], selectedMonth: Date) => {
  return useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Filter bookings for the selected month
    const monthlyBookings = currentBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    // Filter all bookings (including historical) for total revenue calculation
    const allMonthlyBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    const confirmedBookings = monthlyBookings.filter(booking => booking.status === 'confirmed');
    const pendingBookings = monthlyBookings.filter(booking => booking.status === 'pending');
    const historicalBookings = allMonthlyBookings.filter(booking => booking.is_historical);
    const monthlyRevenue = allMonthlyBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);

    return {
      totalBookings: monthlyBookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      historicalBookings: historicalBookings.length,
      monthlyRevenue
    };
  }, [allBookings, currentBookings, selectedMonth]);
};