import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useOptimizedBookings } from '@/hooks/useOptimizedBookings';
import { useProperty } from '@/contexts/PropertyContext';
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
  const { activePropertyId, properties } = useProperty();

  // Filtra bookings pelo chalé ativo
  const filteredBookings = useMemo(() => {
    // Se não tem propriedade ativa ou não tem propriedades, mostra todos
    if (!activePropertyId || properties.length === 0) {
      return bookingHook.bookings;
    }
    return bookingHook.bookings.filter(b => b.property_id === activePropertyId);
  }, [bookingHook.bookings, activePropertyId, properties.length]);

  const filteredAllBookings = useMemo(() => {
    if (!activePropertyId || properties.length === 0) {
      return bookingHook.allBookings;
    }
    return bookingHook.allBookings.filter(b => b.property_id === activePropertyId);
  }, [bookingHook.allBookings, activePropertyId, properties.length]);

  const filteredHistoricalBookings = useMemo(() => {
    if (!activePropertyId || properties.length === 0) {
      return bookingHook.historicalBookings;
    }
    return bookingHook.historicalBookings.filter(b => b.property_id === activePropertyId);
  }, [bookingHook.historicalBookings, activePropertyId, properties.length]);

  // Wrapper para addBooking que automaticamente adiciona o property_id ativo
  const addBookingWithProperty = useMemo(() => {
    return (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      // Se tem propriedade ativa e o booking não tem property_id, usa o ativo
      const bookingWithProperty = {
        ...booking,
        property_id: booking.property_id || activePropertyId || null,
      };
      bookingHook.addBooking(bookingWithProperty);
    };
  }, [bookingHook.addBooking, activePropertyId]);

  const addHistoricalBookingWithProperty = useMemo(() => {
    return (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_historical' | 'historical_registration_date'>) => {
      const bookingWithProperty = {
        ...booking,
        property_id: booking.property_id || activePropertyId || null,
      };
      bookingHook.addHistoricalBooking(bookingWithProperty);
    };
  }, [bookingHook.addHistoricalBooking, activePropertyId]);

  const value = useMemo(() => ({
    bookings: filteredBookings,
    allBookings: filteredAllBookings,
    historicalBookings: filteredHistoricalBookings,
    loading: bookingHook.loading,
    addBooking: addBookingWithProperty,
    updateBooking: bookingHook.updateBooking,
    deleteBooking: bookingHook.deleteBooking,
    addHistoricalBooking: addHistoricalBookingWithProperty,
    updateHistoricalBooking: bookingHook.updateHistoricalBooking,
    deleteHistoricalBooking: bookingHook.deleteHistoricalBooking,
    getBookingById: bookingHook.getBookingById,
    refetch: bookingHook.refetch,
  }), [
    filteredBookings,
    filteredAllBookings,
    filteredHistoricalBookings,
    bookingHook.loading,
    addBookingWithProperty,
    bookingHook.updateBooking,
    bookingHook.deleteBooking,
    addHistoricalBookingWithProperty,
    bookingHook.updateHistoricalBooking,
    bookingHook.deleteHistoricalBooking,
    bookingHook.getBookingById,
    bookingHook.refetch,
  ]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
