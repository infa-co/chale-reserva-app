
import { createContext, useContext, useState, ReactNode } from 'react';
import { Booking } from '@/types/booking';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: '1',
    guestName: 'Maria Silva',
    phone: '11999887766',
    email: 'maria@email.com',
    city: 'São Paulo',
    state: 'SP',
    bookingDate: '2024-07-01',
    checkIn: '2024-07-15',
    checkOut: '2024-07-17',
    nights: 2,
    totalValue: 600,
    paymentMethod: 'Pix',
    status: 'confirmed',
    notes: 'Cliente recorrente, gosta de acordar cedo',
    createdAt: '2024-07-01T10:00:00Z'
  },
  {
    id: '2',
    guestName: 'João Santos',
    phone: '21987654321',
    email: 'joao@email.com',
    city: 'Rio de Janeiro',
    state: 'RJ',
    bookingDate: '2024-07-03',
    checkIn: '2024-07-20',
    checkOut: '2024-07-23',
    nights: 3,
    totalValue: 900,
    paymentMethod: 'Cartão de Crédito',
    status: 'pending',
    notes: 'Aguardando confirmação do pagamento',
    createdAt: '2024-07-03T14:30:00Z'
  },
  {
    id: '3',
    guestName: 'Ana Costa',
    phone: '31876543210',
    city: 'Belo Horizonte',
    state: 'MG',
    bookingDate: '2024-07-05',
    checkIn: '2024-07-12',
    checkOut: '2024-07-14',
    nights: 2,
    totalValue: 500,
    paymentMethod: 'Pix',
    status: 'confirmed',
    createdAt: '2024-07-05T16:45:00Z'
  }
];

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBooking = (id: string, bookingData: Partial<Booking>) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === id ? { ...booking, ...bookingData } : booking
      )
    );
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== id));
  };

  const getBookingById = (id: string) => {
    return bookings.find(booking => booking.id === id);
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      updateBooking,
      deleteBooking,
      getBookingById
    }}>
      {children}
    </BookingContext.Provider>
  );
};
