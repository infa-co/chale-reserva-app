
import { createContext, useContext, ReactNode } from 'react';
import { useBookings as useBookingsHook } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  addBooking: (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBooking: (id: string, booking: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  getBookingById: (id: string) => Booking | undefined;
  refetch: () => Promise<void>;
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
  const bookingHook = useBookingsHook();

  return (
    <BookingContext.Provider value={bookingHook}>
      {children}
    </BookingContext.Provider>
  );
};
