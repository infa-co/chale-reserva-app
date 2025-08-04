import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Booking } from '@/types/booking';

interface ProcessedClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  bookings: Booking[];
  total_bookings: number;
  total_revenue: number;
}

const processClients = (bookings: Booking[]): ProcessedClient[] => {
  const clientsMap = new Map<string, ProcessedClient>();
  
  bookings.forEach(booking => {
    const clientKey = booking.phone || booking.email || booking.guest_name;
    
    if (clientsMap.has(clientKey)) {
      const client = clientsMap.get(clientKey)!;
      client.bookings.push(booking);
      client.total_bookings += 1;
      if (booking.status === 'confirmed') {
        client.total_revenue += booking.total_value;
      }
    } else {
      clientsMap.set(clientKey, {
        id: clientKey,
        name: booking.guest_name,
        phone: booking.phone,
        email: booking.email,
        city: booking.city,
        state: booking.state,
        tags: [],
        bookings: [booking],
        total_bookings: 1,
        total_revenue: booking.status === 'confirmed' ? booking.total_value : 0
      });
    }
  });

  const clients = Array.from(clientsMap.values())
    .sort((a, b) => b.total_bookings - a.total_bookings);

  // Add automatic tags
  clients.forEach(client => {
    client.tags = [];
    if (client.total_bookings >= 3) {
      client.tags.push('Cliente Recorrente');
    }
    if (client.total_revenue >= 2000) {
      client.tags.push('Cliente VIP');
    }
  });

  return clients;
};

export const useOptimizedClients = (bookings: Booking[]) => {
  // Cache processed clients with React Query
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['processed-clients', bookings.length, bookings.map(b => b.updated_at).join('')],
    queryFn: () => processClients(bookings),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: bookings.length > 0
  });

  return {
    clients,
    loading: isLoading
  };
};