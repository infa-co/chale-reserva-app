import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MessageCircle, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Booking } from '@/types/booking';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BookingExportDialog from '@/components/BookingExportDialog';
import { useBookings } from '@/contexts/BookingContext';
import { openWhatsApp as openWhatsAppUtil } from '@/lib/whatsapp';

interface OptimizedBookingListProps {
  bookings: Booking[];
}

const BookingCard = memo(({ booking }: { booking: Booking }) => {
  const openWhatsApp = useCallback((phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openWhatsAppUtil({ phone });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Aguardando';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  }, []);

  const formattedValue = useMemo(() => 
    booking.total_value.toLocaleString('pt-BR'),
    [booking.total_value]
  );

  const checkInDate = useMemo(() => 
    parseISO(booking.check_in),
    [booking.check_in]
  );

  const checkOutDate = useMemo(() => 
    parseISO(booking.check_out),
    [booking.check_out]
  );

  return (
    <Link
      to={`/reserva/${booking.id}`}
      className="block bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sage-800 mb-1">{booking.guest_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar size={14} />
            <span>
              {format(checkInDate, "dd/MM", { locale: ptBR })} → {format(checkOutDate, "dd/MM", { locale: ptBR })}
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
          R$ {formattedValue}
        </span>
      </div>
    </Link>
  );
});

BookingCard.displayName = 'BookingCard';

const OptimizedBookingList = memo(({ bookings }: OptimizedBookingListProps) => {
  const { historicalBookings } = useBookings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const filteredBookings = useMemo(() => {
    return bookings
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
  }, [bookings, searchTerm, statusFilter, sortOrder, monthStart, monthEnd]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const resetToCurrentMonth = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  const monthTitle = useMemo(() => 
    format(currentMonth, 'MMMM yyyy', { locale: ptBR }),
    [currentMonth]
  );

  return (
    <div className="p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-sage-800">Reservas</h1>
          <BookingExportDialog 
            activeBookings={bookings}
            historicalBookings={historicalBookings}
            totalCount={bookings.length + historicalBookings.length}
          />
        </div>
        
        {/* Month Navigation */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-sage-800">
                {monthTitle}
              </h2>
              <button
                onClick={resetToCurrentMonth}
                className="text-sm text-sage-600 hover:text-sage-800 transition-colors"
              >
                Voltar para hoje
              </button>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''} neste mês
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar por nome do hóspede..."
              value={searchTerm}
              onChange={handleSearchChange}
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
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-medium text-sage-800 mb-2">Nenhuma reserva encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : `Nenhuma reserva em ${monthTitle}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedBookingList.displayName = 'OptimizedBookingList';

export default OptimizedBookingList;