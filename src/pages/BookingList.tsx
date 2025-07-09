
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MessageCircle, Calendar, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/contexts/BookingContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BookingList = () => {
  const { bookings } = useBookings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = booking.guestName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.checkIn);
      const dateB = parseISO(b.checkIn);
      return sortOrder === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Aguardando';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-sage-800 mb-4">Reservas</h1>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar por nome do hóspede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  <Filter size={16} />
                  <SelectValue placeholder="Filtrar por status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              onClick={toggleSort}
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              <ArrowUpDown size={16} />
              <span className="text-sm">Data</span>
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <Link
              key={booking.id}
              to={`/reserva/${booking.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sage-800 mb-1">{booking.guestName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar size={14} />
                    <span>
                      {format(parseISO(booking.checkIn), "dd/MM", { locale: ptBR })} → {format(parseISO(booking.checkOut), "dd/MM", { locale: ptBR })}
                    </span>
                    <span className="text-xs">({booking.nights} noites)</span>
                  </div>
                  {booking.city && (
                    <p className="text-sm text-muted-foreground">{booking.city}, {booking.state}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {booking.phone && (
                    <button
                      onClick={(e) => openWhatsApp(booking.phone, e)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <MessageCircle size={18} className="text-green-600" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
                <span className="font-semibold text-sage-800">
                  R$ {booking.totalValue.toLocaleString('pt-BR')}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-medium text-sage-800 mb-2">Nenhuma reserva encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Que tal criar sua primeira reserva?'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
