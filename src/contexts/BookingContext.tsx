
import { createContext, useContext, ReactNode } from 'react';
import { useOptimizedBookings } from '@/hooks/useOptimizedBookings';
import { Booking } from '@/types/booking';

interface BookingContextType {
  bookings: Booking[];
  allBookings: Booking[];
  historicalBookings: Booking[];
  loading: boolean;
  addBooking: (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  addHistoricalBooking: (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_historical' | 'historical_registration_date'>) => void;
  updateHistoricalBooking: (id: string, booking: Partial<Booking>) => void;
  deleteHistoricalBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  refetch: () => Promise<any>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const bookingHook = useOptimizedBookings();

  return (
    <BookingContext.Provider value={bookingHook}>
      {children}
    </BookingContext.Provider>
  );
};
