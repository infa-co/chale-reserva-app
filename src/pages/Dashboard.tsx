
import { Calendar as CalendarIcon, TrendingUp, Bed, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { useBookings } from '@/contexts/BookingContext';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const Dashboard = () => {
  const { bookings } = useBookings();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const currentDate = new Date();
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const currentMonthBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.checkIn);
    return isWithinInterval(checkIn, { start: monthStart, end: monthEnd });
  });
  
  const totalRevenue = currentMonthBookings
    .filter(booking => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.totalValue, 0);
  
  const upcomingBookings = bookings
    .filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      return checkIn >= new Date() && booking.status === 'confirmed';
    })
    .sort((a, b) => parseISO(a.checkIn).getTime() - parseISO(b.checkIn).getTime())
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

  return (
    <div className="p-4 space-y-6">
      <header className="text-center py-4">
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

      <Calendar currentMonth={selectedMonth} />

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
                  <p className="font-medium text-sage-800">{booking.guestName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(booking.checkIn), "dd/MM", { locale: ptBR })} - {format(parseISO(booking.checkOut), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sage-800">R$ {booking.totalValue.toLocaleString('pt-BR')}</p>
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
