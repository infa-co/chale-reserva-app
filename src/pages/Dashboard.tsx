
import { Calendar as CalendarIcon, TrendingUp, Bed, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { useBookings } from '@/contexts/BookingContext';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import UserMenu from '@/components/UserMenu';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';

const Dashboard = () => {
  const { bookings, loading } = useBookings();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const currentDate = new Date();
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.check_in);
    const isInCurrentMonth = isWithinInterval(checkIn, { start: monthStart, end: monthEnd });
    
    if (!isInCurrentMonth) return false;
    
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });
  
  const totalRevenue = currentMonthBookings
    .filter(booking => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.total_value), 0);
  
  const upcomingBookings = bookings
    .filter(booking => {
      const checkIn = parseISO(booking.check_in);
      return checkIn >= new Date() && booking.status === 'confirmed';
    })
    .sort((a, b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
    .slice(0, 3);

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const resetToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const statusOptions = [
    { key: 'all', label: 'Todas', color: 'bg-sage-100 text-sage-700' },
    { key: 'confirmed', label: 'Confirmadas', color: 'bg-success-light text-success' },
    { key: 'pending', label: 'Aguardando', color: 'bg-warning-light text-warning' },
    { key: 'cancelled', label: 'Canceladas', color: 'bg-danger-light text-danger' }
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="text-center py-4 relative">
        <div className="absolute top-4 right-4">
          <UserMenu />
        </div>
        <h1 className="text-2xl font-bold text-sage-800 mb-1">Chalé Manager</h1>
        <p className="text-sm text-muted-foreground">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-sage-800">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
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
          {currentMonthBookings.length} reserva{currentMonthBookings.length !== 1 ? 's' : ''} neste mês
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="text-sm font-medium text-sage-800 mb-3">Filtrar por Status</h3>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.key}
              onClick={() => setStatusFilter(option.key as StatusFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === option.key 
                  ? option.color 
                  : 'bg-muted text-muted-foreground hover:bg-sage-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sage-100 rounded-lg">
              <Bed className="text-sage-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-800">{currentMonthBookings.length}</p>
              <p className="text-xs text-muted-foreground">Reservas este mês</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="text-success" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-800">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">Faturamento</p>
            </div>
          </div>
        </div>
      </div>

      <Calendar currentMonth={selectedMonth} statusFilter={statusFilter} />

      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="text-lg font-semibold text-sage-800 mb-3">Próximas Chegadas</h3>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-3">
            {upcomingBookings.map(booking => (
              <Link
                key={booking.id}
                to={`/reserva/${booking.id}`}
                className="flex items-center justify-between p-3 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-sage-800">{booking.guest_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(booking.check_in), "dd/MM", { locale: ptBR })} - {format(parseISO(booking.check_out), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sage-800">R$ {Number(booking.total_value).toLocaleString('pt-BR')}</p>
                  <span className="status-badge status-confirmed">Confirmada</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhuma reserva próxima</p>
        )}
      </div>

      <Link
        to="/nova-reserva"
        className="fixed bottom-20 right-4 bg-sage-600 text-white p-4 rounded-full shadow-lg hover:bg-sage-700 transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};

export default Dashboard;
