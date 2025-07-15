
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBookings } from '@/contexts/BookingContext';
import ClientsByMonth from '@/components/ClientsByMonth';
import ClientExportDialog from '@/components/ClientExportDialog';

interface ProcessedClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  bookings: any[];
  total_bookings: number;
  total_revenue: number;
}

const Clients = () => {
  const { bookings } = useBookings();
  const [searchTerm, setSearchTerm] = useState('');

  // Processar clientes a partir das reservas
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

  // Adicionar tags automáticas
  clients.forEach(client => {
    if (client.total_bookings >= 3) {
      client.tags.push('Cliente Recorrente');
    }
    if (client.total_revenue >= 2000) {
      client.tags.push('Cliente VIP');
    }
  });

  // Filtrar clientes para exportação
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-sage-800">Clientes</h1>
          <ClientExportDialog 
            clients={filteredClients} 
            filteredCount={filteredClients.length}
          />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <ClientsByMonth clients={filteredClients} searchTerm={searchTerm} />
    </div>
  );
};

export default Clients;
