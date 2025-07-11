
import { Calendar as CalendarIcon, TrendingUp, Bed, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { useBookings } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/UserMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { bookings, loading } = useBookings();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = startOfMonth(currentDate);
  const nextMonth = startOfMonth(addMonths(currentDate, 1));
  const lastSixMonths = eachMonthOfInterval({
    start: subMonths(currentDate, 5),
    end: currentDate
  });

  const currentMonthBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    return bookingDate >= startOfMonth(currentDate) && bookingDate <= endOfMonth(currentDate);
  });

  const nextMonthBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    return bookingDate >= startOfMonth(nextMonth) && bookingDate <= endOfMonth(nextMonth);
  });

  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + Number(booking.total_value), 0);

  const monthlyStats = lastSixMonths.map(month => {
    const monthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= startOfMonth(month) && bookingDate <= endOfMonth(month);
    });
    
    const monthRevenue = monthBookings
      .filter(booking => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + Number(booking.total_value), 0);

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      bookings: monthBookings.length,
      revenue: monthRevenue
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-danger text-danger-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Aguardando';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonthNav = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      <header className="text-center py-6 relative">
        <div className="absolute top-4 right-4">
          <UserMenu />
        </div>
        <div className="flex items-center justify-center mb-3">
          <img 
            src="/lovable-uploads/d08d425b-8432-4ab7-a851-163f5a72bd81.png" 
            alt="ORDOMO Logo" 
            className="h-24 object-contain"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Sistema de Gestão de Reservas
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bed className="h-4 w-4 text-sage-600" />
              Total de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-800">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedBookings.length} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sage-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-800">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings.length} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-sage-800">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button
          onClick={nextMonthNav}
          className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar */}
      <Calendar currentMonth={currentDate} />

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentMonthBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma reserva este mês</p>
            ) : (
              currentMonthBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 bg-sage-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sage-800 truncate">
                      {booking.guest_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.check_in), 'dd/MM')} - {format(new Date(booking.check_out), 'dd/MM')}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
              ))
            )}
            {currentMonthBookings.length > 3 && (
              <Link 
                to="/reservas" 
                className="text-xs text-sage-600 hover:underline block text-center pt-2"
              >
                Ver todas ({currentMonthBookings.length})
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(nextMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextMonthBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma reserva próximo mês</p>
            ) : (
              nextMonthBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 bg-sage-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sage-800 truncate">
                      {booking.guest_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.check_in), 'dd/MM')} - {format(new Date(booking.check_out), 'dd/MM')}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
              ))
            )}
            {nextMonthBookings.length > 3 && (
              <Link 
                to="/reservas" 
                className="text-xs text-sage-600 hover:underline block text-center pt-2"
              >
                Ver todas ({nextMonthBookings.length})
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <Link
        to="/nova-reserva"
        className="fixed bottom-28 right-4 bg-sage-600 text-white p-4 rounded-full shadow-lg hover:bg-sage-700 transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};

export default Dashboard;
