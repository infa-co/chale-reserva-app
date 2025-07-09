
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBookings } from '@/contexts/BookingContext';
import { Client } from '@/types/booking';

const Clients = () => {
  const { bookings } = useBookings();
  const [searchTerm, setSearchTerm] = useState('');

  // Processar clientes a partir das reservas
  const clientsMap = new Map<string, Client>();
  
  bookings.forEach(booking => {
    const clientKey = booking.phone || booking.email || booking.guestName;
    
    if (clientsMap.has(clientKey)) {
      const client = clientsMap.get(clientKey)!;
      client.bookings.push(booking);
      client.totalBookings += 1;
      if (booking.status === 'confirmed') {
        client.totalRevenue += booking.totalValue;
      }
    } else {
      clientsMap.set(clientKey, {
        id: clientKey,
        name: booking.guestName,
        phone: booking.phone,
        email: booking.email,
        city: booking.city,
        state: booking.state,
        tags: [],
        bookings: [booking],
        totalBookings: 1,
        totalRevenue: booking.status === 'confirmed' ? booking.totalValue : 0
      });
    }
  });

  const clients = Array.from(clientsMap.values())
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.totalBookings - a.totalBookings);

  // Adicionar tags automáticas
  clients.forEach(client => {
    if (client.totalBookings >= 3) {
      client.tags.push('Cliente Recorrente');
    }
    if (client.totalRevenue >= 2000) {
      client.tags.push('Cliente VIP');
    }
  });

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-sage-800 mb-4">Clientes</h1>
        
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

      <div className="grid grid-cols-1 gap-4">
        {clients.length > 0 ? (
          clients.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-xl p-4 shadow-sm border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sage-800 mb-1">{client.name}</h3>
                  
                  {client.city && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {client.city}, {client.state}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {client.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {client.phone && (
                    <button
                      onClick={(e) => openWhatsApp(client.phone, e)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <MessageCircle size={18} className="text-green-600" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-sage-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-sage-600 mb-1">
                    <Calendar size={14} />
                  </div>
                  <p className="font-semibold text-sage-800">{client.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Reservas</p>
                </div>
                
                <div className="p-2 bg-success/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp size={14} />
                  </div>
                  <p className="font-semibold text-sage-800">
                    R$ {client.totalRevenue.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                </div>
                
                <div className="p-2 bg-warning/10 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-warning mb-1">
                    <TrendingUp size={14} />
                  </div>
                  <p className="font-semibold text-sage-800">
                    R$ {Math.round(client.totalRevenue / client.totalBookings).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="text-sm font-medium text-sage-800 mb-2">Últimas Reservas</h4>
                <div className="space-y-1">
                  {client.bookings
                    .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                    .slice(0, 2)
                    .map(booking => (
                      <Link
                        key={booking.id}
                        to={`/reserva/${booking.id}`}
                        className="flex items-center justify-between p-2 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors"
                      >
                        <span className="text-sm">
                          {new Date(booking.checkIn).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-sm font-medium">
                          R$ {booking.totalValue.toLocaleString('pt-BR')}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-medium text-sage-800 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Tente ajustar o termo de busca' 
                : 'Os clientes aparecerão aqui conforme você criar reservas'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
