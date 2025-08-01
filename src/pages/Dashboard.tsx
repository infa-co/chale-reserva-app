
import { memo, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useBookings } from '@/contexts/BookingContext';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import QuickStats from '@/components/dashboard/QuickStats';
import CalendarNavigation from '@/components/dashboard/CalendarNavigation';
import CalendarWithFilters from '@/components/dashboard/CalendarWithFilters';
import MonthlyBookings from '@/components/dashboard/MonthlyBookings';

const Dashboard = memo(() => {
  const { bookings, loading } = useBookings();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonthBookings = useMemo(() => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= startOfMonth(currentDate) && bookingDate <= endOfMonth(currentDate);
    });
  }, [bookings, currentDate]);

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
      <DashboardHeader />
      
      <QuickStats bookings={bookings} selectedMonth={currentDate} />

      <CalendarNavigation 
        currentDate={currentDate}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonthNav}
      />

      <CalendarWithFilters currentMonth={currentDate} />

      <MonthlyBookings 
        bookings={currentMonthBookings}
        month={currentDate}
        title={format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      />

      <Link
        to="/nova-reserva"
        className="fixed bottom-28 right-4 bg-sage-600 text-white p-4 rounded-full shadow-lg hover:bg-sage-700 transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
