
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MessageCircle, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/contexts/BookingContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

const BookingList = () => {
  const { bookings } = useBookings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const filteredBookings = bookings
    .filter(booking => {
      const checkInDate = parseISO(booking.check_in);
      const isInCurrentMonth = isWithinInterval(checkInDate, { start: monthStart, end: monthEnd });
      const matchesSearch = booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return isInCurrentMonth && matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.check_in);
      const dateB = parseISO(b.check_in);
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
    openWhatsAppUtil({ phone });
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const resetToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="p-3 md:p-4 pb-32">
      <header className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-bold text-sage-800 mb-3 md:mb-4">Reservas</h1>
        
        {/* Month Navigation */}
        <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <ChevronLeft size={18} className="md:hidden" />
              <ChevronLeft size={20} className="hidden md:block" />
            </button>
            
            <div className="text-center flex-1 px-2">
              <h2 className="text-base md:text-lg font-semibold text-sage-800">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <button
                onClick={resetToCurrentMonth}
                className="text-xs md:text-sm text-sage-600 hover:text-sage-800 transition-colors mt-1"
              >
                Voltar para hoje
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <ChevronRight size={18} className="md:hidden" />
              <ChevronRight size={20} className="hidden md:block" />
            </button>
          </div>
          
          <div className="text-center text-xs md:text-sm text-muted-foreground">
            {filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''} neste mês
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground md:hidden" size={16} />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hidden md:block" size={18} />
            <Input
              placeholder="Buscar por nome do hóspede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 text-sm md:text-base h-10 md:h-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 h-10">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="md:hidden" />
                  <Filter size={16} className="hidden md:block" />
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
              className="flex items-center justify-center gap-2 px-3 py-2 border rounded-md hover:bg-accent transition-colors h-10 touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <ArrowUpDown size={14} className="md:hidden" />
              <ArrowUpDown size={16} className="hidden md:block" />
              <span className="text-xs md:text-sm">Data</span>
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
              className="block bg-white rounded-xl p-3 md:p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sage-800 mb-1 text-sm md:text-base truncate">{booking.guest_name}</h3>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground mb-2 flex-wrap">
                    <Calendar size={12} className="md:hidden flex-shrink-0" />
                    <Calendar size={14} className="hidden md:block flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {format(parseISO(booking.check_in), "dd/MM", { locale: ptBR })} → {format(parseISO(booking.check_out), "dd/MM", { locale: ptBR })}
                    </span>
                    <span className="text-xs whitespace-nowrap">({booking.nights} noites)</span>
                  </div>
                  {booking.city && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{booking.city}, {booking.state}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  {booking.phone && (
                    <button
                      onClick={(e) => openWhatsApp(booking.phone, e)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <MessageCircle size={16} className="text-green-600 md:hidden" />
                      <MessageCircle size={18} className="text-green-600 hidden md:block" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStatusColor(booking.status)} text-xs md:text-sm`}>
                  {getStatusText(booking.status)}
                </span>
                <span className="font-semibold text-sage-800 text-sm md:text-base">
                  R$ {booking.total_value.toLocaleString('pt-BR')}
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
                : `Nenhuma reserva em ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
