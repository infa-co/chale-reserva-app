import { memo } from 'react';
import { useBookings } from '@/contexts/BookingContext';
import OptimizedBookingList from '@/components/OptimizedBookingList';

const OptimizedBookingListPage = memo(() => {
  const { bookings } = useBookings();

  return <OptimizedBookingList bookings={bookings} />;
});

OptimizedBookingListPage.displayName = 'OptimizedBookingListPage';

export default OptimizedBookingListPage;